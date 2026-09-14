create or replace function public.qa_diagnose_commercial_trigger()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'function_source', (
      select pg_get_functiondef(oid) from pg_proc
      where proname = 'protect_establishment_commercial_fields'
    ),
    'my_role_probe', jsonb_build_object(
      'auth_role', auth.role(),
      'current_user', current_user,
      'session_user', session_user,
      'current_setting_role', current_setting('role', true),
      'jwt_claims', current_setting('request.jwt.claims', true),
      'is_app_admin', public.is_app_admin()
    )
  );
$$;
revoke all on function public.qa_diagnose_commercial_trigger() from public, anon;
grant execute on function public.qa_diagnose_commercial_trigger() to authenticated, service_role;
