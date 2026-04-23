-- ============================================================
-- Stacko Cafe — Real Menu Seed
-- Migration: 004_menu_seed.sql
-- Run this in Supabase SQL Editor AFTER 003_inventory_seed.sql
-- ============================================================
-- Adds notes column to menu_items (if not exists),
-- clears all sample menu data, and inserts real Stacko menu.

-- Add notes column to menu_items (not in original schema)
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS notes text;

DELETE FROM order_items;
DELETE FROM recipe_items;
DELETE FROM menu_items;

-- ============================================================
-- MENU ITEMS
-- All prices in LKR cents (multiply LKR by 100)
-- Categories: coffee, matcha, shakes, waffles, desserts,
--             toppings_scoop, toppings_drizzle,
--             toppings_spread, toppings_savoury
-- is_available defaults to true
-- ============================================================

INSERT INTO menu_items (name, category, price, is_available, notes)
VALUES

  -- ── COFFEE SPECIALTIES ────────────────────────────────────
  ('Espresso',          'coffee',   32000,  true, NULL),
  ('Iced Americano',    'coffee',   45000,  true, NULL),
  ('Cappuccino',        'coffee',   50000,  true, NULL),
  ('Latte',             'coffee',   60000,  true, NULL),
  ('Iced Latte',        'coffee',   55000,  true, NULL),
  ('Mocha',             'coffee',   70000,  true, NULL),
  ('Coffee Frappe',     'coffee',  129000,  true, NULL),
  ('Hot Chocolate',     'coffee',   60000,  true, NULL),

  -- ── MATCHA DRINKS ─────────────────────────────────────────
  ('Matcha Latte',        'matcha',  145000,  true, NULL),
  ('Kithul Honey Matcha', 'matcha',  150000,  true, NULL),
  ('Strawberry Matcha',   'matcha',  250000,  true, NULL),
  ('Matcha Frappe',       'matcha',  155000,  true, NULL),

  -- ── SHAKES ────────────────────────────────────────────────
  ('Milo Shake',  'shakes',   78000,  true, NULL),
  ('Oreo Shake',  'shakes',  112000,  true, NULL),

  -- ── SIGNATURE WAFFLES ─────────────────────────────────────
  ('Waffle',           'waffles',   25000,  true, '1 waffle'),
  ('Chocolate Waffle', 'waffles',   30000,  true, '1 waffle'),
  ('Savoury Waffle',   'waffles',   35000,  true, '1 waffle'),

  -- ── DESSERTS ──────────────────────────────────────────────
  ('Affogato', 'desserts',   70000,  true, 'Ice cream + Espresso'),
  ('S''mores', 'desserts',   35000,  true, 'Marshmallow + Crackers'),

  -- ── TOPPINGS — SCOOP x1 ───────────────────────────────────
  ('Oreo Crumbles',    'toppings_scoop',   12000,  true, NULL),
  ('Cornflakes',       'toppings_scoop',    8000,  true, NULL),
  ('Chocolate Flakes', 'toppings_scoop',   10000,  true, NULL),
  ('Almond',           'toppings_scoop',   14000,  true, NULL),
  ('Cashew',           'toppings_scoop',   16000,  true, NULL),
  ('Pebbles',          'toppings_scoop',    8000,  true, NULL),
  ('Sprinkles',        'toppings_scoop',    8000,  true, NULL),
  ('Chocolate Chips',  'toppings_scoop',   10000,  true, NULL),
  ('Wafers',           'toppings_scoop',    4000,  true, NULL),
  ('Marshmallow',      'toppings_scoop',    4000,  true, NULL),

  -- ── TOPPINGS — DRIZZLES ───────────────────────────────────
  ('Chocolate Sauce',  'toppings_drizzle',  10000,  true, NULL),
  ('Strawberry Sauce', 'toppings_drizzle',  10000,  true, NULL),
  ('Caramel Sauce',    'toppings_drizzle',  10000,  true, NULL),

  -- ── TOPPINGS — SPREADS ────────────────────────────────────
  ('Nutella',       'toppings_spread',  10000,  true, NULL),
  ('Peanut Butter', 'toppings_spread',  12000,  true, NULL),

  -- ── TOPPINGS — SAVOURY BITES ──────────────────────────────
  ('Cheese',          'toppings_savoury',   30000,  true, NULL),
  ('Spicy Cheese',    'toppings_savoury',   32000,  true, NULL),
  ('Tuna Spread',     'toppings_savoury',   65000,  true, NULL),
  ('Mayonnaise',      'toppings_savoury',   10000,  true, NULL),
  ('Tomato Ketchup',  'toppings_savoury',   10000,  true, NULL),
  ('Seeni Sambol',    'toppings_savoury',    5000,  true, NULL);
