-- ============================================================
-- fix_rls_recursion.sql
-- Run this in your Supabase SQL Editor to fix the
-- "Database error querying schema" error.
--
-- Root cause: RLS policies on all tables were querying the
-- `users` table, but the `users` table itself had an RLS policy
-- that also queried `users` → infinite recursion → PostgREST crash.
--
-- Fix: add a SECURITY DEFINER function `get_my_role()` that
-- bypasses RLS, then replace all policies to use it.
-- ============================================================

-- Step 1: Create the helper function
create or replace function get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from users where id = auth.uid();
$$;

-- Step 2: Drop old policies and replace with non-recursive ones

-- users
drop policy if exists "owner_all_users" on users;
create policy "owner_all_users" on users
  for all to authenticated
  using (get_my_role() = 'owner')
  with check (get_my_role() = 'owner');

-- suppliers
drop policy if exists "owner_manager_inventory_all_suppliers" on suppliers;
create policy "owner_manager_inventory_all_suppliers" on suppliers
  for all to authenticated
  using (get_my_role() in ('owner', 'manager', 'inventory'))
  with check (get_my_role() in ('owner', 'manager', 'inventory'));

-- ingredients
drop policy if exists "owner_manager_inventory_all_ingredients" on ingredients;
create policy "owner_manager_inventory_all_ingredients" on ingredients
  for all to authenticated
  using (get_my_role() in ('owner', 'manager', 'inventory'))
  with check (get_my_role() in ('owner', 'manager', 'inventory'));

drop policy if exists "kitchen_read_ingredients" on ingredients;
create policy "kitchen_read_ingredients" on ingredients
  for select to authenticated
  using (get_my_role() = 'kitchen');

-- menu_items
drop policy if exists "owner_manager_all_menu_items" on menu_items;
create policy "owner_manager_all_menu_items" on menu_items
  for all to authenticated
  using (get_my_role() in ('owner', 'manager'))
  with check (get_my_role() in ('owner', 'manager'));

drop policy if exists "cashier_kitchen_read_menu_items" on menu_items;
create policy "cashier_kitchen_read_menu_items" on menu_items
  for select to authenticated
  using (get_my_role() in ('cashier', 'kitchen'));

-- recipe_items
drop policy if exists "owner_manager_all_recipe_items" on recipe_items;
create policy "owner_manager_all_recipe_items" on recipe_items
  for all to authenticated
  using (get_my_role() in ('owner', 'manager'))
  with check (get_my_role() in ('owner', 'manager'));

drop policy if exists "kitchen_read_recipe_items" on recipe_items;
create policy "kitchen_read_recipe_items" on recipe_items
  for select to authenticated
  using (get_my_role() = 'kitchen');

-- orders
drop policy if exists "owner_manager_all_orders" on orders;
create policy "owner_manager_all_orders" on orders
  for all to authenticated
  using (get_my_role() in ('owner', 'manager'))
  with check (get_my_role() in ('owner', 'manager'));

drop policy if exists "cashier_read_orders" on orders;
create policy "cashier_read_orders" on orders
  for select to authenticated
  using (get_my_role() = 'cashier');

drop policy if exists "cashier_insert_orders" on orders;
create policy "cashier_insert_orders" on orders
  for insert to authenticated
  with check (get_my_role() = 'cashier');

drop policy if exists "cashier_update_orders" on orders;
create policy "cashier_update_orders" on orders
  for update to authenticated
  using (get_my_role() = 'cashier');

drop policy if exists "kitchen_read_orders" on orders;
create policy "kitchen_read_orders" on orders
  for select to authenticated
  using (get_my_role() = 'kitchen');

-- order_items
drop policy if exists "owner_manager_all_order_items" on order_items;
create policy "owner_manager_all_order_items" on order_items
  for all to authenticated
  using (get_my_role() in ('owner', 'manager'))
  with check (get_my_role() in ('owner', 'manager'));

drop policy if exists "cashier_all_order_items" on order_items;
create policy "cashier_all_order_items" on order_items
  for all to authenticated
  using (get_my_role() = 'cashier')
  with check (get_my_role() = 'cashier');

drop policy if exists "kitchen_read_order_items" on order_items;
create policy "kitchen_read_order_items" on order_items
  for select to authenticated
  using (get_my_role() = 'kitchen');

-- expenses
drop policy if exists "owner_all_expenses" on expenses;
create policy "owner_all_expenses" on expenses
  for all to authenticated
  using (get_my_role() = 'owner')
  with check (get_my_role() = 'owner');

drop policy if exists "manager_read_expenses" on expenses;
create policy "manager_read_expenses" on expenses
  for select to authenticated
  using (get_my_role() = 'manager');

drop policy if exists "manager_insert_expenses" on expenses;
create policy "manager_insert_expenses" on expenses
  for insert to authenticated
  with check (
    get_my_role() = 'manager'
    and recorded_by = auth.uid()
  );

-- employees
drop policy if exists "owner_all_employees" on employees;
create policy "owner_all_employees" on employees
  for all to authenticated
  using (get_my_role() = 'owner')
  with check (get_my_role() = 'owner');

drop policy if exists "manager_read_employees" on employees;
create policy "manager_read_employees" on employees
  for select to authenticated
  using (get_my_role() = 'manager');

-- salaries
drop policy if exists "owner_all_salaries" on salaries;
create policy "owner_all_salaries" on salaries
  for all to authenticated
  using (get_my_role() = 'owner')
  with check (get_my_role() = 'owner');

-- stock_updates
drop policy if exists "owner_manager_inventory_all_stock_updates" on stock_updates;
create policy "owner_manager_inventory_all_stock_updates" on stock_updates
  for all to authenticated
  using (get_my_role() in ('owner', 'manager', 'inventory'))
  with check (get_my_role() in ('owner', 'manager', 'inventory'));

-- notifications
drop policy if exists "owner_manager_all_notifications" on notifications;
create policy "owner_manager_all_notifications" on notifications
  for all to authenticated
  using (get_my_role() in ('owner', 'manager'))
  with check (get_my_role() in ('owner', 'manager'));

drop policy if exists "inventory_read_notifications" on notifications;
create policy "inventory_read_notifications" on notifications
  for select to authenticated
  using (get_my_role() = 'inventory');
