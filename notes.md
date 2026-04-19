# has outputs from claude and other useful information

# --------------

chema is at supabase/migrations/001_initial_schema.sql. Here's what was generated:

  Tables (12): users, suppliers, ingredients, menu_items, recipe_items, orders, order_items, expenses, employees, salaries, stock_updates, notifications

  Enums (8): user_role, order_status, order_source, payment_method, expense_category, salary_type, stock_update_type, notification_type

  RLS policies — role matrix:

  ┌───────────────┬───────┬───────────────┬──────────────────────┬───────────┬─────────┐
  │     Table     │ owner │    manager    │       cashier        │ inventory │ kitchen │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ users         │ all   │ —             │ —                    │ —         │ —       │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ employees     │ all   │ select        │ —                    │ —         │ —       │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ salaries      │ all   │ —             │ —                    │ —         │ —       │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ orders        │ all   │ all           │ select/insert/update │ —         │ select  │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ order_items   │ all   │ all           │ all                  │ —         │ select  │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ menu_items    │ all   │ all           │ select               │ —         │ select  │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ ingredients   │ all   │ all           │ —                    │ all       │ select  │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ suppliers     │ all   │ all           │ —                    │ all       │ —       │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ stock_updates │ all   │ all           │ —                    │ all       │ —       │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ expenses      │ all   │ select/insert │ —                    │ —         │ —       │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ notifications │ all   │ all           │ —                    │ select    │ —       │
  ├───────────────┼───────┼───────────────┼──────────────────────┼───────────┼─────────┤
  │ recipe_items  │ all   │ all           │ —                    │ —         │ select  │
  └───────────────┴───────┴───────────────┴──────────────────────┴───────────┴─────────┘

  Triggers:
  - set_updated_at() — fires on all mutable tables
  - apply_stock_update() — adjusts ingredients.quantity on every stock_updates insert
  - notify_low_stock() — inserts a notification when ingredients.quantity drops below min_stock_level

  One note on salary column masking: Postgres RLS is row-level only — manager exclusion of base_salary from employees must be enforced at the application layer (the comment
  in the file flags this).

# ---------------

Done. supabase/seed.sql is ready. Here's a summary of what's in it:

  Users (Section 1–2)

  ┌──────────────────┬─────────┬──────────┐
  │      Email       │  Role   │ Password │
  ├──────────────────┼─────────┼──────────┤
  │ owner@staco.lk   │ owner   │ Dev@1234 │
  ├──────────────────┼─────────┼──────────┤
  │ manager@staco.lk │ manager │ Dev@1234 │
  ├──────────────────┼─────────┼──────────┤
  │ cashier@staco.lk │ cashier │ Dev@1234 │
  └──────────────────┴─────────┴──────────┘

  Inserts into both auth.users (bcrypt hashed via crypt()) and public.users.

  Reference data
  - 3 suppliers: Green Leaf Produce, Island Dry Goods Co., Ceylon Beverage Suppliers
  - 10 ingredients across Beverages/Dry Goods/Protein/Bakery/Produce categories — Ceylon Tea Leaves is deliberately seeded below its min stock level to demo the low-stock
  alert
  - 5 menu items across Beverages / Rice & Curry / Snacks

  Transactional data
  - 3 employees + 6 salary records: previous month all paid, current month all unpaid (salary-due alert scenario)
  - 10 expenses spanning rent, utilities, ingredients, maintenance, packaging, delivery_commission, other
  - 20 orders: 8 dine-in, 4 takeaway, 4 PickMe, 4 Uber Eats — statuses cover completed, cancelled, preparing, ready, new_order, accepted; PickMe/Uber orders include
  commission amounts
  - All 20 orders have order_items rows with unit price snapshots

  One thing to note before running: the apply_stock_update trigger will fire on any INSERT into stock_updates. The seed skips that table's history rows to avoid
  double-adjusting the quantities already seeded directly into ingredients. You can populate stock update history through the app UI.

# ---------------

Done. Here's a summary of every file created and one important discovery:
                                                                                          
  ---                                                                                                                                                                        
  constants/roles.ts                                                                                                                                                         
  Exports ROLES (typed const object), Role type, and ROLE_ALLOWED_ROUTES — the single source of truth for permissions. The proxy and any future server-side checks import    
  from here.                                                                                                                                                                 
                                                                                                                                                                             
  lib/supabase.ts
  Three factories, all built on @supabase/ssr (installed):                                                                                                                   
  - createBrowserClient() — for Client Components; uses localStorage-backed cookie storage
  - createServerClient() — async, for Server Components/Actions; reads/writes the Next.js cookies() store                                                                    
  - createProxyClient(request, response) — for proxy.ts; parses the raw Cookie header and appends Set-Cookie to the response so token rotation works on every request
                                                                                                                                                                             
  proxy.ts (not middleware.ts — renamed in Next.js 16)                                                                                                                       
  - Exported function is proxy, not middleware                                                                                                                               
  - Refreshes the session on every request (handles token expiry transparently)                                                                                              
  - Unauthenticated → /auth/login?redirect=<original-path>                                                                                                                   
  - Authenticated hitting /auth/* → /dashboard                                                                                                                               
  - Owner bypasses all route checks           
  - Other roles checked against ROLE_ALLOWED_ROUTES; unknown role is signed out                                                                                              
                                                            
  app/auth/login/page.tsx                                                                                                                                                    
  - Client Component with signInWithPassword                
  - h-12 inputs (48px, meets the 44px touch-target rule from CLAUDE.md)                                                                                                      
  - Inline error rendered in a destructive-tinted alert box            
  - Redirects to ?redirect= param or /dashboard on success                                                                                                                   
                                                                                                                                                                             
  One env var reminder: create cafe-admin/.env.local with:                                                                                                                   
  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co                                                                                                                
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>   

# ---------------



# ---------------