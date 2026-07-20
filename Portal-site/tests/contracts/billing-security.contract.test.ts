import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(import.meta.dir, '../..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('billing security contract', () => {
  test('checkout prices and allowed plans are decided on the server', () => {
    const route = source('app/api/billing/checkout/route.ts');
    const catalog = source('lib/server/billing/catalog.ts');
    expect(route).toContain('isBillingPlanId');
    expect(route).toContain('getBillingAuth(request)');
    expect(route).toContain('BILLING_PLANS[planId]');
    expect(route).toContain('existing.checkout_url');
    expect(route).toContain('mercadoPagoPayerEmail(user.email!)');
    expect(route).not.toContain('body.amount');
    expect(catalog).toContain('amountCents: 4900');
    expect(catalog).toContain('amountCents: 9900');
  });

  test('browser return cannot activate an entitlement', () => {
    const checkout = source('app/api/billing/checkout/route.ts');
    const webhook = source('app/api/webhooks/mercado-pago/route.ts');
    expect(checkout).not.toContain('subscription_plan:');
    expect(webhook).toContain('verifyMercadoPagoSignature');
    expect(webhook).toContain("status === 'authorized'");
    expect(webhook).toContain('subscription_plan: subscription.plan_id');
  });

  test('gateway event persistence is idempotent and client writes are revoked', () => {
    const migration = source('../supabase/migrations/20260720170000_create_subscription_billing_domain.sql');
    expect(migration).toContain('unique(provider, provider_event_id)');
    expect(migration).toContain('revoke insert, update, delete');
    expect(migration).toContain('enable row level security');
  });
});
