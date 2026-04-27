-- ============================================================
-- seed.sql — Development seed data for Stacko Cafe Management
-- All monetary values in cents (1 LKR = 100 cents)
-- Run AFTER 001_initial_schema.sql
--
-- ⚠️  DEV ONLY — DO NOT USE IN PRODUCTION
-- These credentials are for local development only.
-- Production must use unique, strong passwords created via
-- the Supabase Dashboard. Never reuse these passwords.
--
-- Dev login credentials (all use password: Dev@1234)
--   ceo@staco.lk     → owner
--   manager@staco.lk → manager
--   cashier@staco.lk → cashier
--
-- NOTE: auth.users rows are created via Supabase Dashboard (Authentication > Users).
--       The UUIDs below are the ones assigned by Supabase on creation.
--       If you recreate these users, update the UUIDs throughout this file.
-- ============================================================

-- ----------------------------------------------------------------
-- Helpers: fixed UUIDs so re-runs are idempotent
-- ----------------------------------------------------------------
-- Users
-- u_owner   be4cc9f0-2a30-49ae-aaf5-a1e3f159f831  (ceo@staco.lk)
-- u_manager bf0bc2b6-374c-4f11-9e12-5f55c43d75c7  (manager@staco.lk)
-- u_cashier 93b58a03-3484-407f-a94c-f27788a43856  (cashier@staco.lk)

-- Suppliers
-- sup_1     b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01
-- sup_2     b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b02
-- sup_3     b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b03

-- Menu items
-- mi_1..5   c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01..05

-- Ingredients
-- ing_1..27 d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d01..27

-- Employees
-- emp_1..3  e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01..03

-- Orders
-- ord_1..20 f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f01..20


-- ================================================================
-- SECTION 1: AUTH USERS
-- ================================================================
-- pgcrypto is already enabled by the migration.
-- Passwords are hashed with bcrypt cost 10.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
(
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'ceo@staco.lk',
  crypt('Dev@1234', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Owner"}',
  now() - interval '90 days',
  now()
),
(
  'bf0bc2b6-374c-4f11-9e12-5f55c43d75c7',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'manager@staco.lk',
  crypt('Dev@1234', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Manager"}',
  now() - interval '60 days',
  now()
),
(
  '93b58a03-3484-407f-a94c-f27788a43856',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'cashier@staco.lk',
  crypt('Dev@1234', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Cashier"}',
  now() - interval '30 days',
  now()
)
on conflict (id) do nothing;

-- auth.identities is required by GoTrue for email sign-in.
-- Each auth.users row needs a matching identity row.
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
(
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831',
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831',
  'ceo@staco.lk',
  '{"sub":"be4cc9f0-2a30-49ae-aaf5-a1e3f159f831","email":"ceo@staco.lk"}',
  'email',
  now(),
  now(),
  now()
),
(
  'bf0bc2b6-374c-4f11-9e12-5f55c43d75c7',
  'bf0bc2b6-374c-4f11-9e12-5f55c43d75c7',
  'manager@staco.lk',
  '{"sub":"bf0bc2b6-374c-4f11-9e12-5f55c43d75c7","email":"manager@staco.lk"}',
  'email',
  now(),
  now(),
  now()
),
(
  '93b58a03-3484-407f-a94c-f27788a43856',
  '93b58a03-3484-407f-a94c-f27788a43856',
  'cashier@staco.lk',
  '{"sub":"93b58a03-3484-407f-a94c-f27788a43856","email":"cashier@staco.lk"}',
  'email',
  now(),
  now(),
  now()
)
on conflict (id) do nothing;


-- ================================================================
-- SECTION 2: PUBLIC USERS
-- ================================================================
insert into users (id, email, full_name, role, created_at) values
(
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831',
  'ceo@staco.lk',
  'Owner',
  'owner',
  now() - interval '90 days'
),
(
  'bf0bc2b6-374c-4f11-9e12-5f55c43d75c7',
  'manager@staco.lk',
  'Manager',
  'manager',
  now() - interval '60 days'
),
(
  '93b58a03-3484-407f-a94c-f27788a43856',
  'cashier@staco.lk',
  'Cashier',
  'cashier',
  now() - interval '30 days'
)
on conflict (id) do nothing;


-- ================================================================
-- SECTION 3: SUPPLIERS
-- ================================================================
insert into suppliers (id, name, contact, supplied_items, notes) values
(
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
  'Green Leaf Produce',
  '0771-234567',
  'Vegetables, Eggs, Fresh Herbs',
  'Delivers Mon/Wed/Fri mornings. Contact Niroshan.'
),
(
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
  'Island Dry Goods Co.',
  '0112-456789',
  'Rice, Flour, Sugar, Spices, Lentils, Cooking Oil',
  'Weekly delivery every Tuesday. Minimum order LKR 20,000.'
),
(
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
  'Ceylon Beverage Suppliers',
  '0777-891234',
  'Coffee Beans, Tea Leaves, Milk Powder, Syrups',
  'Specialty coffee beans from Nuwara Eliya estate. Lead time 3 days.'
)
on conflict (id) do nothing;


-- ================================================================
-- SECTION 4: INGREDIENTS (10 items)
-- Quantities in natural units; cost_price in cents per pack/unit as listed
-- Real inventory from cafe CSV — 27 items
-- supplier_id set to null (Phase 2 supplier management)
-- ================================================================
insert into ingredients (
  id, name, category, unit, quantity, min_stock_level, cost_price, supplier_id, expiry_date
) values
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
  'Milk (900 ml)',
  'Beverages',
  'pack',
  40.0,
  20.0,
  44000,    -- LKR 440 per pack
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
  'Nutella (750 g)',
  'Spreads & Sauces',
  'jar',
  1.0,
  1.0,
  485000,   -- LKR 4,850 per jar
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
  'Nescafe Classic (200 g x2)',
  'Beverages',
  'pack',
  1.0,
  1.0,
  472500,   -- LKR 4,725 per pack of 2
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d04',
  'Coffee Beans (1 kg)',
  'Beverages',
  'kg',
  1.0,
  1.0,
  950000,   -- LKR 9,500 per kg
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d05',
  'Local Coffee (200 g)',
  'Beverages',
  'pack',
  1.0,
  5.0,      -- min 5 kg worth → low stock alert
  150000,   -- LKR 1,500 per 200 g pack
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d06',
  'Wafer Rolls (10 packs)',
  'Snacks',
  'pack',
  10.0,
  5.0,
  12000,    -- LKR 120 per pack
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d07',
  'Peanut Butter (340 g x5)',
  'Spreads & Sauces',
  'pack',
  1.0,
  1.0,
  380000,   -- LKR 3,800 per pack of 5
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d08',
  'Tomato Sauce (4 L x2)',
  'Spreads & Sauces',
  'pack',
  1.0,
  1.0,
  250000,   -- LKR 2,500 per pack of 2
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d09',
  'Mayonnaise (3.78 L)',
  'Spreads & Sauces',
  'bottle',
  1.0,
  1.0,
  550000,   -- LKR 5,500 per bottle
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d10',
  'Vanilla Essence (500 ml)',
  'Baking',
  'bottle',
  1.0,
  1.0,
  225000,   -- LKR 2,250 per bottle
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d11',
  'Flour (1 kg x8)',
  'Baking',
  'pack',
  1.0,
  1.0,
  32500,    -- LKR 325 per pack of 8 kg
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d12',
  'Soda 500 ml',
  'Beverages',
  'bottle',
  36.0,
  12.0,
  11200,    -- LKR 112 per bottle
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d13',
  'Soda 1.5 L',
  'Beverages',
  'bottle',
  25.0,
  10.0,
  23300,    -- LKR 233 per bottle
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d14',
  'Hersheys Syrup (623 ml)',
  'Syrups & Toppings',
  'bottle',
  2.0,
  1.0,
  400000,   -- LKR 4,000 per bottle (Chocolate & Strawberry)
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d15',
  'Monin Dark Chocolate (1.89 L)',
  'Syrups & Toppings',
  'bottle',
  1.0,
  1.0,
  1040000,  -- LKR 10,400 per bottle
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d16',
  'Crackers (500 g x2)',
  'Snacks',
  'pack',
  1.0,
  1.0,
  200000,   -- LKR 2,000 per pack
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d17',
  'Sprinkles (1 kg)',
  'Syrups & Toppings',
  'kg',
  1.0,
  1.0,
  250000,   -- LKR 2,500 per kg
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d18',
  'Almond (1 kg x2)',
  'Baking',
  'pack',
  1.0,
  1.0,
  520000,   -- LKR 5,200 per pack of 2 kg
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d19',
  'Cocoa Powder (1 kg x3)',
  'Baking',
  'pack',
  1.0,
  1.0,
  550000,   -- LKR 5,500 per pack of 3 kg
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d20',
  'Milo (400 g x3)',
  'Beverages',
  'pack',
  1.0,
  1.0,
  89000,    -- LKR 890 per pack of 3
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d21',
  'Marshmallow (250 g / 50 pcs)',
  'Syrups & Toppings',
  'pack',
  1.0,
  4.0,      -- min 4 packs → low stock alert
  30000,    -- LKR 300 per pack
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d22',
  'Lemon Syrup (1 L)',
  'Syrups & Toppings',
  'bottle',
  1.0,
  1.0,
  700000,   -- LKR 7,000 per bottle
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d23',
  'Syrup (750 ml)',
  'Syrups & Toppings',
  'bottle',
  1.0,
  1.0,
  500000,   -- LKR 5,000 per bottle
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d24',
  'Mint Syrup (750 ml)',
  'Syrups & Toppings',
  'bottle',
  1.0,
  1.0,
  265000,   -- LKR 2,650 per bottle
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d25',
  'Raspberry Syrup (750 ml)',
  'Syrups & Toppings',
  'bottle',
  1.0,
  1.0,
  265000,   -- LKR 2,650 per bottle
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d26',
  'Mozzarella Cheese (2 kg)',
  'Dairy',
  'pack',
  1.0,
  1.0,
  1000000,  -- LKR 10,000 per 2 kg pack
  null,
  null
),
(
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d27',
  'Cornflakes (1 kg)',
  'Snacks',
  'kg',
  1.0,
  1.0,
  300000,   -- LKR 3,000 per kg
  null,
  null
)
on conflict (id) do nothing;


-- ================================================================
-- SECTION 5: MENU ITEMS (5 items across 3 categories)
-- ================================================================
insert into menu_items (id, name, category, price, is_available) values
-- Category: Beverages
(
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
  'Espresso',
  'Beverages',
  45000,    -- LKR 450
  true
),
(
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c02',
  'Iced Caramel Latte',
  'Beverages',
  65000,    -- LKR 650
  true
),
-- Category: Rice & Curry
(
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03',
  'Rice & Chicken Curry',
  'Rice & Curry',
  89000,    -- LKR 890
  true
),
(
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c04',
  'Egg Fried Rice',
  'Rice & Curry',
  75000,    -- LKR 750
  true
),
-- Category: Snacks
(
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c05',
  'Chicken Club Sandwich',
  'Snacks',
  72000,    -- LKR 720
  true
)
on conflict (id) do nothing;


-- ================================================================
-- SECTION 6: EMPLOYEES (3)
-- ================================================================
insert into employees (
  id, full_name, role, contact, joining_date, salary_type, base_salary, is_active
) values
(
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
  'Kamal Dissanayake',
  'Head Barista',
  '0712-345678',
  '2023-06-01',
  'monthly',
  8500000,  -- LKR 85,000/month
  true
),
(
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e02',
  'Nimal Rajapaksa',
  'Chef',
  '0723-456789',
  '2023-08-15',
  'monthly',
  7500000,  -- LKR 75,000/month
  true
),
(
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
  'Priya Wickramasinghe',
  'Cashier',
  '0761-567890',
  '2024-01-10',
  'monthly',
  6000000,  -- LKR 60,000/month
  true
)
on conflict (id) do nothing;


-- ================================================================
-- SECTION 7: SALARY RECORDS (current month + previous month)
-- net_salary = base_salary + overtime - advances - deductions
-- ================================================================
insert into salaries (
  id, employee_id, month, base_salary, overtime, advances, deductions, net_salary, paid_at
) values
-- Previous month — all paid
(
  gen_random_uuid(),
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
  date_trunc('month', current_date - interval '1 month')::date,
  8500000, 425000, 0, 0, 8925000,
  current_date - interval '5 days'
),
(
  gen_random_uuid(),
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e02',
  date_trunc('month', current_date - interval '1 month')::date,
  7500000, 0, 200000, 0, 7300000,
  current_date - interval '5 days'
),
(
  gen_random_uuid(),
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
  date_trunc('month', current_date - interval '1 month')::date,
  6000000, 0, 0, 0, 6000000,
  current_date - interval '5 days'
),
-- Current month — unpaid (salary due alert scenario)
(
  gen_random_uuid(),
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
  date_trunc('month', current_date)::date,
  8500000, 0, 0, 0, 8500000,
  null
),
(
  gen_random_uuid(),
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e02',
  date_trunc('month', current_date)::date,
  7500000, 0, 0, 0, 7500000,
  null
),
(
  gen_random_uuid(),
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
  date_trunc('month', current_date)::date,
  6000000, 0, 0, 0, 6000000,
  null
);


-- ================================================================
-- SECTION 8: EXPENSES (10 records across different categories)
-- ================================================================
insert into expenses (id, category, amount, description, date, recorded_by) values
(
  gen_random_uuid(),
  'rent',
  450000000,  -- LKR 4,500,000/month rent
  'Monthly shop rent — April 2026',
  date_trunc('month', current_date)::date,
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831'
),
(
  gen_random_uuid(),
  'utilities',
  8500000,    -- LKR 85,000 electricity
  'CEB electricity bill — March 2026',
  (current_date - interval '18 days')::date,
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831'
),
(
  gen_random_uuid(),
  'utilities',
  1200000,    -- LKR 12,000 water
  'Water bill — March 2026',
  (current_date - interval '18 days')::date,
  'bf0bc2b6-374c-4f11-9e12-5f55c43d75c7'
),
(
  gen_random_uuid(),
  'ingredients',
  35000000,   -- LKR 350,000 produce restock
  'Weekly vegetable & protein restock from Green Leaf Produce',
  (current_date - interval '7 days')::date,
  'bf0bc2b6-374c-4f11-9e12-5f55c43d75c7'
),
(
  gen_random_uuid(),
  'ingredients',
  22500000,   -- LKR 225,000 dry goods
  'Monthly dry goods order — Island Dry Goods Co.',
  (current_date - interval '14 days')::date,
  'bf0bc2b6-374c-4f11-9e12-5f55c43d75c7'
),
(
  gen_random_uuid(),
  'ingredients',
  18000000,   -- LKR 180,000 coffee & tea
  'Coffee beans & tea restock — Ceylon Beverage Suppliers',
  (current_date - interval '10 days')::date,
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831'
),
(
  gen_random_uuid(),
  'maintenance',
  9500000,    -- LKR 95,000 espresso machine service
  'Espresso machine descaling and group head service',
  (current_date - interval '21 days')::date,
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831'
),
(
  gen_random_uuid(),
  'packaging',
  4200000,    -- LKR 42,000 takeaway packaging
  'Takeaway boxes, cups, and paper bags restock',
  (current_date - interval '5 days')::date,
  'bf0bc2b6-374c-4f11-9e12-5f55c43d75c7'
),
(
  gen_random_uuid(),
  'delivery_commission',
  12600000,   -- LKR 126,000 PickMe commission
  'PickMe Food platform commission — March 2026',
  (current_date - interval '3 days')::date,
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831'
),
(
  gen_random_uuid(),
  'other',
  3500000,    -- LKR 35,000 misc
  'Staff uniform replacements (3 sets)',
  (current_date - interval '12 days')::date,
  'be4cc9f0-2a30-49ae-aaf5-a1e3f159f831'
);


-- ================================================================
-- SECTION 9: ORDERS (20 orders across all sources and statuses)
-- Order amounts are totals after discount/tax.
-- ================================================================

-- We insert orders first, then order_items below.

insert into orders (
  id, source, status, customer_name,
  total_amount, discount, tax, commission,
  payment_method, created_at, completed_at
) values

-- Dine-in orders (8)
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f01',
  'dine_in', 'completed', 'Table 3',
  298000, 0, 26820, 0,
  'cash',
  now() - interval '2 days' + interval '8 hours',
  now() - interval '2 days' + interval '9 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f02',
  'dine_in', 'completed', 'Table 7',
  164000, 10000, 13860, 0,
  'card',
  now() - interval '2 days' + interval '12 hours',
  now() - interval '2 days' + interval '13 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f03',
  'dine_in', 'completed', 'Table 1',
  214000, 0, 19260, 0,
  'cash',
  now() - interval '1 day' + interval '7 hours',
  now() - interval '1 day' + interval '8 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f04',
  'dine_in', 'completed', 'Table 5',
  89000, 0, 8010, 0,
  'card',
  now() - interval '1 day' + interval '11 hours',
  now() - interval '1 day' + interval '12 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f05',
  'dine_in', 'cancelled', 'Table 2',
  72000, 0, 0, 0,
  null,
  now() - interval '1 day' + interval '14 hours',
  null
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f06',
  'dine_in', 'preparing', 'Table 4',
  161000, 0, 14490, 0,
  null,
  now() - interval '30 minutes',
  null
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f07',
  'dine_in', 'ready', 'Table 6',
  134000, 0, 12060, 0,
  null,
  now() - interval '15 minutes',
  null
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f08',
  'dine_in', 'new_order', 'Table 8',
  110000, 0, 9900, 0,
  null,
  now() - interval '5 minutes',
  null
),

-- Takeaway orders (4)
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f09',
  'takeaway', 'completed', 'Amara Silva',
  207000, 0, 18630, 0,
  'cash',
  now() - interval '3 days' + interval '9 hours',
  now() - interval '3 days' + interval '9 hours 30 minutes'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f10',
  'takeaway', 'completed', 'Thilina Bandara',
  137000, 0, 12330, 0,
  'card',
  now() - interval '1 day' + interval '16 hours',
  now() - interval '1 day' + interval '16 hours 20 minutes'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f11',
  'takeaway', 'completed', 'Dilini Madushani',
  89000, 0, 8010, 0,
  'cash',
  now() - interval '4 hours',
  now() - interval '3 hours 40 minutes'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f12',
  'takeaway', 'accepted', 'Roshan Kumara',
  164000, 0, 14760, 0,
  'cash',
  now() - interval '20 minutes',
  null
),

-- PickMe Food orders (4)
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f13',
  'pickmefood', 'completed', 'PickMe #PMF-8821',
  298000, 0, 26820, 44700,  -- 15% commission
  'online',
  now() - interval '5 days' + interval '12 hours',
  now() - interval '5 days' + interval '13 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f14',
  'pickmefood', 'completed', 'PickMe #PMF-9104',
  164000, 0, 14760, 24600,
  'online',
  now() - interval '4 days' + interval '19 hours',
  now() - interval '4 days' + interval '20 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f15',
  'pickmefood', 'completed', 'PickMe #PMF-9367',
  161000, 0, 14490, 24150,
  'online',
  now() - interval '2 days' + interval '20 hours',
  now() - interval '2 days' + interval '21 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f16',
  'pickmefood', 'cancelled', 'PickMe #PMF-9512',
  89000, 0, 0, 0,
  'online',
  now() - interval '1 day' + interval '20 hours',
  null
),

-- Uber Eats orders (4)
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f17',
  'ubereats', 'completed', 'Uber #UE-44201',
  254000, 0, 22860, 50800,  -- 20% commission
  'online',
  now() - interval '6 days' + interval '18 hours',
  now() - interval '6 days' + interval '19 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f18',
  'ubereats', 'completed', 'Uber #UE-44567',
  207000, 0, 18630, 41400,
  'online',
  now() - interval '3 days' + interval '13 hours',
  now() - interval '3 days' + interval '14 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f19',
  'ubereats', 'completed', 'Uber #UE-44891',
  137000, 0, 12330, 27400,
  'online',
  now() - interval '1 day' + interval '18 hours',
  now() - interval '1 day' + interval '19 hours'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f20',
  'ubereats', 'preparing', 'Uber #UE-45102',
  161000, 0, 14490, 32200,
  'online',
  now() - interval '45 minutes',
  null
)

on conflict (id) do nothing;


-- ================================================================
-- SECTION 10: ORDER ITEMS
-- (unit_price = snapshot of price at time of order, in cents)
-- ================================================================
insert into order_items (order_id, menu_item_id, quantity, unit_price) values

-- ord_01: Table 3 — 2x Espresso + 1x Rice & Chicken Curry + 1x Club Sandwich
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 2, 45000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 1, 72000),

-- ord_02: Table 7 — 2x Iced Caramel Latte + 1x Club Sandwich
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 2, 65000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 1, 72000),

-- ord_03: Table 1 — 1x Rice & Chicken Curry + 1x Egg Fried Rice + 1x Espresso
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 1, 75000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 1, 45000),

-- ord_04: Table 5 — 1x Rice & Chicken Curry
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f04', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),

-- ord_05: Table 2 (cancelled) — 1x Club Sandwich
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f05', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 1, 72000),

-- ord_06: Table 4 (preparing) — 1x Egg Fried Rice + 1x Iced Caramel Latte
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f06', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 1, 75000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f06', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 1, 65000),

-- ord_07: Table 6 (ready) — 1x Rice & Chicken Curry + 1x Espresso
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f07', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 1, 45000),

-- ord_08: Table 8 (new) — 1x Iced Caramel Latte + 1x Club Sandwich
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f08', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 1, 65000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f08', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 1, 72000),

-- ord_09: Amara Silva (takeaway) — 1x Rice & Chicken Curry + 1x Egg Fried Rice
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f09', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f09', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 1, 75000),

-- ord_10: Thilina Bandara (takeaway) — 2x Espresso + 1x Club Sandwich
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f10', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 2, 45000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f10', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 1, 72000),

-- ord_11: Dilini Madushani (takeaway) — 1x Rice & Chicken Curry
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),

-- ord_12: Roshan Kumara (takeaway, accepted) — 2x Iced Caramel Latte
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 2, 65000),

-- ord_13: PickMe #8821 — 1x Rice & Chicken Curry + 1x Egg Fried Rice + 1x Espresso
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 1, 75000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 1, 45000),

-- ord_14: PickMe #9104 — 1x Egg Fried Rice + 1x Iced Caramel Latte
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f14', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 1, 75000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f14', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 1, 65000),

-- ord_15: PickMe #9367 — 1x Rice & Chicken Curry + 1x Espresso
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f15', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f15', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 1, 45000),

-- ord_16: PickMe #9512 (cancelled) — 1x Rice & Chicken Curry
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f16', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),

-- ord_17: Uber #44201 — 1x Rice & Chicken Curry + 1x Egg Fried Rice + 1x Iced Caramel Latte
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f17', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f17', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 1, 75000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f17', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 1, 65000),

-- ord_18: Uber #44567 — 1x Rice & Chicken Curry + 1x Egg Fried Rice
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f18', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f18', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 1, 75000),

-- ord_19: Uber #44891 — 2x Espresso + 1x Club Sandwich
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f19', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 2, 45000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f19', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 1, 72000),

-- ord_20: Uber #45102 (preparing) — 1x Rice & Chicken Curry + 1x Iced Caramel Latte
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f20', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 1, 89000),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f20', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 1, 65000)

on conflict do nothing;


-- ================================================================
-- SECTION 11: STOCK UPDATES — recent restocks to populate history
-- (The apply_stock_update trigger will adjust ingredients.quantity
--  but we seeded ingredient quantities directly above, so we
--  insert stock_updates as historical records with quantity deltas
--  that represent what happened to reach the seeded quantities.)
-- NOTE: If running seed after a fresh schema apply, disable or
--       temporarily drop the apply_stock_update trigger to avoid
--       double-counting with the quantities set in SECTION 4.
--       Alternatively, treat these as the audit trail only.
-- ================================================================

-- For simplicity in dev: skip stock_update history records here.
-- The trigger is already tested via the schema migration.
-- Stock update records can be created through the app UI.


-- ================================================================
-- SECTION 12: NOTIFICATIONS — seed a few for dashboard demo
-- ================================================================
insert into notifications (type, message, is_read, created_at) values
(
  'low_stock',
  'Low stock: Ceylon Tea Leaves (0.8 kg remaining, minimum 1.5 kg)',
  false,
  now() - interval '2 hours'
),
(
  'low_stock',
  'Low stock: Fresh Milk (18 L remaining, minimum 10 L) — expiry in 5 days',
  true,
  now() - interval '1 day'
),
(
  'salary_due',
  'Salary due: 3 employees have unpaid salaries for ' || to_char(date_trunc('month', current_date), 'Month YYYY'),
  false,
  now() - interval '30 minutes'
),
(
  'order',
  'New PickMe Food order received — #PMF-9512',
  true,
  now() - interval '1 day' + interval '20 hours'
);
