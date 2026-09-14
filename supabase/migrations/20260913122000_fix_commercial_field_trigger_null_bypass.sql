-- Fixes a real bug found during live Fase 1 testing (scenarios G/H/I): the
-- protect_establishment_commercial_fields() trigger let an owner change
-- subscription_plan/trial_started_at/extra_trial_days directly.
--
-- Root cause: `auth.role() = 'service_role'` evaluated to NULL in this
-- trigger's execution context. SQL three-valued logic then made the whole
-- `bypass1 or bypass2 or bypass3` expression NULL (NULL or false or false =
-- NULL, not false), and `if not (NULL) then ... end if` is treated as false
-- in PL/pgSQL — silently skipping the RAISE EXCEPTION instead of blocking.
-- Confirmed live: an authenticated (non-admin) owner's PATCH to
-- subscription_plan/extra_trial_days returned 204 and the values persisted.
--
-- Fix: coalesce every disjunct to a definite boolean so the guard can never
-- silently resolve to "allow" regardless of why auth.role() is null here.
create or replace function public.protect_establishment_commercial_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.subscription_plan is distinct from old.subscription_plan)
     or (new.trial_started_at is distinct from old.trial_started_at)
     or (new.extra_trial_days is distinct from old.extra_trial_days)
  then
    if not (
      coalesce(auth.role() = 'service_role', false)
      or coalesce(public.is_app_admin(), false)
      or coalesce(current_user in ('postgres', 'supabase_admin', 'supabase_storage_admin'), false)
    ) then
      raise exception 'subscription_plan, trial_started_at and extra_trial_days can only be changed by a trusted billing process'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- Remove the temporary diagnostic used to find the bug above.
drop function if exists public.qa_diagnose_commercial_trigger();
