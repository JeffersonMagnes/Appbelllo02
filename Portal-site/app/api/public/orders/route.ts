import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendEstablishmentNotification } from '@/lib/server/notifications';

// Service-role client: an anonymous storefront visitor has no session to read
// `products` under RLS, and — more importantly — price/name must come from
// the database, never from the client's request body.
function ordersAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Orders database credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const establishment_id = typeof body?.establishment_id === 'string' ? body.establishment_id : null;
  const customer_name = typeof body?.customer_name === 'string' ? body.customer_name.trim() : '';
  const customer_phone = typeof body?.customer_phone === 'string' ? body.customer_phone.trim() : '';
  const customer_address = typeof body?.customer_address === 'string' ? body.customer_address : null;
  const notes = typeof body?.notes === 'string' ? body.notes : null;
  const rawItems: unknown[] = Array.isArray(body?.items) ? body.items : [];

  if (!establishment_id || !customer_name || !customer_phone || rawItems.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const requested = rawItems
    .map((i: any) => ({
      product_id: typeof i?.product_id === 'string' ? i.product_id : null,
      quantity: Number.isFinite(i?.quantity) ? Math.trunc(i.quantity) : NaN,
    }))
    .filter(i => i.product_id && Number.isInteger(i.quantity) && i.quantity > 0);

  if (requested.length === 0 || requested.length !== rawItems.length) {
    return NextResponse.json({ error: 'Itens do pedido inválidos' }, { status: 400 });
  }

  const admin = ordersAdminClient();

  const { data: establishment } = await admin
    .from('establishments')
    .select('id, active')
    .eq('id', establishment_id)
    .maybeSingle();
  if (!establishment || !establishment.active) {
    return NextResponse.json({ error: 'Estabelecimento indisponível' }, { status: 404 });
  }

  const productIds = Array.from(new Set(requested.map(i => i.product_id as string)));
  const { data: products } = await admin
    .from('products')
    .select('id, name, price, stock')
    .eq('establishment_id', establishment_id)
    .eq('active', true)
    .eq('sell_online', true)
    .in('id', productIds);
  const productById = new Map((products ?? []).map((p: any) => [p.id, p]));

  const orderItems: { product_id: string; product_name: string; quantity: number; unit_price: number }[] = [];
  for (const item of requested) {
    const product = productById.get(item.product_id as string);
    if (!product) {
      return NextResponse.json({ error: 'Um ou mais produtos não estão mais disponíveis' }, { status: 409 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `Estoque insuficiente para "${product.name}"` }, { status: 409 });
    }
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: product.price,
    });
  }
  // Price and name always come from the row just read above — never from the client.
  const total = orderItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const { data: order, error } = await admin
    .from('online_orders')
    .insert({ establishment_id, customer_name, customer_phone, customer_address: customer_address || null, notes: notes || null, total })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('online_order_items').insert(
    orderItems.map(i => ({ order_id: order.id, ...i }))
  );

  // Push notification para o estabelecimento
  try {
    await sendEstablishmentNotification({
      establishmentId: establishment_id,
      title: '🛍️ Novo Pedido!',
      body: `${customer_name} fez um pedido de R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      data: { type: 'new_order', establishmentId: establishment_id },
      url: '/dashboard/pedidos',
    });
  } catch { /* best-effort */ }

  return NextResponse.json({ id: order.id, status: 'pendente', total }, { status: 201 });
}
