# Staco Cafe Management — Full System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Authentication & Session Flow](#authentication--session-flow)
4. [Role-Based Access Control](#role-based-access-control)
5. [Module Breakdown](#module-breakdown)
6. [Database Schema](#database-schema)
7. [Realtime Subscriptions & Automations](#realtime-subscriptions--automations)
8. [Utility Functions](#utility-functions)
9. [Placeholders & Unimplemented Features](#placeholders--unimplemented-features)
10. [What Updates Automatically](#what-updates-automatically)
11. [Constants Reference](#constants-reference)
12. [File Structure Reference](#file-structure-reference)

---

## System Overview

A tablet-optimised (1024px primary breakpoint) web admin application for a cafe owner to manage and monitor full cafe operations. Built with Next.js App Router, TypeScript, Supabase, and shadcn/ui.

**All monetary values are stored in cents (integers).** Display conversion happens only at render time via `formatCurrency()`.

**All dates stored as UTC ISO strings** in the database. Displayed as `dd MMM yyyy` via `formatDate()`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui components |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (WebSocket subscriptions) |
| Data Fetching | TanStack React Query v5 (staleTime: 60s) |
| Charts | Recharts (BarChart, PieChart, LineChart) |
| Date Handling | date-fns |
| Icons | Lucide React |
| Analytics | Vercel Analytics |
| Hosting | Vercel |
| Font | Inter (Google Fonts) |

---

## Authentication & Session Flow

### Login Flow
1. User navigates to any page
2. `proxy.ts` (middleware) runs on every request
3. If unauthenticated → redirected to `/auth/login?redirect=<intended_path>`
4. User enters email + password on login page
5. `supabase.auth.signInWithPassword()` is called
6. On success → redirected to the `redirect` param (default: `/dashboard`)
7. Session cookies are managed automatically by `@supabase/ssr`

### Session Refresh
- The proxy calls `supabase.auth.getUser()` on every request
- This refreshes expired tokens and writes updated cookies back to the browser
- No manual token handling needed

### Sign Out
- Sidebar has a "Sign Out" button
- Calls `supabase.auth.signOut()` → redirects to `/auth/login`

### Supabase Clients (3 variants)
| Client | File | Used In |
|--------|------|---------|
| `createBrowserClient()` | `lib/supabase.ts` | Client Components (hooks, forms, realtime) |
| `createProxyClient()` | `lib/supabase.ts` | `proxy.ts` only (middleware) |
| `createServerClient()` | `lib/supabase-server.ts` | Server Components (page-level auth checks) |

### Dev Credentials
| Email | Password | Role |
|-------|----------|------|
| ceo@staco.lk | 12345 | owner |
| manager@staco.lk | 12345 | manager |
| cashier@staco.lk | 12345 | cashier |

---

## Role-Based Access Control

### Route Access Matrix

| Route | Owner | Manager | Cashier | Inventory | Kitchen |
|-------|-------|---------|---------|-----------|---------|
| /dashboard | Yes | Yes | Yes | Yes | Yes |
| /finance | Yes | Yes | No | No | No |
| /inventory | Yes | Yes | No | Yes | No |
| /orders | Yes | Yes | Yes | No | No |
| /orders/kitchen | Yes | Yes | Yes | No | Yes |
| /employees | Yes | Yes | No | No | No |
| /employees/salary | Yes | Yes | No | No | No |
| /reports | Yes | Yes | No | No | No |
| /notifications | Yes | Yes | No | No | No |

### Data Access (RLS Policies)

| Table | Owner | Manager | Cashier | Inventory | Kitchen |
|-------|-------|---------|---------|-----------|---------|
| users | Full CRUD | Read own row | Read own row | Read own row | Read own row |
| orders | Full CRUD | Full CRUD | Read + Insert + Update | No access | Read only |
| order_items | Full CRUD | Full CRUD | Full CRUD | No access | Read only |
| menu_items | Full CRUD | Full CRUD | Read only | No access | Read only |
| ingredients | Full CRUD | Full CRUD | No access | Full CRUD | Read only |
| stock_updates | Full CRUD | Full CRUD | No access | Full CRUD | No access |
| expenses | Full CRUD | Read + Insert (own only) | No access | No access | No access |
| employees | Full CRUD | Read only | No access | No access | No access |
| salaries | Full CRUD | No access | No access | No access | No access |
| suppliers | Full CRUD | Full CRUD | No access | Full CRUD | No access |
| notifications | Full CRUD | Full CRUD | No access | Read only | No access |

### UI-Level Restrictions
- **Salary amounts** in the employees table are hidden for non-owners (managers see names + paid status only)
- **Navigation links** are filtered by role — users only see links for routes they can access
- **Action buttons** (edit salary, record payment, print slip) are owner-only in salary management

### How Roles Are Determined
1. Role is stored in `auth.users.raw_user_meta_data.role`
2. Also stored in `public.users.role` (used by `get_my_role()` SQL function for RLS)
3. Proxy reads from `user.user_metadata.role` or `user.app_metadata.role`
4. Both must be in sync for the system to work correctly

---

## Module Breakdown

### 1. Dashboard (`/dashboard`)

**Purpose:** At-a-glance overview of today's cafe performance.

**Components:**
| Component | What It Shows | Data Source |
|-----------|--------------|-------------|
| `sales-card.tsx` | Today's total sales (LKR) | Sum of completed orders' `total_amount` today |
| `orders-summary.tsx` | Order counts: total, completed, pending, cancelled | Count of orders today by status |
| `profit-estimate.tsx` | Net profit = income - expenses today | Completed orders total minus expenses total |
| `revenue-trend.tsx` | Bar chart of revenue per day (last 7 days) | Completed orders grouped by day |
| `orders-by-source.tsx` | Donut chart of orders by source | Today's orders grouped by source |
| `low-stock-alert.tsx` | List of ingredients below minimum stock | `low_stock_ingredients` DB view |

**Auto-updates:** Revenue and order data refresh via Realtime subscription on orders table. Low stock alerts update when stock changes trigger the DB function.

---

### 2. Finance (`/finance`)

**Purpose:** Financial analytics with income, expenses, and platform earnings tracking.

**3 Tabs:**

#### Overview Tab
| Widget | What It Shows |
|--------|--------------|
| Income KPI card | Total `total_amount` from completed orders in date range |
| Expenses KPI card | Sum of all expenses in date range |
| Net Profit KPI card | Income - Expenses |
| Orders KPI card | Count of completed orders |
| Revenue by Day chart | Bar chart of daily revenue in range |
| Payment Method chart | Pie chart split: cash, card, online, other |
| Month Comparison | Current vs previous month income/expenses with growth % |

#### Expenses Tab
| Widget | What It Shows |
|--------|--------------|
| Category filter | Dropdown to filter by expense category |
| Date range filter | From/to date inputs |
| Expenses table | Date, category badge, description, amount |
| Add Expense button | Dialog: category, amount (LKR input → stored as cents), date, description |
| Breakdown donut chart | Expenses by category for the selected date range |

#### Platform Earnings Tab
| Widget | What It Shows |
|--------|--------------|
| Platform cards | Per platform (PickMe Food, Uber Eats): gross sales, commission paid, net received, order count |
| Comparison bar chart | Visual comparison of platform performance |

**Date Range Presets:** Today, This Week, This Month, Custom (date picker)

---

### 3. Inventory (`/inventory`)

**Purpose:** Manage ingredient stock levels, track movements, and monitor low stock.

**Main Page (`/inventory`):**
| Feature | Description |
|---------|-------------|
| Ingredients table | Name, category, quantity + unit, min stock level, cost price, supplier, expiry date |
| Category filter | Dropdown to filter by ingredient category |
| Search | Text search by ingredient name |
| Add Item button | Dialog with full ingredient form |
| Edit button (per row) | Dialog to edit ingredient details |
| Stock Update button (per row) | Dialog to record stock_in / stock_out / adjustment / wastage |
| Low Stock link | Badge showing count + link to low stock page |

**Low Stock Page (`/inventory/low-stock`):**
| Feature | Description |
|---------|-------------|
| Low stock table | Ingredients below min level with: current qty, min level, shortfall, last restock date |
| Restock button (per row) | Opens stock update dialog pre-filled with stock_in type |

**How stock updates work:**
1. User records a stock update (type + quantity + notes)
2. Row inserted into `stock_updates` table
3. DB trigger `apply_stock_update()` fires → adjusts `ingredients.quantity` automatically
4. If new quantity < min_stock_level → DB trigger `notify_low_stock()` fires → inserts a `low_stock` notification

---

### 4. Orders (`/orders`)

**Purpose:** Manage all orders across all channels with live status updates.

| Feature | Description |
|---------|-------------|
| Orders table | Columns: order ID (truncated), source badge, customer, items count, total, payment method, status badge, date |
| Source filter | Dropdown: all, dine_in, takeaway, pickmefood, ubereats, other |
| Status filter | Dropdown: all, new_order, accepted, preparing, ready, completed, cancelled, refunded |
| Payment method filter | Dropdown: all, cash, card, online, other |
| Date range filter | From/to date inputs |
| Search | Text search by order ID or customer name |
| Add Order button | Full order creation form |
| Row click | Opens order detail dialog |

**Add Order Dialog:**
- Source selector (dine_in, takeaway, pickmefood, ubereats, other)
- Customer name (optional)
- Payment method
- Menu item selector with quantity +/- buttons
- Auto-calculated total
- Commission field (appears for delivery platform sources: pickmefood, ubereats)

**Order Detail Dialog:**
- Full order info: source, status, customer, payment method, dates
- Line items table: menu item name, quantity, unit price, subtotal
- For delivery platforms: commission amount and net amount (total - commission)
- Status transition button (follows workflow: new_order → accepted → preparing → ready → completed)
- Cancel button (changes status to `cancelled`)

**Order Status Workflow:**
```
new_order → accepted → preparing → ready → completed
                                          → cancelled (from any active state)
                                          → refunded (from completed)
```

**Realtime:** Orders table has a Supabase Realtime subscription. Any INSERT or UPDATE to orders automatically invalidates React Query cache → UI refreshes without manual reload.

---

### 5. Employees (`/employees`)

**Purpose:** Manage employee profiles and monthly salary records.

**Employee List Page (`/employees`):**
| Feature | Description |
|---------|-------------|
| Employees table | Name, role, contact, joining date, salary type, base salary (owner only), status badge |
| Add Employee button | Dialog: name, role, contact, joining date, salary type (monthly/daily/hourly), base salary (LKR), active status |
| Edit button (per row) | Same dialog pre-filled for editing |
| Salary Management link | Navigates to `/employees/salary` |

**Salary Management Page (`/employees/salary`):**
| Feature | Description |
|---------|-------------|
| Month picker | `<input type="month">` to select which month to view |
| Salary table | Employee name, base salary, overtime, advances, deductions, net salary, paid status badge |
| Edit button (per row, owner only) | Dialog to adjust overtime, advances, deductions (auto-calculates net) |
| Record Payment button (per row, owner only) | Sets `paid_at` timestamp |
| Print Slip button (per row, owner only) | Opens print-optimised salary slip in new window |
| Back to Employees link | Navigate back |

**Salary Calculation:**
```
Net Salary = Base Salary + Overtime - Advances - Deductions
```
Calculated at input time in the dialog and stored as `net_salary`.

---

### 6. Reports (`/reports`)

**Purpose:** Generate and export reports for business analysis.

**4 Report Types:**

| Report | Input | Shows |
|--------|-------|-------|
| Daily Sales | Date picker | All orders for that day: ID, source, customer, total, payment method, status. Summary: total revenue, order count, by source, by payment method |
| Monthly Income | Month picker | Revenue by source table, expenses by category table, summary KPIs (gross income, total expenses, net profit) |
| Stock Report | None (current snapshot) | All ingredients: name, category, quantity, unit, min level, cost price, low stock flag. Total stock value |
| Salary Report | Month picker | All salary records: employee, base, overtime, advances, deductions, net, paid status. Totals row |

**Export Options (all reports):**
- **CSV Download** — Generates a CSV file and triggers browser download
- **Print / PDF** — Opens a print-optimised window with styled HTML, user can print or save as PDF

---

### 7. Notifications

**Purpose:** In-app alerts for low stock and salary due events.

**Location:** Bell icon in the top bar (visible on all protected pages)

| Feature | Description |
|---------|-------------|
| Unread badge | Red dot with count of unread notifications |
| Popover dropdown | Last 20 notifications (unread first), with icon per type |
| Click notification | Marks as read |
| Mark All Read button | Marks all notifications as read |
| Realtime subscription | New notifications appear instantly without refresh |

**Notification Types:**
| Type | Icon | Trigger |
|------|------|---------|
| `low_stock` | AlertTriangle (amber) | DB trigger when `ingredients.quantity` drops below `min_stock_level` |
| `salary_due` | DollarSign (blue) | pg_cron job on 25th of each month for unpaid salaries |
| `order` | ShoppingCart (green) | Not auto-triggered in MVP 1 (placeholder) |
| `system` | Info (gray) | Manual / future use |

---

## Database Schema

### Entity Relationship Summary

```
users (auth)
  └── employees (managed by owner)
        └── salaries (monthly records per employee)

menu_items
  └── recipe_items (Phase 2, links to ingredients)
  └── order_items (line items per order)

orders
  └── order_items

ingredients
  └── stock_updates (movement log)
  └── recipe_items (Phase 2)

suppliers
  └── ingredients (supplier_id FK)

expenses (standalone ledger)

notifications (global alert log)
```

### Table Details

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Matches auth.users.id |
| email | text | Unique |
| full_name | text | Display name |
| role | user_role enum | owner, manager, cashier, inventory, kitchen |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-set via trigger |

#### `employees`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| full_name | text | Required |
| role | text | Job title (e.g., "Cleaner", "Barista") |
| contact | text | Phone number, nullable |
| joining_date | date | Nullable |
| salary_type | salary_type enum | monthly, daily, hourly |
| base_salary | integer | Cents, >= 0 |
| is_active | boolean | Default true |
| created_at / updated_at | timestamptz | Auto-managed |

#### `menu_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| name | text | Required |
| category | text | E.g., "Hot Beverages", "Pastries" |
| price | integer | Cents |
| is_available | boolean | Default true |
| created_at / updated_at | timestamptz | Auto-managed |

#### `ingredients`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| name | text | Required |
| category | text | From INGREDIENT_CATEGORIES constant |
| unit | text | From INGREDIENT_UNITS constant |
| quantity | numeric(12,3) | Current stock level, >= 0 |
| min_stock_level | numeric(12,3) | Alert threshold, >= 0 |
| cost_price | integer | Cents per unit, nullable |
| supplier_id | uuid (FK → suppliers) | Nullable |
| expiry_date | date | Nullable |
| created_at / updated_at | timestamptz | Auto-managed |

#### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| source | order_source enum | dine_in, takeaway, pickmefood, ubereats, other |
| status | order_status enum | new_order, accepted, preparing, ready, completed, cancelled, refunded |
| customer_name | text | Nullable |
| total_amount | integer | Cents, >= 0 |
| discount | integer | Cents, default 0 |
| tax | integer | Cents, default 0 |
| commission | integer | Cents, default 0 (for delivery platforms) |
| payment_method | payment_method enum | cash, card, online, other |
| created_at | timestamptz | Auto-set |
| completed_at | timestamptz | Set when status → completed |
| updated_at | timestamptz | Auto-set via trigger |

#### `order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| order_id | uuid (FK → orders, cascade delete) | Required |
| menu_item_id | uuid (FK → menu_items, restrict delete) | Required |
| quantity | integer | >= 1 |
| unit_price | integer | Cents, snapshot at order time |
| created_at | timestamptz | Auto-set |

#### `expenses`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| category | expense_category enum | ingredients, utilities, rent, salaries, maintenance, packaging, delivery_commission, other |
| amount | integer | Cents, > 0 |
| description | text | Nullable |
| date | date | Default: current_date |
| recorded_by | uuid (FK → auth.users) | Who entered it |
| created_at / updated_at | timestamptz | Auto-managed |

#### `salaries`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| employee_id | uuid (FK → employees, restrict delete) | Required |
| month | date | First of month (e.g., 2026-04-01) |
| base_salary | integer | Cents |
| overtime | integer | Cents, default 0 |
| advances | integer | Cents, default 0 |
| deductions | integer | Cents, default 0 |
| net_salary | integer | Cents (base + overtime - advances - deductions) |
| paid_at | timestamptz | Null = unpaid, set when payment recorded |
| created_at / updated_at | timestamptz | Auto-managed |

#### `stock_updates`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| ingredient_id | uuid (FK → ingredients, restrict delete) | Required |
| type | stock_update_type enum | stock_in, stock_out, adjustment, wastage |
| quantity | numeric(12,3) | Amount changed (positive for stock_in, can be negative for adjustments) |
| notes | text | Nullable |
| updated_by | uuid (FK → auth.users) | Who recorded it |
| created_at | timestamptz | Auto-set |

#### `suppliers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| name | text | Required |
| contact | text | Nullable |
| supplied_items | text | Nullable, description of what they supply |
| notes | text | Nullable |
| created_at / updated_at | timestamptz | Auto-managed |

#### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| type | notification_type enum | low_stock, salary_due, order, system |
| message | text | Human-readable alert text |
| is_read | boolean | Default false |
| created_at | timestamptz | Auto-set |

---

## Realtime Subscriptions & Automations

### Realtime Channels (Client-Side)

| Channel | Table | Events | Effect |
|---------|-------|--------|--------|
| `orders-realtime` | orders | INSERT, UPDATE | Invalidates `['orders']` and `['dashboard']` query keys → UI auto-refreshes |
| `notifications-realtime` | notifications | INSERT, UPDATE | Invalidates `['notifications']` and `['unread-count']` query keys → bell updates |

**Active on pages:** Dashboard (orders), Orders page (orders), All protected pages (notifications via bell)

### Database Triggers (Server-Side, Automatic)

| Trigger | Table | Event | Action |
|---------|-------|-------|--------|
| `trg_*_updated_at` | All mutable tables | BEFORE UPDATE | Sets `updated_at = now()` |
| `trg_apply_stock_update` | stock_updates | AFTER INSERT | Adjusts `ingredients.quantity += new.quantity` |
| `trg_notify_low_stock` | ingredients | AFTER UPDATE (quantity) | If `quantity < min_stock_level`, inserts `low_stock` notification (deduplicates) |

### Scheduled Jobs (pg_cron)

| Schedule | Function | What It Does |
|----------|----------|-------------|
| `0 9 25 * *` (25th of each month, 9am UTC) | `generate_salary_due_notifications()` | For each active employee without a paid salary record for the current month, inserts a `salary_due` notification. Avoids duplicates. |

**Setup required:** Enable pg_cron extension in Supabase Dashboard, then:
```sql
SELECT cron.schedule(
  'salary-due-notifications',
  '0 9 25 * *',
  $$SELECT generate_salary_due_notifications()$$
);
```

---

## Utility Functions

### `lib/utils.ts`

| Function | Signature | Description |
|----------|-----------|-------------|
| `cn()` | `(...inputs: ClassValue[]) → string` | Merges Tailwind classes (clsx + tailwind-merge) |
| `formatCurrency()` | `(cents: number) → string` | Formats cents as "LKR 1,234.56" (divides by 100, en-LK locale) |
| `formatDate()` | `(iso: string) → string` | Formats ISO date as "19 Apr 2026" (date-fns `dd MMM yyyy`) |
| `downloadCSV()` | `(headers: string[], rows: string[][], filename: string) → void` | Creates CSV blob and triggers download |
| `printReport()` | `(title: string, bodyHtml: string) → void` | Opens styled print window with cafe branding |

---

## Placeholders & Unimplemented Features

### Currently Placeholder / Not Functional

| Feature | Status | Notes |
|---------|--------|-------|
| Kitchen display view (`/orders/kitchen`) | Route allowed in roles but **no dedicated UI** | Kitchen role users see the regular orders page |
| Recipe-based inventory deduction | **Not implemented** (Phase 2) | `recipe_items` table exists but UI doesn't use it. Marking order as "completed" does NOT auto-deduct stock |
| Supplier management UI | **No dedicated page** | Suppliers table exists, referenced in ingredients, but no CRUD UI for suppliers |
| `order` notification type | **Never auto-triggered** | Type exists in enum but no trigger creates these notifications |
| `system` notification type | **Never auto-triggered** | Reserved for future use |
| Inventory role UI | **Partially functional** | Can access inventory pages but no dedicated optimised view |
| Settings page | **Does not exist** | No `/settings` route implemented |
| Email notifications (Resend) | **Not implemented** | Tech stack mentions Resend but no email sending code exists |
| Error monitoring (Sentry) | **Not implemented** | Listed in tech stack but not integrated |
| Forecasting / smart reorder | **Phase 2** | Not started |
| Barcode support | **Phase 2** | Not started |
| PickMe / Uber Eats live API | **Not implemented** | Manual entry + future CSV import only |
| Multi-branch support | **Phase 3** | Not started |
| Loyalty program | **Phase 3** | Not started |
| AI insights | **Phase 3** | Not started |

### What "Add Employee" Does vs Doesn't Do
- **Does:** Creates a row in `employees` table
- **Does NOT:** Auto-create a salary record for any month. You must manually create salary records via the Salary Management page.

### What "Complete Order" Does vs Doesn't Do
- **Does:** Sets `status = 'completed'` and `completed_at = now()`
- **Does NOT:** Deduct ingredient stock (Phase 2 feature via recipe_items)

---

## What Updates Automatically

### Automatic (No User Action Needed)

| What | Trigger | How |
|------|---------|-----|
| `ingredients.quantity` | Stock update recorded | DB trigger adds/subtracts from quantity |
| Low stock notification | Ingredient quantity drops below min level | DB trigger inserts notification |
| Salary due notification | 25th of each month | pg_cron scheduled function |
| `updated_at` timestamps | Any row update | DB trigger on all tables |
| Orders list on Dashboard & Orders page | New order created or status changed | Supabase Realtime → React Query invalidation |
| Notification bell count | New notification inserted | Supabase Realtime → React Query invalidation |
| Session token refresh | Every request | Proxy middleware auto-refreshes expired tokens |

### Manual (User Must Do)

| What | How |
|------|-----|
| Create salary records for employees | Go to Salary Management, create record per employee per month |
| Record salary payment | Click "Record Payment" button (owner only) |
| Update order status | Click status transition button in order detail |
| Record expenses | Add via Finance > Expenses > Add Expense |
| Stock adjustments | Use Stock Update dialog on any ingredient |
| Mark notifications as read | Click notification or "Mark All Read" |

---

## Constants Reference

### Order Statuses
```
new_order → accepted → preparing → ready → completed
Also: cancelled, refunded
```

### Order Sources
`dine_in`, `takeaway`, `pickmefood`, `ubereats`, `other`

### Payment Methods
`cash`, `card`, `online`, `other`

### Expense Categories
`ingredients`, `utilities`, `rent`, `salaries`, `maintenance`, `packaging`, `delivery_commission`, `other`

### Ingredient Categories
`Beverages`, `Dry Goods`, `Protein`, `Produce`, `Bakery`, `Dairy`, `Spices`, `Other`

### Ingredient Units
`kg`, `g`, `litre`, `ml`, `piece`, `loaf`, `pack`, `bottle`, `box`

### Stock Update Types
`stock_in`, `stock_out`, `adjustment`, `wastage`

### Salary Types
`monthly`, `daily`, `hourly`

### Notification Types
`low_stock`, `salary_due`, `order`, `system`

### User Roles
`owner`, `manager`, `cashier`, `inventory`, `kitchen`

---

## File Structure Reference

```
cafe-admin/
├── app/
│   ├── layout.tsx                          → Root layout (QueryProvider, Analytics, font)
│   ├── page.tsx                            → Redirects to /dashboard
│   ├── error.tsx                           → Global error boundary
│   ├── not-found.tsx                       → 404 page
│   ├── globals.css                         → Tailwind base styles
│   ├── auth/
│   │   └── login/page.tsx                  → Login form
│   └── (protected)/
│       ├── layout.tsx                      → Auth check + ProtectedShell wrapper
│       ├── dashboard/page.tsx              → Dashboard with 6 widgets
│       ├── finance/page.tsx                → Finance tabs (Overview, Expenses, Platform)
│       ├── inventory/
│       │   ├── page.tsx                    → Ingredient table + CRUD
│       │   └── low-stock/page.tsx          → Low stock alerts
│       ├── orders/page.tsx                 → Orders table + detail + create
│       ├── employees/
│       │   ├── page.tsx                    → Employee list
│       │   └── salary/page.tsx             → Salary management
│       └── reports/page.tsx                → Report selector + export
├── components/
│   ├── ui/                                 → shadcn/ui primitives (button, card, table, etc.)
│   ├── shared/
│   │   ├── sidebar.tsx                     → Desktop navigation sidebar
│   │   ├── bottom-nav.tsx                  → Mobile bottom navigation
│   │   ├── protected-shell.tsx             → Layout wrapper (sidebar + nav + top bar)
│   │   └── notification-bell.tsx           → Bell icon with popover
│   ├── providers/
│   │   └── query-provider.tsx              → React Query client provider
│   ├── dashboard/
│   │   ├── sales-card.tsx                  → Today's sales KPI
│   │   ├── orders-summary.tsx              → Order counts grid
│   │   ├── profit-estimate.tsx             → Net profit KPI
│   │   ├── revenue-trend.tsx               → 7-day bar chart
│   │   ├── orders-by-source.tsx            → Source donut chart
│   │   └── low-stock-alert.tsx             → Low stock list
│   ├── finance/
│   │   ├── finance-tabs.tsx                → Tab container + date range
│   │   ├── overview-tab.tsx                → Income/expense summary + charts
│   │   ├── expenses-tab.tsx                → Expense table + breakdown chart
│   │   ├── platform-tab.tsx                → Platform earnings comparison
│   │   ├── add-expense-dialog.tsx          → New expense form
│   │   └── date-range-picker.tsx           → Date preset selector
│   ├── inventory/
│   │   ├── inventory-table.tsx             → Main ingredients table
│   │   ├── add-item-dialog.tsx             → Add ingredient form
│   │   ├── edit-item-dialog.tsx            → Edit ingredient form
│   │   ├── ingredient-form.tsx             → Shared form fields
│   │   ├── stock-update-dialog.tsx         → Stock movement form
│   │   ├── low-stock-table.tsx             → Low stock items table
│   │   └── low-stock-link.tsx              → Badge link to low stock page
│   ├── orders/
│   │   ├── orders-table.tsx                → Filterable orders table
│   │   ├── order-detail-dialog.tsx         → Order view + status actions
│   │   ├── add-order-dialog.tsx            → New order form
│   │   └── realtime-listener.tsx           → Mounts realtime subscription
│   ├── employees/
│   │   ├── employees-table.tsx             → Employee list table
│   │   ├── employee-dialog.tsx             → Add/edit employee form
│   │   ├── salary-table.tsx                → Monthly salary table
│   │   └── salary-dialog.tsx               → Edit salary breakdown form
│   └── reports/
│       ├── reports-view.tsx                → Report type selector + date input
│       ├── daily-sales-report.tsx          → Daily order report
│       ├── monthly-income-report.tsx       → Monthly P&L report
│       ├── stock-report.tsx                → Current stock snapshot report
│       ├── salary-report.tsx               → Monthly salary report
│       └── export-buttons.tsx              → CSV + Print buttons
├── hooks/
│   ├── useDashboard.ts                     → Dashboard data hooks
│   ├── useOrders.ts                        → Order CRUD + realtime hooks
│   ├── useInventory.ts                     → Inventory CRUD hooks
│   ├── useFinance.ts                       → Finance analytics hooks
│   ├── useEmployees.ts                     → Employee & salary hooks
│   ├── useReports.ts                       → Report data hooks
│   └── useNotifications.ts                 → Notification hooks + realtime
├── constants/
│   ├── roles.ts                            → Role definitions + route permissions
│   ├── navigation.ts                       → Nav items array
│   ├── orders.ts                           → Order statuses, sources, payment methods
│   ├── expenses.ts                         → Expense categories + colors
│   └── inventory.ts                        → Ingredient categories, units, stock types
├── lib/
│   ├── supabase.ts                         → Browser + proxy Supabase clients
│   ├── supabase-server.ts                  → Server component Supabase client
│   ├── utils.ts                            → formatCurrency, formatDate, downloadCSV, printReport
│   └── types.ts                            → All TypeScript interfaces
├── proxy.ts                                → Route protection middleware
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql          → Full schema + RLS + triggers
│       └── 002_notification_triggers.sql   → Notification realtime + salary_due function
└── public/                                 → Static assets
```

---

## Net Profit Formula

```
Net Profit = Total Income - Total Expenses - Salaries - Delivery Commissions - Other Deductions
```

Where:
- **Total Income** = Sum of `orders.total_amount` where `status = 'completed'`
- **Total Expenses** = Sum of `expenses.amount`
- **Delivery Commissions** = Sum of `orders.commission` for platform orders (also tracked in expenses as `delivery_commission` category)
- **Salaries** = Tracked via salary records (also optionally logged as `salaries` expense category)

Profit is always **calculated at query time** — never stored as a derived value.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both are required. Only the anon key is used client-side. Never expose the service role key in the browser.
