import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { sendEstablishmentNotification } from '@/lib/server/notifications';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function allowRequest(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowRequest(user.id)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const [{ data: establishment }, { data: admin }] = await Promise.all([
    supabase.from('establishments').select('id').eq('owner_id', user.id).maybeSingle(),
    supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle(),
  ]);

  let payload: { establishmentId?: string; title?: string; body?: string; data?: Record<string, string>; url?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { establishmentId, title, body, data, url } = payload;
  if (!establishmentId || !title?.trim() || !body?.trim() || title.length > 80 || body.length > 240) {
    return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
  }
  const ownEstablishment = establishment as { id: string } | null;
  if (!admin && ownEstablishment?.id !== establishmentId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const results = await sendEstablishmentNotification({ establishmentId, title: title.trim(), body: body.trim(), data, url });
    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ error: 'Notification delivery failed' }, { status: 502 });
  }
}
