-- Reconcile schema changes that already exist partially in production but were
-- not registered consistently in the remote migration history.

create index if not exists idx_professionals_demo
  on public.professionals (establishment_id) where is_demo_data = true;
create index if not exists idx_services_demo
  on public.services (establishment_id) where is_demo_data = true;
create index if not exists idx_service_categories_demo
  on public.service_categories (establishment_id) where is_demo_data = true;
create index if not exists idx_clients_demo
  on public.clients (establishment_id) where is_demo_data = true;
create index if not exists idx_appointments_demo
  on public.appointments (establishment_id) where is_demo_data = true;
create index if not exists idx_employees_demo
  on public.employees (establishment_id) where is_demo_data = true;
create index if not exists idx_products_demo
  on public.products (establishment_id) where is_demo_data = true;
create index if not exists idx_transactions_demo
  on public.transactions (establishment_id) where is_demo_data = true;
create index if not exists idx_comandas_demo
  on public.comandas (establishment_id) where is_demo_data = true;

alter table public.product_images enable row level security;

drop policy if exists product_images_owner on public.product_images;
create policy product_images_owner
on public.product_images
for all
to authenticated
using (
  exists (
    select 1
    from public.products p
    join public.establishments e on e.id = p.establishment_id
    where p.id = product_images.product_id
      and e.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.products p
    join public.establishments e on e.id = p.establishment_id
    where p.id = product_images.product_id
      and e.owner_id = auth.uid()
  )
);

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read
on public.product_images
for select
to anon, authenticated
using (true);

alter table public.comandas add column if not exists client_name text;
alter table public.comanda_items add column if not exists type text default 'service';
alter table public.comanda_items add column if not exists unit_price numeric default 0;
alter table public.comanda_items add column if not exists employee_id uuid;
alter table public.comanda_items add column if not exists description text;

update public.comanda_items
set description = name
where description is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.comanda_items'::regclass
      and conname = 'comanda_items_employee_id_fkey'
  ) then
    alter table public.comanda_items
      add constraint comanda_items_employee_id_fkey
      foreign key (employee_id) references public.profiles(id) on delete set null;
  end if;
end
$$;
