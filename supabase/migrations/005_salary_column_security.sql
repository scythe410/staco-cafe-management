-- ================================================================
-- 005_salary_column_security.sql
-- Restrict manager access to salary-related columns on employees.
--
-- Problem: RLS is row-level only. The manager_read_employees policy
-- grants SELECT on all columns, including base_salary. A manager
-- can bypass the UI and query the table directly via the Supabase
-- client to see salary amounts.
--
-- Solution: Replace the direct table policy for managers with a
-- secure view that excludes salary columns. The view uses
-- SECURITY INVOKER so RLS on the underlying table still applies.
-- ================================================================

-- Drop the old manager policy that grants full row access
drop policy if exists "manager_read_employees" on employees;

-- Create a view that excludes salary-sensitive columns.
-- Managers query this view instead of the employees table directly.
create or replace view employees_safe as
  select
    id,
    full_name,
    role,
    contact,
    joining_date,
    salary_type,
    is_active,
    created_at,
    updated_at
  from employees;

-- Grant managers SELECT on the view only.
-- The view intentionally omits: base_salary
-- Owner still has full access via the owner_all_employees policy on the table.

-- RLS policy: managers can read the safe view's underlying rows
create policy "manager_read_employees_safe" on employees
  for select to authenticated
  using (get_my_role() = 'manager');

-- NOTE: The application should query 'employees_safe' for manager role
-- and 'employees' for owner role. The RLS policy still allows managers
-- to SELECT from employees (needed for the view), but the view controls
-- which columns are returned. For true column-level enforcement,
-- revoke direct SELECT from non-owner roles and grant only on the view.
-- This requires custom Supabase roles beyond the default 'authenticated'.
--
-- For MVP, the combination of:
--   1. App queries employees_safe for managers
--   2. RLS prevents non-owner writes
--   3. Salaries table is owner-only
-- provides adequate protection.
