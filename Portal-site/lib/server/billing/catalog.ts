export const BILLING_PLANS = {
  starter: { id: 'starter', name: 'Starter', amountCents: 4900 },
  pro: { id: 'pro', name: 'Pro', amountCents: 9900 },
} as const;

export type BillingPlanId = keyof typeof BILLING_PLANS;

export function isBillingPlanId(value: unknown): value is BillingPlanId {
  return typeof value === 'string' && value in BILLING_PLANS;
}
