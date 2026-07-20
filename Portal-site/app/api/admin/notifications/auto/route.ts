import { createClient } from '@supabase/supabase-js';
import { createSign } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// ─── Supabase admin (service role bypasses RLS) ────────────────────────────
function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
  return createClient(url, key);
}

// ─── FCM helpers ──────────────────────────────────────────────────────────
function createJWT(sa: { client_email: string; private_key: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');
  const data = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(data);
  return `${data}.${sign.sign(sa.private_key, 'base64url')}`;
}

async function getFcmToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createJWT(sa),
    }),
  });
  const d = await res.json() as { access_token?: string };
  if (!d.access_token) throw new Error('FCM token inválido');
  return d.access_token;
}

async function sendPush(
  sa: { client_email: string; private_key: string; project_id: string },
  accessToken: string,
  pushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, string>,
  webSub?: { endpoint: string; keys: { p256dh: string; auth: string } } | null,
) {
  if (pushToken) {
    await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: pushToken,
            notification: { title, body },
            android: { priority: 'high', notification: { channel_id: 'agendamentos', sound: 'default' } },
            data: data ?? {},
          },
        }),
      },
    );
  }
  if (webSub?.endpoint) {
    try {
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:contato@appbello.com';
      if (vapidPrivate && vapidPublic) {
        const webpush = (await import('web-push')).default ?? (await import('web-push'));
        webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
        await webpush.sendNotification(
          { endpoint: webSub.endpoint, keys: { p256dh: webSub.keys.p256dh, auth: webSub.keys.auth } },
          JSON.stringify({ title, body, url: '/dashboard/agenda', tag: 'appbello' }),
          { TTL: 86400 },
        );
      }
    } catch { /* best-effort */ }
  }
}

// ─── Main handler ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Protege o endpoint: só Vercel Cron ou chamadas com CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    const supabase = adminSupabase();

    // Carrega configurações de notificações
    const { data: settingsRows } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['notifications', 'geral']);

    const notifSettings = (settingsRows?.find(r => r.key === 'notifications')?.value ?? {}) as Record<string, boolean>;
    const geralSettings = (settingsRows?.find(r => r.key === 'geral')?.value ?? { trialDays: 30 }) as { trialDays?: number };
    const trialDays = geralSettings.trialDays ?? 30;

    // Carrega service account FCM
    const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!saRaw) {
      return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT não configurada' }, { status: 500 });
    }
    const sa = JSON.parse(saRaw) as { client_email: string; private_key: string; project_id: string };
    const accessToken = await getFcmToken(sa);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Busca todos os estabelecimentos ativos com push_token do dono
    const { data: establishments } = await supabase
      .from('establishments')
      .select('id, name, owner_id, subscription_plan, trial_started_at, active')
      .eq('active', true);

    if (!establishments?.length) {
      return NextResponse.json({ ok: true, results: ['Nenhum estabelecimento ativo'] });
    }

    const ownerIds = establishments.map(e => e.owner_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, push_token, web_push_subscription')
      .in('id', ownerIds);

    const tokenMap = new Map<string, string>();
    const webSubMap = new Map<string, any>();
    for (const p of profiles ?? []) {
      if (p.push_token) tokenMap.set(p.id, p.push_token);
      if ((p as any).web_push_subscription) webSubMap.set(p.id, (p as any).web_push_subscription);
    }

    for (const est of establishments) {
      const pushToken = tokenMap.get(est.owner_id);
      const webSub = webSubMap.get(est.owner_id);
      if (!pushToken && !webSub) continue;

      const plan = est.subscription_plan ?? 'trial';

      // ── Trial expirando em 3 dias ──────────────────────────────────────
      if (notifSettings.trialReminder3 && plan === 'trial' && est.trial_started_at) {
        const trialStart = new Date(est.trial_started_at);
        const trialEnd = new Date(trialStart.getTime() + trialDays * 86400000);
        trialEnd.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((trialEnd.getTime() - today.getTime()) / 86400000);
        if (daysLeft === 3) {
          await sendPush(sa, accessToken, pushToken,
            '⏳ Seu trial expira em 3 dias',
            'Assine agora para continuar usando o AppBello sem interrupção.',
            { type: 'trial_expiring', days: '3' },
            webSub,
          );
          results.push(`trial3 → ${est.name}`);
        }
      }

      // ── Trial expirando amanhã ─────────────────────────────────────────
      if (notifSettings.trialReminder1 && plan === 'trial' && est.trial_started_at) {
        const trialStart = new Date(est.trial_started_at);
        const trialEnd = new Date(trialStart.getTime() + trialDays * 86400000);
        trialEnd.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((trialEnd.getTime() - today.getTime()) / 86400000);
        if (daysLeft === 1) {
          await sendPush(sa, accessToken, pushToken,
            '🚨 Último dia do seu trial!',
            'Seu período gratuito termina amanhã. Assine agora e não perca seus dados.',
            { type: 'trial_expiring', days: '1' },
            webSub,
          );
          results.push(`trial1 → ${est.name}`);
        }
      }

      // ── Falha no pagamento ─────────────────────────────────────────────
      if (notifSettings.paymentFailed && plan === 'payment_failed') {
        await sendPush(sa, accessToken, pushToken,
          '💳 Falha no pagamento',
          'Não conseguimos processar sua cobrança. Atualize seu método de pagamento.',
          { type: 'payment_failed' },
          webSub,
        );
        results.push(`payment_failed → ${est.name}`);
      }

      // ── Relatório semanal (toda segunda-feira) ─────────────────────────
      if (notifSettings.weeklyReport && today.getDay() === 1) {
        if (['starter', 'pro', 'premium'].includes(plan)) {
          await sendPush(sa, accessToken, pushToken,
            '📊 Seu relatório semanal chegou',
            'Veja o resumo de agendamentos e faturamento da semana no app.',
            { type: 'weekly_report' },
            webSub,
          );
          results.push(`weeklyReport → ${est.name}`);
        }
      }
    }

    return NextResponse.json({ ok: true, processed: establishments.length, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
