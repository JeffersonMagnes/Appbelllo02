create table public.product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  image_url text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.product_images enable row level security;

create policy "product_images_owner" on public.product_images
  for all using (
    product_id in (
      select id from public.products where establishment_id in (
        select id from public.establishments where owner_id = auth.uid()
      )
    )
  );

create policy "product_images_public_read" on public.product_images
  for select to public using (true);
