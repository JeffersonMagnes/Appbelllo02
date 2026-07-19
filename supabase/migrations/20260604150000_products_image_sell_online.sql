alter table public.products
  add column if not exists image_url text,
  add column if not exists sell_online boolean default false;
