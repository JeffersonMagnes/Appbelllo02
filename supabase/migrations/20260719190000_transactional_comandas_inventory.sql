-- DOM-002: atomic tabs, inventory movements and financial settlement.

alter table public.comandas add column if not exists idempotency_key text;
alter table public.comandas add column if not exists closed_idempotency_key text;
alter table public.comandas add column if not exists discount numeric not null default 0;
alter table public.comandas add column if not exists payment_method text;
alter table public.comandas add column if not exists closed_at timestamptz;
alter table public.comanda_items add column if not exists service_id uuid references public.services(id) on delete set null;
alter table public.comanda_items add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.comanda_items add column if not exists price numeric not null default 0;
alter table public.transactions add column if not exists source_type text;
alter table public.transactions add column if not exists source_id uuid;
alter table public.transactions add column if not exists idempotency_key text;

alter table public.transactions drop constraint if exists transactions_payment_method_check;
alter table public.transactions add constraint transactions_payment_method_check
  check (payment_method in ('cash','credit','debit','pix','transfer','dinheiro','credito','debito','outro','cheque','cortesia')) not valid;

create unique index if not exists comandas_establishment_idempotency_uidx
  on public.comandas (establishment_id, idempotency_key)
  where idempotency_key is not null;
create unique index if not exists transactions_establishment_idempotency_uidx
  on public.transactions (establishment_id, idempotency_key)
  where idempotency_key is not null;

alter table public.products drop constraint if exists products_stock_nonnegative;
alter table public.products add constraint products_stock_nonnegative check (stock >= 0) not valid;
alter table public.transactions drop constraint if exists transactions_amount_positive;
alter table public.transactions add constraint transactions_amount_positive check (amount > 0) not valid;
alter table public.comandas drop constraint if exists comandas_money_valid;
alter table public.comandas add constraint comandas_money_valid
  check (total >= 0 and coalesce(discount, 0) >= 0 and coalesce(discount, 0) <= total) not valid;
alter table public.comanda_items drop constraint if exists comanda_items_values_valid;
alter table public.comanda_items add constraint comanda_items_values_valid
  check (quantity > 0 and coalesce(unit_price, price, 0) >= 0) not valid;

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

drop trigger if exists comanda_items_guard_stock on public.comanda_items;
create trigger comanda_items_guard_stock
before insert or update or delete on public.comanda_items
for each row execute function public.guard_comanda_item_and_stock();

create or replace function public.recalculate_comanda_total()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare target_id uuid := coalesce(new.comanda_id, old.comanda_id);
begin
  update public.comandas c set total = coalesce((
    select round(sum(i.quantity * coalesce(i.unit_price, i.price, 0)), 2)
    from public.comanda_items i where i.comanda_id = target_id
  ), 0) where c.id = target_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists comanda_items_recalculate_total on public.comanda_items;
create trigger comanda_items_recalculate_total
after insert or update or delete on public.comanda_items
for each row execute function public.recalculate_comanda_total();

create or replace function public.prevent_paid_comanda_delete()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if old.status = 'paid' then raise exception 'paid_comanda_is_immutable' using errcode = '55000'; end if;
  return old;
end;
$$;
drop trigger if exists comandas_prevent_paid_delete on public.comandas;
create trigger comandas_prevent_paid_delete before delete on public.comandas
for each row execute function public.prevent_paid_comanda_delete();

create or replace function public.create_comanda_with_items(
  p_establishment_id uuid,
  p_client_id uuid,
  p_client_name text,
  p_items jsonb,
  p_notes text default null,
  p_idempotency_key text default null
)
returns uuid language plpgsql security invoker set search_path = public
as $$
declare
  result_id uuid;
  item jsonb;
  normalized_key text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  item_type text;
  item_product uuid;
  item_service uuid;
  item_quantity integer;
  item_price numeric(12,2);
  item_name text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'comanda_requires_items' using errcode = '22023';
  end if;
  if normalized_key is not null then
    select id into result_id from public.comandas
    where establishment_id = p_establishment_id and idempotency_key = normalized_key;
    if result_id is not null then return result_id; end if;
  end if;

  insert into public.comandas(establishment_id, client_id, client_name, status, total, notes, idempotency_key)
  values (p_establishment_id, p_client_id, nullif(trim(coalesce(p_client_name, '')), ''), 'open', 0,
    nullif(trim(coalesce(p_notes, '')), ''), normalized_key)
  on conflict (establishment_id, idempotency_key) where idempotency_key is not null
  do update set idempotency_key = excluded.idempotency_key
  returning id into result_id;

  if exists (select 1 from public.comanda_items where comanda_id = result_id) then return result_id; end if;
  for item in select value from jsonb_array_elements(p_items) loop
    item_type := coalesce(item->>'type', 'service');
    item_product := nullif(item->>'product_id', '')::uuid;
    item_service := nullif(item->>'service_id', '')::uuid;
    item_quantity := coalesce((item->>'quantity')::integer, 1);
    item_price := round(coalesce((item->>'unit_price')::numeric, 0), 2);
    item_name := nullif(trim(coalesce(item->>'description', item->>'name', '')), '');
    if item_type not in ('service', 'product') or item_quantity <= 0 or item_price < 0 or item_name is null then
      raise exception 'invalid_comanda_item' using errcode = '22023';
    end if;
    insert into public.comanda_items(comanda_id, type, service_id, product_id, name, description,
      quantity, price, unit_price, employee_id)
    values (result_id, item_type, item_service, item_product, item_name, item_name,
      item_quantity, item_price, item_price, nullif(item->>'employee_id', '')::uuid);
  end loop;
  return result_id;
end;
$$;

create or replace function public.close_comanda(
  p_comanda_id uuid,
  p_discount numeric,
  p_payments jsonb,
  p_idempotency_key text
)
returns uuid language plpgsql security invoker set search_path = public
as $$
declare
  target public.comandas%rowtype;
  payment jsonb;
  payment_total numeric(12,2) := 0;
  final_total numeric(12,2);
  payment_amount numeric(12,2);
  payment_method text;
  ordinal integer := 0;
  normalized_key text := nullif(trim(coalesce(p_idempotency_key, '')), '');
begin
  if normalized_key is null or jsonb_typeof(p_payments) <> 'array' or jsonb_array_length(p_payments) = 0 then
    raise exception 'invalid_payment_request' using errcode = '22023';
  end if;
  select * into target from public.comandas where id = p_comanda_id for update;
  if target.id is null then raise exception 'comanda_not_found' using errcode = 'P0002'; end if;
  if target.status = 'paid' and target.closed_idempotency_key = normalized_key then return target.id; end if;
  if target.status <> 'open' then raise exception 'comanda_not_open' using errcode = '55000'; end if;

  final_total := round(target.total - coalesce(p_discount, 0), 2);
  if final_total < 0 then raise exception 'invalid_discount' using errcode = '22023'; end if;
  for payment in select value from jsonb_array_elements(p_payments) loop
    payment_amount := round(coalesce((payment->>'amount')::numeric, 0), 2);
    payment_method := payment->>'method';
    if payment_amount <= 0 or payment_method not in ('cash','credit','debit','pix','transfer','dinheiro','credito','debito','outro','cheque','cortesia') then
      raise exception 'invalid_payment' using errcode = '22023';
    end if;
    payment_total := payment_total + payment_amount;
  end loop;
  if abs(payment_total - final_total) > 0.009 then
    raise exception 'payment_total_mismatch' using errcode = '22023';
  end if;

  for payment in select value from jsonb_array_elements(p_payments) loop
    ordinal := ordinal + 1;
    insert into public.transactions(establishment_id, type, category, description, amount,
      payment_method, date, client_id, status, source_type, source_id, idempotency_key)
    values (target.establishment_id, 'income', 'service',
      'Comanda - ' || coalesce(target.client_name, 'Cliente'),
      round((payment->>'amount')::numeric, 2), payment->>'method',
      (current_timestamp at time zone coalesce((select timezone from public.establishments where id = target.establishment_id), 'America/Sao_Paulo'))::date,
      target.client_id, 'paid', 'comanda', target.id, normalized_key || ':' || ordinal)
    on conflict (establishment_id, idempotency_key) where idempotency_key is not null do nothing;
  end loop;

  update public.comandas set status = 'paid', discount = round(coalesce(p_discount, 0), 2),
    payment_method = case when jsonb_array_length(p_payments) = 1 then p_payments->0->>'method' else 'misto' end,
    closed_at = current_timestamp, closed_idempotency_key = normalized_key
  where id = target.id;
  return target.id;
end;
$$;

revoke all on function public.create_comanda_with_items(uuid, uuid, text, jsonb, text, text) from public;
grant execute on function public.create_comanda_with_items(uuid, uuid, text, jsonb, text, text) to authenticated, service_role;
revoke all on function public.close_comanda(uuid, numeric, jsonb, text) from public;
grant execute on function public.close_comanda(uuid, numeric, jsonb, text) to authenticated, service_role;
