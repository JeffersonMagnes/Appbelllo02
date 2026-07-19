'use client';

import { DollarCircle, TrendUp as TrendingUp, TrendDown as TrendingDown, ImportSquare } from 'iconsax-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminTopbar from '@/components/admin/AdminTopbar';
import KPICard from '@/components/admin/KPICard';
import StatusBadge from '@/components/admin/StatusBadge';

const mrrData = [
  { month: 'Out', mrr: 41200, new: 8200, churn: 2100 }, { month: 'Nov', mrr: 48900, new: 10400, churn: 2700 },
  { month: 'Dez', mrr: 57100, new: 11300, churn: 3100 }, { month: 'Jan', mrr: 69300, new: 15200, churn: 3000 },
  { month: 'Fev', mrr: 81400, new: 16800, churn: 4700 }, { month: 'Mar', mrr: 97200, new: 19600, churn: 3800 },
  { month: 'Abr', mrr: 114500, new: 21800, churn: 4500 },
];
const transactions = [
  { name: 'Ana Lima', plan: 'pro', value: 89.90, date: '22/04/2026', status: 'pago' },
  { name: 'Carlos Mendes', plan: 'starter', value: 49.90, date: '22/04/2026', status: 'pago' },
  { name: 'Fernanda Torres', plan: 'premium', value: 149.90, date: '21/04/2026', status: 'pago' },
  { name: 'Roberto Carvalho', plan: 'pro', value: 89.90, date: '21/04/2026', status: 'falhou' },
  { name: 'Lucia Motta', plan: 'starter', value: 49.90, date: '20/04/2026', status: 'pendente' },
  { name: 'Pedro Alves', plan: 'pro', value: 89.90, date: '20/04/2026', status: 'pago' },
];

function exportCSV() {
  const header = 'Usuário,Plano,Valor,Data,Status';
  const rows = transactions.map(t => `${t.name},${t.plan},R$ ${t.value.toFixed(2)},${t.date},${t.status}`);
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transacoes.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function FinanceiroPage() {
  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Planos & Financeiro', 'Financeiro']} />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Financeiro</h1><p className="text-sm text-gray-500 mt-0.5">Receitas e transações da plataforma</p></div>
          <button onClick={exportCSV} className="flex items-center gap-2 text-sm text-[#6666cc] hover:underline font-medium"><ImportSquare className="w-4 h-4"  variant="Outline" /> Exportar</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="MRR atual" value="R$ 114.500" change={17.8} icon={DollarCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <KPICard title="ARR projetado" value="R$ 1.37M" change={17.8} icon={TrendingUp} iconBg="bg-[#6666cc]/10" iconColor="text-[#6666cc]" />
          <KPICard title="Nova receita (mês)" value="R$ 21.800" change={11.2} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <KPICard title="Churn receita" value="R$ 4.500" change={18.4} icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-500" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-900 mb-1">Evolução do MRR</p>
          <p className="text-xs text-gray-400 mb-4">Receita recorrente mensal vs. churn</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6666cc" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6666cc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
              <Area type="monotone" dataKey="mrr" stroke="#6666cc" strokeWidth={2.5} fill="url(#gMrr)" name="MRR" />
              <Area type="monotone" dataKey="new" stroke="#5ab0b6" strokeWidth={2} fill="none" name="Nova receita" />
              <Area type="monotone" dataKey="churn" stroke="#EF4444" strokeWidth={2} fill="none" name="Churn" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><p className="font-bold text-gray-900">Transações recentes</p></div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-semibold">Usuário</th>
                <th className="text-left px-4 py-3 font-semibold">Plano</th>
                <th className="text-left px-4 py-3 font-semibold">Valor</th>
                <th className="text-left px-4 py-3 font-semibold">Data</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={t.plan} type="plan" /></td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-900">R$ {t.value.toFixed(2).replace('.', ',')}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{t.date}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
