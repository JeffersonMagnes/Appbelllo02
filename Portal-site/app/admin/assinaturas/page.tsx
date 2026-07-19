'use client';

import { useEffect, useState } from 'react';
import { SearchNormal1, Refresh2, CloseCircle, Card, Clock, DollarCircle, TrendUp as TrendingUp, Profile2User, Calendar, ArrowDown2, Sms, Buildings2 } from 'iconsax-react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { createClient } from '@/lib/supabase/client';

// ── Tipos ─────────────────────────────────────────────────────────────────────
type PlanId = 'trial' | 'starter' | 'pro' | 'premium' | 'cancelado' | 'expirado';

interface Subscription {
  id: string;
  establishment_name: string;
  logo_url: string | null;
  owner_name: string;
  owner_email: string;
  professionals_count: number;
  created_at: string;
  plan: PlanId;
  status: 'trial' | 'ativo' | 'expirado' | 'cancelado';
  mrr: number;
  daysUsing: number;
  nextBilling: string | null;
  trialEndsAt: string | null;
  trialDaysLeft: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const PLAN_PRICE: Record<string, number> = { starter: 79, pro: 149, premium: 249, trial: 0, cancelado: 0, expirado: 0 };

function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Badge de status ────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: Subscription['status'] }) {
  const map = {
    trial:    { label: 'Trial',     cls: 'bg-amber-50 text-amber-600 border-amber-200',    dot: 'bg-amber-400' },
    ativo:    { label: 'Ativo',     cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-400' },
    expirado: { label: 'Expirado',  cls: 'bg-red-50 text-red-500 border-red-200',          dot: 'bg-red-400' },
    cancelado:{ label: 'Cancelado', cls: 'bg-gray-100 text-gray-400 border-gray-200',      dot: 'bg-gray-300' },
  };
  const c = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: PlanId }) {
  const map: Record<string, string> = {
    trial:    'bg-amber-50 text-amber-600',
    starter:  'bg-slate-100 text-slate-600',
    pro:      'bg-[#7C6EFA]/10 text-[#7C6EFA]',
    premium:  'bg-teal-50 text-teal-600',
    cancelado:'bg-gray-100 text-gray-400',
    expirado: 'bg-red-50 text-red-400',
  };
  const labels: Record<string, string> = {
    trial:'Trial', starter:'Starter', pro:'Pro', premium:'Premium', cancelado:'Cancelado', expirado:'Expirado',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${map[plan] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[plan] ?? plan}
    </span>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ logo, name, size = 36 }: { logo: string | null; name: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
  if (logo) {
    return (
      <img src={logo} alt={name} width={size} height={size}
        className="rounded-xl object-cover border border-gray-100 shrink-0"
        style={{ width: size, height: size }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
    );
  }
  return (
    <div className="rounded-xl bg-gradient-to-br from-[#7C6EFA] to-[#5B4FD9] text-white font-bold flex items-center justify-center text-xs shrink-0"
      style={{ width: size, height: size }}>
      {initials || '?'}
    </div>
  );
}

// ── Histórico mockado ──────────────────────────────────────────────────────────
function PaymentHistory({ sub, onClose }: { sub: Subscription; onClose: () => void }) {
  const history = sub.status === 'ativo' ? [
    { date: fmtDate(addDays(new Date().toISOString(), -30)),  value: PLAN_PRICE[sub.plan], status: 'pago',  method: 'Cartão ···4891' },
    { date: fmtDate(addDays(new Date().toISOString(), -60)),  value: PLAN_PRICE[sub.plan], status: 'pago',  method: 'Cartão ···4891' },
    { date: fmtDate(addDays(new Date().toISOString(), -90)),  value: PLAN_PRICE[sub.plan], status: 'pago',  method: 'PIX' },
  ] : [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F0E17] to-[#1a1830] px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar logo={sub.logo_url} name={sub.establishment_name} size={44} />
              <div>
                <p className="text-white font-bold">{sub.establishment_name}</p>
                <p className="text-white/50 text-xs">{sub.owner_email}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <CloseCircle className="w-5 h-5"  variant="Outline" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Plano', value: sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) },
              { label: 'MRR', value: fmtCurrency(sub.mrr) },
              { label: 'Próx. cobrança', value: fmtDate(sub.nextBilling) },
            ].map(k => (
              <div key={k.label} className="bg-white/[0.06] rounded-xl p-3">
                <p className="text-white/40 text-xs">{k.label}</p>
                <p className="text-white font-bold text-sm mt-0.5">{k.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico */}
        <div className="p-6">
          <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Card className="w-4 h-4 text-[#7C6EFA]"  variant="Outline" /> Histórico de pagamentos
          </p>
          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <DollarCircle className="w-8 h-8 mx-auto mb-2 opacity-30"  variant="Outline" />
              <p className="text-sm">Nenhum pagamento registrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{h.date}</p>
                      <p className="text-xs text-gray-400">{h.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{fmtCurrency(h.value)}</p>
                    <span className="text-xs text-emerald-600 font-semibold">Pago</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 mt-5">
            <a href={`mailto:${sub.owner_email}`}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Sms className="w-4 h-4"  variant="Outline" /> Contatar
            </a>
            <button onClick={onClose}
              className="flex-1 h-10 rounded-xl bg-[#7C6EFA] hover:bg-[#6B5FE8] text-white text-sm font-semibold transition-colors">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tela principal ─────────────────────────────────────────────────────────────
const STATUS_FILTERS = ['Todos', 'Trial', 'Ativo', 'Expirado', 'Cancelado'];
const PLAN_FILTERS   = ['Todos', 'Starter', 'Pro', 'Premium'];

export default function AssinaturasPage() {
  const [subs, setSubs]             = useState<Subscription[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusF, setStatusF]       = useState('Todos');
  const [planF, setPlanF]           = useState('Todos');
  const [detail, setDetail]         = useState<Subscription | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc('get_admin_establishments');
    const rows: any[] = Array.isArray(data) ? data : [];

    const mapped: Subscription[] = rows.map(row => {
      const days = daysAgo(row.created_at);
      const isTrial = days <= 30;
      const plan: PlanId = isTrial ? 'trial' : row.professionals_count >= 5 ? 'pro' : 'starter';
      const status: Subscription['status'] = row.active ? (isTrial ? 'trial' : 'ativo') : 'cancelado';
      const trialEndsAt = isTrial ? addDays(row.created_at, 30) : null;
      const trialDaysLeft = isTrial ? Math.max(0, 30 - days) : 0;
      const nextBilling = !isTrial && row.active ? addDays(row.created_at, Math.ceil(days / 30) * 30) : null;

      return {
        id: row.id,
        establishment_name: row.establishment_name,
        logo_url: row.logo_url,
        owner_name: row.owner_name,
        owner_email: row.owner_email,
        professionals_count: row.professionals_count,
        created_at: row.created_at,
        plan,
        status,
        mrr: isTrial ? 0 : PLAN_PRICE[plan],
        daysUsing: days,
        nextBilling,
        trialEndsAt,
        trialDaysLeft,
      };
    });

    setSubs(mapped);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = subs.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.establishment_name.toLowerCase().includes(q) ||
      s.owner_email.toLowerCase().includes(q) || s.owner_name.toLowerCase().includes(q);
    const matchStatus = statusF === 'Todos' || s.status === statusF.toLowerCase();
    const matchPlan = planF === 'Todos' || s.plan === planF.toLowerCase();
    return matchSearch && matchStatus && matchPlan;
  });

  // KPIs
  const mrr          = subs.filter(s => s.status === 'ativo').reduce((a, s) => a + s.mrr, 0);
  const trials       = subs.filter(s => s.status === 'trial').length;
  const ativos       = subs.filter(s => s.status === 'ativo').length;
  const expirando3d  = subs.filter(s => s.status === 'trial' && s.trialDaysLeft <= 3).length;

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Assinaturas']} />
      <main className="flex-1 p-6 space-y-5">

        {/* Título */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assinaturas</h1>
            <p className="text-sm text-gray-400 mt-0.5">Gestão de planos e pagamentos dos clientes</p>
          </div>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Refresh2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}  variant="Outline" /> Atualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'MRR',
              value: fmtCurrency(mrr),
              sub: 'Receita recorrente mensal',
              icon: <DollarCircle className="w-4 h-4 text-emerald-600"  variant="Outline" />,
              bg: 'bg-emerald-50',
              accent: 'border-l-emerald-500',
            },
            {
              label: 'Assinantes ativos',
              value: String(ativos),
              sub: 'Clientes pagantes',
              icon: <CheckCircle2 className="w-4 h-4 text-[#7C6EFA]" />,
              bg: 'bg-[#7C6EFA]/8',
              accent: 'border-l-[#7C6EFA]',
            },
            {
              label: 'Em trial',
              value: String(trials),
              sub: `${expirando3d} expirando em 3 dias`,
              icon: <Clock className="w-4 h-4 text-amber-600"  variant="Outline" />,
              bg: 'bg-amber-50',
              accent: 'border-l-amber-400',
            },
            {
              label: 'ARR projetado',
              value: fmtCurrency(mrr * 12),
              sub: 'Base anual',
              icon: <TrendingUp className="w-4 h-4 text-blue-600"  variant="Outline" />,
              bg: 'bg-blue-50',
              accent: 'border-l-blue-400',
            },
          ].map(k => (
            <div key={k.label} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 border-l-4 ${k.accent}`}>
              <div className={`w-8 h-8 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>{k.icon}</div>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">{k.label}</p>
              <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"  variant="Outline" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar estabelecimento, e-mail..."
              className="pl-9 pr-4 h-9 w-full rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6EFA]/20 focus:border-[#7C6EFA]/40 bg-white transition-all placeholder:text-gray-400" />
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setStatusF(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusF === f ? 'bg-[#7C6EFA] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {PLAN_FILTERS.map(f => (
              <button key={f} onClick={() => setPlanF(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${planF === f ? 'bg-[#7C6EFA] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <Refresh2 className="w-4 h-4 animate-spin"  variant="Outline" /> Carregando assinaturas...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Card className="w-10 h-10 mb-3 opacity-20"  variant="Outline" />
              <p className="text-sm font-medium">Nenhuma assinatura encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500">
                    <th className="text-left px-5 py-3 font-semibold">Estabelecimento</th>
                    <th className="text-left px-4 py-3 font-semibold">Plano</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Trial / Vence</th>
                    <th className="text-left px-4 py-3 font-semibold">Próx. cobrança</th>
                    <th className="text-left px-4 py-3 font-semibold">MRR</th>
                    <th className="text-left px-4 py-3 font-semibold">
                      <div className="flex items-center gap-1"><Profile2User className="w-3.5 h-3.5"  variant="Outline" /> Profis.</div>
                    </th>
                    <th className="text-right px-5 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">

                      {/* Estabelecimento */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar logo={sub.logo_url} name={sub.establishment_name} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{sub.establishment_name}</p>
                            <p className="text-xs text-gray-400">{sub.owner_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plano */}
                      <td className="px-4 py-3.5"><PlanBadge plan={sub.plan} /></td>

                      {/* Status */}
                      <td className="px-4 py-3.5"><StatusPill status={sub.status} /></td>

                      {/* Trial / vencimento */}
                      <td className="px-4 py-3.5">
                        {sub.status === 'trial' ? (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              {sub.trialDaysLeft <= 3
                                ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                : <Clock className="w-3.5 h-3.5 text-amber-400"  variant="Outline" />}
                              <span className={`text-xs font-bold ${sub.trialDaysLeft <= 3 ? 'text-red-500' : 'text-amber-600'}`}>
                                {sub.trialDaysLeft}d restantes
                              </span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full w-20">
                              <div className={`h-full rounded-full transition-all ${sub.trialDaysLeft <= 3 ? 'bg-red-400' : 'bg-amber-400'}`}
                                style={{ width: `${Math.min(100, ((30 - sub.trialDaysLeft) / 30) * 100)}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{fmtDate(sub.trialEndsAt)}</span>
                        )}
                      </td>

                      {/* Próxima cobrança */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-300"  variant="Outline" />
                          <span className="text-sm text-gray-700 font-medium">{fmtDate(sub.nextBilling)}</span>
                        </div>
                      </td>

                      {/* MRR */}
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-bold ${sub.mrr > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                          {sub.mrr > 0 ? fmtCurrency(sub.mrr) : '—'}
                        </span>
                      </td>

                      {/* Profissionais */}
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-bold ${sub.professionals_count > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                          {sub.professionals_count}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetail(sub)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7C6EFA] bg-[#7C6EFA]/8 hover:bg-[#7C6EFA]/15 transition-colors flex items-center gap-1.5">
                            <Card className="w-3.5 h-3.5"  variant="Outline" /> Pagamentos
                          </button>
                          <a href={`mailto:${sub.owner_email}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#7C6EFA] hover:bg-[#7C6EFA]/8 transition-colors">
                            <Sms className="w-4 h-4"  variant="Outline" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alertas — trials expirando */}
        {subs.filter(s => s.status === 'trial' && s.trialDaysLeft <= 5).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-bold text-amber-800">Trials expirando nos próximos 5 dias</p>
            </div>
            <div className="space-y-2">
              {subs.filter(s => s.status === 'trial' && s.trialDaysLeft <= 5).map(s => (
                <div key={s.id} className="flex items-center justify-between bg-white rounded-xl border border-amber-100 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Avatar logo={s.logo_url} name={s.establishment_name} size={30} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.establishment_name}</p>
                      <p className="text-xs text-gray-400">{s.owner_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${s.trialDaysLeft <= 1 ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                      {s.trialDaysLeft === 0 ? 'Hoje!' : `${s.trialDaysLeft}d`}
                    </span>
                    <a href={`mailto:${s.owner_email}`}
                      className="px-3 py-1 rounded-lg bg-[#7C6EFA] text-white text-xs font-semibold hover:bg-[#6B5FE8] transition-colors">
                      Contatar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-right">
          Dados do Supabase · {lastRefresh.toLocaleTimeString('pt-BR')}
        </p>
      </main>

      {/* Modal de histórico */}
      {detail && <PaymentHistory sub={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
