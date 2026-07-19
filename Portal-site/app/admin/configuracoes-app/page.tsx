'use client';

import { useEffect, useState } from 'react';
import { Save2, Mobile } from 'iconsax-react';
import { Globe, Palette, Bell, CreditCard, Shield } from 'lucide-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const TABS = [
  { id: 'geral', label: 'Geral', icon: Globe },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
];

type GeralSettings = {
  appName: string;
  supportEmail: string;
  supportPhone: string;
  trialDays: number;
  maintenanceMode: boolean;
};

type NotifSettings = {
  trialReminder3: boolean;
  trialReminder1: boolean;
  paymentFailed: boolean;
  weeklyReport: boolean;
  newFeature: boolean;
  partnerOffer: boolean;
};

const DEFAULT_GERAL: GeralSettings = {
  appName: 'AppBello',
  supportEmail: 'suporte@appbello.com.br',
  supportPhone: '(11) 4000-0000',
  trialDays: 14,
  maintenanceMode: false,
};

const DEFAULT_NOTIF: NotifSettings = {
  trialReminder3: true,
  trialReminder1: true,
  paymentFailed: true,
  weeklyReport: false,
  newFeature: true,
  partnerOffer: true,
};

export default function ConfiguracoesAppPage() {
  const [tab, setTab] = useState('geral');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [geral, setGeral] = useState<GeralSettings>(DEFAULT_GERAL);
  const [notif, setNotif] = useState<NotifSettings>(DEFAULT_NOTIF);
  const [security, setSecurity] = useState({ twoFa: true, socialLogin: false, auditoria: true, rateLimit: true });

  useEffect(() => {
    fetch('/api/admin/app-settings')
      .then(r => r.json())
      .then((data: { geral?: GeralSettings; notifications?: NotifSettings }) => {
        if (data.geral) setGeral({ ...DEFAULT_GERAL, ...data.geral });
        if (data.notifications) setNotif({ ...DEFAULT_NOTIF, ...data.notifications });
      })
      .catch(() => setError('Erro ao carregar configurações'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/app-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geral, notifications: notif }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Erro ao salvar');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Configurações do App']} />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações do App</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gerencie as configurações globais da plataforma</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className={`gap-2 rounded-xl transition-all ${saved ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-[#6666cc] hover:bg-[#5555aa]'} text-white`}
            >
              <Save2 className="w-4 h-4" variant="Outline" />
              {saving ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Icon className="w-4 h-4" /><span className="hidden sm:block">{t.label}</span>
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#6666cc] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && tab === 'geral' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="font-bold text-gray-900">Informações gerais</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome do app</label>
                  <Input value={geral.appName} onChange={e => setGeral(g => ({ ...g, appName: e.target.value }))} className="h-10 rounded-xl border-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">E-mail de suporte</label>
                  <Input value={geral.supportEmail} onChange={e => setGeral(g => ({ ...g, supportEmail: e.target.value }))} className="h-10 rounded-xl border-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Telefone de suporte</label>
                  <Input value={geral.supportPhone} onChange={e => setGeral(g => ({ ...g, supportPhone: e.target.value }))} className="h-10 rounded-xl border-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Dias de trial padrão</label>
                  <Input type="number" value={geral.trialDays} onChange={e => setGeral(g => ({ ...g, trialDays: +e.target.value }))} className="h-10 rounded-xl border-gray-200" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Modo de manutenção</p>
                  <p className="text-xs text-gray-400 mt-0.5">Exibe tela de manutenção para todos os usuários</p>
                </div>
                <button
                  onClick={() => setGeral(g => ({ ...g, maintenanceMode: !g.maintenanceMode }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${geral.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${geral.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          )}

          {!loading && tab === 'aparencia' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="font-bold text-gray-900">Aparência e marca</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Cor primária</label>
                  <div className="flex items-center gap-3">
                    <input type="color" defaultValue="#6666cc" className="h-10 w-14 rounded-xl border border-gray-200 cursor-pointer" />
                    <Input defaultValue="#6666cc" className="h-10 rounded-xl border-gray-200 font-mono text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Cor de destaque</label>
                  <div className="flex items-center gap-3">
                    <input type="color" defaultValue="#5ab0b6" className="h-10 w-14 rounded-xl border border-gray-200 cursor-pointer" />
                    <Input defaultValue="#5ab0b6" className="h-10 rounded-xl border-gray-200 font-mono text-sm" />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-5">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Logo do app</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#6666cc]/10 flex items-center justify-center">
                    <Mobile className="w-7 h-7 text-[#6666cc]" variant="Outline" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-sm">Alterar logo</Button>
                    <p className="text-xs text-gray-400 mt-1.5">PNG ou SVG, mín. 512x512px</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && tab === 'notificacoes' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Notificações automáticas</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Disparadas diariamente às 9h via cron job</p>
                </div>
              </div>
              {([
                { key: 'trialReminder3', label: 'Trial expirando em 3 dias', desc: 'Avisa o usuário quando o trial está próximo de encerrar' },
                { key: 'trialReminder1', label: 'Trial expirando amanhã', desc: 'Último aviso antes do trial encerrar' },
                { key: 'paymentFailed', label: 'Falha no pagamento', desc: 'Notifica sobre cobrança não processada' },
                { key: 'weeklyReport', label: 'Relatório semanal', desc: 'Resumo semanal de agendamentos e faturamento (toda segunda-feira)' },
                { key: 'newFeature', label: 'Novo recurso disponível', desc: 'Avisa sobre novas funcionalidades' },
                { key: 'partnerOffer', label: 'Oferta de parceiro', desc: 'Promoções e ofertas de parceiros' },
              ] as { key: keyof NotifSettings; label: string; desc: string }[]).map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotif(n => ({ ...n, [item.key]: !n[item.key] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${notif[item.key] ? 'bg-[#6666cc]' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notif[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && tab === 'pagamentos' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="font-bold text-gray-900">Integração de pagamentos</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Stripe Publishable Key</label>
                  <Input defaultValue="pk_live_••••••••••••••••" className="h-10 rounded-xl border-gray-200 font-mono text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Stripe Secret Key</label>
                  <Input type="password" defaultValue="sk_live_••••••••••••••••" className="h-10 rounded-xl border-gray-200 font-mono text-sm" />
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Stripe conectado e operacional</p>
              </div>
            </div>
          )}

          {!loading && tab === 'seguranca' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="font-bold text-gray-900">Segurança</h2>
              {([
                { key: 'twoFa', label: 'Forçar 2FA para admins', desc: 'Exige autenticação de dois fatores para todos os usuários admin' },
                { key: 'socialLogin', label: 'Login social', desc: 'Permite cadastro/login com Google e Apple' },
                { key: 'auditoria', label: 'Auditoria de ações', desc: 'Registra todas as ações dos administradores' },
                { key: 'rateLimit', label: 'Rate limiting', desc: 'Limita tentativas de login para prevenir ataques' },
              ] as { key: keyof typeof security; label: string; desc: string }[]).map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setSecurity(s => ({ ...s, [item.key]: !s[item.key] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${security[item.key] ? 'bg-[#6666cc]' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${security[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
