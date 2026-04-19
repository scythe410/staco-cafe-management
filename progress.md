# Build Progress — Cafe Management App

## Current status
🟡 In progress — Phase 1 complete, Next.js project not yet initialised

## Phases

### ✅ Phase 1 — Database (COMPLETE, confirmed in Supabase)
- [x] Supabase schema — `supabase/migrations/001_initial_schema.sql`
  - All MVP 1 tables with correct types, constraints, FKs
  - Enums: user_role, order_status, order_source, payment_method, expense_category, salary_type, stock_update_type, notification_type
  - RLS enabled on all tables with per-role policies
  - updated_at trigger on all mutable tables
  - stock_updates insert trigger that adjusts ingredients.quantity
  - low_stock notification trigger on ingredients.quantity update
  - low_stock_ingredients convenience view
  - Realtime enabled on orders table
- [x] Dev seed data — `supabase/seed.sql` (confirmed working)
  - 3 auth users: owner@staco.lk, manager@staco.lk, cashier@staco.lk (password: Dev@1234)
  - 3 suppliers, 10 ingredients (1 below min stock to demo alert), 5 menu items (3 categories)
  - 3 employees + 6 salary records (3 paid prev month, 3 unpaid current month)
  - 20 orders across dine_in/takeaway/pickmefood/ubereats with mixed statuses + line items
  - 10 expenses across all categories
  - 4 seed notifications (low stock + salary due)

### 🔴 Phase 2 — Next.js App Shell
- [ ] Next.js project init (App Router, TypeScript, Tailwind, shadcn/ui)
- [ ] Auth — login page, session handling, role-based middleware
- [ ] Dashboard shell — layout, bottom nav, empty module placeholders

### 🔴 Phase 3 — Core Modules
- [ ] Financial analytics module
- [ ] Inventory module
- [ ] Order management module
- [ ] Employee + salary module

### 🔴 Phase 4 — Reports & Notifications
- [ ] Reports module (PDF + Excel export)
- [ ] Notifications (in-app, low stock + salary due alerts)

## Decisions made
- Currency stored in cents (integer) in DB, converted to LKR on display
- No live PickMe/Uber API in MVP 1 — manual entry + CSV import fallback
- Recipe-based stock deduction deferred to Phase 2 (feature phase, not build phase)
- Primary breakpoint: 1024px (tablet)

## Known issues / blockers
- None

## Notes for next session
- Start Phase 2: `npx create-next-app@latest` inside project root with TypeScript + Tailwind
- Install shadcn/ui, TanStack Query, Supabase JS client, date-fns, Recharts
- First component to build: auth login page + session middleware
