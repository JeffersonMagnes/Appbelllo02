import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repository = join(import.meta.dir, '../../..');
const source = (path: string) => readFileSync(join(repository, path), 'utf8');
const catalog = JSON.parse(source('contracts/v1/commercial-catalog.json')) as {
  version: string;
  trialDays: number;
  couponsEnabled: boolean;
  onlineCheckoutEnabled: boolean;
  plans: Array<{ id: string; priceMonthlyCents: number }>;
};

describe('official commercial catalog', () => {
  test('is versioned and enables only the test checkout', () => {
    expect(catalog.version).toBe('2026-07-20.2');
    expect(catalog.trialDays).toBe(30);
    expect(catalog.couponsEnabled).toBe(false);
    expect(catalog.onlineCheckoutEnabled).toBe(true);
  });

  test('contains only the approved Starter and Pro prices', () => {
    expect(catalog.plans).toEqual([
      expect.objectContaining({ id: 'starter', priceMonthlyCents: 4900 }),
      expect.objectContaining({ id: 'pro', priceMonthlyCents: 9900 }),
    ]);
    expect(catalog.plans.some((plan) => plan.id === 'premium')).toBe(false);
  });

  test('Web and Mobile no longer publish the conflicting catalog', () => {
    const mobile = source('mobile/src/lib/state/subscription-store.ts');
    const web = source('Portal-site/components/landing/Pricing.tsx');
    for (const obsolete of ['R$ 79', 'R$ 149', 'R$ 249', "id: 'premium'", "name: 'Empresarial'"]) {
      expect(`${mobile}\n${web}`).not.toContain(obsolete);
    }
    for (const approved of ['R$ 49', 'R$ 99']) {
      expect(mobile).toContain(approved);
      expect(web).toContain(approved);
    }
  });

  test('notification fallbacks use the official trial duration', () => {
    expect(source('Portal-site/app/api/admin/notifications/auto/route.ts')).not.toContain('trialDays ?? 14');
    expect(source('Portal-site/netlify/functions/notifications-auto.ts')).not.toContain('trialDays ?? 14');
    expect(source('Portal-site/components/dashboard/NotificationBanners.tsx')).not.toContain('trialDays ?? 14');
  });

  test('unapproved referral discounts are not offered', () => {
    expect(source('Portal-site/app/dashboard/assinatura/page.tsx')).toContain('REFERRALS_ENABLED = false');
    expect(source('mobile/src/app/paywall.tsx')).toContain('REFERRALS_ENABLED = false');
  });
});
