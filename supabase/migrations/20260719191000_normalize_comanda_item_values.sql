-- Follow-up for the legacy comanda_items shape found in production.
create or replace function public.guard_comanda_item_and_stock()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare
  comanda_establishment uuid;
  comanda_status text;
  product_establishment uuid;
  available_stock integer;
  old_quantity integer := case when tg_op in ('UPDATE', 'DELETE') and old.product_id is not null then old.quantity else 0 end;
  new_quantity integer := case when tg_op in ('INSERT', 'UPDATE') and new.product_id is not null then new.quantity else 0 end;
begin
  select c.establishment_id, c.status into comanda_establishment, comanda_status
  from public.comandas c where c.id = coalesce(new.comanda_id, old.comanda_id) for update;
  if comanda_establishment is null then raise exception 'comanda_not_found' using errcode = 'P0002'; end if;
  if comanda_status <> 'open' then raise exception 'comanda_not_open' using errcode = '55000'; end if;

  if tg_op in ('INSERT', 'UPDATE') then
    new.quantity := coalesce(new.quantity, 1);
    new.unit_price := round(coalesce(new.unit_price, new.price, 0), 2);
    new.price := new.unit_price;
    new.total := round(new.quantity * new.unit_price, 2);
    new.item_id := coalesce(new.product_id, new.service_id, new.item_id);
  end if;

  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    if old.product_id is not null then
      update public.products set stock = stock + old.quantity where id = old.product_id;
    end if;
    old_quantity := 0;
  end if;
  if tg_op in ('UPDATE', 'DELETE') and old.product_id is not null and
     (tg_op = 'DELETE' or old.product_id = new.product_id) then
    update public.products set stock = stock + old_quantity where id = old.product_id;
    old_quantity := 0;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.product_id is not null then
    select p.establishment_id, p.stock into product_establishment, available_stock
    from public.products p where p.id = new.product_id for update;
    if product_establishment is distinct from comanda_establishment then
      raise exception 'product_wrong_establishment' using errcode = '42501';
    end if;
    if available_stock < new_quantity then
      raise exception 'insufficient_stock' using errcode = '23514';
    end if;
    update public.products set stock = stock - new_quantity where id = new.product_id;
  end if;
  return coalesce(new, old);
end;
$$;
