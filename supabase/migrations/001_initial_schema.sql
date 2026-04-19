-- ============================================================
-- 001_initial_schema.sql
-- MVP 1 — full initial schema for Staco Cafe Management App
-- All monetary values in cents (integer)
-- All dates in UTC ISO strings (timestamptz)
-- ============================================================

-- ----------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------
create type user_role as enum (
  'owner',
  'manager',
  'cashier',
  'inventory',
  'kitchen'
);

create type order_status as enum (
  'new_order',
  'accepted',
  'preparing',
  'ready',
  'completed',
  'cancelled',
  'refunded'
);

create type order_source as enum (
  'dine_in',
  'takeaway',
  'pickmefood',
  'ubereats',
  'other'
);

create type payment_method as enum (
  'cash',
  'card',
  'online',
  'other'
);

create type expense_category as enum (
  'ingredients',
  'utilities',
  'rent',
  'salaries',
  'maintenance',
  'packaging',
  'delivery_commission',
  'other'
);

create type salary_type as enum (
  'monthly',
  'daily',
  'hourly'
);

create type stock_update_type as enum (
  'stock_in',
  'stock_out',
  'adjustment',
  'wastage'
);

create type notification_type as enum (
  'low_stock',
  'salary_due',
  'order',
  'system'
);

-- ----------------------------------------------------------------
-- updated_at trigger function (shared)
-- ----------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------
-- TABLE: users
-- ----------------------------------------------------------------
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null,
  role        user_role not null default 'cashier',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

alter table users enable row level security;

-- owner: full access
create policy "owner_all_users" on users
  for all to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'owner')
  )
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'owner')
  );

-- everyone: read own row
create policy "self_read_users" on users
  for select to authenticated
  using (id = auth.uid());

-- ----------------------------------------------------------------
-- TABLE: suppliers
-- ----------------------------------------------------------------
create table suppliers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  contact        text,
  supplied_items text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_suppliers_updated_at
  before update on suppliers
  for each row execute function set_updated_at();

alter table suppliers enable row level security;

-- owner + manager + inventory role: full access
create policy "owner_manager_inventory_all_suppliers" on suppliers
  for all to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager', 'inventory')
    )
  )
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager', 'inventory')
    )
  );

-- ----------------------------------------------------------------
-- TABLE: ingredients
-- ----------------------------------------------------------------
create table ingredients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  category         text not null,
  unit             text not null,
  quantity         numeric(12, 3) not null default 0 check (quantity >= 0),
  min_stock_level  numeric(12, 3) not null default 0 check (min_stock_level >= 0),
  cost_price       integer not null default 0 check (cost_price >= 0),  -- cents
  supplier_id      uuid references suppliers(id) on delete set null,
  expiry_date      date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_ingredients_supplier on ingredients(supplier_id);
create index idx_ingredients_category on ingredients(category);

create trigger trg_ingredients_updated_at
  before update on ingredients
  for each row execute function set_updated_at();

alter table ingredients enable row level security;

create policy "owner_manager_inventory_all_ingredients" on ingredients
  for all to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager', 'inventory')
    )
  )
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager', 'inventory')
    )
  );

-- kitchen: read-only on ingredients
create policy "kitchen_read_ingredients" on ingredients
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'kitchen')
  );

-- ----------------------------------------------------------------
-- TABLE: menu_items
-- ----------------------------------------------------------------
create table menu_items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text not null,
  price         integer not null check (price >= 0),  -- cents
  is_available  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_menu_items_category on menu_items(category);
create index idx_menu_items_available on menu_items(is_available);

create trigger trg_menu_items_updated_at
  before update on menu_items
  for each row execute function set_updated_at();

alter table menu_items enable row level security;

-- owner + manager: full access
create policy "owner_manager_all_menu_items" on menu_items
  for all to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  );

-- cashier + kitchen: read-only
create policy "cashier_kitchen_read_menu_items" on menu_items
  for select to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('cashier', 'kitchen')
    )
  );

-- ----------------------------------------------------------------
-- TABLE: recipe_items
-- (Phase 2 — table created now for FK integrity, not actively used in MVP 1)
-- ----------------------------------------------------------------
create table recipe_items (
  id               uuid primary key default gen_random_uuid(),
  menu_item_id     uuid not null references menu_items(id) on delete cascade,
  ingredient_id    uuid not null references ingredients(id) on delete cascade,
  quantity_used    numeric(12, 3) not null check (quantity_used > 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (menu_item_id, ingredient_id)
);

create index idx_recipe_items_menu_item on recipe_items(menu_item_id);
create index idx_recipe_items_ingredient on recipe_items(ingredient_id);

create trigger trg_recipe_items_updated_at
  before update on recipe_items
  for each row execute function set_updated_at();

alter table recipe_items enable row level security;

create policy "owner_manager_all_recipe_items" on recipe_items
  for all to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  );

create policy "kitchen_read_recipe_items" on recipe_items
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'kitchen')
  );

-- ----------------------------------------------------------------
-- TABLE: orders
-- ----------------------------------------------------------------
create table orders (
  id               uuid primary key default gen_random_uuid(),
  source           order_source not null,
  status           order_status not null default 'new_order',
  customer_name    text,
  total_amount     integer not null default 0 check (total_amount >= 0),  -- cents
  discount         integer not null default 0 check (discount >= 0),      -- cents
  tax              integer not null default 0 check (tax >= 0),           -- cents
  commission       integer not null default 0 check (commission >= 0),    -- cents
  payment_method   payment_method,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz,
  updated_at       timestamptz not null default now()
);

create index idx_orders_status on orders(status);
create index idx_orders_source on orders(source);
create index idx_orders_created_at on orders(created_at desc);

create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

alter table orders enable row level security;

-- owner + manager: full access
create policy "owner_manager_all_orders" on orders
  for all to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  );

-- cashier: insert + select + update (status workflow), no delete
create policy "cashier_read_orders" on orders
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'cashier')
  );

create policy "cashier_insert_orders" on orders
  for insert to authenticated
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'cashier')
  );

create policy "cashier_update_orders" on orders
  for update to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'cashier')
  );

-- kitchen: read-only (preparing/ready workflow view)
create policy "kitchen_read_orders" on orders
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'kitchen')
  );

-- ----------------------------------------------------------------
-- TABLE: order_items
-- ----------------------------------------------------------------
create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  menu_item_id  uuid not null references menu_items(id) on delete restrict,
  quantity      integer not null check (quantity > 0),
  unit_price    integer not null check (unit_price >= 0),  -- cents, snapshot at time of order
  created_at    timestamptz not null default now()
);

create index idx_order_items_order on order_items(order_id);
create index idx_order_items_menu_item on order_items(menu_item_id);

alter table order_items enable row level security;

create policy "owner_manager_all_order_items" on order_items
  for all to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  );

create policy "cashier_all_order_items" on order_items
  for all to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'cashier')
  )
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'cashier')
  );

create policy "kitchen_read_order_items" on order_items
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'kitchen')
  );

-- ----------------------------------------------------------------
-- TABLE: expenses
-- ----------------------------------------------------------------
create table expenses (
  id           uuid primary key default gen_random_uuid(),
  category     expense_category not null,
  amount       integer not null check (amount > 0),  -- cents
  description  text,
  date         date not null default current_date,
  recorded_by  uuid not null references users(id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_expenses_date on expenses(date desc);
create index idx_expenses_category on expenses(category);
create index idx_expenses_recorded_by on expenses(recorded_by);

create trigger trg_expenses_updated_at
  before update on expenses
  for each row execute function set_updated_at();

alter table expenses enable row level security;

-- owner: full access
create policy "owner_all_expenses" on expenses
  for all to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'owner')
  )
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'owner')
  );

-- manager: read + insert (no delete, no update of others' records)
create policy "manager_read_expenses" on expenses
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'manager')
  );

create policy "manager_insert_expenses" on expenses
  for insert to authenticated
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'manager')
    and recorded_by = auth.uid()
  );

-- ----------------------------------------------------------------
-- TABLE: employees
-- ----------------------------------------------------------------
create table employees (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  role          text not null,
  contact       text,
  joining_date  date,
  salary_type   salary_type not null,
  base_salary   integer not null check (base_salary >= 0),  -- cents
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_employees_active on employees(is_active);

create trigger trg_employees_updated_at
  before update on employees
  for each row execute function set_updated_at();

alter table employees enable row level security;

-- owner: full access (including salary details)
create policy "owner_all_employees" on employees
  for all to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'owner')
  )
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'owner')
  );

-- manager: read-only but NOT salary fields — enforced at application layer
-- (Postgres RLS is row-level; column masking requires a view or app logic)
-- We grant read on the row; the application must exclude base_salary for managers.
create policy "manager_read_employees" on employees
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'manager')
  );

-- ----------------------------------------------------------------
-- TABLE: salaries
-- ----------------------------------------------------------------
create table salaries (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references employees(id) on delete restrict,
  month        date not null,  -- stored as first day of month (e.g. 2024-03-01)
  base_salary  integer not null check (base_salary >= 0),  -- cents
  overtime     integer not null default 0 check (overtime >= 0),   -- cents
  advances     integer not null default 0 check (advances >= 0),   -- cents
  deductions   integer not null default 0 check (deductions >= 0), -- cents
  net_salary   integer not null check (net_salary >= 0),           -- cents (computed at insert/update)
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (employee_id, month)
);

create index idx_salaries_employee on salaries(employee_id);
create index idx_salaries_month on salaries(month desc);

create trigger trg_salaries_updated_at
  before update on salaries
  for each row execute function set_updated_at();

alter table salaries enable row level security;

-- owner only: full access to salary records
create policy "owner_all_salaries" on salaries
  for all to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'owner')
  )
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'owner')
  );

-- ----------------------------------------------------------------
-- TABLE: stock_updates
-- ----------------------------------------------------------------
create table stock_updates (
  id             uuid primary key default gen_random_uuid(),
  ingredient_id  uuid not null references ingredients(id) on delete restrict,
  type           stock_update_type not null,
  quantity       numeric(12, 3) not null,  -- positive = added, can be negative for adjustments
  notes          text,
  updated_by     uuid not null references users(id) on delete restrict,
  created_at     timestamptz not null default now()
);

create index idx_stock_updates_ingredient on stock_updates(ingredient_id);
create index idx_stock_updates_type on stock_updates(type);
create index idx_stock_updates_created_at on stock_updates(created_at desc);
create index idx_stock_updates_updated_by on stock_updates(updated_by);

alter table stock_updates enable row level security;

-- owner + manager + inventory: full access
create policy "owner_manager_inventory_all_stock_updates" on stock_updates
  for all to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager', 'inventory')
    )
  )
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager', 'inventory')
    )
  );

-- ----------------------------------------------------------------
-- TABLE: notifications
-- ----------------------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  type        notification_type not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_notifications_is_read on notifications(is_read);
create index idx_notifications_created_at on notifications(created_at desc);

alter table notifications enable row level security;

-- owner + manager: full access to notifications
create policy "owner_manager_all_notifications" on notifications
  for all to authenticated
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role in ('owner', 'manager')
    )
  );

-- inventory role: read-only (to see low-stock notifications)
create policy "inventory_read_notifications" on notifications
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.role = 'inventory')
  );

-- ----------------------------------------------------------------
-- Trigger: apply stock change to ingredients.quantity on stock_updates insert
-- ----------------------------------------------------------------
create or replace function apply_stock_update()
returns trigger as $$
begin
  update ingredients
  set quantity = quantity + new.quantity
  where id = new.ingredient_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_apply_stock_update
  after insert on stock_updates
  for each row execute function apply_stock_update();

-- ----------------------------------------------------------------
-- Function: notify_low_stock
-- Inserts a notification when an ingredient falls below min_stock_level.
-- Called via trigger on ingredients.
-- ----------------------------------------------------------------
create or replace function notify_low_stock()
returns trigger as $$
begin
  if new.quantity < new.min_stock_level then
    insert into notifications (type, message)
    values (
      'low_stock',
      'Low stock: ' || new.name || ' (' || new.quantity || ' ' || new.unit || ' remaining, minimum ' || new.min_stock_level || ' ' || new.unit || ')'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_low_stock
  after update of quantity on ingredients
  for each row
  when (new.quantity < new.min_stock_level and (old.quantity >= old.min_stock_level or new.quantity < old.quantity))
  execute function notify_low_stock();

-- ----------------------------------------------------------------
-- View: low_stock_ingredients (convenience view for dashboard widget)
-- ----------------------------------------------------------------
create view low_stock_ingredients as
  select
    id,
    name,
    category,
    unit,
    quantity,
    min_stock_level,
    (min_stock_level - quantity) as shortfall
  from ingredients
  where quantity < min_stock_level
  order by shortfall desc;

-- ----------------------------------------------------------------
-- Realtime: enable for orders table (live order updates)
-- ----------------------------------------------------------------
alter publication supabase_realtime add table orders;
