-- ============================================================
-- 007_bookings.sql
-- Special Bookings module — bookings, items, payments, RPC
-- ============================================================

-- ----------------------------------------------------------------
-- TABLE: bookings
-- ----------------------------------------------------------------
create table bookings (
  id              uuid primary key default gen_random_uuid(),
  booking_code    text unique not null,
  customer_name   text not null,
  customer_phone  text not null,
  customer_email  text,
  party_size      integer not null check (party_size > 0),
  occasion        text,
  booking_date    date not null,
  start_time      time not null,
  end_time        time not null,
  table_or_area   text,
  special_notes   text,
  subtotal        integer not null default 0 check (subtotal >= 0),
  discount        integer not null default 0 check (discount >= 0),
  service_charge  integer not null default 0 check (service_charge >= 0),
  tax             integer not null default 0 check (tax >= 0),
  total_amount    integer not null default 0 check (total_amount >= 0),
  deposit_paid    integer not null default 0 check (deposit_paid >= 0),
  deposit_method  text,
  balance_due     integer not null default 0,
  status          text not null default 'tentative'
                  check (status in (
                    'tentative', 'confirmed', 'in_progress',
                    'completed', 'cancelled', 'no_show'
                  )),
  source          text default 'walk_in'
                  check (source in ('walk_in', 'phone', 'whatsapp', 'email')),
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  cancelled_at    timestamptz,
  cancellation_reason text,
  constraint chk_end_after_start check (end_time > start_time)
);

create index idx_bookings_date on bookings(booking_date);
create index idx_bookings_status on bookings(status);
create index idx_bookings_customer_phone on bookings(customer_phone);
create index idx_bookings_code on bookings(booking_code);

-- updated_at trigger (uses existing set_updated_at function from 001)
create trigger trg_bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------
-- Booking code generator: STC-B-0001 etc.
-- ----------------------------------------------------------------
create sequence if not exists booking_code_seq start 1;

create or replace function generate_booking_code()
returns trigger language plpgsql as $$
begin
  if new.booking_code is null or new.booking_code = '' then
    new.booking_code := 'STC-B-' || lpad(nextval('booking_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger bookings_code_trigger
  before insert on bookings
  for each row execute function generate_booking_code();

-- ----------------------------------------------------------------
-- Auto-recalc total_amount + balance_due
-- ----------------------------------------------------------------
create or replace function recalc_booking_totals()
returns trigger language plpgsql as $$
begin
  new.total_amount := new.subtotal - new.discount + new.service_charge + new.tax;
  if new.total_amount < 0 then new.total_amount := 0; end if;
  new.balance_due  := new.total_amount - new.deposit_paid;
  return new;
end;
$$;

create trigger bookings_recalc_totals
  before insert or update on bookings
  for each row execute function recalc_booking_totals();

-- ----------------------------------------------------------------
-- TABLE: booking_items
-- ----------------------------------------------------------------
create table booking_items (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings(id) on delete cascade,
  menu_item_id  uuid not null references menu_items(id) on delete restrict,
  quantity      integer not null check (quantity > 0),
  unit_price    integer not null check (unit_price >= 0),
  notes         text,
  created_at    timestamptz not null default now()
);

create index idx_booking_items_booking on booking_items(booking_id);
create index idx_booking_items_menu_item on booking_items(menu_item_id);

-- ----------------------------------------------------------------
-- TABLE: booking_payments
-- ----------------------------------------------------------------
create table booking_payments (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings(id) on delete cascade,
  amount        integer not null check (amount > 0),
  method        text not null,
  type          text not null check (type in ('deposit', 'balance', 'refund')),
  reference     text,
  recorded_by   uuid references users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index idx_booking_payments_booking on booking_payments(booking_id);

-- ----------------------------------------------------------------
-- RLS
-- Owner + Manager: full access
-- Cashier: read + insert (no edit, no cancel)
-- Inventory + Kitchen: no access (no policies)
-- ----------------------------------------------------------------
alter table bookings         enable row level security;
alter table booking_items    enable row level security;
alter table booking_payments enable row level security;

-- bookings
create policy "owner_manager_all_bookings" on bookings
  for all to authenticated
  using (get_my_role() in ('owner', 'manager'))
  with check (get_my_role() in ('owner', 'manager'));

create policy "cashier_read_bookings" on bookings
  for select to authenticated
  using (get_my_role() = 'cashier');

create policy "cashier_insert_bookings" on bookings
  for insert to authenticated
  with check (get_my_role() = 'cashier');

-- booking_items
create policy "owner_manager_all_booking_items" on booking_items
  for all to authenticated
  using (get_my_role() in ('owner', 'manager'))
  with check (get_my_role() in ('owner', 'manager'));

create policy "cashier_read_booking_items" on booking_items
  for select to authenticated
  using (get_my_role() = 'cashier');

create policy "cashier_insert_booking_items" on booking_items
  for insert to authenticated
  with check (get_my_role() = 'cashier');

-- booking_payments
create policy "owner_manager_all_booking_payments" on booking_payments
  for all to authenticated
  using (get_my_role() in ('owner', 'manager'))
  with check (get_my_role() in ('owner', 'manager'));

create policy "cashier_read_booking_payments" on booking_payments
  for select to authenticated
  using (get_my_role() = 'cashier');

create policy "cashier_insert_booking_payments" on booking_payments
  for insert to authenticated
  with check (get_my_role() = 'cashier');

-- ----------------------------------------------------------------
-- RPC: create_booking_with_items
-- Atomic create — booking + items + initial deposit payment
-- ----------------------------------------------------------------
create or replace function create_booking_with_items(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_party_size integer,
  p_occasion text,
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_table_or_area text,
  p_special_notes text,
  p_discount integer,
  p_service_charge integer,
  p_tax integer,
  p_deposit_paid integer,
  p_deposit_method text,
  p_deposit_reference text,
  p_source text,
  p_created_by uuid,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_booking_id uuid;
  computed_subtotal integer := 0;
  item jsonb;
begin
  for item in select * from jsonb_array_elements(p_items) loop
    computed_subtotal := computed_subtotal +
      (item->>'unit_price')::integer * (item->>'quantity')::integer;
  end loop;

  insert into bookings (
    customer_name, customer_phone, customer_email, party_size, occasion,
    booking_date, start_time, end_time, table_or_area, special_notes,
    subtotal, discount, service_charge, tax,
    deposit_paid, deposit_method, source, created_by, status
  ) values (
    p_customer_name, p_customer_phone, p_customer_email, p_party_size, p_occasion,
    p_booking_date, p_start_time, p_end_time, p_table_or_area, p_special_notes,
    computed_subtotal, coalesce(p_discount, 0), coalesce(p_service_charge, 0), coalesce(p_tax, 0),
    coalesce(p_deposit_paid, 0), p_deposit_method, coalesce(p_source, 'walk_in'), p_created_by,
    case when coalesce(p_deposit_paid, 0) > 0 then 'confirmed' else 'tentative' end
  )
  returning id into new_booking_id;

  for item in select * from jsonb_array_elements(p_items) loop
    insert into booking_items (booking_id, menu_item_id, quantity, unit_price, notes)
    values (
      new_booking_id,
      (item->>'menu_item_id')::uuid,
      (item->>'quantity')::integer,
      (item->>'unit_price')::integer,
      nullif(item->>'notes', '')
    );
  end loop;

  if coalesce(p_deposit_paid, 0) > 0 then
    insert into booking_payments (booking_id, amount, method, type, reference, recorded_by)
    values (new_booking_id, p_deposit_paid, coalesce(p_deposit_method, 'cash'), 'deposit', nullif(p_deposit_reference, ''), p_created_by);
  end if;

  return new_booking_id;
end;
$$;

grant execute on function create_booking_with_items to authenticated;

-- ----------------------------------------------------------------
-- RPC: replace_booking_items
-- For edit flow — atomically replaces items and recomputes subtotal.
-- ----------------------------------------------------------------
create or replace function replace_booking_items(
  p_booking_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  computed_subtotal integer := 0;
  item jsonb;
begin
  delete from booking_items where booking_id = p_booking_id;

  for item in select * from jsonb_array_elements(p_items) loop
    computed_subtotal := computed_subtotal +
      (item->>'unit_price')::integer * (item->>'quantity')::integer;

    insert into booking_items (booking_id, menu_item_id, quantity, unit_price, notes)
    values (
      p_booking_id,
      (item->>'menu_item_id')::uuid,
      (item->>'quantity')::integer,
      (item->>'unit_price')::integer,
      nullif(item->>'notes', '')
    );
  end loop;

  update bookings set subtotal = computed_subtotal where id = p_booking_id;
end;
$$;

grant execute on function replace_booking_items to authenticated;
