-- ================================================================
-- 011_security_hardening.sql
-- Address Supabase advisor findings:
--   1. SECURITY DEFINER views (employees_safe, low_stock_ingredients)
--      bypass RLS on the underlying tables. Switch to security_invoker.
--   2. SECURITY DEFINER functions without an explicit search_path are
--      vulnerable to search-path injection. Pin search_path = public.
--   3. SECURITY DEFINER RPCs are executable by the anon role, meaning
--      anyone with the anon key can call them without signing in.
--      Revoke EXECUTE from anon (admin app uses authenticated only).
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Views: enforce the caller's RLS, not the view owner's
-- ----------------------------------------------------------------
alter view public.employees_safe         set (security_invoker = true);
alter view public.low_stock_ingredients  set (security_invoker = true);

-- ----------------------------------------------------------------
-- 2. Functions: pin search_path to prevent injection attacks
--    (Functions that already had search_path set are skipped.)
-- ----------------------------------------------------------------
alter function public.set_updated_at()                            set search_path = public;
alter function public.apply_stock_update()                        set search_path = public;
alter function public.notify_low_stock()                          set search_path = public;
alter function public.generate_salary_due_notifications()         set search_path = public;
alter function public.generate_balance_due_notifications()        set search_path = public;
alter function public.generate_booking_code()                     set search_path = public;
alter function public.recalc_booking_totals()                     set search_path = public;
alter function public.notify_new_booking()                        set search_path = public;
alter function public.notify_booking_cancelled()                  set search_path = public;
alter function public.create_order_with_items(
  text, text, text, integer, integer, integer, integer, jsonb
) set search_path = public;
alter function public.create_booking_with_items(
  text, text, text, integer, text, date, time, time, text, text,
  integer, integer, integer, integer, integer, text, text, text,
  uuid, jsonb
) set search_path = public;
alter function public.replace_booking_items(uuid, jsonb)          set search_path = public;

-- ----------------------------------------------------------------
-- 3. Lock SECURITY DEFINER RPCs to authenticated users only
--    Postgres grants EXECUTE to PUBLIC by default, which includes
--    the anon role. Revoke from PUBLIC and anon (authenticated and
--    service_role keep their explicit grants).
--    If a public-facing booking form is added later, grant back to
--    anon for create_booking_with_items only.
-- ----------------------------------------------------------------
revoke execute on function public.apply_stock_update()                 from public, anon;
revoke execute on function public.archive_record(text, uuid)           from public, anon;
revoke execute on function public.archive_records_older_than(integer)  from public, anon;
revoke execute on function public.unarchive_record(text, uuid)         from public, anon;
revoke execute on function public.create_order_with_items(
  text, text, text, integer, integer, integer, integer, jsonb
) from public, anon;
revoke execute on function public.create_booking_with_items(
  text, text, text, integer, text, date, time, time, text, text,
  integer, integer, integer, integer, integer, text, text, text,
  uuid, jsonb
) from public, anon;
revoke execute on function public.replace_booking_items(uuid, jsonb)   from public, anon;
revoke execute on function public.generate_salary_due_notifications()  from public, anon;
revoke execute on function public.generate_balance_due_notifications() from public, anon;
revoke execute on function public.notify_low_stock()                   from public, anon;
revoke execute on function public.rls_auto_enable()                    from public, anon;
revoke execute on function public.get_my_role()                        from public, anon;
