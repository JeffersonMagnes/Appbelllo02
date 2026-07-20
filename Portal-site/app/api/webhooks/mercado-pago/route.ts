import { NextRequest, NextResponse } from 'next/server';
import { createBillingAdminClient } from '@/lib/server/billing/admin';
import { getPreapproval } from '@/lib/server/billing/mercado-pago';
import { verifyMercadoPagoSignature } from '@/lib/server/billing/webhook-signature';

export const dynamic = 'force-dynamic';

const STATUS_MAP: Record<string, string> = {
  pending: 'pending',
  authorized: 'authorized',
  paused: 'paused',
  cancelled: 'cancelled',
};

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const payload = await request.json().catch(() => ({}));
  const dataId = url.searchParams.get('data.id') ?? payload?.data?.id?.toString() ?? null;
  const requestId = request.headers.get('x-request-id');
  const signatureValid = verifyMercadoPagoSignature({
    xSignature: request.headers.get('x-signature'),
    xRequestId: requestId,
    dataId,
  });
  if (!signatureValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  const eventType = url.searchParams.get('type') ?? payload?.type ?? 'unknown';
  if (!dataId || eventType !== 'subscription_preapproval') {
    return NextResponse.json({ received: true, ignored: true });
  }

  const admin = createBillingAdminClient();
  const eventId = `${requestId}:${payload?.id ?? dataId}`;
  const { error: eventError } = await admin.from('billing_webhook_events').insert({
    provider: 'mercado_pago',
    provider_event_id: eventId,
    event_type: eventType,
    resource_id: dataId,
    signature_valid: true,
    payload,
  });
  if (eventError?.code === '23505') return NextResponse.json({ received: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: 'Event persistence failed' }, { status: 500 });

  try {
    const preapproval = await getPreapproval(dataId);
    const externalReference = preapproval.external_reference;
    if (!externalReference?.startsWith('appbello:')) throw new Error('Unknown external reference');

    const status = STATUS_MAP[preapproval.status] ?? 'pending';
    const { data: subscription, error } = await admin
      .from('billing_subscriptions')
      .update({
        status,
        provider_status: preapproval.status,
        provider_subscription_id: preapproval.id,
        current_period_end: preapproval.next_payment_date ?? null,
        provider_payload: preapproval,
        updated_at: new Date().toISOString(),
      })
      .eq('external_reference', externalReference)
      .select('establishment_id, plan_id')
      .single();
    if (error || !subscription) throw error ?? new Error('Subscription not found');

    // Only a verified provider response can change the legacy entitlement field.
    if (status === 'authorized') {
      const { error: entitlementError } = await admin
        .from('establishments')
        .update({ subscription_plan: subscription.plan_id })
        .eq('id', subscription.establishment_id);
      if (entitlementError) throw entitlementError;
    }

    await admin.from('billing_webhook_events').update({
      status: 'processed',
      processed_at: new Date().toISOString(),
    }).eq('provider_event_id', eventId).eq('provider', 'mercado_pago');
    return NextResponse.json({ received: true });
  } catch (error) {
    await admin.from('billing_webhook_events').update({
      status: 'failed',
      error_message: error instanceof Error ? error.message.slice(0, 500) : 'Unknown error',
      processed_at: new Date().toISOString(),
    }).eq('provider_event_id', eventId).eq('provider', 'mercado_pago');
    console.error('billing.webhook.failed', { eventId, dataId, error });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
