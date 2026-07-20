-- DB-002: explicit tenant authorization, protected admin tables and FK indexes.

create or replace function public.can_manage_establishment(p_establishment_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.establishments e
    where e.id = p_establishment_id and e.owner_id = auth.uid()
  ) or public.is_app_admin();
$$;
revoke all on function public.can_manage_establishment(uuid) from public, anon;
grant execute on function public.can_manage_establishment(uuid) to authenticated, service_role;

alter table public.admin_users enable row level security;
drop policy if exists allow_read_admin_users on public.admin_users;
drop policy if exists admin_users_self_read on public.admin_users;
create policy admin_users_self_read on public.admin_users for select to authenticated
using (user_id = auth.uid());

alter table public.app_settings enable row level security;
drop policy if exists app_settings_admin on public.app_settings;
create policy app_settings_admin on public.app_settings for all to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists establishments_public_select on public.establishments;
drop policy if exists establishments_all on public.establishments;
create policy establishments_owner_admin on public.establishments for all to authenticated
using (owner_id = auth.uid() or public.is_app_admin())
with check (owner_id = auth.uid() or public.is_app_admin());

drop policy if exists professionals_public_select on public.professionals;
drop policy if exists professionals_all on public.professionals;
create policy professionals_owner_admin on public.professionals for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists service_categories_all on public.service_categories;
create policy service_categories_owner_admin on public.service_categories for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists owner_services on public.services;
create policy services_owner_admin on public.services for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists appointments_all on public.appointments;
create policy appointments_owner_admin on public.appointments for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists clients_all on public.clients;
create policy clients_owner_admin on public.clients for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists employees_all on public.employees;
create policy employees_owner_admin on public.employees for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists products_all on public.products;
create policy products_owner_admin on public.products for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists transactions_all on public.transactions;
create policy transactions_owner_admin on public.transactions for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists owner_blocked_slots on public.blocked_slots;
create policy blocked_slots_owner_admin on public.blocked_slots for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists owner_service_packages on public.service_packages;
create policy service_packages_owner_admin on public.service_packages for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists working_hours_all on public.working_hours;
create policy working_hours_owner_admin on public.working_hours for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists anamnesis_all on public.client_anamnesis;
create policy client_anamnesis_owner_admin on public.client_anamnesis for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists owner_anamnesis_templates on public.anamnesis_templates;
create policy anamnesis_templates_owner_admin on public.anamnesis_templates for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists owner_anamnesis_submissions on public.anamnesis_submissions;
create policy anamnesis_submissions_owner_admin on public.anamnesis_submissions for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));
drop policy if exists public_insert_anamnesis_submissions on public.anamnesis_submissions;
create policy public_insert_anamnesis_submissions on public.anamnesis_submissions for insert to anon, authenticated
with check (
  jsonb_typeof(data::jsonb) = 'object'
  and exists (
    select 1 from public.anamnesis_templates t
    where t.id = template_id and t.establishment_id = establishment_id and t.active = true
  )
);

drop policy if exists owner_offers on public.offers;
create policy offers_owner_admin on public.offers for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists owner_comandas on public.comandas;
create policy comandas_owner_admin on public.comandas for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists owner_comanda_items on public.comanda_items;
create policy comanda_items_owner_admin on public.comanda_items for all to authenticated
using (exists (select 1 from public.comandas c where c.id = comanda_id and public.can_manage_establishment(c.establishment_id)))
with check (exists (select 1 from public.comandas c where c.id = comanda_id and public.can_manage_establishment(c.establishment_id)));

drop policy if exists professional_services_all on public.professional_services;
create policy professional_services_owner_admin on public.professional_services for all to authenticated
using (exists (select 1 from public.professionals p where p.id = professional_id and public.can_manage_establishment(p.establishment_id)))
with check (
  exists (select 1 from public.professionals p where p.id = professional_id and public.can_manage_establishment(p.establishment_id))
  and exists (select 1 from public.services s join public.professionals p on p.id = professional_id
    where s.id = service_id and s.establishment_id = p.establishment_id)
);

drop policy if exists product_images_public_read on public.product_images;
drop policy if exists product_images_owner on public.product_images;
create policy product_images_owner_admin on public.product_images for all to authenticated
using (exists (select 1 from public.products p where p.id = product_id and public.can_manage_establishment(p.establishment_id)))
with check (exists (select 1 from public.products p where p.id = product_id and public.can_manage_establishment(p.establishment_id)));

drop policy if exists orders_public_read on public.online_orders;
drop policy if exists orders_owner on public.online_orders;
create policy online_orders_owner_admin on public.online_orders for all to authenticated
using (public.can_manage_establishment(establishment_id))
with check (public.can_manage_establishment(establishment_id));

drop policy if exists order_items_public_read on public.online_order_items;
drop policy if exists order_items_owner on public.online_order_items;
create policy online_order_items_owner_admin on public.online_order_items for all to authenticated
using (exists (select 1 from public.online_orders o where o.id = order_id and public.can_manage_establishment(o.establishment_id)))
with check (exists (select 1 from public.online_orders o where o.id = order_id and public.can_manage_establishment(o.establishment_id)));

drop policy if exists partner_ads_write on public.partner_ads;
create policy partner_ads_admin_write on public.partner_ads for all to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists plans_admin_all on public.plans;
create policy plans_admin_all on public.plans for all to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

-- Tenant filters, joins and foreign-key cascades need non-partial indexes.
create index if not exists idx_establishments_owner_id on public.establishments(owner_id);
create index if not exists idx_professionals_establishment_id on public.professionals(establishment_id);
create index if not exists idx_service_categories_establishment_id on public.service_categories(establishment_id);
create index if not exists idx_services_establishment_id on public.services(establishment_id);
create index if not exists idx_clients_establishment_id on public.clients(establishment_id);
create index if not exists idx_appointments_establishment_date on public.appointments(establishment_id, date);
create index if not exists idx_appointments_employee_date_time on public.appointments(employee_id, date, time);
create index if not exists idx_employees_establishment_id on public.employees(establishment_id);
create index if not exists idx_products_establishment_id on public.products(establishment_id);
create index if not exists idx_transactions_establishment_date on public.transactions(establishment_id, date);
create index if not exists idx_blocked_slots_establishment_date on public.blocked_slots(establishment_id, date);
create index if not exists idx_anamnesis_templates_establishment_id on public.anamnesis_templates(establishment_id);
create index if not exists idx_anamnesis_submissions_establishment_id on public.anamnesis_submissions(establishment_id);
create index if not exists idx_anamnesis_submissions_template_id on public.anamnesis_submissions(template_id);
create index if not exists idx_service_packages_establishment_id on public.service_packages(establishment_id);
create index if not exists idx_offers_establishment_id on public.offers(establishment_id);
create index if not exists idx_comandas_establishment_id on public.comandas(establishment_id);
create index if not exists idx_comanda_items_comanda_id on public.comanda_items(comanda_id);
create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_online_orders_establishment_id on public.online_orders(establishment_id);
create index if not exists idx_online_order_items_order_id on public.online_order_items(order_id);
create index if not exists idx_online_order_items_product_id on public.online_order_items(product_id);
create index if not exists idx_professional_services_service_id on public.professional_services(service_id);

drop function if exists public.db002_schema_audit_snapshot();
