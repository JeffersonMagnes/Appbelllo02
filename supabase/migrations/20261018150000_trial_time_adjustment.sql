-- Trial time adjustment with minute / hour / day precision.
--
-- Until now the trial end was `trial_started_at + (trialDays + extra_trial_days) days`:
-- whole days only, and only reachable through production-only RPCs
-- (admin_extend_trial / admin_bulk_extend_trial) that are not versioned here and
-- write no audit trail. Those RPCs are intentionally left untouched.
--
-- This migration adds, without changing any existing trial's end date:
--   1. establishments.trial_adjust_micros — a signed adjustment in microseconds
--      added on top of the existing day-based formula (default 0 = unchanged);
--   2. compute_establishment_access() including that adjustment, so every reader
--      (RLS gate, mobile, web dashboard, admin) keeps using ONE formula;
--   3. protect_establishment_commercial_fields() also guarding the new column,
--      so an owner can never self-extend through PostgREST;
--   4. trial_adjustments — an append-only audit of who changed what and when;
--   5. admin_preview_trial_adjustment() / admin_grant_trial_time() — admin-only,
--      server-computed, validated and audited.
--
-- Two modes decide what the amount is added to:
--   'extend'   : current end + amount (the current end may already be in the past)
--   'from_now' : now() + amount, regardless of the current end. This is how an
--                already-expired trial gets a fresh interval without having to
--                compensate the whole expired period; it can also shorten an
--                active trial, which must be explicitly allowed (p_allow_shorten).

-- ---------------------------------------------------------------------------
-- 0. Pre-flight: abort (before changing anything) unless the objects this
--    migration replaces are exactly the ones it was written against. A hotfix
--    applied outside the migration history, or a stale environment, would
--    otherwise be silently overwritten.
-- ---------------------------------------------------------------------------
do $$
declare
  v_def text;
begin
  if to_regclass('public.establishments') is null
     or to_regclass('public.billing_subscriptions') is null
     or to_regclass('public.app_settings') is null then
    raise exception 'pre-flight failed: establishments, billing_subscriptions and app_settings must exist';
  end if;

  if (select count(*) from information_schema.columns
        where table_schema = 'public' and table_name = 'establishments'
          and column_name in ('trial_started_at', 'extra_trial_days', 'subscription_plan', 'owner_id')) <> 4 then
    raise exception 'pre-flight failed: establishments is missing trial_started_at/extra_trial_days/subscription_plan/owner_id';
  end if;

  if to_regprocedure('public.is_app_admin()') is null
     or to_regprocedure('public.compute_establishment_access(uuid)') is null
     or to_regprocedure('public.protect_establishment_commercial_fields()') is null then
    raise exception 'pre-flight failed: is_app_admin, compute_establishment_access or protect_establishment_commercial_fields is missing';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.establishments'::regclass
      and tgname = 'protect_establishment_commercial_fields'
      and not tgisinternal
  ) then
    raise exception 'pre-flight failed: trigger protect_establishment_commercial_fields is not installed on establishments';
  end if;

  v_def := pg_get_functiondef('public.protect_establishment_commercial_fields()'::regprocedure);
  if v_def like '%current_user%' or v_def not like '%is_app_admin%' or v_def not like '%extra_trial_days%' then
    raise exception 'pre-flight failed: protect_establishment_commercial_fields is not the expected hardened variant';
  end if;

  v_def := pg_get_functiondef('public.compute_establishment_access(uuid)'::regprocedure);
  if v_def not like '%extra_trial_days%' or v_def not like '%billing_subscriptions%' or v_def not like '%trialDays%' then
    raise exception 'pre-flight failed: compute_establishment_access is not the expected entitlement formula';
  end if;

  if to_regclass('public.trial_adjustments') is not null and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trial_adjustments' and column_name = 'previous_ends_at'
  ) then
    raise exception 'pre-flight failed: public.trial_adjustments already exists with a different shape';
  end if;
end;
$$;

alter table public.establishments
  add column if not exists trial_adjust_micros bigint not null default 0;

-- ---------------------------------------------------------------------------
-- 1. Audit trail. establishment_id is deliberately NOT a foreign key so the
--    history survives an establishment deletion.
-- ---------------------------------------------------------------------------
create table if not exists public.trial_adjustments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null,
  admin_user_id uuid,
  admin_email text,
  amount integer not null check (amount > 0),
  unit text not null check (unit in ('minutes', 'hours', 'days')),
  mode text not null check (mode in ('extend', 'from_now')),
  previous_ends_at timestamptz not null,
  new_ends_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists trial_adjustments_establishment_idx
  on public.trial_adjustments (establishment_id, created_at desc);

alter table public.trial_adjustments enable row level security;

drop policy if exists trial_adjustments_admin_select on public.trial_adjustments;
create policy trial_adjustments_admin_select on public.trial_adjustments
  for select to authenticated
  using (coalesce(public.is_app_admin(), false));

-- Rows are written only by admin_grant_trial_time() (security definer).
revoke all on public.trial_adjustments from public, anon, authenticated;
grant select on public.trial_adjustments to authenticated;
grant all on public.trial_adjustments to service_role;

-- ---------------------------------------------------------------------------
-- 2. The single computation, now including the adjustment. Identical to the
--    previous definition except for the added trial_adjust_micros term.
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
  select id, trial_started_at, extra_trial_days, trial_adjust_micros, subscription_plan
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
    + ((v_trial_days + coalesce(v_est.extra_trial_days, 0)) || ' days')::interval
    + (coalesce(v_est.trial_adjust_micros, 0) * interval '1 microsecond');
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
-- 3. Column guard: the new column is a commercial field like the other three.
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
     or (new.trial_adjust_micros is distinct from old.trial_adjust_micros)
  then
    if not (
      coalesce(auth.role() = 'service_role', false)
      or coalesce(public.is_app_admin(), false)
    ) then
      raise exception 'subscription_plan, trial_started_at, extra_trial_days and trial_adjust_micros can only be changed by a trusted billing process'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Shared calculation (internal; not callable by clients).
-- ---------------------------------------------------------------------------
create or replace function public.trial_adjustment_calc(
  p_establishment_id uuid,
  p_amount integer,
  p_unit text,
  p_mode text
)
returns table (
  current_ends_at timestamptz,
  new_ends_at timestamptz,
  access_status text,
  server_time timestamptz,
  delta_micros bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_access public.establishment_access;
  v_step interval;
  v_new timestamptz;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be a positive integer' using errcode = '22023';
  end if;
  if p_unit is null or p_unit not in ('minutes', 'hours', 'days') then
    raise exception 'unit must be minutes, hours or days' using errcode = '22023';
  end if;
  if p_mode is null or p_mode not in ('extend', 'from_now') then
    raise exception 'mode must be extend or from_now' using errcode = '22023';
  end if;

  v_step := case p_unit
    when 'minutes' then p_amount * interval '1 minute'
    when 'hours' then p_amount * interval '1 hour'
    else p_amount * interval '1 day'
  end;
  if v_step > interval '365 days' then
    raise exception 'duration cannot exceed 365 days' using errcode = '22023';
  end if;

  v_access := public.compute_establishment_access(p_establishment_id);
  if v_access.status = 'subscription_active' then
    raise exception 'establishment has an active subscription; trial cannot be adjusted'
      using errcode = '55000';
  end if;

  v_new := case p_mode
    when 'from_now' then now() + v_step
    else v_access.trial_ends_at + v_step
  end;

  return query select
    v_access.trial_ends_at,
    v_new,
    v_access.status,
    now(),
    round(extract(epoch from (v_new - v_access.trial_ends_at)) * 1000000)::bigint;
end;
$$;

revoke all on function public.trial_adjustment_calc(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.trial_adjustment_calc(uuid, integer, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- 5. Admin preview (read-only) and grant (writes + audit).
-- ---------------------------------------------------------------------------
create or replace function public.admin_preview_trial_adjustment(
  p_establishment_id uuid,
  p_amount integer,
  p_unit text,
  p_mode text default 'extend'
)
returns table (
  current_ends_at timestamptz,
  new_ends_at timestamptz,
  access_status text,
  server_time timestamptz,
  shortens boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (coalesce(public.is_app_admin(), false) or coalesce(auth.role() = 'service_role', false)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select c.current_ends_at, c.new_ends_at, c.access_status, c.server_time, c.new_ends_at < c.current_ends_at
    from public.trial_adjustment_calc(p_establishment_id, p_amount, p_unit, p_mode) c;
end;
$$;

revoke all on function public.admin_preview_trial_adjustment(uuid, integer, text, text) from public, anon;
grant execute on function public.admin_preview_trial_adjustment(uuid, integer, text, text) to authenticated, service_role;

create or replace function public.admin_grant_trial_time(
  p_establishment_ids uuid[],
  p_amount integer,
  p_unit text,
  p_mode text default 'extend',
  p_allow_shorten boolean default false,
  p_note text default null
)
returns setof public.trial_adjustments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_calc record;
  v_row public.trial_adjustments;
  v_email text;
begin
  if not (coalesce(public.is_app_admin(), false) or coalesce(auth.role() = 'service_role', false)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_establishment_ids is null or coalesce(array_length(p_establishment_ids, 1), 0) = 0 then
    raise exception 'at least one establishment is required' using errcode = '22023';
  end if;
  if array_length(p_establishment_ids, 1) > 200 then
    raise exception 'at most 200 establishments per call' using errcode = '22023';
  end if;

  if auth.uid() is not null then
    select email into v_email from auth.users where id = auth.uid();
  end if;

  -- Sorted + distinct: deterministic lock order, and a repeated id cannot be
  -- applied twice. Any failure raises and rolls the whole call back.
  for v_id in select distinct unnest(p_establishment_ids) order by 1 loop
    perform 1 from public.establishments where id = v_id for update;
    if not found then
      raise exception 'establishment % not found', v_id using errcode = 'P0002';
    end if;

    select * into v_calc from public.trial_adjustment_calc(v_id, p_amount, p_unit, p_mode);

    if v_calc.new_ends_at < v_calc.current_ends_at and not coalesce(p_allow_shorten, false) then
      raise exception 'this would shorten the trial of % (from % to %); pass p_allow_shorten to confirm',
        v_id, v_calc.current_ends_at, v_calc.new_ends_at using errcode = '22023';
    end if;

    update public.establishments
      set trial_adjust_micros = trial_adjust_micros + v_calc.delta_micros
      where id = v_id;

    insert into public.trial_adjustments
      (establishment_id, admin_user_id, admin_email, amount, unit, mode, previous_ends_at, new_ends_at, note)
    values
      (v_id, auth.uid(), v_email, p_amount, p_unit, p_mode, v_calc.current_ends_at, v_calc.new_ends_at, p_note)
    returning * into v_row;

    return next v_row;
  end loop;
  return;
end;
$$;

revoke all on function public.admin_grant_trial_time(uuid[], integer, text, text, boolean, text) from public, anon;
grant execute on function public.admin_grant_trial_time(uuid[], integer, text, text, boolean, text) to authenticated, service_role;
