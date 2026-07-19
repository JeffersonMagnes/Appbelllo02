'use client';

import { ImportSquare, Eye, Mouse, TrendUp as TrendingUp, Profile2User } from 'iconsax-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminTopbar from '@/components/admin/AdminTopbar';
import KPICard from '@/components/admin/KPICard';
import StatusBadge from '@/components/admin/StatusBadge';

const performanceData = [
  { day: 'Seg', impressions: 4200, clicks: 312 }, { day: 'Ter', impressions: 5100, clicks: 398 },
  { day: 'Qua', impressions: 3800, clicks: 286 }, { day: 'Qui', impressions: 6200, clicks: 487 },
  { day: 'Sex', impressions: 7100, clicks: 562 }, { day: 'Sáb', impressions: 5900, clicks: 441 }, { day: 'Dom', impressions: 2400, clicks: 178 },
];
const adStats = [
  { title: 'Schwarzkopf 20% OFF', impressions: 8420, clicks: 642, ctr: 7.6, status: 'active' },
  { title: 'Loreal Professionnel', impressions: 7210, clicks: 520, ctr: 7.2, status: 'paused' },
  { title: 'Curso Colorimetria', impressions: 5180, clicks: 398, ctr: 7.7, status: 'active' },
  { title: 'Cadeira Reclinável Pro', impressions: 4290, clicks: 310, ctr: 7.2, status: 'active' },
];

export default function RelatoriosPage() {
  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Anúncios & Parceiros', 'Relatórios']} />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Relatórios de Anúncios</h1><p className="text-sm text-gray-500 mt-0.5">Últimos 7 dias</p></div>
          <button onClick={() => {
            const header = 'Anúncio,Impressões,Cliques,CTR,Status';
            const rows = adStats.map(a => `${a.title},${a.impressions},${a.clicks},${a.ctr}%,${a.status}`);
            const csv = [header, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'relatorio-anuncios.csv'; a.click();
            URL.revokeObjectURL(url);
          }} className="flex items-center gap-2 text-sm text-[#6666cc] hover:underline font-medium"><ImportSquare className="w-4 h-4"  variant="Outline" /> Exportar</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Impressões totais" value="29.300" change={18} icon={Eye} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <KPICard title="Cliques únicos" value="2.664" change={23} icon={Mouse} iconBg="bg-[#6666cc]/10" iconColor="text-[#6666cc]" />
          <KPICard title="CTR Médio" value="9.1%" change={0.8} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <KPICard title="Usuários alcançados" value="14.200" change={15} icon={Profile2User} iconBg="bg-amber-50" iconColor="text-amber-600" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-900 mb-4">Impressões e Cliques — 7 dias</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip />
              <Bar dataKey="impressions" fill="#6666cc" radius={[4, 4, 0, 0]} name="Impressões" />
              <Bar dataKey="clicks" fill="#5ab0b6" radius={[4, 4, 0, 0]} name="Cliques" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><p className="font-bold text-gray-900">Performance por Anúncio</p></div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100"><tr className="text-xs text-gray-500">
              <th className="text-left px-5 py-3 font-semibold">Anúncio</th>
              <th className="text-left px-4 py-3 font-semibold">Impressões</th>
              <th className="text-left px-4 py-3 font-semibold">Cliques</th>
              <th className="text-left px-4 py-3 font-semibold">CTR</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {adStats.map((a) => (
                <tr key={a.title} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{a.title}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{a.impressions.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{a.clicks.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-[#5ab0b6]">{a.ctr}%</td>
                  <td className="px-4 py-3.5"><StatusBadge status={a.status === 'active' ? 'ativo' : 'paused'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
