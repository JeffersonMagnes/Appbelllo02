'use client';

import { useEffect, useState } from 'react';
import { Profile2User, UserAdd, Award } from 'iconsax-react';
import { Loader2, ChevronDown } from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';

type Period = '12m' | '6m' | 'month' | 'year' | 'custom';
type ReportType = 'receita' | 'atendimentos';

const PERIODS: { key: Period; label: string }[] = [
  { key: '12m', label: 'Últimos 12 meses' },
  { key: '6m', label: 'Últimos 6 meses' },
  { key: 'month', label: 'Este mês' },
  { key: 'year', label: 'Este ano' },
  { key: 'custom', label: 'Personalizado' },
];

function getDateRange(period: Period, customStart?: string, customEnd?: string) {
  const now = new Date();
  let start: Date;
  switch (period) {
    case '12m': start = new Date(now); start.setMonth(start.getMonth() - 12); break;
    case '6m': start = new Date(now); start.setMonth(start.getMonth() - 6); break;
    case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'year': start = new Date(now.getFullYear(), 0, 1); break;
    case 'custom':
      start = customStart ? new Date(customStart + 'T00:00:00') : new Date(now.getFullYear(), 0, 1);
      return { start, end: customEnd ? new Date(customEnd + 'T23:59:59') : now };
  }
  return { start, end: now };
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type RankedClient = { id: string; name: string; value: number };

export default function TopClientesPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('12m');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportType, setReportType] = useState<ReportType>('receita');
  const [totalClients, setTotalClients] = useState(0);
  const [newClients, setNewClients] = useState(0);
  const [ranked, setRanked] = useState<RankedClient[]>([]);
  const [showPeriod, setShowPeriod] = useState(false);
  const [showType, setShowType] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: est } = await (supabase as any).from('establishments').select('id').eq('owner_id', user.id).maybeSingle() as { data: { id: string } | null };
      if (!est) { setLoading(false); return; }

      const { start, end } = getDateRange(period, customStart, customEnd);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      const [clientsRes, aptsRes, txsRes] = await Promise.all([
        (supabase as any).from('clients').select('id, name, created_at').eq('establishment_id', est.id),
        (supabase as any).from('appointments').select('id, client_id, client_name, status, date').eq('establishment_id', est.id).gte('date', startStr).lte('date', endStr),
        (supabase as any).from('transactions').select('id, client_id, amount, date').eq('establishment_id', est.id).eq('type', 'income').gte('date', startStr).lte('date', endStr),
      ]);

      const clients = clientsRes.data || [];
      const apts = aptsRes.data || [];
      const txs = txsRes.data || [];

      setTotalClients(clients.length);
      setNewClients(clients.filter((c: any) => c.created_at && c.created_at >= startStr).length);

      const clientMap = Object.fromEntries(clients.map((c: any) => [c.id, c.name]));

      if (reportType === 'receita') {
        const revenueMap: Record<string, number> = {};
        txs.forEach((t: any) => {
          if (t.client_id) revenueMap[t.client_id] = (revenueMap[t.client_id] || 0) + parseFloat(t.amount || 0);
        });
        apts.filter((a: any) => a.status === 'completed' || a.status === 'concluido').forEach((a: any) => {
          if (a.client_id && !revenueMap[a.client_id]) revenueMap[a.client_id] = 0;
        });
        const list = Object.entries(revenueMap)
          .map(([id, value]) => ({ id, name: clientMap[id] || (apts.find((a: any) => a.client_id === id) as any)?.client_name || 'Cliente', value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 30);
        setRanked(list);
      } else {
        const countMap: Record<string, number> = {};
        apts.forEach((a: any) => {
          if (a.client_id) countMap[a.client_id] = (countMap[a.client_id] || 0) + 1;
        });
        const list = Object.entries(countMap)
          .map(([id, value]) => ({ id, name: clientMap[id] || (apts.find((a: any) => a.client_id === id) as any)?.client_name || 'Cliente', value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 30);
        setRanked(list);
      }

      setLoading(false);
    };
    load();
  }, [period, reportType, customStart, customEnd]);

  const { start, end } = getDateRange(period, customStart, customEnd);
  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? '';
  const dateRange = `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Top Clientes" />
      <main className="flex-1 p-4 sm:p-6 max-w-4xl space-y-5">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Total de Clientes</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{totalClients}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#5333ED]/10 flex items-center justify-center">
              <Profile2User className="w-6 h-6 text-[#5333ED]" variant="Outline" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Novos Clientes</p>
              <p className="text-3xl font-black text-[#0BBDB6] mt-1">{newClients}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#0BBDB6]/10 flex items-center justify-center">
              <UserAdd className="w-6 h-6 text-[#0BBDB6]" variant="Outline" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          {/* Period */}
          <div className="relative flex-1 w-full">
            <p className="text-xs font-semibold text-[#5333ED] mb-1">Selecione o período</p>
            <button onClick={() => { setShowPeriod(!showPeriod); setShowType(false); }}
              className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>({periodLabel}) {dateRange}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPeriod ? 'rotate-180' : ''}`} />
            </button>
            {showPeriod && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
                {PERIODS.map(p => (
                  <button key={p.key} onClick={() => { setPeriod(p.key); setShowPeriod(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm ${period === p.key ? 'bg-[#5333ED]/5 text-[#5333ED] font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            {period === 'custom' && (
              <div className="flex gap-2 mt-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm" />
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm" />
              </div>
            )}
          </div>

          {/* Type */}
          <div className="relative flex-1 w-full">
            <p className="text-xs font-semibold text-[#5333ED] mb-1">Selecione o tipo de relatório</p>
            <button onClick={() => { setShowType(!showType); setShowPeriod(false); }}
              className="w-full h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>{reportType === 'receita' ? 'Por Receita' : 'Por Número de Atendimentos'}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showType ? 'rotate-180' : ''}`} />
            </button>
            {showType && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
                <button onClick={() => { setReportType('receita'); setShowType(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm ${reportType === 'receita' ? 'bg-[#5333ED]/5 text-[#5333ED] font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                  Por Receita
                </button>
                <button onClick={() => { setReportType('atendimentos'); setShowType(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm ${reportType === 'atendimentos' ? 'bg-[#5333ED]/5 text-[#5333ED] font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                  Por Número de Atendimentos
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <p className="text-center text-sm font-semibold text-gray-900">
          Rank top 30 melhores clientes {reportType === 'receita' ? 'por receita' : 'por atendimentos'}.
          <br />
          <span className="text-gray-400 font-normal">De {dateRange}</span>
        </p>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#5333ED]" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[50px_1fr_120px] px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <span className="text-xs font-bold text-gray-500">#</span>
              <span className="text-xs font-bold text-gray-500">Nome</span>
              <span className="text-xs font-bold text-gray-500 text-right">{reportType === 'receita' ? 'Receita' : 'Atendimentos'}</span>
            </div>
            {ranked.length === 0 ? (
              <div className="py-16 text-center">
                <Profile2User className="w-8 h-8 text-gray-300 mx-auto mb-2" variant="Outline" />
                <p className="text-sm text-gray-400">Nenhum dado para este período.</p>
              </div>
            ) : (
              ranked.map((client, i) => (
                <div key={client.id}
                  className={`grid grid-cols-[50px_1fr_120px] px-4 py-3.5 items-center border-b border-gray-50 ${i < 3 ? 'bg-[#5333ED]/[0.02]' : ''}`}>
                  <span className={`text-sm font-bold ${i === 0 ? 'text-amber-600' : i === 1 ? 'text-gray-500' : i === 2 ? 'text-orange-700' : 'text-gray-400'}`}>
                    {i + 1} º
                  </span>
                  <span className={`text-sm ${i < 3 ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{client.name}</span>
                  <span className={`text-sm font-semibold text-right ${i < 3 ? 'text-[#5333ED]' : 'text-gray-900'}`}>
                    {reportType === 'receita' ? fmt(client.value) : `${client.value}`}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
