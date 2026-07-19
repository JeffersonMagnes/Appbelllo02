'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle, CreditCard, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Banner = {
  id: string;
  type: 'warning' | 'danger' | 'error';
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: { label: string; href: string };
};

export default function NotificationBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: est } = await supabase
          .from('establishments')
          .select('id, subscription_plan, trial_started_at')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!est) return;

        // Carrega dias de trial configurados pelo admin
        const settingsRes = await fetch('/api/admin/app-settings');
        const settings = settingsRes.ok ? await settingsRes.json() as { geral?: { trialDays?: number } } : {};
        const trialDays = settings.geral?.trialDays ?? 14;

        const plan = (est as { subscription_plan?: string }).subscription_plan ?? 'trial';
        const trialStartedAt = (est as { trial_started_at?: string }).trial_started_at;

        const found: Banner[] = [];

        // ── Trial expirando ──────────────────────────────────────────────
        if (plan === 'trial' && trialStartedAt) {
          const trialEnd = new Date(new Date(trialStartedAt).getTime() + trialDays * 86400000);
          trialEnd.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const daysLeft = Math.round((trialEnd.getTime() - today.getTime()) / 86400000);

          if (daysLeft <= 0) {
            found.push({
              id: 'trial-expired',
              type: 'danger',
              icon: <Clock className="w-4 h-4" />,
              title: 'Seu trial encerrou',
              message: 'Assine um plano para continuar usando o AppBello.',
              action: { label: 'Ver planos', href: '/dashboard/assinatura' },
            });
          } else if (daysLeft === 1) {
            found.push({
              id: 'trial-1',
              type: 'danger',
              icon: <Clock className="w-4 h-4" />,
              title: 'Último dia do seu trial!',
              message: 'Seu período gratuito termina hoje. Assine agora e não perca seus dados.',
              action: { label: 'Assinar agora', href: '/dashboard/assinatura' },
            });
          } else if (daysLeft <= 3) {
            found.push({
              id: 'trial-3',
              type: 'warning',
              icon: <Clock className="w-4 h-4" />,
              title: `Seu trial expira em ${daysLeft} dias`,
              message: 'Assine agora para continuar usando o AppBello sem interrupção.',
              action: { label: 'Ver planos', href: '/dashboard/assinatura' },
            });
          }
        }

        // ── Falha no pagamento ───────────────────────────────────────────
        if (plan === 'payment_failed') {
          found.push({
            id: 'payment-failed',
            type: 'error',
            icon: <CreditCard className="w-4 h-4" />,
            title: 'Falha no pagamento',
            message: 'Não conseguimos processar sua cobrança. Atualize seu método de pagamento.',
            action: { label: 'Atualizar pagamento', href: '/dashboard/assinatura' },
          });
        }

        setBanners(found);
      } catch (error) {
        console.error('NotificationBanners load failed:', error);
      }
    };

    load();
  }, []);

  // Recupera dismissed da sessão
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('dismissed_banners');
      if (stored) setDismissed(new Set(JSON.parse(stored) as string[]) as Set<string>);
    } catch (error) {
      console.error('Failed to read dismissed_banners:', error);
    }
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(Array.from(dismissed).concat(id));
    setDismissed(next);
    try {
      sessionStorage.setItem('dismissed_banners', JSON.stringify(Array.from(next)));
    } catch (error) {
      console.error('Failed to persist dismissed_banners:', error);
    }
  };

  const visible = banners.filter(b => !dismissed.has(b.id));
  if (!visible.length) return null;

  const colors = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger:  'bg-red-50 border-red-200 text-red-800',
    error:   'bg-red-50 border-red-300 text-red-900',
  };

  const iconColors = {
    warning: 'text-amber-500',
    danger:  'text-red-500',
    error:   'text-red-600',
  };

  const actionColors = {
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    danger:  'bg-red-600 hover:bg-red-700 text-white',
    error:   'bg-red-700 hover:bg-red-800 text-white',
  };

  return (
    <div className="flex flex-col gap-1.5 px-6 pt-4">
      {visible.map(banner => (
        <div
          key={banner.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${colors[banner.type]}`}
        >
          <span className={`shrink-0 ${iconColors[banner.type]}`}>{banner.icon}</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{banner.title}</span>
            <span className="ml-2 font-normal opacity-80">{banner.message}</span>
          </div>
          {banner.action && (
            <a
              href={banner.action.href}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${actionColors[banner.type]}`}
            >
              {banner.action.label}
            </a>
          )}
          <button onClick={() => dismiss(banner.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
