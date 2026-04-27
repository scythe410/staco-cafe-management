-- ================================================================
-- Migration 009: Booking fee
-- - Adds a separate `booking_fee` column (venue/booking charge,
--   distinct from food subtotal)
-- - Updates recalc trigger to include booking_fee in total
-- - Replaces create_booking_with_items RPC with p_booking_fee param
-- ================================================================

alter table bookings
  add column if not exists booking_fee integer not null default 0
  check (booking_fee >= 0);

-- ----------------------------------------------------------------
-- Updated recalc trigger:
--   total = subtotal + booking_fee + service_charge + tax - discount
-- ----------------------------------------------------------------
create or replace function recalc_booking_totals()
returns trigger language plpgsql as $$
begin
  new.total_amount := new.subtotal + new.booking_fee
                    + new.service_charge + new.tax
                    - new.discount;
  if new.total_amount < 0 then new.total_amount := 0; end if;
  new.balance_due  := new.total_amount - new.deposit_paid;
  return new;
end;
$$;

-- ----------------------------------------------------------------
-- Replace RPC: create_booking_with_items (now accepts p_booking_fee)
-- ----------------------------------------------------------------
drop function if exists create_booking_with_items(
  text, text, text, integer, text, date, time, time, text, text,
  integer, integer, integer, integer, text, text, text, uuid, jsonb
);

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
  p_booking_fee integer,
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
    subtotal, booking_fee, discount, service_charge, tax,
    deposit_paid, deposit_method, source, created_by, status
  ) values (
    p_customer_name, p_customer_phone, p_customer_email, p_party_size, p_occasion,
    p_booking_date, p_start_time, p_end_time, p_table_or_area, p_special_notes,
    computed_subtotal, coalesce(p_booking_fee, 0), coalesce(p_discount, 0),
    coalesce(p_service_charge, 0), coalesce(p_tax, 0),
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

grant execute on function create_booking_with_items(
  text, text, text, integer, text, date, time, time, text, text,
  integer, integer, integer, integer, integer, text, text, text, uuid, jsonb
) to authenticated;
