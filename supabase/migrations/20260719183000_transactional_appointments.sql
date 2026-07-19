-- DOM-001: serialize schedule writes and reject overlapping appointments/blocks.

alter table public.establishments
  add column if not exists timezone text not null default 'America/Sao_Paulo';

alter table public.appointments
  add column if not exists idempotency_key text;

create unique index if not exists appointments_establishment_idempotency_uidx
  on public.appointments (establishment_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.appointment_duration_minutes(
  p_service_id uuid,
  p_establishment_id uuid
)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select greatest(1, least(1440, coalesce(
    (select s.duration from public.services s
      where s.id = p_service_id and s.establishment_id = p_establishment_id),
    (select e.default_service_duration from public.establishments e
      where e.id = p_establishment_id),
    30
  )))::integer;
$$;

create or replace function public.enforce_appointment_schedule()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  start_minute integer;
  end_minute integer;
begin
  if new.time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'invalid_booking_time' using errcode = '22023';
  end if;

  if new.status = 'cancelled' then
    return new;
  end if;

  -- Every write for the same establishment/day uses the same transaction lock.
  -- This also serializes global blocked slots against employee appointments.
  perform pg_advisory_xact_lock(
    hashtextextended(new.establishment_id::text || ':' || new.date::text, 0)
  );

  start_minute := split_part(new.time, ':', 1)::integer * 60
    + split_part(new.time, ':', 2)::integer;
  end_minute := start_minute
    + public.appointment_duration_minutes(new.service_id, new.establishment_id);

  if end_minute > 1440 then
    raise exception 'appointment_crosses_day_boundary' using errcode = '22023';
  end if;

  if new.employee_id is not null and exists (
    select 1
    from public.appointments existing
    where existing.establishment_id = new.establishment_id
      and existing.employee_id = new.employee_id
      and existing.date = new.date
      and existing.status <> 'cancelled'
      and existing.id is distinct from new.id
      and existing.time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and start_minute < (
        split_part(existing.time, ':', 1)::integer * 60
        + split_part(existing.time, ':', 2)::integer
        + public.appointment_duration_minutes(existing.service_id, existing.establishment_id)
      )
      and (
        split_part(existing.time, ':', 1)::integer * 60
        + split_part(existing.time, ':', 2)::integer
      ) < end_minute
  ) then
    raise exception 'appointment_conflict' using errcode = '23P01';
  end if;

  if exists (
    select 1
    from public.blocked_slots blocked
    where blocked.establishment_id = new.establishment_id
      and blocked.date = new.date
      and (blocked.employee_id is null or blocked.employee_id = new.employee_id)
      and blocked.start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and blocked.end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and start_minute < (
        split_part(blocked.end_time, ':', 1)::integer * 60
        + split_part(blocked.end_time, ':', 2)::integer
      )
      and (
        split_part(blocked.start_time, ':', 1)::integer * 60
        + split_part(blocked.start_time, ':', 2)::integer
      ) < end_minute
  ) then
    raise exception 'appointment_blocked' using errcode = '23P01';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_enforce_schedule on public.appointments;
create trigger appointments_enforce_schedule
before insert or update of establishment_id, employee_id, service_id, date, time, status
on public.appointments
for each row execute function public.enforce_appointment_schedule();

create or replace function public.enforce_blocked_slot_schedule()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  block_start integer;
  block_end integer;
begin
  if new.start_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or new.end_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'invalid_block_time' using errcode = '22023';
  end if;

  block_start := split_part(new.start_time, ':', 1)::integer * 60
    + split_part(new.start_time, ':', 2)::integer;
  block_end := split_part(new.end_time, ':', 1)::integer * 60
    + split_part(new.end_time, ':', 2)::integer;
  if block_end <= block_start then
    raise exception 'invalid_block_range' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.establishment_id::text || ':' || new.date::text, 0)
  );

  if exists (
    select 1
    from public.appointments appointment
    where appointment.establishment_id = new.establishment_id
      and appointment.date = new.date
      and appointment.status <> 'cancelled'
      and (new.employee_id is null or appointment.employee_id = new.employee_id)
      and appointment.time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and block_start < (
        split_part(appointment.time, ':', 1)::integer * 60
        + split_part(appointment.time, ':', 2)::integer
        + public.appointment_duration_minutes(appointment.service_id, appointment.establishment_id)
      )
      and (
        split_part(appointment.time, ':', 1)::integer * 60
        + split_part(appointment.time, ':', 2)::integer
      ) < block_end
  ) then
    raise exception 'blocked_slot_conflicts_with_appointment' using errcode = '23P01';
  end if;

  return new;
end;
$$;

drop trigger if exists blocked_slots_enforce_schedule on public.blocked_slots;
create trigger blocked_slots_enforce_schedule
before insert or update of establishment_id, employee_id, date, start_time, end_time
on public.blocked_slots
for each row execute function public.enforce_blocked_slot_schedule();

drop function if exists public.create_public_booking(uuid, uuid, uuid, date, text, text, text, text);
create function public.create_public_booking(
  p_establishment_id uuid, p_service_id uuid, p_employee_id uuid,
  p_date date, p_time text, p_client_name text, p_client_phone text,
  p_notes text default null, p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_name text := nullif(trim(p_client_name), '');
  normalized_phone text := nullif(regexp_replace(coalesce(p_client_phone, ''), '\D', '', 'g'), '');
  normalized_key text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  selected_client_id uuid;
  new_appointment_id uuid;
  business_timezone text;
  business_today date;
begin
  if normalized_name is null or length(normalized_name) > 120 then
    raise exception 'invalid_client_name' using errcode = '22023';
  end if;
  if normalized_phone is null or length(normalized_phone) not between 10 and 15 then
    raise exception 'invalid_client_phone' using errcode = '22023';
  end if;
  if normalized_key is not null and length(normalized_key) > 128 then
    raise exception 'invalid_idempotency_key' using errcode = '22023';
  end if;
  if p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'invalid_booking_time' using errcode = '22023';
  end if;

  select e.timezone into business_timezone
  from public.establishments e
  where e.id = p_establishment_id and e.active = true;
  if business_timezone is null then
    raise exception 'establishment_not_found' using errcode = 'P0002';
  end if;
  begin
    business_today := (current_timestamp at time zone business_timezone)::date;
  exception when invalid_parameter_value then
    raise exception 'invalid_establishment_timezone' using errcode = '22023';
  end;
  if p_date < business_today or p_date > business_today + 180 then
    raise exception 'invalid_booking_date' using errcode = '22023';
  end if;

  if p_service_id is not null and not exists (
    select 1 from public.services where id = p_service_id
      and establishment_id = p_establishment_id and active = true
  ) then raise exception 'service_not_found' using errcode = 'P0002'; end if;
  if p_employee_id is not null and not exists (
    select 1 from public.employees where id = p_employee_id
      and establishment_id = p_establishment_id and active = true
  ) then raise exception 'employee_not_found' using errcode = 'P0002'; end if;

  if normalized_key is not null then
    select a.id into new_appointment_id
    from public.appointments a
    where a.establishment_id = p_establishment_id
      and a.idempotency_key = normalized_key;
    if new_appointment_id is not null then return new_appointment_id; end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_establishment_id::text || ':' || normalized_phone, 0));
  select c.id into selected_client_id from public.clients c
  where c.establishment_id = p_establishment_id and c.phone = normalized_phone
  order by c.created_at limit 1;
  if selected_client_id is null then
    insert into public.clients (establishment_id, name, phone)
    values (p_establishment_id, normalized_name, normalized_phone)
    returning id into selected_client_id;
  end if;

  insert into public.appointments (
    establishment_id, client_id, employee_id, service_id, date, time,
    status, notes, client_name, idempotency_key
  ) values (
    p_establishment_id, selected_client_id, p_employee_id, p_service_id,
    p_date, p_time, 'pending', nullif(trim(coalesce(p_notes, '')), ''),
    normalized_name, normalized_key
  )
  on conflict (establishment_id, idempotency_key)
    where idempotency_key is not null
  do update set idempotency_key = excluded.idempotency_key
  returning id into new_appointment_id;
  return new_appointment_id;
end;
$$;

revoke all on function public.create_public_booking(uuid, uuid, uuid, date, text, text, text, text, text) from public;
grant execute on function public.create_public_booking(uuid, uuid, uuid, date, text, text, text, text, text)
  to anon, authenticated, service_role;
