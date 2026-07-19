'use client';

import { Profile2User, TrendUp as TrendingUp, DollarCircle, UserTick, Activity, ExportSquare, Clock, Card, Flash as Zap } from 'iconsax-react';
import { AlertTriangle, UserX, ArrowDownRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AdminTopbar from '@/components/admin/AdminTopbar';
import StatusBadge from '@/components/admin/StatusBadge';
import Link from 'next/link';

// ── Mock data ──────────────────────────────────────────────────────────────────
const userGrowth = [
  { month: 'Out', users: 820 }, { month: 'Nov', users: 980 }, { month: 'Dez', users: 1140 },
  { month: 'Jan', users: 1380 }, { month: 'Fev', users: 1620 }, { month: 'Mar', users: 1940 },
  { month: 'Abr', users: 2284 },
];
const revenue = [
  { month: 'Out', mrr: 41200 }, { month: 'Nov', mrr: 48900 }, { month: 'Dez', mrr: 57100 },
  { month: 'Jan', mrr: 69300 }, { month: 'Fev', mrr: 81400 }, { month: 'Mar', mrr: 97200 },
  { month: 'Abr', mrr: 114500 },
];
const planDist = [
  { name: 'Starter', value: 1240, color: '#94A3B8' },
  { name: 'Pro',     value: 780,  color: '#7C6EFA' },
  { name: 'Premium', value: 264,  color: '#0D9488' },
];
const recentSignups = [
  { name: 'Ana Lima',       email: 'ana@salaoana.com.br',       plan: 'pro',     trialDays: 12, status: 'trial' },
  { name: 'Carlos Mendes',  email: 'carlos@barbearia.com',      plan: 'starter', trialDays: 9,  status: 'trial' },
  { name: 'Fernanda Torres',email: 'ft@studiobeleza.com',       plan: 'premium', trialDays: 0,  status: 'ativo' },
  { name: 'João Silva',     email: 'joao@clinicajs.com.br',     plan: 'pro',     trialDays: 3,  status: 'trial' },
  { name: 'Mariana Castro', email: 'mcastro@beleza.com',        plan: 'starter', trialDays: 11, status: 'trial' },
];
const expiringTrials = [
  { name: 'Rodrigo Alves',   plan: 'pro',     daysLeft: 1 },
  { name: 'Patrícia Nunes',  plan: 'starter', daysLeft: 2 },
  { name: 'Lucas Ferreira',  plan: 'pro',     daysLeft: 2 },
  { name: 'Beatriz Sousa',   plan: 'premium', daysLeft: 3 },
];

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KPI({
  label, value, change, icon, accent,
}: {
  label: string; value: string; change?: number;
  icon: React.ReactNode; accent: string;
}) {
  const up = change !== undefined && change >= 0;
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 border-l-4 ${accent} hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-snug">{label}</p>
        <div className="text-gray-400">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      {change !== undefined && (
        <div className={`inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded-md text-xs font-bold ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {up ? <ExportSquare className="w-3 h-3"  variant="Outline" /> : <ArrowDownRight className="w-3 h-3" />}
          {change > 0 ? '+' : ''}{change}%
        </div>
      )}
    </div>
  );
}

// ── Tooltip customizado ────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, prefix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-bold text-gray-900">{prefix}{payload[0].value.toLocaleString('pt-BR')}</p>
    </div>
  );
};

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Dashboard']} />
      <main className="flex-1 p-6 space-y-5 bg-gray-50/50">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Visão geral da plataforma Appbello</p>
        </div>

        {/* KPIs — usuários */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI label="Total de usuários"       value="2.284"    change={21}   accent="border-l-[#7C6EFA]" icon={<Profile2User className="w-4 h-4"  variant="Outline" />} />
          <KPI label="Usuários ativos"          value="1.840"    change={14}   accent="border-l-emerald-500" icon={<UserTick className="w-4 h-4"  variant="Outline" />} />
          <KPI label="Em trial"                 value="312"      change={-8}   accent="border-l-amber-400" icon={<Activity className="w-4 h-4"  variant="Outline" />} />
          <KPI label="Cancelamentos (mês)"      value="68"       change={-12}  accent="border-l-red-400" icon={<UserX className="w-4 h-4" />} />
        </div>

        {/* KPIs — financeiro */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI label="MRR"          value="R$ 114.500"  change={17.8} accent="border-l-emerald-500" icon={<DollarCircle className="w-4 h-4"  variant="Outline" />} />
          <KPI label="ARR projetado" value="R$ 1,37M"   change={17.8} accent="border-l-blue-400" icon={<TrendingUp className="w-4 h-4"  variant="Outline" />} />
          <KPI label="Churn mensal"  value="3,5%"       change={-0.3} accent="border-l-amber-400" icon={<AlertTriangle className="w-4 h-4" />} />
          <KPI label="ARPU"          value="R$ 50,14"   change={5.2}  accent="border-l-teal-400" icon={<Zap className="w-4 h-4" />} />
        </div>

        {/* Gráficos — linha 1 */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Crescimento */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900 text-sm">Crescimento de usuários</p>
                <p className="text-xs text-gray-400 mt-0.5">Últimos 7 meses</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+21% MoM</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={userGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C6EFA" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C6EFA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="users" stroke="#7C6EFA" strokeWidth={2.5} fill="url(#gradU)" name="Usuários" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Distribuição de planos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-900 text-sm mb-1">Distribuição de planos</p>
            <p className="text-xs text-gray-400 mb-3">Usuários ativos por plano</p>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={planDist} cx="50%" cy="50%" innerRadius={38} outerRadius={56} dataKey="value" paddingAngle={3}>
                  {planDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR')} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {planDist.map(p => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-xs text-gray-500">{p.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-800">{p.value.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-gray-900 text-sm">Evolução do MRR</p>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 7 meses</p>
            </div>
            <Link href="/admin/assinaturas" className="text-xs font-semibold text-[#7C6EFA] hover:underline flex items-center gap-1">
              Ver assinaturas <ExportSquare className="w-3 h-3"  variant="Outline" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip prefix="R$ " />} />
              <Bar dataKey="mrr" fill="#7C6EFA" radius={[6, 6, 0, 0]} name="MRR" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabelas */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Novos cadastros */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-bold text-gray-900 text-sm">Novos cadastros</p>
              <Link href="/admin/usuarios" className="text-xs text-[#7C6EFA] font-semibold hover:underline">Ver todos</Link>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-400">
                  <th className="text-left px-5 py-2.5 font-semibold">Usuário</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Plano</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Trial</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSignups.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={u.plan} type="plan" /></td>
                    <td className="px-4 py-3">
                      {u.trialDays > 0 ? (
                        <div>
                          <div className="h-1 bg-gray-100 rounded-full w-16 mb-1">
                            <div className="h-full bg-[#7C6EFA] rounded-full" style={{ width: `${(u.trialDays / 30) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{u.trialDays}d</span>
                        </div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trials expirando */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500"  variant="Outline" /> Trials expirando
              </p>
              <Link href="/admin/assinaturas" className="text-xs text-[#7C6EFA] font-semibold hover:underline">Ver</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {expiringTrials.map((t, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <StatusBadge status={t.plan} type="plan" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${t.daysLeft <= 1 ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                      {t.daysLeft}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100">
              <Link href="/admin/assinaturas"
                className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl bg-[#7C6EFA]/8 text-[#7C6EFA] text-xs font-bold hover:bg-[#7C6EFA]/15 transition-colors">
                <Card className="w-3.5 h-3.5"  variant="Outline" /> Gerenciar assinaturas
              </Link>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
