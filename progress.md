# Build Progress — Cafe Management App

## Current status
✅ MVP 1 COMPLETE — All phases done (Database, App Shell, Core Modules, Reports & Notifications, Audit & Deploy Prep)

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

### ✅ Phase 3 — Core Modules (COMPLETE)
- [x] Dashboard — real data via React Query hooks + Supabase
  - `hooks/useDashboard.ts` — 6 hooks: useTodaySales, useTodayOrderCounts, useTodayProfitEstimate, useLowStockItems, useOrdersBySource, useRevenueTrend
  - `constants/orders.ts` — ORDER_STATUS, ORDER_SOURCE, PENDING_STATUSES, ORDER_SOURCE_LABELS
  - 6 widget components wired to live Supabase data with loading/error/empty states
  - Low stock queries the `low_stock_ingredients` DB view
  - Revenue trend buckets completed orders by day for last 7 days
- [x] Financial analytics module
  - `hooks/useFinance.ts` — useFinanceSummary, useRevenueByDay, usePaymentMethodSplit, useMonthComparison, useExpenses, useExpenseBreakdown, useCreateExpense, usePlatformEarnings
  - `constants/expenses.ts` — EXPENSE_CATEGORY, labels, colors
  - `components/finance/finance-tabs.tsx` — tabbed layout (Overview, Expenses, Platform Earnings) with shared date range state
  - `components/finance/date-range-picker.tsx` — preset selector (today/week/month/custom) + custom date inputs
  - `components/finance/overview-tab.tsx` — KPI cards (income, expenses, net profit, orders), revenue by day bar chart, payment method pie chart, month-over-month comparison with growth %
  - `components/finance/expenses-tab.tsx` — filterable expense table (category, date range), add expense dialog, expense breakdown donut chart
  - `components/finance/add-expense-dialog.tsx` — expense entry form (category, amount in LKR→cents, date, description)
  - `components/finance/platform-tab.tsx` — per-platform cards (gross, commission, net), comparison bar chart
  - All calculations done via Supabase queries — no derived values stored
- [x] Inventory module
  - `hooks/useInventory.ts` — useIngredients, useSuppliers, CRUD mutations, useLowStockIngredients, useLowStockCount, useLastRestockDates
  - `components/inventory/` — InventoryTable, AddItemDialog, EditItemDialog, StockUpdateDialog, LowStockTable, LowStockLink
  - `app/(protected)/inventory/page.tsx` — main inventory page with table + low stock link
  - `app/(protected)/inventory/low-stock/page.tsx` — low stock alerts page (items below min level, shortfall, last restock date, restock button)
  - Badge count on Inventory nav link (sidebar + bottom nav) showing low stock item count
- [x] Order management module
  - `hooks/useOrders.ts` — useOrders (filterable), useOrderDetail, useMenuItems, useUpdateOrderStatus, useCreateOrder
  - `constants/orders.ts` — expanded with status labels/variants, next-status workflow, source colors, payment method constants, commission sources
  - `components/orders/orders-table.tsx` — filterable table (source, status, payment method, date range, search by ID/customer), click row opens detail
  - `components/orders/order-detail-dialog.tsx` — full order view with line items, totals, commission for delivery platforms, net amount, status advance/cancel buttons
  - `components/orders/add-order-dialog.tsx` — manual order entry: source, customer, payment, menu item selector with qty +/-, auto-calculated total, commission field for delivery sources
  - `app/(protected)/orders/page.tsx` — orders page with table + new order button
  - `useRealtimeOrders()` hook — Supabase Realtime subscription on INSERT/UPDATE to orders table, auto-invalidates React Query cache
  - `components/orders/realtime-listener.tsx` — drop-in client component that activates the subscription
  - Realtime active on both dashboard and orders pages
- [x] Employee + salary module
  - `hooks/useEmployees.ts` — useEmployees, useCreateEmployee, useUpdateEmployee, useSalaries, useUpsertSalary, useRecordPayment
  - `components/employees/employees-table.tsx` — employee list with role-based column visibility (salary amounts owner-only)
  - `components/employees/employee-dialog.tsx` — add/edit employee form (name, role, contact, joining date, salary type, base salary, status)
  - `components/employees/salary-table.tsx` — monthly salary view with month selector, payment recording, printable salary slip
  - `components/employees/salary-dialog.tsx` — edit overtime/advances/deductions with auto net salary calculation
  - `app/(protected)/employees/page.tsx` — employee list page
  - `app/(protected)/employees/salary/page.tsx` — salary management page
  - Manager role added to /employees route; manager sees names + paid status only, owner sees all amounts
  - Generate slip opens printable salary slip in new window

### ✅ Phase 4 — Reports & Notifications (COMPLETE)
- [x] Reports module (PDF + Excel export)
  - `hooks/useReports.ts` — useDailySalesReport, useMonthlyIncomeReport, useStockReport, useSalaryReport
  - `lib/utils.ts` — downloadCSV (CSV export), printReport (print-optimised HTML window)
  - `components/reports/reports-view.tsx` — report type selector + date/month picker
  - `components/reports/daily-sales-report.tsx` — orders by day with source/payment breakdowns, summary cards
  - `components/reports/monthly-income-report.tsx` — revenue by source, expenses by category, net profit KPIs
  - `components/reports/stock-report.tsx` — all ingredients with low stock flagging, total stock value
  - `components/reports/salary-report.tsx` — salary details per month with paid/unpaid status
  - `components/reports/export-buttons.tsx` — reusable CSV + Print/PDF export buttons
  - All reports support CSV download and print-optimised PDF via window.print()
- [x] Notifications (in-app, low stock + salary due alerts)
  - `hooks/useNotifications.ts` — useNotifications, useUnreadCount, useMarkAsRead, useMarkAllRead, useRealtimeNotifications
  - `components/shared/notification-bell.tsx` — bell icon with unread badge, popover dropdown with last 10 notifications, mark as read on click, mark all read button
  - `components/shared/protected-shell.tsx` — top bar added with notification bell (visible on all protected pages)
  - `components/ui/popover.tsx` — shadcn/ui popover component
  - `supabase/migrations/002_notification_triggers.sql` — Realtime enabled on notifications, salary_due notification function + pg_cron schedule (25th monthly)
  - Low stock trigger already in 001 (fires on ingredient quantity drop below min)
  - Salary due: `generate_salary_due_notifications()` function checks for active employees without paid salary for current month, avoids duplicates
  - Realtime subscription on notifications table keeps bell count updated live

## Decisions made
- Currency stored in cents (integer) in DB, converted to LKR on display
- No live PickMe/Uber API in MVP 1 — manual entry + CSV import fallback
- Recipe-based stock deduction deferred to Phase 2 (feature phase, not build phase)
- Primary breakpoint: 1024px (tablet)

### ✅ Phase 5 — Audit & Deploy Prep (COMPLETE)
- [x] Full app audit — all 9 checks passed
  - No console errors, all loading/error states present, form validation, formatCurrency/formatDate usage, tablet layout
- [x] 404 page — `app/not-found.tsx`
- [x] Error boundary — `app/error.tsx` (client component with reset)
- [x] `.env.local.example` — template for required env vars
- [x] `README.md` — setup instructions, module list, deployment guide
- [x] TypeScript check — zero errors (`tsc --noEmit` clean)
- [x] Build check — `next build` passes with zero warnings

### ✅ Phase 6 — Branding & Polish (COMPLETE)
- [x] Vercel Analytics integration (`@vercel/analytics`)
- [x] Date formatting fix — corrected month date formatting in employee and report hooks
- [x] UI aesthetics overhaul — improved styling and visual consistency
- [x] Cafe logos added — `public/logos/logo-owl.png`, `public/logos/logo-text.png`, `public/logos/neuralshift-logo.png`
- [x] Login page redesign — logo-text image replaces text heading, "Powered by NeuralShift" footer added
- [x] Sidebar branding — owl logo icon added next to "Stacko Cafe" title
- [x] Favicon & PWA setup — custom favicon (16x16, 32x32), apple-touch-icon (192x192, 512x512), `site.webmanifest`
- [x] Metadata updated in `app/layout.tsx` — proper favicon references and web manifest
- [x] Old root-level logo files removed (`cafe-admin/logo-owl.png`, `cafe-admin/logo-text.png`) — assets moved to `public/logos/`
- [x] Inventory data replaced with real cafe ingredients + migration (`supabase/migrations/003_real_ingredients.sql`)
- [x] Comprehensive system documentation added (`DESIGN.md`, `CLAUDE.md`)

### ✅ Phase 7 — Real Menu Data (COMPLETE)
- [x] Real Stacko Cafe menu migration — `supabase/migrations/004_menu_seed.sql`
  - Adds `notes` column to menu_items (ALTER TABLE IF NOT EXISTS)
  - Clears sample menu_items, order_items, recipe_items
  - Inserts 40 real menu items across 9 categories
  - Categories: coffee, matcha, shakes, waffles, desserts, toppings_scoop, toppings_drizzle, toppings_spread, toppings_savoury
  - All prices in LKR cents
- [x] Menu category constants — `constants/menu.ts`
  - MENU_CATEGORIES with value/label pairs
  - TOPPING_CATEGORIES, MAIN_CATEGORIES, TOPPING_CATEGORY_LIST groupings
  - MENU_CATEGORY_LABELS lookup map
  - CATEGORY_BADGE_STYLES per category group (brown for drinks, rust for food, beige for toppings)
- [x] Add-order dialog updated — grouped by category with sticky headers, collapsible toppings section
- [x] Order detail dialog updated — category badge next to each item name with colour-coded styles
- [x] MenuItem type updated — added `notes` field to `lib/types.ts`
- [x] No hardcoded prices or menu item names anywhere — all from database via formatCurrency()
- [x] TypeScript check — zero errors

### ✅ Phase 8 — MVP 1 QA Pass (COMPLETE)
- [x] Role-based nav filtering — sidebar and bottom-nav now only show links the user's role can access
  - Owner sees all 6 modules
  - Manager sees Dashboard, Finance, Inventory, Orders, Employees, Reports
  - Cashier sees Dashboard, Orders only
  - Inventory sees Dashboard, Inventory only
  - Kitchen sees Dashboard, Orders only
- [x] Kitchen role fix — allowed route changed from `/orders/kitchen` (non-existent) to `/orders`
- [x] Kitchen read-only orders — orders page hides "New Order" button, order detail hides status change/cancel buttons
- [x] Root redirect — authenticated users visiting `/` now redirect to `/dashboard` (was showing 404 for owner)
- [x] BottomNav now receives `userRole` prop for role-based filtering
- [x] TypeScript check — zero errors
- [x] Production build — passes clean, zero warnings
- [x] No console.log statements in production code
- [x] No TODO/FIXME comments remaining
- [x] .env.local in .gitignore, only .env.local.example committed
- [x] Only Supabase anon key used client-side (no service role key)
- [x] All forms disable submit button while pending (double-click prevention)
- [x] All currency values use formatCurrency() — no raw cents displayed
- [x] All dates use formatDate() or date-fns format() — no raw ISO strings
- [x] All tables have empty state messages
- [x] All data-loading states show skeletons
- [x] All error states handled explicitly with user-friendly messages
- [x] Profit card shows negative values in red, positive in green
- [x] Month comparison handles zero previous month (shows null/no growth, not Infinity/NaN)

### ✅ Phase 9 — Print Bill Feature (COMPLETE)
- [x] Order bill receipt component — `components/orders/order-bill.tsx`
  - `getBillHtml()` generates full receipt HTML with inline SVGs
  - `getOrderPrintTitle()` returns `Stacko-Cafe-Bill-{id}-{date}` for PDF filename
  - `BILL_STYLES` CSS string with 80mm thermal receipt layout
  - Inline Stacko owl SVG (monochrome, stroke-only, waffle body + coffee cup wing)
  - Inline NeuralShift SVG (triangle neural network mark)
  - Bill header: owl logo, "Stacko Cafe", tagline
  - Meta: bill number (#STC-{id}), date, time, order type, customer
  - Items: full names with word-break wrapping, qty, LKR price with comma formatting
  - Totals: subtotal, discount/tax/commission (conditional), bold TOTAL
  - Footer: payment method, thank you message, NeuralShift powered-by
- [x] Print via isolated popup window (not window.print on main page)
  - Opens `_blank` popup with only the bill HTML + styles
  - Auto-prints on load, auto-closes after print dialog
  - Main app completely unaffected — no sidebar/nav/dialog prints
  - PDF filename derived from `<title>`: `Stacko-Cafe-Bill-{last8}-{yyyy-mm-dd}.pdf`
- [x] Print Bill button in order detail dialog
  - Visible to owner, manager, cashier roles only
  - Hidden from kitchen and inventory roles
- [x] Order detail dialog fixes
  - Source and payment method labels display full text (no truncation)
  - Item names display fully with word-wrap (no text-overflow ellipsis)
  - Price columns use `whitespace-nowrap` to prevent LKR wrapping
  - Grid columns have proper gap spacing
- [x] TypeScript check — zero errors

## Known issues / blockers
- None

## Notes for next session
- MVP 1 is fully complete with branding and deployed to Vercel.
- Next steps: start Phase 2 features (recipe-based inventory deduction, supplier management, forecasting).
- Run `supabase/migrations/002_notification_triggers.sql` in Supabase SQL editor to enable notification Realtime + salary due function.
- Run `supabase/migrations/003_real_ingredients.sql` to load real cafe ingredient data.
- Run `supabase/migrations/004_menu_seed.sql` to load real Stacko menu (adds notes column + 40 menu items).
- Enable pg_cron extension in Supabase Dashboard, then schedule salary due notifications (see migration 002 comments).
- Middleware file is `middleware.ts` (export `middleware`), NOT `proxy.ts`.
- Supabase clients are split: `lib/supabase.ts` (browser + middleware) and `lib/supabase-server.ts` (server components only).
- Auth users created via Supabase Dashboard, NOT seed SQL. Role set in raw_user_meta_data via SQL update.
- Dev credentials: ceo@staco.lk (owner), manager@staco.lk, cashier@staco.lk — password: 12345
- UUIDs: owner=be4cc9f0-2a30-49ae-aaf5-a1e3f159f831, manager=bf0bc2b6-374c-4f11-9e12-5f55c43d75c7, cashier=93b58a03-3484-407f-a94c-f27788a43856
- Env vars needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (in `.env.local`).
- Logo assets live in `public/logos/` — owl icon, text logo, and NeuralShift branding.
- Login page shows logo-text image and NeuralShift "Powered by" footer.
- Sidebar shows owl logo next to brand name.
