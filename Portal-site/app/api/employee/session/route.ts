import { NextRequest, NextResponse } from 'next/server';
import {
  createEmployeeSession,
  EMPLOYEE_COOKIE,
  employeeAdminClient,
  readEmployeeSession,
} from '@/lib/server/employee-session';

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function requestKey(request: NextRequest) {
  return request.headers.get('x-nf-client-connection-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}

function allowed(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_ATTEMPTS) return false;
  current.count += 1;
  return true;
}

const publicSession = (session: NonNullable<Awaited<ReturnType<typeof readEmployeeSession>>>) => ({
  employeeId: session.employeeId,
  employeeName: session.employeeName,
  establishmentId: session.establishmentId,
  establishmentName: session.establishmentName,
  role: session.role,
  permissions: session.permissions,
  avatarUrl: session.avatarUrl,
});

export async function GET() {
  const session = await readEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(publicSession(session));
}

export async function POST(request: NextRequest) {
  const key = requestKey(request);
  if (!allowed(key)) return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });

  let body: { ownerEmail?: string; pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 400 });
  }

  const ownerEmail = body.ownerEmail?.trim().toLowerCase();
  const pin = body.pin?.trim();
  if (!ownerEmail || !/^\d{4,6}$/.test(pin ?? '')) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 400 });
  }

  try {
    const supabase = employeeAdminClient();
    let ownerId: string | undefined;
    for (let page = 1; page <= 10 && !ownerId; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      ownerId = data.users.find(user => user.email?.toLowerCase() === ownerEmail)?.id;
      if (data.users.length < 200) break;
    }
    if (!ownerId) return NextResponse.json({ error: 'E-mail ou PIN inválido.' }, { status: 401 });

    const { data: establishment } = await supabase
      .from('establishments')
      .select('id, name')
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (!establishment) return NextResponse.json({ error: 'E-mail ou PIN inválido.' }, { status: 401 });

    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, role, permissions, avatar_url')
      .eq('establishment_id', establishment.id)
      .eq('pin', pin)
      .eq('active', true)
      .maybeSingle();
    if (!employee) return NextResponse.json({ error: 'E-mail ou PIN inválido.' }, { status: 401 });

    const session = {
      employeeId: employee.id,
      employeeName: employee.name,
      establishmentId: establishment.id,
      establishmentName: establishment.name,
      role: employee.role || 'employee',
      permissions: (employee.permissions as Record<string, boolean> | null) || {},
      avatarUrl: employee.avatar_url || undefined,
    };
    const token = await createEmployeeSession(session);
    const response = NextResponse.json(session);
    response.cookies.set(EMPLOYEE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60,
    });
    attempts.delete(key);
    return response;
  } catch {
    return NextResponse.json({ error: 'Não foi possível autenticar.' }, { status: 503 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(EMPLOYEE_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0, sameSite: 'lax' });
  return response;
}
