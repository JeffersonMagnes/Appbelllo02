-- Harden privileged admin access and remove anonymous client enumeration.

create or replace function public.is_app_admin()
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare allowed boolean := false;
begin
  if auth.uid() is null or to_regclass('public.admin_users') is null then return false; end if;
  execute 'select exists (select 1 from public.admin_users where user_id = $1)'
    into allowed using auth.uid();
  return coalesce(allowed, false);
end;
$$;

revoke all on function public.is_app_admin() from public, anon;
grant execute on function public.is_app_admin() to authenticated, service_role;

create or replace function public.get_admin_establishments()
returns table (
  id uuid, owner_id uuid, establishment_name text, slug text, logo_url text,
  business_type text, phone text, address text, active boolean,
  created_at timestamptz, owner_name text, owner_email text,
  professionals_count bigint
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  return query
  select e.id, e.owner_id, e.name, e.slug, e.logo_url, e.business_type,
    e.phone, e.address, e.active, e.created_at,
    coalesce(p.name, ''), coalesce(p.email, ''), count(pr.id)
  from public.establishments e
  left join public.profiles p on p.id = e.owner_id
  left join public.professionals pr on pr.establishment_id = e.id and pr.active = true
  group by e.id, p.name, p.email order by e.created_at desc;
end;
$$;

revoke all on function public.get_admin_establishments() from public, anon;
grant execute on function public.get_admin_establishments() to authenticated, service_role;

create or replace function public.create_public_booking(
  p_establishment_id uuid, p_service_id uuid, p_employee_id uuid,
  p_date date, p_time text, p_client_name text, p_client_phone text,
  p_notes text default null
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  normalized_name text := nullif(trim(p_client_name), '');
  normalized_phone text := nullif(regexp_replace(coalesce(p_client_phone, ''), '\D', '', 'g'), '');
  selected_client_id uuid;
  new_appointment_id uuid;
begin
  if normalized_name is null or length(normalized_name) > 120 then
    raise exception 'invalid_client_name' using errcode = '22023';
  end if;
  if normalized_phone is null or length(normalized_phone) not between 10 and 15 then
    raise exception 'invalid_client_phone' using errcode = '22023';
  end if;
  if p_date < current_date or p_date > current_date + 180 then
    raise exception 'invalid_booking_date' using errcode = '22023';
  end if;
  if p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'invalid_booking_time' using errcode = '22023';
  end if;
  if not exists (select 1 from public.establishments where id = p_establishment_id and active = true) then
    raise exception 'establishment_not_found' using errcode = 'P0002';
  end if;
  if p_service_id is not null and not exists (
    select 1 from public.services where id = p_service_id
      and establishment_id = p_establishment_id and active = true
  ) then raise exception 'service_not_found' using errcode = 'P0002'; end if;
  if p_employee_id is not null and not exists (
    select 1 from public.employees where id = p_employee_id
      and establishment_id = p_establishment_id and active = true
  ) then raise exception 'employee_not_found' using errcode = 'P0002'; end if;

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
    status, notes, client_name
  ) values (
    p_establishment_id, selected_client_id, p_employee_id, p_service_id,
    p_date, p_time, 'pending', nullif(trim(coalesce(p_notes, '')), ''), normalized_name
  ) returning id into new_appointment_id;
  return new_appointment_id;
end;
$$;

revoke all on function public.create_public_booking(uuid, uuid, uuid, date, text, text, text, text) from public;
grant execute on function public.create_public_booking(uuid, uuid, uuid, date, text, text, text, text)
  to anon, authenticated, service_role;

-- The legacy public policies are removed by the follow-up migration only after
-- the Site and Mobile clients using create_public_booking are deployed.
