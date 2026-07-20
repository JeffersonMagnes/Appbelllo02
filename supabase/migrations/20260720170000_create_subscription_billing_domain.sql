-- SUB-001 / PAY-001: tenant-scoped subscription state and idempotent gateway events.
-- Billing state is written only by trusted server code using the service role.

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  provider text not null check (provider in ('mercado_pago')),
  plan_id text not null check (plan_id in ('starter', 'pro')),
  status text not null default 'pending' check (
    status in ('pending', 'authorized', 'paused', 'past_due', 'cancelled', 'expired')
  ),
  external_reference text not null unique,
  provider_subscription_id text unique,
  payer_email text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  checkout_url text,
  current_period_end timestamptz,
  provider_status text,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_subscriptions_one_live_per_establishment
  on public.billing_subscriptions(establishment_id)
  where status in ('pending', 'authorized', 'paused', 'past_due');

create index if not exists billing_subscriptions_establishment_idx
  on public.billing_subscriptions(establishment_id, created_at desc);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('mercado_pago')),
  provider_event_id text not null,
  event_type text not null,
  resource_id text,
  signature_valid boolean not null default false,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider, provider_event_id)
);

alter table public.billing_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

drop policy if exists billing_subscriptions_owner_read on public.billing_subscriptions;
create policy billing_subscriptions_owner_read
on public.billing_subscriptions for select
to authenticated
using (
  exists (
    select 1 from public.establishments e
    where e.id = billing_subscriptions.establishment_id
      and e.owner_id = auth.uid()
  )
);

-- No client policy is created for INSERT/UPDATE/DELETE or webhook events.
-- The service role bypasses RLS and is the sole billing writer.

revoke all on public.billing_webhook_events from anon, authenticated;
revoke insert, update, delete on public.billing_subscriptions from anon, authenticated;
grant select on public.billing_subscriptions to authenticated;

