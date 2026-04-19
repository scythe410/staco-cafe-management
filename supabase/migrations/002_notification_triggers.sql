-- ================================================================
-- Migration 002: Notification triggers
-- - Low stock trigger already exists in 001 (notify_low_stock)
-- - This adds: salary_due notification function + pg_cron schedule
-- - Also enables Realtime on the notifications table
-- ================================================================

-- ----------------------------------------------------------------
-- Enable Realtime on notifications table
-- ----------------------------------------------------------------
alter publication supabase_realtime add table notifications;

-- ----------------------------------------------------------------
-- Function: generate_salary_due_notifications
-- Inserts a salary_due notification for each active employee who
-- does not have a paid salary record for the current month.
-- Designed to run on the 25th of each month via pg_cron.
-- Can also be called manually: SELECT generate_salary_due_notifications();
-- ----------------------------------------------------------------
create or replace function generate_salary_due_notifications()
returns void as $$
declare
  current_month text;
  emp record;
begin
  current_month := to_char(now(), 'YYYY-MM');

  for emp in
    select e.id, e.full_name
    from employees e
    where e.is_active = true
      and not exists (
        select 1
        from salaries s
        where s.employee_id = e.id
          and s.month = current_month
          and s.paid_at is not null
      )
  loop
    -- Avoid duplicate notifications for same employee + month
    if not exists (
      select 1
      from notifications n
      where n.type = 'salary_due'
        and n.message like '%' || emp.full_name || '%'
        and n.message like '%' || current_month || '%'
    ) then
      insert into notifications (type, message)
      values (
        'salary_due',
        'Salary due: ' || emp.full_name || ' has no paid salary record for ' || current_month
      );
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------
-- pg_cron schedule: run on the 25th of each month at 09:00 UTC
-- NOTE: pg_cron must be enabled in Supabase Dashboard under
--   Database > Extensions > pg_cron
-- Run this after enabling the extension:
-- ----------------------------------------------------------------
-- To set up the cron job, run this in the Supabase SQL editor
-- after enabling the pg_cron extension:
--
--   select cron.schedule(
--     'salary-due-notifications',
--     '0 9 25 * *',
--     $$select generate_salary_due_notifications()$$
--   );
--
-- To remove:
--   select cron.unschedule('salary-due-notifications');
-- ----------------------------------------------------------------
