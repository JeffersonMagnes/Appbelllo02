'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subscribeToWebPush } from '@/lib/web-push-client';

const STORAGE_KEY = 'web_push_subscribed_v1';

export default function WebPushSetup() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'denied') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const register = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ok = await subscribeToWebPush(user.id, async (subscription) => {
        const sb = supabase as any;
        await sb.from('profiles').update({ web_push_subscription: subscription }).eq('id', user.id);
      });

      if (ok) sessionStorage.setItem(STORAGE_KEY, '1');
    };

    const t = setTimeout(register, 3000);
    return () => clearTimeout(t);
  }, []);

  return null;
}
