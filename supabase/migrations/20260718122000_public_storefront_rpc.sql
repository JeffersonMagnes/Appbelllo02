-- Public storefront data is exposed through one explicit, read-only contract.
-- Internal establishment, subscription, owner and employee fields stay private.

create or replace function public.get_public_storefront(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'establishment', jsonb_build_object(
      'id', e.id,
      'name', e.name,
      'logo_url', e.logo_url,
      'address', e.address,
      'phone', e.phone,
      'whatsapp', e.whatsapp,
      'business_type', e.business_type,
      'primary_color', e.primary_color,
      'secondary_color', e.secondary_color,
      'instagram', e.instagram,
      'hours_json', e.hours_json,
      'bio', e.bio,
      'banner_url', e.banner_url,
      'custom_links', e.custom_links
    ),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'price', s.price,
        'duration', s.duration,
        'category', s.category
      ) order by s.name)
      from public.services s
      where s.establishment_id = e.id and s.active = true
    ), '[]'::jsonb),
    'professionals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', emp.id,
        'name', emp.name,
        'specialty', emp.specialty,
        'avatar', emp.avatar_url
      ) order by emp.name)
      from public.employees emp
      where emp.establishment_id = e.id and emp.active = true
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'price', p.price,
        'category', p.category,
        'image_url', p.image_url,
        'stock', p.stock,
        'images', coalesce((
          select jsonb_agg(jsonb_build_object('id', pi.id, 'image_url', pi.image_url) order by pi.sort_order)
          from public.product_images pi
          where pi.product_id = p.id
        ), '[]'::jsonb)
      ) order by p.name)
      from public.products p
      where p.establishment_id = e.id
        and p.active = true
        and p.sell_online = true
        and p.stock > 0
    ), '[]'::jsonb)
  )
  from public.establishments e
  where e.slug = nullif(trim(p_slug), '')
    and e.active = true
  limit 1;
$$;

revoke all on function public.get_public_storefront(text) from public;
grant execute on function public.get_public_storefront(text) to anon, authenticated, service_role;

