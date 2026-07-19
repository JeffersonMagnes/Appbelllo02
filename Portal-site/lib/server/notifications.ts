import 'server-only';

import { createSign } from 'crypto';
import { createClient } from '@supabase/supabase-js';

type WebSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };
type NotificationInput = {
  establishmentId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  url?: string;
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Notification service is not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function createFcmJWT(sa: { client_email: string; private_key: string }): string {
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
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth2:grant-type:jwt-bearer', assertion: createFcmJWT(sa) }),
  });
  const data = await response.json() as { access_token?: string };
  if (!response.ok || !data.access_token) throw new Error('FCM authentication failed');
  return data.access_token;
}

async function sendFcm(token: string, title: string, body: string, data?: Record<string, string>) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return 'not_configured';
  const sa = JSON.parse(raw) as { client_email: string; private_key: string; project_id: string };
  const accessToken = await getFcmAccessToken(sa);
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ message: { token, notification: { title, body }, android: { priority: 'high', notification: { channel_id: 'agendamentos', sound: 'default' } }, data: data ?? {} } }),
  });
  if (!response.ok) throw new Error(`FCM delivery failed (${response.status})`);
  return 'sent';
}

async function sendWeb(subscription: WebSubscription, title: string, body: string, url: string) {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!privateKey || !publicKey) return 'not_configured';
  const webpush = require('web-push');
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:contato@appbello.com', publicKey, privateKey);
  await webpush.sendNotification(subscription, JSON.stringify({ title, body, url, tag: 'appbello-notification' }), { TTL: 86400 });
  return 'sent';
}

export async function sendEstablishmentNotification(input: NotificationInput) {
  const supabase = serviceClient();
  const { data: establishment, error: establishmentError } = await supabase
    .from('establishments')
    .select('owner_id')
    .eq('id', input.establishmentId)
    .maybeSingle();
  if (establishmentError || !establishment) throw new Error('Establishment not found');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('push_token,web_push_subscription')
    .eq('id', establishment.owner_id)
    .maybeSingle();
  if (profileError) throw new Error('Notification recipient lookup failed');

  const results: Record<string, string> = {};
  if (profile?.push_token) results.fcm = await sendFcm(profile.push_token, input.title, input.body, input.data);
  if (profile?.web_push_subscription) results.web = await sendWeb(profile.web_push_subscription as WebSubscription, input.title, input.body, input.url ?? '/dashboard/agenda');
  return results;
}

