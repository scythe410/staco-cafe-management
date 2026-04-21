# Staco Cafe Management System — Stakeholder Guide

## What Is This?

Staco Cafe Management is a web-based admin system designed specifically for tablet use. It gives the cafe owner (and authorised staff) a single place to manage every aspect of cafe operations — from taking orders to tracking profits, managing stock, paying employees, and generating reports.

The system is accessed through a web browser (no app download needed) and works best on tablets, though it also works on desktop computers and phones.

---

## Who Uses It?

The system has 5 user levels, each with different access:

### Owner (CEO)
- Sees and controls **everything**
- Financial data, employee salaries, all reports
- The only person who can record salary payments, edit salary details, or view salary amounts

### Manager
- Day-to-day operations: orders, inventory, basic finance, employee names (not salary amounts)
- Can add expenses and view financial summaries
- Cannot see or edit salary details

### Cashier
- Limited to taking and managing orders
- Cannot see finances, inventory details, employee information, or reports

### Inventory Staff
- Limited to stock management
- Can view stock levels, record deliveries, adjust quantities
- Cannot see orders, finances, or employee data

### Kitchen Staff
- View-only access to orders (to know what to prepare)
- Cannot modify anything

---

## What Can It Do?

### 1. Dashboard — Your Daily Snapshot

When you log in, the dashboard immediately shows you:

- **Today's Total Sales** — How much revenue came in today
- **Order Counts** — How many orders today: total, completed, still in progress, and cancelled
- **Profit Estimate** — Today's income minus today's expenses (a quick health check)
- **Revenue Trend** — A bar chart showing the last 7 days of revenue so you can spot patterns
- **Orders by Channel** — A pie chart showing where orders came from today (dine-in, takeaway, PickMe Food, Uber Eats)
- **Low Stock Alerts** — A list of ingredients that are running low and need restocking

The dashboard updates in real time. When a new order comes in or is completed, the numbers change without needing to refresh the page.

---

### 2. Order Management — All Channels in One Place

Every order from every channel is managed here:

**Channels supported:**
- Dine-in
- Takeaway
- PickMe Food
- Uber Eats
- Other (custom)

**What you can do:**
- View all orders in a filterable table (filter by channel, status, payment method, date, or search by customer name)
- Create new orders manually (select menu items, set quantities, choose payment method)
- Track order progress through the workflow
- View full order details including line items and totals
- For delivery platform orders: see the commission charged and the net amount you actually receive

**Order Workflow:**
```
New Order → Accepted → Preparing → Ready → Completed
```
At any point before completion, an order can also be cancelled. After completion, it can be marked as refunded if needed.

**Live Updates:** When any staff member creates or updates an order, everyone else sees the change immediately — no page refresh needed. This is critical for coordinating between cashier and kitchen.

**Delivery Platform Commissions:** When creating a PickMe Food or Uber Eats order, you enter the commission amount. The system tracks:
- Gross sale (what the customer paid)
- Commission (what the platform takes)
- Net received (what you actually get)

---

### 3. Financial Analytics — Know Your Numbers

Three views to understand your finances:

#### Overview
- Total income for any period (today, this week, this month, or custom dates)
- Total expenses
- Net profit (income minus expenses)
- Revenue broken down by day (bar chart)
- Payment method breakdown (how much came via cash vs card vs online)
- Month-over-month comparison with growth percentages

#### Expenses
- Complete expense log with date, category, description, and amount
- Filter by category or date range
- Add new expenses (categories: ingredients, utilities, rent, salaries, maintenance, packaging, delivery commission, other)
- Visual breakdown showing where money is going (pie chart)

#### Platform Earnings
- See exactly how much you're earning (and losing to commission) from each delivery platform
- Compare PickMe Food vs Uber Eats performance
- Track order counts, gross sales, commissions, and net income per platform

**Important:** Profit is always calculated live from actual data — it's never a manually entered number. This means your profit figures are always accurate and up to date.

---

### 4. Inventory Management — Never Run Out

#### Main Stock View
- See all ingredients with current quantity, minimum required level, cost price, supplier, and expiry date
- Filter by category (Beverages, Dry Goods, Protein, Produce, Bakery, Dairy, Spices, Other)
- Search by name
- Add new ingredients
- Edit existing ingredient details
- Record stock movements (delivery received, stock used, adjustments, wastage)

#### Low Stock Alerts
- Dedicated page showing only items that are below their minimum required level
- Shows how much you're short by
- Shows when each item was last restocked
- Quick restock button to record a delivery

#### How Stock Tracking Works
1. You set a minimum stock level for each ingredient (e.g., "always have at least 5kg of flour")
2. When stock is received, you record it → quantity goes up
3. When stock is used or wasted, you record it → quantity goes down
4. If quantity drops below the minimum level → the system automatically creates an alert notification

**Note:** In this version, stock is adjusted manually. The system does not yet automatically reduce stock when orders are completed (that's planned for Phase 2).

---

### 5. Employee & Salary Management

#### Employee Profiles
- Full list of all employees (active and inactive)
- Details: name, job role, phone number, joining date, salary type (monthly/daily/hourly), base salary, active status
- Add new employees or edit existing ones

#### Salary Management
- Monthly salary records per employee
- For each month, view/edit: base salary, overtime, advances (money taken early), deductions, and calculated net salary
- Mark salaries as paid (records the payment date)
- Generate printable salary slips (opens in a new window for printing)

#### Salary Calculation
```
Net Salary = Base Salary + Overtime - Advances - Deductions
```

#### Privacy Controls
- Only the owner can see salary amounts
- Only the owner can edit salary records or record payments
- Managers can see employee names and whether they've been paid, but not the amounts

---

### 6. Reports — Export and Share

Four report types, all exportable:

| Report | What It Shows | Input |
|--------|--------------|-------|
| Daily Sales | Every order for a specific day — who ordered, from which channel, how much, payment method, status | Pick a date |
| Monthly Income | Full month breakdown — revenue by channel, expenses by category, net profit | Pick a month |
| Stock Report | Current snapshot of all ingredients — quantities, values, which items are low | No input needed |
| Salary Report | All salary records for a month — employee details, amounts, paid/unpaid status | Pick a month |

**Export Options:**
- **CSV Download** — Opens in Excel/Google Sheets for further analysis
- **Print / Save as PDF** — Clean, formatted printout suitable for records or sharing

---

### 7. Notifications — Stay Informed

A bell icon in the top-right corner shows alerts:

**Automatic alerts:**
- **Low Stock** — Triggered instantly when any ingredient drops below its minimum level
- **Salary Due** — Triggered on the 25th of each month for any employee whose salary hasn't been paid yet

**Features:**
- Unread count badge on the bell icon
- Click a notification to mark it as read
- "Mark All Read" button to clear all at once
- Notifications appear in real time — no need to refresh

---

## How Everything Connects

### Daily Operation Flow

```
Morning:
  → Owner/Manager logs in
  → Dashboard shows yesterday's carryover + today's early data
  → Check low stock alerts → record any deliveries received

During Service:
  → Cashier creates orders (dine-in, takeaway)
  → Manually enter PickMe/Uber Eats orders with commission
  → Kitchen sees orders appear in real time
  → Orders progress: New → Accepted → Preparing → Ready → Completed
  → Dashboard updates live as orders complete

End of Day:
  → Record any expenses (utilities paid, supplies bought, etc.)
  → Check daily sales report
  → Record any stock wastage or adjustments

End of Month:
  → Run monthly income report for the full picture
  → Review salary records, add overtime/deductions
  → Record salary payments
  → Print salary slips for employees
  → Compare with previous month (growth/decline)
```

### Money Flow Tracking

```
INCOME
├── Dine-in orders (full amount received)
├── Takeaway orders (full amount received)
├── PickMe Food orders (amount received = total - commission)
└── Uber Eats orders (amount received = total - commission)

EXPENSES
├── Ingredients (supplies purchased)
├── Utilities (electricity, water, gas)
├── Rent
├── Salaries (employee payments)
├── Maintenance (repairs, equipment)
├── Packaging (cups, bags, containers)
├── Delivery commission (platform fees)
└── Other

NET PROFIT = Total Income - Total Expenses
```

### Stock Flow

```
Stock In (delivery received)
    ↓
Current Stock Level ← shown on inventory page
    ↓
Stock Out / Wastage / Adjustment (recorded manually)
    ↓
If below minimum → automatic low stock alert
```

---

## Security & Access Control

### How Access Is Protected

1. **Login required** — No one can see anything without a valid email and password
2. **Role enforcement** — Even if someone knows a page URL, they cannot access it unless their role permits it
3. **Database-level security** — Even if the application layer were bypassed, the database itself blocks unauthorised access based on user role
4. **Session management** — Sessions expire and refresh automatically; no permanent access without re-authentication

### Data Privacy

- Salary information is visible **only to the owner**
- Expense records show who entered them
- Stock updates show who recorded them
- Each user only sees navigation options for pages they're allowed to access

---

## What's Live vs What's Coming Later

### Currently Working (MVP 1)

| Feature | Status |
|---------|--------|
| Login and role-based access | Fully working |
| Dashboard with live data | Fully working |
| Order management (all channels) | Fully working |
| Real-time order updates | Fully working |
| Financial analytics (income, expenses, profit) | Fully working |
| Platform earnings tracking (PickMe, Uber Eats) | Fully working |
| Expense recording and categorisation | Fully working |
| Inventory management | Fully working |
| Low stock alerts (automatic) | Fully working |
| Employee profiles | Fully working |
| Salary management and payment recording | Fully working |
| Printable salary slips | Fully working |
| Reports (daily, monthly, stock, salary) | Fully working |
| CSV and PDF export | Fully working |
| In-app notifications | Fully working |
| Salary due reminders (25th of month) | Fully working |
| Tablet-optimised design | Fully working |

### Planned for Phase 2

| Feature | What It Means |
|---------|---------------|
| Automatic stock deduction | When an order is completed, ingredients used in those menu items are automatically subtracted from stock (based on recipes) |
| Recipe management | Define exactly which ingredients and quantities go into each menu item |
| Supplier management | Dedicated page to manage supplier contacts, orders, and payment tracking |
| Smart reorder suggestions | System suggests what to reorder based on usage patterns |
| Kitchen display | A dedicated screen for the kitchen showing only orders to prepare, optimised for that workflow |
| Barcode scanning | Scan items for faster stock counting and updates |

### Planned for Phase 3

| Feature | What It Means |
|---------|---------------|
| Multi-branch support | Manage multiple cafe locations from one system |
| Loyalty program | Track repeat customers and reward them |
| AI insights | Automated suggestions for pricing, staffing, and stock based on patterns |
| Live delivery platform integration | Automatic order import from PickMe Food and Uber Eats (no manual entry) |

---

## Important Things to Know

### Currency
- All amounts are displayed in **Sri Lankan Rupees (LKR)**
- Format: LKR 1,234.56

### Dates
- Displayed as: 19 Apr 2026
- All times stored in UTC (universal time)

### Data Entry for Delivery Orders
- Since live integration with PickMe Food and Uber Eats is not available yet, delivery platform orders must be **entered manually**
- When entering, you specify the total amount AND the commission amount
- The system then calculates your net earnings automatically

### Salary Records Are Not Automatic
- Adding an employee does **not** automatically create their salary record
- Each month, salary records need to be created or carried forward manually
- This gives the owner full control over what's recorded

### Stock Is Not Auto-Deducted (Yet)
- Completing an order does **not** automatically reduce ingredient quantities
- Stock adjustments must be recorded manually
- This changes in Phase 2 when recipe-based deduction is added

### Profit Calculation Is Always Real-Time
- The system never stores a "profit" number
- Every time you view profit, it's freshly calculated from actual income and expense records
- This means profit is always accurate — it can't get "out of sync"

---

## System Requirements

### To Use the System
- A tablet, computer, or phone with a modern web browser (Chrome, Safari, Firefox, Edge)
- Internet connection
- Login credentials (email + password)

### Recommended Setup
- **Primary device:** Tablet (iPad or Android tablet, 10-inch or larger)
- **Orientation:** Landscape for best experience
- **Browser:** Chrome or Safari (latest version)

### No Installation Needed
- The system runs entirely in the browser
- No app store download required
- Updates happen automatically (no manual update process)

---

## Support & Access

### Login Credentials
Credentials are created by the system administrator. Each user gets:
- An email address (used as username)
- A password
- An assigned role (owner/manager/cashier/inventory/kitchen)

### If You're Locked Out
- Contact the system administrator to reset your password
- Sessions refresh automatically, but if you're inactive for an extended period, you'll need to log in again

### Data Backup
- All data is stored in Supabase (cloud database)
- Automatic backups are handled by the hosting provider
- Data persists even if your device is lost or broken

---

## Quick Reference — Who Can Do What

| Action | Owner | Manager | Cashier | Inventory | Kitchen |
|--------|-------|---------|---------|-----------|---------|
| View dashboard | Yes | Yes | Yes | Yes | Yes |
| Create orders | Yes | Yes | Yes | No | No |
| Update order status | Yes | Yes | Yes | No | No |
| View financial summary | Yes | Yes | No | No | No |
| Add expenses | Yes | Yes | No | No | No |
| View/manage stock | Yes | Yes | No | Yes | No |
| Record stock updates | Yes | Yes | No | Yes | No |
| View employee list | Yes | Yes | No | No | No |
| Add/edit employees | Yes | No | No | No | No |
| View salary amounts | Yes | No | No | No | No |
| Record salary payments | Yes | No | No | No | No |
| Generate reports | Yes | Yes | No | No | No |
| Export CSV/PDF | Yes | Yes | No | No | No |
| View notifications | Yes | Yes | No | Yes (stock only) | No |

---

## Summary

Staco Cafe Management gives you complete visibility and control over your cafe operations through one system. It tracks every rupee coming in and going out, keeps your stock levels visible, manages your team's salaries, and delivers reports whenever you need them — all accessible from a tablet at your fingertips.

The system is live, secure, and ready for daily use. Future phases will add automation (recipe-based stock deduction, smart reordering) and integrations (live delivery platform sync) to reduce manual work further.
