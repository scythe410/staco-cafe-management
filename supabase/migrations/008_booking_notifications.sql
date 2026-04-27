-- ================================================================
-- Migration 008: Booking notifications
-- - Adds 'booking' to notification_type enum
-- - Trigger: notify on new booking insert
-- - Trigger: notify on booking cancellation
-- - Function: generate_balance_due_notifications (for pg_cron)
--   Notifies for confirmed bookings with balance_due > 0 occurring
--   within the next 2 days.
-- ================================================================

-- ----------------------------------------------------------------
-- Add 'booking' to the notification_type enum
-- ----------------------------------------------------------------
alter type notification_type add value if not exists 'booking';

-- ----------------------------------------------------------------
-- Trigger: notify on new booking
-- ----------------------------------------------------------------
create or replace function notify_new_booking()
returns trigger language plpgsql as $$
begin
  insert into notifications (type, message)
  values (
    'booking',
    'New booking ' || new.booking_code || ' — ' || new.customer_name ||
    ' (' || new.party_size || ' pax) on ' ||
    to_char(new.booking_date, 'DD Mon') || ' at ' ||
    to_char(new.start_time, 'HH24:MI')
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_booking on bookings;
create trigger trg_notify_new_booking
after insert on bookings
for each row
execute function notify_new_booking();

-- ----------------------------------------------------------------
-- Trigger: notify on booking cancellation
-- ----------------------------------------------------------------
create or replace function notify_booking_cancelled()
returns trigger language plpgsql as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    insert into notifications (type, message)
    values (
      'booking',
      'Booking cancelled: ' || new.booking_code || ' — ' || new.customer_name ||
      ' for ' || to_char(new.booking_date, 'DD Mon')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_booking_cancelled on bookings;
create trigger trg_notify_booking_cancelled
after update on bookings
for each row
execute function notify_booking_cancelled();

-- ----------------------------------------------------------------
-- Function: generate_balance_due_notifications
-- Inserts a notification for each confirmed booking with an
-- outstanding balance whose date is within the next 2 days.
-- Designed to run daily via pg_cron. Idempotent per booking+date.
-- ----------------------------------------------------------------
create or replace function generate_balance_due_notifications()
returns void as $$
declare
  bk record;
  marker text;
begin
  for bk in
    select b.booking_code, b.customer_name, b.balance_due, b.booking_date
    from bookings b
    where b.status = 'confirmed'
      and b.balance_due > 0
      and b.booking_date >= current_date
      and b.booking_date <= current_date + interval '2 days'
  loop
    marker := 'Balance due: ' || bk.booking_code;

    if not exists (
      select 1 from notifications
      where type = 'booking'
        and message like marker || '%'
        and created_at::date = current_date
    ) then
      insert into notifications (type, message)
      values (
        'booking',
        marker || ' — ' || bk.customer_name ||
        ' on ' || to_char(bk.booking_date, 'DD Mon') ||
        ' (LKR ' || to_char(bk.balance_due / 100.0, 'FM999,999.00') || ')'
      );
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------
-- pg_cron schedule (run after enabling pg_cron extension):
--
--   select cron.schedule(
--     'booking-balance-due-notifications',
--     '0 9 * * *',                              -- daily at 09:00 UTC
--     $$select generate_balance_due_notifications()$$
--   );
--
-- To remove:
--   select cron.unschedule('booking-balance-due-notifications');
-- ----------------------------------------------------------------
