import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getBillingAuth } from '@/lib/server/billing/auth';
import { createBillingAdminClient } from '@/lib/server/billing/admin';
import { BILLING_PLANS, isBillingPlanId } from '@/lib/server/billing/catalog';
import { createPreapproval, mercadoPagoPayerEmail } from '@/lib/server/billing/mercado-pago';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { user, establishment } = await getBillingAuth(request);
  if (!user || !establishment) {
    console.info('billing.checkout.rejected', { reason: 'unauthorized' });
    return NextResponse.json({ error: 'Sua sessão expirou. Entre novamente para assinar.' }, { status: 401 });
  }

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
  let payerEmail: string;
  try {
    payerEmail = mercadoPagoPayerEmail(user.email!);
  } catch {
    return NextResponse.json({ error: 'A conta compradora de teste ainda não foi configurada.' }, { status: 503 });
  }

  const { data: existing } = await admin
    .from('billing_subscriptions')
    .select('id, plan_id, status, checkout_url, payer_email')
    .eq('establishment_id', establishment.id)
    .in('status', ['pending', 'authorized', 'paused', 'past_due'])
    .maybeSingle();

  if (existing?.status === 'pending' && existing.payer_email !== payerEmail) {
    await admin.from('billing_subscriptions').update({
      status: 'expired',
      provider_status: 'test_payer_replaced',
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
  } else if (existing?.status === 'pending' && existing.plan_id === plan.id && existing.checkout_url) {
    return NextResponse.json({ checkoutUrl: existing.checkout_url, reused: true });
  } else if (existing) {
    return NextResponse.json({ error: 'Já existe uma assinatura ativa ou em andamento para esta empresa.' }, { status: 409 });
  }

  const { data: subscription, error: insertError } = await admin
    .from('billing_subscriptions')
    .insert({
      establishment_id: establishment.id,
      provider: 'mercado_pago',
      plan_id: plan.id,
      status: 'pending',
      external_reference: externalReference,
      payer_email: payerEmail,
      amount_cents: plan.amountCents,
    })
    .select('id')
    .single();

  if (insertError || !subscription) {
    console.info('billing.checkout.rejected', { reason: 'subscription_conflict', code: insertError?.code });
    return NextResponse.json({ error: 'Já existe uma assinatura em andamento ou não foi possível iniciá-la' }, { status: 409 });
  }

  try {
    const preapproval = await createPreapproval({
      externalReference,
      payerEmail,
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
