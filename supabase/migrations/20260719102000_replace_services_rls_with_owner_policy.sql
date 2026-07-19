-- Public catalog reads services through get_public_storefront(). Direct table
-- access is owner-only until employee permissions are modeled in AUTH-001.

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'services'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end;
$$;

create policy "owner_services"
on public.services
for all
to authenticated
using (
  exists (
    select 1 from public.establishments e
    where e.id = services.establishment_id and e.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.establishments e
    where e.id = services.establishment_id and e.owner_id = auth.uid()
  )
);
