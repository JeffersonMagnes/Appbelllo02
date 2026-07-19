-- Containment: replace every inherited/broken policy on comandas with an
-- explicit owner-only policy. Employee access will be modeled in AUTH-001.

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('comandas', 'comanda_items')
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

create policy "owner_comandas"
on public.comandas
for all
to authenticated
using (
  exists (
    select 1 from public.establishments e
    where e.id = comandas.establishment_id and e.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.establishments e
    where e.id = comandas.establishment_id and e.owner_id = auth.uid()
  )
);

create policy "owner_comanda_items"
on public.comanda_items
for all
to authenticated
using (
  exists (
    select 1
    from public.comandas c
    join public.establishments e on e.id = c.establishment_id
    where c.id = comanda_items.comanda_id and e.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.comandas c
    join public.establishments e on e.id = c.establishment_id
    where c.id = comanda_items.comanda_id and e.owner_id = auth.uid()
  )
);
