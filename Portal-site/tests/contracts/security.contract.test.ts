import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const portalRoot = resolve(import.meta.dir, '../..');
const workspaceRoot = resolve(portalRoot, '..');
const readPortal = (path: string) => readFileSync(resolve(portalRoot, path), 'utf8');
const readWorkspace = (path: string) => readFileSync(resolve(workspaceRoot, path), 'utf8');

describe('public data contracts', () => {
  test('public storefront uses the whitelisted RPC and does not query owner notification data', () => {
    const page = readPortal('app/p/[slug]/page.tsx');
    expect(page).toContain("rpc('get_public_storefront'");
    expect(page).toContain("rpc('create_public_booking'");
    expect(page).not.toContain("from('profiles')");
    expect(page).not.toContain('get_push_token_for_establishment');
    expect(page).not.toContain('owner_id: string');
  });

  test('public booking clients use the server-side booking function', () => {
    const webRoute = readPortal('app/api/public/booking/route.ts');
    const mobilePage = readWorkspace('mobile/src/app/booking-public.tsx');
    expect(webRoute).toContain("rpc('create_public_booking'");
    expect(mobilePage).toContain("rpc('create_public_booking'");
    expect(webRoute).not.toContain("from('clients').insert");
    expect(mobilePage).not.toContain("from('clients').insert");
  });

  test('legacy anonymous client and appointment policies are explicitly removed', () => {
    const migration = readWorkspace('supabase/migrations/20260718121000_remove_legacy_public_booking_policies.sql');
    expect(migration).toContain('drop policy if exists "clients_public_select"');
    expect(migration).toContain('drop policy if exists "clients_public_insert"');
    expect(migration).toContain('drop policy if exists "appointments_public_insert"');
  });

  test('schedule writes are serialized and reject overlaps', () => {
    const migration = readWorkspace('supabase/migrations/20260719183000_transactional_appointments.sql');
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('appointment_conflict');
    expect(migration).toContain('appointment_blocked');
    expect(migration).toContain('blocked_slot_conflicts_with_appointment');
    expect(migration).toContain('idempotency_key');
    expect(migration).toContain("default 'America/Sao_Paulo'");
  });

  test('comanda settlement and inventory are transactional', () => {
    const migration = readWorkspace('supabase/migrations/20260719190000_transactional_comandas_inventory.sql');
    const webComandas = readPortal('app/dashboard/comandas/page.tsx');
    const mobileHooks = readWorkspace('mobile/src/lib/hooks/use-comandas.ts');
    expect(migration).toContain('guard_comanda_item_and_stock');
    expect(migration).toContain('recalculate_comanda_total');
    expect(migration).toContain('create_comanda_with_items');
    expect(migration).toContain('close_comanda');
    expect(migration).toContain('insufficient_stock');
    expect(webComandas).toContain("rpc('create_comanda_with_items'");
    expect(webComandas).toContain("rpc('close_comanda'");
    expect(mobileHooks).toContain("rpc('close_comanda'");
  });

  test('multi-tenant tables use explicit owner/admin checks and private direct reads', () => {
    const migration = readWorkspace('supabase/migrations/20260720122000_harden_multitenant_rls_and_indexes.sql');
    expect(migration).toContain('alter table public.admin_users enable row level security');
    expect(migration).toContain('alter table public.app_settings enable row level security');
    expect(migration).toContain('with check (public.can_manage_establishment(establishment_id))');
    expect(migration).toContain('drop policy if exists establishments_public_select');
    expect(migration).toContain('drop policy if exists orders_public_read');
    expect(migration).toContain('drop policy if exists order_items_public_read');
    expect(migration).toContain('drop policy if exists product_images_public_read');
    expect(migration).toContain('partner_ads_admin_write');
    expect(migration).toContain('idx_appointments_employee_date_time');
    expect(migration).toContain('drop function if exists public.db002_schema_audit_snapshot');
  });
});

describe('notification authorization', () => {
  test('notification endpoint validates the user and never accepts recipient tokens', () => {
    const route = readPortal('app/api/notify/route.ts');
    expect(route).toContain('supabase.auth.getUser()');
    expect(route).toContain("status: 401");
    expect(route).toContain("status: 403");
    expect(route).not.toContain('pushToken?:');
    expect(route).not.toContain('webPushSubscription?:');
  });

  test('public orders call the internal notification service instead of the HTTP endpoint', () => {
    const route = readPortal('app/api/public/orders/route.ts');
    expect(route).toContain('sendEstablishmentNotification');
    expect(route).not.toContain("fetch(`${process.env.NEXT_PUBLIC_APP_URL");
    expect(route).not.toContain('get_push_token_for_establishment');
  });
});

describe('employee authorization', () => {
  test('employee login uses a server-issued HttpOnly session', () => {
    const login = readPortal('app/employee-login/page.tsx');
    const route = readPortal('app/api/employee/session/route.ts');
    expect(login).toContain("fetch('/api/employee/session'");
    expect(login).not.toContain("rpc('get_user_id_by_email'");
    expect(login).not.toContain("from('employees')");
    expect(login).not.toContain("sessionStorage.setItem('employee_session'");
    expect(route).toContain('httpOnly: true');
    expect(route).toContain('sameSite:');
    expect(route).toContain('MAX_ATTEMPTS');
  });

  test('employee pages do not trust browser storage or query tenant tables directly', () => {
    const layout = readPortal('app/employee-dashboard/layout.tsx');
    const dashboard = readPortal('app/employee-dashboard/page.tsx');
    const clients = readPortal('app/employee-dashboard/clientes/page.tsx');
    for (const source of [layout, dashboard, clients]) {
      expect(source).not.toContain("sessionStorage.getItem('employee_session'");
      expect(source).not.toContain("from('clients')");
      expect(source).not.toContain("from('appointments')");
    }
    expect(dashboard).toContain('/api/employee/dashboard');
    expect(clients).toContain('/api/employee/clients');
  });
});
