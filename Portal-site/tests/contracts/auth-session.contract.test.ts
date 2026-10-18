import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readPortal = (path: string) => readFileSync(resolve(import.meta.dir, '../..', path), 'utf8');

// ── getAuthUser(): web cookie + native Bearer ────────────────────────────────
let authorization: string | null = null;
const calls: string[] = [];
const validTokens = new Set(['valid-owner-token']);

const makeClient = (label: string, resolveUser: (token?: string) => { id: string } | null) => ({
  auth: {
    getUser: async (token?: string) => {
      calls.push(`${label}.getUser(${token ?? ''})`);
      const user = resolveUser(token);
      return { data: { user }, error: user ? null : new Error('invalid') };
    },
  },
  from: (table: string) => ({
    select: () => ({ eq: (_c: string, v: string) => ({ maybeSingle: async () => ({ data: { id: `est-of-${v}`, name: table, slug: 's' } }) }) }),
  }),
});

mock.module('next/headers', () => ({
  headers: () => ({ get: (n: string) => (n.toLowerCase() === 'authorization' ? authorization : null) }),
  cookies: () => ({ get: () => undefined, toString: () => '' }),
}));
mock.module('@supabase/supabase-js', () => ({
  createClient: (_u: string, _k: string, opts: any) => {
    calls.push(`createClient(auth=${opts?.global?.headers?.Authorization ?? 'none'})`);
    return makeClient('bearer', (t) => (t && validTokens.has(t) ? { id: 'owner-1' } : null));
  },
}));
mock.module('@/lib/supabase/server', () => ({
  createServerSupabase: () => { calls.push('cookieClient'); return makeClient('cookie', () => ({ id: 'owner-web' })); },
}));
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
const getAuthUser = async () => (await import('@/lib/api-auth')).getAuthUser();

beforeEach(() => { calls.length = 0; authorization = null; });

describe('getAuthUser', () => {
  test('web: without Authorization it uses the cookie-aware server client', async () => {
    const r = await getAuthUser();
    expect(r.user?.id).toBe('owner-web');
    expect(r.establishment?.id).toBe('est-of-owner-web');
    expect(calls).toContain('cookieClient');
  });

  test('mobile owner: a valid Bearer authenticates and the cookie client is never used', async () => {
    authorization = 'Bearer valid-owner-token';
    const r = await getAuthUser();
    expect(r.user?.id).toBe('owner-1');
    expect(r.establishment?.id).toBe('est-of-owner-1');
    expect(calls).toContain('createClient(auth=Bearer valid-owner-token)');
    expect(calls).not.toContain('cookieClient');
  });

  test('an invalid Bearer is rejected and never falls back to a cookie session', async () => {
    authorization = 'Bearer nope';
    const r = await getAuthUser();
    expect(r.user).toBeNull();
    expect(r.establishment).toBeNull();
    expect(calls).not.toContain('cookieClient');
  });

  test('an employee session token (not a Supabase JWT) is not accepted as an owner credential', async () => {
    authorization = 'Bearer eyJleG8iOjF9.signature';
    const r = await getAuthUser();
    expect(r.user).toBeNull();
    expect(calls).not.toContain('cookieClient');
  });
});

describe('source contracts', () => {
  test('getAdminUser and getAuthUser no longer rely on a header-only supabase-js cookie client', () => {
    const src = readPortal('lib/api-auth.ts');
    expect(src).not.toContain('cookie: cookieStore.toString()');
    expect(src).not.toContain('persistSession: false,\n      },\n      global: {\n        headers: {\n          cookie');
    expect(src).toContain('createServerSupabase()');
    expect(src).toContain('auth.getUser()');
    expect(src).not.toContain('getSession()');
  });

  test('employee routes keep their own credential and are untouched by getAuthUser', () => {
    const route = readPortal('app/api/employee/clients/route.ts');
    expect(route).toMatch(/read(Active)?EmployeeSession/);
    expect(route).not.toContain('getAuthUser');
  });
});
