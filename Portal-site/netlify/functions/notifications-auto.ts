import { createClient } from '@supabase/supabase-js';
import { createSign } from 'crypto';
import type { Config } from '@netlify/functions';

// ─── Supabase admin ────────────────────────────────────────────────────────
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

async function getFcmAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
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
  projectId: string,
  accessToken: string,
  pushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, string>,
  webSub?: { endpoint: string; keys: { p256dh: string; auth: string } } | null,
) {
  if (pushToken) {
    await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
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
        const webpush = require('web-push');
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

// ─── Handler (roda todo dia às 9h, horário de Brasília = 12 UTC) ──────────
export default async function handler() {
  const supabase = adminSupabase();

  // Carrega configurações salvas pelo superadmin
  const { data: settingsRows } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['notifications', 'geral']);

  const notif = (settingsRows?.find(r => r.key === 'notifications')?.value ?? {}) as Record<string, boolean>;
  const geral = (settingsRows?.find(r => r.key === 'geral')?.value ?? {}) as { trialDays?: number };
  const trialDays = geral.trialDays ?? 30;

  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saRaw) {
    console.error('FIREBASE_SERVICE_ACCOUNT não configurada');
    return;
  }
  const sa = JSON.parse(saRaw) as { client_email: string; private_key: string; project_id: string };
  const accessToken = await getFcmAccessToken(sa);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Busca todos os estabelecimentos ativos
  const { data: establishments } = await supabase
    .from('establishments')
    .select('id, name, owner_id, subscription_plan, trial_started_at')
    .eq('active', true);

  if (!establishments?.length) return;

  const ownerIds = establishments.map(e => e.owner_id as string);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token, web_push_subscription')
    .in('id', ownerIds);

  const tokenMap = new Map<string, string>();
  const webSubMap = new Map<string, any>();
  for (const p of profiles ?? []) {
    if (p.push_token) tokenMap.set(p.id as string, p.push_token as string);
    if ((p as any).web_push_subscription) webSubMap.set(p.id as string, (p as any).web_push_subscription);
  }

  for (const est of establishments) {
    const pushToken = tokenMap.get(est.owner_id as string);
    const webSub = webSubMap.get(est.owner_id as string);
    if (!pushToken && !webSub) continue;
    const plan = (est.subscription_plan as string) ?? 'trial';

    // Trial expirando em 3 dias
    if (notif.trialReminder3 && plan === 'trial' && est.trial_started_at) {
      const trialEnd = new Date(new Date(est.trial_started_at as string).getTime() + trialDays * 86400000);
      trialEnd.setHours(0, 0, 0, 0);
      const daysLeft = Math.round((trialEnd.getTime() - today.getTime()) / 86400000);
      if (daysLeft === 3) {
        await sendPush(sa.project_id, accessToken, pushToken,
          '⏳ Seu trial expira em 3 dias',
          'Assine agora para continuar usando o AppBello sem interrupção.',
          { type: 'trial_expiring', days: '3' },
          webSub,
        );
        console.log(`trial3 → ${est.name as string}`);
      }
    }

    // Trial expirando amanhã
    if (notif.trialReminder1 && plan === 'trial' && est.trial_started_at) {
      const trialEnd = new Date(new Date(est.trial_started_at as string).getTime() + trialDays * 86400000);
      trialEnd.setHours(0, 0, 0, 0);
      const daysLeft = Math.round((trialEnd.getTime() - today.getTime()) / 86400000);
      if (daysLeft === 1) {
        await sendPush(sa.project_id, accessToken, pushToken,
          '🚨 Último dia do seu trial!',
          'Seu período gratuito termina amanhã. Assine agora e não perca seus dados.',
          { type: 'trial_expiring', days: '1' },
          webSub,
        );
        console.log(`trial1 → ${est.name as string}`);
      }
    }

    // Falha no pagamento
    if (notif.paymentFailed && plan === 'payment_failed') {
      await sendPush(sa.project_id, accessToken, pushToken,
        '💳 Falha no pagamento',
        'Não conseguimos processar sua cobrança. Atualize seu método de pagamento.',
        { type: 'payment_failed' },
        webSub,
      );
      console.log(`payment_failed → ${est.name as string}`);
    }

    // Relatório semanal — toda segunda-feira
    if (notif.weeklyReport && today.getDay() === 1 && ['starter', 'pro', 'premium'].includes(plan)) {
      await sendPush(sa.project_id, accessToken, pushToken,
        '📊 Seu relatório semanal chegou',
        'Veja o resumo de agendamentos e faturamento da semana no app.',
        { type: 'weekly_report' },
        webSub,
      );
      console.log(`weeklyReport → ${est.name as string}`);
    }
  }
}

// Roda todo dia às 12:00 UTC = 9:00 horário de Brasília
export const config: Config = {
  schedule: '0 12 * * *',
};
