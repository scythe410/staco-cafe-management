-- Add service_charge to orders table
-- (discount and tax columns already exist from the initial schema)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS service_charge integer NOT NULL DEFAULT 0;
