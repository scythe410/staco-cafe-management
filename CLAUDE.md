# Cafe Management Admin Web App — Claude Code Context

## Project overview
A tablet-optimised web admin application for a cafe owner to manage and monitor full cafe
operations from one place. Covers financial analytics, inventory, orders, employee salaries,
third-party delivery platform orders (PickMe Food, Uber Eats), and reporting.

## Tech stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database + Auth + Real-time:** Supabase (PostgreSQL)
- **Charts:** Recharts or Tremor
- **Data fetching:** React Query (TanStack Query)
- **Email:** Resend
- **Error monitoring:** Sentry
- **Hosting:** Vercel
- **Version control:** GitHub

## Folder structure
```
/app
  /dashboard         → main dashboard page
  /finance           → financial analytics module
  /inventory         → inventory management module
  /orders            → order management module
  /employees         → employee and salary module
  /reports           → reports and exports module
  /settings          → system configuration
  /auth              → login, role gating
/components
  /ui                → shadcn/ui base components
  /shared            → reusable app components (tables, charts, badges)
  /dashboard         → dashboard-specific widgets
  /finance           → finance module components
  /inventory         → inventory module components
  /orders            → order module components
  /employees         → employee module components
/lib
  supabase.ts        → Supabase client (always import from here)
  utils.ts           → shared utility functions
  types.ts           → all TypeScript types and interfaces
/hooks               → custom React hooks (useInventory, useOrders, etc.)
/constants           → app-wide constants (order statuses, roles, units)
```

## Coding rules — always follow these
- Always import Supabase client from `lib/supabase.ts` — never instantiate it elsewhere
- All database types go in `lib/types.ts` — never define inline
- Use React Query for all data fetching — no raw useEffect + fetch patterns
- Use server components by default; mark `"use client"` only when needed (forms, interactivity)
- All monetary values stored and calculated in **cents (integer)** — display only converts to display currency
- All dates stored as UTC ISO strings in the database
- Use `constants/` for magic values — never hardcode strings like `"admin"` or `"completed"` inline
- Error boundaries on every page-level component
- Every Supabase query must handle the error state explicitly — never ignore `.error`

## Database — core entities
```
users              → id, email, role, full_name, created_at
employees          → id, full_name, role, contact, joining_date, salary_type, base_salary, is_active
menu_items         → id, name, category, price, is_available
ingredients        → id, name, category, unit, quantity, min_stock_level, cost_price, supplier_id, expiry_date
recipe_items       → id, menu_item_id, ingredient_id, quantity_used
orders             → id, source, status, customer_name, total_amount, discount, tax, commission, payment_method, created_at, completed_at
order_items        → id, order_id, menu_item_id, quantity, unit_price
expenses           → id, category, amount, description, date, recorded_by
salaries           → id, employee_id, month, base_salary, overtime, advances, deductions, net_salary, paid_at
suppliers          → id, name, contact, supplied_items, notes
stock_updates      → id, ingredient_id, type (stock_in/stock_out/adjustment/wastage), quantity, notes, updated_by, created_at
notifications      → id, type, message, is_read, created_at
```

## User roles and access
```
owner     → full access to all modules
manager   → orders, reports, inventory, selected finance (no salary details)
cashier   → orders and billing only
inventory → stock and supplier modules only
kitchen   → order preparation view only (read-only)
```
Role is stored in `users.role`. All route protection handled via middleware checking Supabase session + role.

## Order statuses (use constants — never hardcode strings)
`new_order` → `accepted` → `preparing` → `ready` → `completed`
Also: `cancelled`, `refunded`

## Order sources
`dine_in`, `takeaway`, `pickmefood`, `ubereats`, `other`

## Expense categories
`ingredients`, `utilities`, `rent`, `salaries`, `maintenance`, `packaging`, `delivery_commission`, `other`

## Net profit formula
```
Net Profit = Total Income - Total Expenses - Salaries - Delivery Commissions - Other Deductions
```
Calculate this at query time from the database — never store derived profit values.

## Key business logic rules
- When an order is marked `completed`, automatically deduct ingredient quantities based on `recipe_items` mappings
- Low stock alert triggers when `ingredients.quantity < ingredients.min_stock_level`
- Salary due alert triggers on the 25th of each month for unpaid salary records
- Delivery commission is recorded per order and also tracked as an expense category
- Platform net income = order total - commission amount

## MVP 1 scope — build only these
1. Auth + role-based routing
2. Dashboard (sales summary, order counts, low stock alerts, profit estimate)
3. Financial analytics (daily/monthly summary, expense tracking, net profit)
4. Inventory management (stock items, categories, low stock alerts, stock updates)
5. Order management (all channels, status workflow, payment tracking)
6. Employee + salary management (profiles, salary calc, payment records)
7. Reports (daily sales, monthly income, stock report — PDF + Excel export)
8. Notifications (in-app, low stock + salary due alerts)

## Not in MVP 1 — do not build yet
- Recipe-based automatic inventory deduction (Phase 2)
- Supplier management (Phase 2)
- Forecasting and smart reorder (Phase 2)
- Kitchen display system (Phase 2)
- Barcode support (Phase 2)
- Loyalty program (Phase 3)
- Multi-branch support (Phase 3)
- AI insights (Phase 3)
- PickMe / Uber Eats live API integration (fallback: manual order entry + CSV import)

## UI / UX rules
- Optimised for tablet viewport (1024px primary breakpoint)
- Large touch targets — minimum 44px tap area on all interactive elements
- Bottom navigation bar on tablet for main module switching
- Use shadcn/ui `<Table>`, `<Card>`, `<Badge>`, `<Dialog>` as base — do not build these from scratch
- Chart library: Recharts — use `<BarChart>`, `<LineChart>`, `<PieChart>` only
- Currency display: always format as LKR with 2 decimal places using a shared `formatCurrency()` util
- Dates: display in `dd MMM yyyy` format using `date-fns`
- Status badges: use colour-coded `<Badge>` — green for completed, amber for preparing, red for cancelled

## Supabase conventions
- Use Row Level Security (RLS) on all tables
- Policies follow role hierarchy — owner sees all, others see scoped data
- Use Supabase realtime subscriptions for orders table (live order updates on dashboard)
- All edge functions live in `/supabase/functions/`
- Never expose service role key on client side — use anon key only in browser

## Progress tracking
See `progress.md` in project root for current build status, decisions made, and what's next.
Start each session by reading `progress.md` before doing anything.
