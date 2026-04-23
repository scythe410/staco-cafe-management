# Stacko Cafe Management

Tablet-optimised admin web app for managing cafe operations — finances, inventory, orders, employees, and reports.

Built for [Stacko Cafe](https://staco.lk) | Powered by [NeuralShift](https://neuralshift.dev)

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database / Auth / Realtime:** Supabase (PostgreSQL)
- **Charts:** Recharts
- **Data fetching:** TanStack Query (React Query)
- **Analytics:** Vercel Analytics
- **Hosting:** Vercel

## Getting started

### Prerequisites

- Node.js 18+
- A Supabase project with the schema applied

### 1. Clone and install

```bash
git clone https://github.com/scythe410/staco-cafe-management.git
cd staco-cafe-management/cafe-admin
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase project URL and anon key (from Supabase Dashboard > Settings > API).

### 3. Set up the database

Run the migration files in your Supabase SQL editor in order:

1. `supabase/migrations/001_initial_schema.sql` — tables, RLS, triggers, views
2. `supabase/migrations/002_notification_triggers.sql` — notification realtime + salary due function
3. `supabase/migrations/003_real_ingredients.sql` — real cafe ingredient data
4. `supabase/migrations/004_menu_seed.sql` — real Stacko Cafe menu (40 items, 9 categories)

### 4. Create auth users

Create users via the Supabase Dashboard (Authentication > Users). Set the role in each user's `raw_user_meta_data`:

```json
{ "role": "owner" }
```

Available roles: `owner`, `manager`, `cashier`

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Modules

| Module | Path | Description |
|--------|------|-------------|
| Dashboard | `/dashboard` | Sales summary, order counts, low stock alerts, revenue trend |
| Finance | `/finance` | Income/expense tracking, payment methods, platform earnings |
| Inventory | `/inventory` | Ingredient CRUD, stock updates, low stock alerts |
| Orders | `/orders` | Order management with realtime updates, status workflow |
| Employees | `/employees` | Employee profiles, salary management, printable pay slips |
| Reports | `/reports` | Daily sales, monthly income, stock, salary — CSV + PDF export |

## Deployment

### Quick deploy to Vercel

1. Push to GitHub
2. Import the repo in Vercel — set **Root Directory** to `cafe-admin`
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

## Branding

- Login page displays the Stacko Cafe logo and NeuralShift attribution
- Sidebar includes the owl logo icon
- Custom favicon and PWA manifest with app icons (16x16, 32x32, 192x192, 512x512)
- Logo assets stored in `public/logos/`

## User roles

| Role | Access |
|------|--------|
| Owner | Full access to all modules |
| Manager | Orders, inventory, reports, finance (no salary amounts) |
| Cashier | Orders only |
