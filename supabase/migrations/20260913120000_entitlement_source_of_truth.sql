-- FASE 1: single server-side source of truth for trial/subscription access.
--
-- Problems closed:
--   P-01 expired trial never blocked any real operation;
--   P-02 establishment owner could self-escalate subscription_plan/trial_started_at/
--        extra_trial_days directly via PostgREST, bypassing Mercado Pago entirely;
--   P-03 at least six independent, client-computed trial-days formulas existed
--        across mobile/web/admin with no shared authority.
--
-- Design: one computation function (compute_establishment_access) reads
-- establishments + billing_subscriptions + app_settings.geral.trialDays using the
-- database's own now() as the only clock. can_manage_establishment() — already the
-- single gate used by ~20 existing RLS policies — is extended to require this
-- entitlement for the owner branch, so every table that already calls it inherits
-- enforcement with no per-policy changes. Admins keep full access regardless of the
-- target establishment's billing state. Mercado Pago's webhook/checkout are
-- untouched: they already write establishments.subscription_plan and
-- billing_subscriptions via the service role, which this migration explicitly keeps
-- privileged to do so.

-- Defensive: these columns are referenced throughout the app but were only ever
-- added via the legacy supabase-setup.sql / production dashboard, never a tracked
-- migration. IF NOT EXISTS makes this a no-op where they already exist.
alter table public.establishments add column if not exists subscription_plan varchar(20) default 'trial';
alter table public.establishments add column if not exists trial_started_at timestamptz default now();
alter table public.establishments add column if not exists extra_trial_days integer not null default 0;

-- ---------------------------------------------------------------------------
-- 1. Composite result type shared by every access-resolution function.
-- ---------------------------------------------------------------------------
drop type if exists public.establishment_access cascade;
create type public.establishment_access as (
  establishment_id uuid,
  has_access boolean,
  status text,               -- 'subscription_active' | 'trial' | 'trial_expired'
  plan_id text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  trial_days_left integer,
  subscription_status text,  -- latest billing_subscriptions.status, or 'none'
  reason text,
  server_time timestamptz
);

-- ---------------------------------------------------------------------------
-- 2. Pure computation — the only place trial/subscription math happens.
-- ---------------------------------------------------------------------------
create or replace function public.compute_establishment_access(p_establishment_id uuid)
returns public.establishment_access
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_est record;
  v_sub record;
  v_trial_days int;
  v_trial_ends timestamptz;
  v_days_left int;
  v_latest_status text;
  v_result public.establishment_access;
begin
  select id, trial_started_at, extra_trial_days, subscription_plan
    into v_est
    from public.establishments
    where id = p_establishment_id;

  if not found then
    raise exception 'establishment % not found', p_establishment_id using errcode = 'P0002';
  end if;

  select status into v_latest_status
    from public.billing_subscriptions
    where establishment_id = p_establishment_id
    order by updated_at desc
    limit 1;

  select status, plan_id, current_period_end
    into v_sub
    from public.billing_subscriptions
    where establishment_id = p_establishment_id
      and status = 'authorized'
    order by updated_at desc
    limit 1;

  v_result.establishment_id := p_establishment_id;
  v_result.server_time := now();
  v_result.subscription_status := coalesce(v_latest_status, 'none');

  if found then
    v_result.has_access := true;
    v_result.status := 'subscription_active';
    v_result.plan_id := v_sub.plan_id;
    v_result.trial_started_at := v_est.trial_started_at;
    v_result.trial_ends_at := v_sub.current_period_end;
    v_result.trial_days_left := 0;
    v_result.reason := 'subscription_active';
    return v_result;
  end if;

  select (value->>'trialDays')::int into v_trial_days
    from public.app_settings
    where key = 'geral';
  v_trial_days := coalesce(v_trial_days, 30);

  v_trial_ends := coalesce(v_est.trial_started_at, now())
    + ((v_trial_days + coalesce(v_est.extra_trial_days, 0)) || ' days')::interval;
  v_days_left := greatest(0, ceil(extract(epoch from (v_trial_ends - now())) / 86400.0)::int);

  v_result.has_access := now() < v_trial_ends;
  v_result.status := case when now() < v_trial_ends then 'trial' else 'trial_expired' end;
  v_result.plan_id := nullif(v_est.subscription_plan, 'trial');
  v_result.trial_started_at := v_est.trial_started_at;
  v_result.trial_ends_at := v_trial_ends;
  v_result.trial_days_left := v_days_left;
  v_result.reason := case when now() < v_trial_ends then 'trial_active' else 'trial_expired' end;
  return v_result;
end;
$$;

revoke all on function public.compute_establishment_access(uuid) from public, anon;
grant execute on function public.compute_establishment_access(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Boolean gate used internally by RLS (can_manage_establishment below).
-- ---------------------------------------------------------------------------
create or replace function public.establishment_has_access(p_establishment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (public.compute_establishment_access(p_establishment_id)).has_access;
$$;

revoke all on function public.establishment_has_access(uuid) from public, anon;
grant execute on function public.establishment_has_access(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Client-facing readers. Owner reads their own; admin reads any.
-- ---------------------------------------------------------------------------
create or replace function public.get_establishment_access(p_establishment_id uuid)
returns public.establishment_access
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.establishments e
    where e.id = p_establishment_id
      and (e.owner_id = auth.uid() or public.is_app_admin())
  ) then
    raise exception 'not authorized to read establishment %', p_establishment_id using errcode = '42501';
  end if;
  return public.compute_establishment_access(p_establishment_id);
end;
$$;

revoke all on function public.get_establishment_access(uuid) from public, anon;
grant execute on function public.get_establishment_access(uuid) to authenticated;

create or replace function public.get_my_establishment_access()
returns public.establishment_access
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.establishments where owner_id = auth.uid() limit 1;
  if v_id is null then
    raise exception 'no establishment for current user' using errcode = 'P0002';
  end if;
  return public.compute_establishment_access(v_id);
end;
$$;

revoke all on function public.get_my_establishment_access() from public, anon;
grant execute on function public.get_my_establishment_access() to authenticated;

-- Bulk reader for the admin panel (admin/usuarios, admin/assinaturas) so every
-- row in those lists uses the exact same formula instead of a fourth/fifth copy.
create or replace function public.admin_list_establishment_access()
returns setof public.establishment_access
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_app_admin() or auth.role() = 'service_role') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select (public.compute_establishment_access(e.id)).*
    from public.establishments e;
end;
$$;

revoke all on function public.admin_list_establishment_access() from public, anon;
grant execute on function public.admin_list_establishment_access() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. The enforcement point: extend the existing tenant gate, not each policy.
--    ~20 policies already call can_manage_establishment(establishment_id) —
--    they all inherit this automatically. Admins are unaffected on purpose:
--    they must be able to manage/support a blocked establishment.
-- ---------------------------------------------------------------------------
create or replace function public.can_manage_establishment(p_establishment_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.establishments e
    where e.id = p_establishment_id
      and e.owner_id = auth.uid()
      and public.establishment_has_access(e.id)
  ) or public.is_app_admin();
$$;

-- ---------------------------------------------------------------------------
-- 6. Close the P-02 bypass at the column level: only a trusted writer (service
--    role, i.e. the Mercado Pago webhook/admin API using the service key; an
--    authenticated app admin; or a superuser session such as a migration) may
--    change the three commercial fields. Every other column on establishments
--    (name, phone, address, logo, hours_json, etc.) is completely unaffected —
--    the trigger only inspects these three.
-- ---------------------------------------------------------------------------
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
      auth.role() = 'service_role'
      or public.is_app_admin()
      or current_user in ('postgres', 'supabase_admin', 'supabase_storage_admin')
    ) then
      raise exception 'subscription_plan, trial_started_at and extra_trial_days can only be changed by a trusted billing process'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_establishment_commercial_fields on public.establishments;
create trigger protect_establishment_commercial_fields
before update on public.establishments
for each row execute function public.protect_establishment_commercial_fields();
