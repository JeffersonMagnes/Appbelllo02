import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { createBillingAdminClient } from '@/lib/server/billing/admin';
import { BILLING_PLANS, isBillingPlanId } from '@/lib/server/billing/catalog';
import { createPreapproval } from '@/lib/server/billing/mercado-pago';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { user, establishment } = await getAuthUser();
  if (!user || !establishment) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const planId = typeof body === 'object' && body !== null && 'planId' in body
    ? (body as { planId?: unknown }).planId
    : undefined;
  if (!isBillingPlanId(planId)) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
  }

  const plan = BILLING_PLANS[planId];
  const externalReference = `appbello:${establishment.id}:${randomUUID()}`;
  const admin = createBillingAdminClient();

  const { data: subscription, error: insertError } = await admin
    .from('billing_subscriptions')
    .insert({
      establishment_id: establishment.id,
      provider: 'mercado_pago',
      plan_id: plan.id,
      status: 'pending',
      external_reference: externalReference,
      payer_email: user.email,
      amount_cents: plan.amountCents,
    })
    .select('id')
    .single();

  if (insertError || !subscription) {
    return NextResponse.json({ error: 'Já existe uma assinatura em andamento ou não foi possível iniciá-la' }, { status: 409 });
  }

  try {
    const preapproval = await createPreapproval({
      externalReference,
      payerEmail: user.email!,
      planName: plan.name,
      amountCents: plan.amountCents,
    });
    if (!preapproval.init_point) throw new Error('Checkout URL missing');

    await admin.from('billing_subscriptions').update({
      provider_subscription_id: preapproval.id,
      provider_status: preapproval.status,
      checkout_url: preapproval.init_point,
      provider_payload: preapproval,
      updated_at: new Date().toISOString(),
    }).eq('id', subscription.id);

    return NextResponse.json({ checkoutUrl: preapproval.init_point });
  } catch (error) {
    await admin.from('billing_subscriptions').update({
      status: 'expired',
      provider_status: 'creation_failed',
      updated_at: new Date().toISOString(),
    }).eq('id', subscription.id);
    console.error('billing.checkout.failed', { subscriptionId: subscription.id, error });
    return NextResponse.json({ error: 'Não foi possível abrir o checkout do Mercado Pago' }, { status: 502 });
  }
}
