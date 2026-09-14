-- Second, real fix for the G/H/I failure. The previous coalesce() fix
-- (20260913122000) was necessary but not sufficient: live diagnostics show
-- that in this project's connection architecture, `current_user` is
-- literally 'postgres' for EVERY PostgREST request, regardless of the
-- caller's actual JWT role (identity here is carried entirely by the
-- request.jwt.claims GUC that auth.uid()/auth.role() read, not by native
-- Postgres ROLE switching). The trigger's `current_user in ('postgres', ...)`
-- escape hatch — added defensively for direct-migration compatibility — was
-- therefore true for every owner's own PATCH request too, silently allowing
-- the exact tampering this trigger exists to block.
--
-- Confirmed live: an authenticated non-admin QA user's PATCH to
-- subscription_plan/trial_started_at/extra_trial_days returned 204 and the
-- new values persisted, while `current_user` for that same request read back
-- as 'postgres' via a temporary diagnostic RPC.
--
-- Fix: drop the current_user escape hatch entirely. auth.role()='service_role'
-- (used by the webhook/admin API's service-role client) and is_app_admin()
-- (used by the admin panel) are both GUC/JWT-based and already proven
-- reliable by the live test suite — no legitimate write path depends on the
-- current_user check.
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
    ) then
      raise exception 'subscription_plan, trial_started_at and extra_trial_days can only be changed by a trusted billing process'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- Remove the temporary diagnostics used to find both issues above.
drop function if exists public.qa_diagnose_commercial_trigger();
