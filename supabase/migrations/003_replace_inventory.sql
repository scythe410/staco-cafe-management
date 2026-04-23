-- ================================================================
-- Migration: Replace placeholder ingredients with real cafe inventory
-- Source: inventory.csv from cafe
-- ================================================================

begin;

-- Remove old placeholder ingredients and any stock_updates that reference them
delete from stock_updates
  where ingredient_id in (select id from ingredients);

delete from ingredients;

-- Insert 27 real inventory items
-- cost_price in cents per pack/unit as listed
insert into ingredients (
  id, name, category, unit, quantity, min_stock_level, cost_price, supplier_id, expiry_date
) values
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d01', 'Milk (900 ml)',                'Beverages',          'pack',   40.0,  20.0, 44000,    null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d02', 'Nutella (750 g)',              'Spreads & Sauces',   'jar',     1.0,   1.0, 485000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d03', 'Nescafe Classic (200 g x2)',   'Beverages',          'pack',    1.0,   1.0, 472500,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d04', 'Coffee Beans (1 kg)',          'Beverages',          'kg',      1.0,   1.0, 950000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d05', 'Local Coffee (200 g)',         'Beverages',          'pack',    1.0,   5.0, 150000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d06', 'Wafer Rolls (10 packs)',       'Snacks',             'pack',   10.0,   5.0, 12000,    null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d07', 'Peanut Butter (340 g x5)',     'Spreads & Sauces',   'pack',    1.0,   1.0, 380000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d08', 'Tomato Sauce (4 L x2)',        'Spreads & Sauces',   'pack',    1.0,   1.0, 250000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d09', 'Mayonnaise (3.78 L)',          'Spreads & Sauces',   'bottle',  1.0,   1.0, 550000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d10', 'Vanilla Essence (500 ml)',     'Baking',             'bottle',  1.0,   1.0, 225000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'Flour (1 kg x8)',             'Baking',             'pack',    1.0,   1.0, 32500,    null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'Soda 500 ml',                 'Beverages',          'bottle', 36.0,  12.0, 11200,    null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'Soda 1.5 L',                  'Beverages',          'bottle', 25.0,  10.0, 23300,    null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'Hersheys Syrup (623 ml)',      'Syrups & Toppings',  'bottle',  2.0,   1.0, 400000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'Monin Dark Chocolate (1.89 L)','Syrups & Toppings',  'bottle',  1.0,   1.0, 1040000,  null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d16', 'Crackers (500 g x2)',          'Snacks',             'pack',    1.0,   1.0, 200000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d17', 'Sprinkles (1 kg)',             'Syrups & Toppings',  'kg',      1.0,   1.0, 250000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d18', 'Almond (1 kg x2)',            'Baking',             'pack',    1.0,   1.0, 520000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d19', 'Cocoa Powder (1 kg x3)',       'Baking',             'pack',    1.0,   1.0, 550000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d20', 'Milo (400 g x3)',             'Beverages',          'pack',    1.0,   1.0, 89000,    null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'Marshmallow (250 g / 50 pcs)', 'Syrups & Toppings',  'pack',    1.0,   4.0, 30000,    null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'Lemon Syrup (1 L)',           'Syrups & Toppings',  'bottle',  1.0,   1.0, 700000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', 'Syrup (750 ml)',              'Syrups & Toppings',  'bottle',  1.0,   1.0, 500000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', 'Mint Syrup (750 ml)',         'Syrups & Toppings',  'bottle',  1.0,   1.0, 265000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d25', 'Raspberry Syrup (750 ml)',    'Syrups & Toppings',  'bottle',  1.0,   1.0, 265000,   null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d26', 'Mozzarella Cheese (2 kg)',    'Dairy',              'pack',    1.0,   1.0, 1000000,  null, null),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d27', 'Cornflakes (1 kg)',           'Snacks',             'kg',      1.0,   1.0, 300000,   null, null);

commit;
