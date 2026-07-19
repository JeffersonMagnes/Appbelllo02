import { createServerSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendEstablishmentNotification } from '@/lib/server/notifications';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { establishment_id, customer_name, customer_phone, customer_address, notes, items } = body;

  if (!establishment_id || !customer_name || !customer_phone || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const total = items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0);

  const { data: order, error } = await (supabase as any)
    .from('online_orders')
    .insert({ establishment_id, customer_name, customer_phone, customer_address: customer_address || null, notes: notes || null, total })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await (supabase as any).from('online_order_items').insert(
    items.map((i: any) => ({
      order_id: order.id,
      product_id: i.product_id || null,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }))
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
