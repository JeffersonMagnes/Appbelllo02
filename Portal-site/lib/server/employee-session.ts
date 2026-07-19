import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const EMPLOYEE_COOKIE = 'appbello_employee_session';
const SESSION_SECONDS = 8 * 60 * 60;

export type EmployeeSession = {
  employeeId: string;
  employeeName: string;
  establishmentId: string;
  establishmentName: string;
  role: string;
  permissions: Record<string, boolean>;
  avatarUrl?: string;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.EMPLOYEE_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('EMPLOYEE_SESSION_SECRET deve possuir pelo menos 32 caracteres');
  }
  return secret;
}

function encode(value: string | Uint8Array) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return Buffer.from(bytes).toString('base64url');
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return encode(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))));
}

export async function createEmployeeSession(value: Omit<EmployeeSession, 'expiresAt'>) {
  const session: EmployeeSession = { ...value, expiresAt: Date.now() + SESSION_SECONDS * 1000 };
  const payload = encode(JSON.stringify(session));
  return `${payload}.${await signature(payload)}`;
}

export async function readEmployeeSession(): Promise<EmployeeSession | null> {
  const token = cookies().get(EMPLOYEE_COOKIE)?.value;
  if (!token) return null;
  const [payload, suppliedSignature, extra] = token.split('.');
  if (!payload || !suppliedSignature || extra) return null;
  if (suppliedSignature !== await signature(payload)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as EmployeeSession;
    if (!session.employeeId || !session.establishmentId || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function employeeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server-side não configurado');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

