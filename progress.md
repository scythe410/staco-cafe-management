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

### ✅ Phase 2 — Next.js App Shell (COMPLETE)
- [x] Next.js project init — `cafe-admin/` (App Router, TypeScript, Tailwind 4, shadcn/ui, Recharts, TanStack Query, date-fns, Supabase JS)
- [x] Auth — login page, session handling, role-based middleware
  - `constants/roles.ts` — ROLES constants + ROLE_ALLOWED_ROUTES map
  - `lib/supabase.ts` — browser client + middleware client (no next/headers)
  - `lib/supabase-server.ts` — server client (uses next/headers, server components only)
  - `middleware.ts` — Next.js middleware route guard (export named `middleware`)
    - Unauthenticated → redirect to /auth/login?redirect=<path>
    - Authenticated on /auth/* → redirect to /dashboard
    - Role-based path check; unknown role → sign out
    - Owner bypasses all role checks
  - `app/auth/login/page.tsx` — tablet-friendly login card, signInWithPassword, error display, redirect on success
  - Auth users created via Supabase Dashboard (not seed SQL). Role set in raw_user_meta_data.
  - Dev credentials: ceo@staco.lk (owner), manager@staco.lk, cashier@staco.lk — password: 12345
- [x] App shell — layout, sidebar, bottom nav, protected routes, empty module placeholders
  - `app/layout.tsx` — root layout with Inter font + React Query provider
  - `components/providers/query-provider.tsx` — TanStack Query client provider
  - `components/shared/sidebar.tsx` — left sidebar (lg+), nav links with lucide icons, user info + sign out
  - `components/shared/bottom-nav.tsx` — bottom tab bar (<lg), icon + label
  - `components/shared/protected-shell.tsx` — wraps sidebar + bottom nav + content area
  - `app/(protected)/layout.tsx` — server layout that checks session, passes user info to shell
  - `app/(protected)/dashboard/page.tsx` — placeholder dashboard
  - `app/(protected)/{finance,inventory,orders,employees,reports}/page.tsx` — placeholder module pages
  - `constants/navigation.ts` — shared NAV_ITEMS array for sidebar + bottom nav
  - `lib/types.ts` — all database entity TypeScript interfaces
  - `DESIGN.md` — design system reference (spacing, colours, badges, typography)

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
- Phase 2 complete. Next: Phase 3 — build core modules (finance, inventory, orders, employees).
- Middleware file is `middleware.ts` (export `middleware`), NOT `proxy.ts`.
- Supabase clients are split: `lib/supabase.ts` (browser + middleware) and `lib/supabase-server.ts` (server components only).
- Auth users created via Supabase Dashboard, NOT seed SQL. Role set in raw_user_meta_data via SQL update.
- Dev credentials: ceo@staco.lk (owner), manager@staco.lk, cashier@staco.lk — password: 12345
- UUIDs: owner=be4cc9f0-2a30-49ae-aaf5-a1e3f159f831, manager=bf0bc2b6-374c-4f11-9e12-5f55c43d75c7, cashier=93b58a03-3484-407f-a94c-f27788a43856
- Env vars needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (in `.env.local`).
