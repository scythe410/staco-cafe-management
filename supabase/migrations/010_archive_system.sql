-- ============================================================
-- Migration 010 — Soft-delete archive system
-- ============================================================
-- Adds is_archived / archived_at / archived_by columns to user-facing
-- record tables so the UI can hide stale records without losing audit
-- history. Financial / analytics queries keep reading every row.
-- ============================================================

-- ----------------------------------------------------------------
-- Schema additions
-- ----------------------------------------------------------------
alter table orders
  add column if not exists is_archived  boolean not null default false,
  add column if not exists archived_at  timestamptz,
  add column if not exists archived_by  uuid references users(id) on delete set null;

alter table expenses
  add column if not exists is_archived  boolean not null default false,
  add column if not exists archived_at  timestamptz,
  add column if not exists archived_by  uuid references users(id) on delete set null;

alter table bookings
  add column if not exists is_archived  boolean not null default false,
  add column if not exists archived_at  timestamptz,
  add column if not exists archived_by  uuid references users(id) on delete set null;

alter table stock_updates
  add column if not exists is_archived  boolean not null default false,
  add column if not exists archived_at  timestamptz,
  add column if not exists archived_by  uuid references users(id) on delete set null;

alter table notifications
  add column if not exists is_archived  boolean not null default false,
  add column if not exists archived_at  timestamptz,
  add column if not exists archived_by  uuid references users(id) on delete set null;

-- Partial indexes — most reads are for active rows.
create index if not exists idx_orders_active        on orders(created_at desc)        where is_archived = false;
create index if not exists idx_expenses_active      on expenses(date desc)            where is_archived = false;
create index if not exists idx_bookings_active      on bookings(booking_date desc)    where is_archived = false;
create index if not exists idx_stock_updates_active on stock_updates(created_at desc) where is_archived = false;
create index if not exists idx_notifications_active on notifications(created_at desc) where is_archived = false;

-- ----------------------------------------------------------------
-- RPC: archive_records_older_than
-- Bulk-archive completed/cancelled records older than N days.
-- Owner only. Returns a count per table for UI feedback.
-- ----------------------------------------------------------------
create or replace function archive_records_older_than(p_days integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role     text;
  v_uid      uuid;
  v_cutoff   timestamptz;
  v_orders   integer := 0;
  v_exps     integer := 0;
  v_books    integer := 0;
  v_notifs   integer := 0;
begin
  v_role := get_my_role();
  if v_role <> 'owner' then
    raise exception 'only owners can archive records' using errcode = '42501';
  end if;

  if p_days is null or p_days < 0 then
    raise exception 'p_days must be a non-negative integer';
  end if;

  v_uid    := auth.uid();
  v_cutoff := now() - (p_days || ' days')::interval;

  with upd as (
    update orders
       set is_archived = true,
           archived_at = now(),
           archived_by = v_uid
     where is_archived = false
       and status in ('completed', 'cancelled', 'refunded')
       and coalesce(completed_at, created_at) < v_cutoff
    returning 1
  )
  select count(*) into v_orders from upd;

  with upd as (
    update expenses
       set is_archived = true,
           archived_at = now(),
           archived_by = v_uid
     where is_archived = false
       and date < v_cutoff::date
    returning 1
  )
  select count(*) into v_exps from upd;

  with upd as (
    update bookings
       set is_archived = true,
           archived_at = now(),
           archived_by = v_uid
     where is_archived = false
       and status in ('completed', 'cancelled', 'no_show')
       and booking_date < v_cutoff::date
    returning 1
  )
  select count(*) into v_books from upd;

  with upd as (
    update notifications
       set is_archived = true,
           archived_at = now(),
           archived_by = v_uid
     where is_archived = false
       and is_read = true
       and created_at < v_cutoff
    returning 1
  )
  select count(*) into v_notifs from upd;

  return jsonb_build_object(
    'orders',        v_orders,
    'expenses',      v_exps,
    'bookings',      v_books,
    'notifications', v_notifs,
    'cutoff',        v_cutoff
  );
end;
$$;

revoke all on function archive_records_older_than(integer) from public;
grant execute on function archive_records_older_than(integer) to authenticated;

-- ----------------------------------------------------------------
-- RPC: archive_record
-- Archive a single record from a known table. Owner + manager.
-- ----------------------------------------------------------------
create or replace function archive_record(p_table text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_uid  uuid;
begin
  v_role := get_my_role();
  if v_role not in ('owner', 'manager') then
    raise exception 'only owners and managers can archive records' using errcode = '42501';
  end if;

  v_uid := auth.uid();

  case p_table
    when 'orders' then
      update orders
         set is_archived = true, archived_at = now(), archived_by = v_uid
       where id = p_id;
    when 'expenses' then
      update expenses
         set is_archived = true, archived_at = now(), archived_by = v_uid
       where id = p_id;
    when 'bookings' then
      update bookings
         set is_archived = true, archived_at = now(), archived_by = v_uid
       where id = p_id;
    when 'stock_updates' then
      update stock_updates
         set is_archived = true, archived_at = now(), archived_by = v_uid
       where id = p_id;
    when 'notifications' then
      update notifications
         set is_archived = true, archived_at = now(), archived_by = v_uid
       where id = p_id;
    else
      raise exception 'unsupported table: %', p_table using errcode = '22023';
  end case;
end;
$$;

revoke all on function archive_record(text, uuid) from public;
grant execute on function archive_record(text, uuid) to authenticated;

-- ----------------------------------------------------------------
-- RPC: unarchive_record
-- Restore a single record. Owner only.
-- ----------------------------------------------------------------
create or replace function unarchive_record(p_table text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := get_my_role();
  if v_role <> 'owner' then
    raise exception 'only owners can restore archived records' using errcode = '42501';
  end if;

  case p_table
    when 'orders' then
      update orders        set is_archived = false, archived_at = null, archived_by = null where id = p_id;
    when 'expenses' then
      update expenses      set is_archived = false, archived_at = null, archived_by = null where id = p_id;
    when 'bookings' then
      update bookings      set is_archived = false, archived_at = null, archived_by = null where id = p_id;
    when 'stock_updates' then
      update stock_updates set is_archived = false, archived_at = null, archived_by = null where id = p_id;
    when 'notifications' then
      update notifications set is_archived = false, archived_at = null, archived_by = null where id = p_id;
    else
      raise exception 'unsupported table: %', p_table using errcode = '22023';
  end case;
end;
$$;

revoke all on function unarchive_record(text, uuid) from public;
grant execute on function unarchive_record(text, uuid) to authenticated;
