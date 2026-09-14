-- Bug found while live-testing the Fase 2 anamnesis fix: the write policies
-- from 20260914020000 only checked `bucket_id = 'public-fichas'`, so ANY
-- authenticated user (any establishment) could overwrite or delete ANY
-- other establishment's shared ficha — not just their own. There was also
-- no SELECT policy at all, which silently broke upsert-based re-upload of
-- an existing ficha (Storage's upsert needs to look the row up first).
--
-- This replaces those policies with ones scoped to the establishment that
-- prefixes the object's path (`${establishmentId}/${shareToken}.html`,
-- the pattern used for every upload since 20260914030000). Pre-migration
-- flat-path objects (no "/" in the name) have no recoverable tenant, so
-- they simply don't match any of these policies going forward — they stay
-- exactly as they are (nothing here deletes or moves them), reachable only
-- through the service-role signed-url endpoint, never through a direct
-- authenticated call. That is a tightening, not a regression: before this
-- migration they were reachable by ANY authenticated user; now by none.

create or replace function public.public_fichas_object_authorized(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  prefix text := split_part(object_name, '/', 1);
begin
  if prefix ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return public.can_manage_establishment(prefix::uuid);
  end if;
  return false;
end;
$$;

drop policy if exists public_fichas_authenticated_write on storage.objects;
create policy public_fichas_owner_write on storage.objects for insert
to authenticated
with check (bucket_id = 'public-fichas' and public.public_fichas_object_authorized(name));

drop policy if exists public_fichas_authenticated_update on storage.objects;
create policy public_fichas_owner_update on storage.objects for update
to authenticated
using (bucket_id = 'public-fichas' and public.public_fichas_object_authorized(name))
with check (bucket_id = 'public-fichas' and public.public_fichas_object_authorized(name));

drop policy if exists public_fichas_authenticated_delete on storage.objects;
create policy public_fichas_owner_delete on storage.objects for delete
to authenticated
using (bucket_id = 'public-fichas' and public.public_fichas_object_authorized(name));

drop policy if exists public_fichas_owner_select on storage.objects;
create policy public_fichas_owner_select on storage.objects for select
to authenticated
using (bucket_id = 'public-fichas' and public.public_fichas_object_authorized(name));
