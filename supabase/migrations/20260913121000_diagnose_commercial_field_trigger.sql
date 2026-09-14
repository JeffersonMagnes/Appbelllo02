-- Temporary, read-only diagnostic for the G/H/I test failure (owner PATCH to
-- subscription_plan/extra_trial_days succeeded when it should have been
-- rejected by protect_establishment_commercial_fields). service_role only.
-- Dropped again in the very next migration once the root cause is fixed.
create or replace function public.qa_diagnose_commercial_trigger()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'trigger_exists', exists (
      select 1 from pg_trigger
      where tgrelid = 'public.establishments'::regclass
        and tgname = 'protect_establishment_commercial_fields'
        and not tgisinternal
    ),
    'trigger_enabled', (
      select tgenabled from pg_trigger
      where tgrelid = 'public.establishments'::regclass
        and tgname = 'protect_establishment_commercial_fields'
        and not tgisinternal
    ),
    'function_source', (
      select pg_get_functiondef(oid) from pg_proc
      where proname = 'protect_establishment_commercial_fields'
    )
  );
$$;
revoke all on function public.qa_diagnose_commercial_trigger() from public, anon, authenticated;
grant execute on function public.qa_diagnose_commercial_trigger() to service_role;
