'use client';

import { useState } from 'react';
import { TrendUp as TrendingUp, Profile2User, Clock, Star1, ExportSquare } from 'iconsax-react';
import { Users, Star } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminTopbar from '@/components/admin/AdminTopbar';
import KPICard from '@/components/admin/KPICard';

const userGrowth = [
  { month: 'Out', users: 820 }, { month: 'Nov', users: 980 }, { month: 'Dez', users: 1140 },
  { month: 'Jan', users: 1380 }, { month: 'Fev', users: 1620 }, { month: 'Mar', users: 1940 }, { month: 'Abr', users: 2284 },
];
const retention = [
  { week: 'Sem 1', rate: 100 }, { week: 'Sem 2', rate: 82 }, { week: 'Sem 4', rate: 68 },
  { week: 'Sem 8', rate: 54 }, { week: 'Sem 12', rate: 47 }, { week: 'Sem 16', rate: 42 },
];
const featureUsage = [
  { feature: 'Agenda', usage: 94 }, { feature: 'Clientes', usage: 87 }, { feature: 'Financeiro', usage: 62 },
  { feature: 'Equipe', usage: 58 }, { feature: 'Serviços', usage: 71 }, { feature: 'Relatórios', usage: 45 },
];
const planDist = [
  { name: 'Starter', value: 1240, color: '#64748B' },
  { name: 'Pro', value: 780, color: '#6666cc' },
  { name: 'Premium', value: 264, color: '#5ab0b6' },
];
const topRegions = [
  { city: 'São Paulo', users: 642, pct: 28.1 }, { city: 'Rio de Janeiro', users: 384, pct: 16.8 },
  { city: 'Belo Horizonte', users: 218, pct: 9.5 }, { city: 'Curitiba', users: 192, pct: 8.4 },
  { city: 'Porto Alegre', users: 167, pct: 7.3 }, { city: 'Outras', users: 881, pct: 38.6 },
];
const RANGES = ['7 dias', '30 dias', '3 meses', '6 meses', '12 meses'];

export default function AnalyticsPage() {
  const [range, setRange] = useState('30 dias');

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Analytics']} />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Analytics</h1><p className="text-sm text-gray-500 mt-0.5">Métricas de uso, crescimento e retenção</p></div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">{RANGES.map(r => <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${range === r ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{r}</button>)}</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Usuários ativos" value="2.284" change={21} icon={Users} iconBg="bg-[#6666cc]/10" iconColor="text-[#6666cc]" />
          <KPICard title="Novos (mês)" value="412" change={6.2} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <KPICard title="Sessão média" value="8m 42s" change={1.3} icon={Clock} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <KPICard title="NPS" value="74" change={4} icon={Star} iconBg="bg-amber-50" iconColor="text-amber-600" />
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-900 mb-1">Crescimento de usuários</p><p className="text-xs text-gray-400 mb-4">Usuários totais ao longo do tempo</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowth}>
                <defs><linearGradient id="gradU2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6666cc" stopOpacity={0.15} /><stop offset="95%" stopColor="#6666cc" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#6666cc" strokeWidth={2.5} fill="url(#gradU2)" name="Usuários" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-900 mb-1">Distribuição de planos</p><p className="text-xs text-gray-400 mb-4">Usuários por plano atual</p>
            <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={planDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>{planDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            <div className="space-y-2 mt-2">{planDist.map(p => <div key={p.name} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} /><span className="text-xs text-gray-600">{p.name}</span></div><span className="text-xs font-bold text-gray-900">{p.value.toLocaleString('pt-BR')}</span></div>)}</div>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-900 mb-1">Taxa de retenção</p><p className="text-xs text-gray-400 mb-4">Usuários ativos por semana de vida</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={retention}><CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" /><XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} /><YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} unit="%" domain={[0, 100]} /><Tooltip formatter={(v: number) => `${v}%`} /><Line type="monotone" dataKey="rate" stroke="#5ab0b6" strokeWidth={2.5} dot={{ r: 4, fill: '#5ab0b6' }} name="Retenção" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-bold text-gray-900 mb-1">Uso por funcionalidade</p><p className="text-xs text-gray-400 mb-4">% de usuários que usaram cada módulo</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={featureUsage} layout="vertical"><XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} unit="%" /><YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: '#6B7280' }} width={72} /><Tooltip formatter={(v: number) => `${v}%`} /><Bar dataKey="usage" fill="#6666cc" radius={[0, 6, 6, 0]} name="Uso" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bold text-gray-900">Top regiões</p>
            <button className="text-xs text-[#6666cc] font-medium flex items-center gap-1 hover:underline">Ver mapa completo <ExportSquare className="w-3.5 h-3.5"  variant="Outline" /></button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100"><tr className="text-xs text-gray-500"><th className="text-left px-5 py-3 font-semibold">Cidade</th><th className="text-left px-4 py-3 font-semibold">Usuários</th><th className="text-left px-4 py-3 font-semibold">% do total</th><th className="px-5 py-3 font-semibold w-48"></th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {topRegions.map(r => (
                <tr key={r.city} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{r.city}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{r.users.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-[#6666cc]">{r.pct}%</td>
                  <td className="px-5 py-3.5"><div className="h-1.5 bg-gray-100 rounded-full w-full"><div className="h-full bg-[#6666cc]/40 rounded-full" style={{ width: `${r.pct}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
