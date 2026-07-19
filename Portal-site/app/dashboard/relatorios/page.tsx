'use client';

import { useEffect, useState } from 'react';
import { FeatureGate } from '@/components/dashboard/FeatureGate';
import { Chart2, Receipt, Chart, TrendUp, TrendDown, Calendar, DollarCircle, Award, User } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';

type TabType = 'resumo' | 'caixa' | 'performance';
type Period = 'week' | 'month' | 'year' | 'custom';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const PAYMENT_LABELS: Record<string,string> = { pix:'PIX', dinheiro:'Dinheiro', credito:'Cartão Crédito', debito:'Cartão Débito', outro:'Outro' };

function getDateRange(period: Period, customStart?: string, customEnd?: string) {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now); d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  if (period === 'custom') return customStart || new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
}

function getDateRangeEnd(period: Period, customEnd?: string) {
  const now = new Date();
  if (period === 'custom' && customEnd) return customEnd;
  return now.toISOString().split('T')[0];
}

export default function RelatoriosPage() {
  const [tab, setTab] = useState<TabType>('resumo');
  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [chartMonths, setChartMonths] = useState<6 | 12>(6);
  const [loading, setLoading] = useState(true);

  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [byMethod, setByMethod] = useState<{method:string;amount:number;pct:number}[]>([]);
  const [topServices, setTopServices] = useState<{name:string;count:number;total:number}[]>([]);
  const [profPerformance, setProfPerformance] = useState<{name:string;apts:number;rev:number;comm:number;commPct:number}[]>([]);
  const [dailyFlow, setDailyFlow] = useState<{day:string;receita:number;despesa:number;net:number}[]>([]);
  const [chartData, setChartData] = useState<{label:string;receita:number;despesa:number}[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<{mes:string;receita:number;despesa:number}[]>([]);
  const [topClients, setTopClients] = useState<{name:string;total:number;visits:number}[]>([]);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customStart, customEnd]);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: estRaw } = await supabase.from('establishments').select('id').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string } | null;
    if (!est) { setLoading(false); return; }

    const startDate = getDateRange(period, customStart, customEnd);
    const endDate = getDateRangeEnd(period, customEnd);

    const [txRes, aptsRes, empRes] = await Promise.all([
      period === 'custom'
        ? (supabase as any).from('transactions').select('*').eq('establishment_id', est.id).gte('date', startDate).lte('date', endDate).order('date')
        : (supabase as any).from('transactions').select('*').eq('establishment_id', est.id).gte('date', startDate).order('date'),
      period === 'custom'
        ? (supabase as any).from('appointments').select('id,employee_id,service_id,status').eq('establishment_id', est.id).gte('date', startDate).lte('date', endDate)
        : (supabase as any).from('appointments').select('id,employee_id,service_id,status').eq('establishment_id', est.id).gte('date', startDate),
      supabase.from('employees').select('id,name,commission_type,commission_value').eq('establishment_id', est.id).eq('active', true),
    ]);

    const txs: any[] = txRes.data || [];
    const apts: any[] = aptsRes.data || [];
    const emps: any[] = empRes.data || [];

    // Totals
    const totalRevenue = txs.filter(t=>t.type==='receita'||t.type==='income').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    const totalExpenses = txs.filter(t=>t.type==='despesa'||t.type==='expense').reduce((s,t)=>s+parseFloat(t.amount||0),0);
    setRevenue(totalRevenue);
    setExpenses(totalExpenses);
    setAppointmentCount(apts.length);

    // By payment method
    const methodMap: Record<string,number> = {};
    txs.filter(t=>t.type==='receita'||t.type==='income').forEach(t => {
      const m = t.payment_method || 'outro';
      methodMap[m] = (methodMap[m]||0) + parseFloat(t.amount||0);
    });
    const methodEntries = Object.entries(methodMap).sort((a,b)=>b[1]-a[1]);
    setByMethod(methodEntries.map(([k,v])=>({ method: PAYMENT_LABELS[k]||k, amount: Math.round(v*100)/100, pct: totalRevenue>0?Math.round(v/totalRevenue*100):0 })));

    // Top services by appointment count
    const svcMap: Record<string,{count:number;name:string}> = {};
    apts.forEach(a => {
      if (a.service_id) svcMap[a.service_id] = { count: (svcMap[a.service_id]?.count||0)+1, name: a.service_id };
    });
    if (Object.keys(svcMap).length > 0) {
      const svcIds = Object.keys(svcMap);
      const { data: svcsData } = await supabase.from('services').select('id,name,price').in('id', svcIds);
      const svcs: any[] = svcsData || [];
      setTopServices(svcs.slice(0,5).map(s => ({
        name: s.name,
        count: svcMap[s.id]?.count||0,
        total: (svcMap[s.id]?.count||0) * parseFloat(s.price||0),
      })).sort((a,b)=>b.count-a.count));
    } else { setTopServices([]); }

    // Employee performance
    const empAptMap: Record<string,number> = {};
    apts.forEach(a => { if (a.employee_id) empAptMap[a.employee_id]=(empAptMap[a.employee_id]||0)+1; });
    const empRevMap: Record<string,number> = {};
    txs.filter(t=>(t.type==='receita'||t.type==='income')&&t.employee_id).forEach(t => {
      empRevMap[t.employee_id]=(empRevMap[t.employee_id]||0)+parseFloat(t.amount||0);
    });
    setProfPerformance(emps.map(e => {
      const rev = empRevMap[e.id]||0;
      const commPct = e.commission_type==='percentage' ? (parseFloat(e.commission_value)||0) : (rev>0?Math.round(parseFloat(e.commission_value||0)/rev*100):0);
      return { name: e.name, apts: empAptMap[e.id]||0, rev: Math.round(rev*100)/100, comm: Math.round(rev*commPct/100*100)/100, commPct };
    }).sort((a,b)=>b.apts-a.apts));

    // Daily flow
    const dayMap: Record<string,{receita:number;despesa:number}> = {};
    txs.forEach(t => {
      const d = (t.date||'').slice(0,10);
      if (!dayMap[d]) dayMap[d]={receita:0,despesa:0};
      if (t.type==='receita'||t.type==='income') dayMap[d].receita+=parseFloat(t.amount||0);
      else if (t.type==='despesa'||t.type==='expense') dayMap[d].despesa+=parseFloat(t.amount||0);
    });
    const flow = Object.entries(dayMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([d,v])=>({
      day: new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
      receita: Math.round(v.receita*100)/100,
      despesa: Math.round(v.despesa*100)/100,
      net: Math.round((v.receita-v.despesa)*100)/100,
    }));
    setDailyFlow(flow);
    setChartData(flow.map(r=>({ label: r.day, receita: r.receita, despesa: r.despesa })));

    // Monthly evolution chart (last 12 months)
    const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0];
    const { data: monthlyTxs } = await (supabase as any).from('transactions').select('type,amount,date').eq('establishment_id', est.id).gte('date', twelveMonthsAgo);
    const mMap: Record<string, { receita: number; despesa: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      mMap[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = { receita: 0, despesa: 0 };
    }
    (monthlyTxs || []).forEach((t: any) => {
      const key = t.date?.slice(0, 7);
      if (mMap[key]) {
        if (t.type === 'receita' || t.type === 'income') mMap[key].receita += parseFloat(t.amount || 0);
        else if (t.type === 'despesa' || t.type === 'expense') mMap[key].despesa += parseFloat(t.amount || 0);
      }
    });
    setMonthlyChart(Object.entries(mMap).map(([k, v]) => ({
      mes: MONTH_NAMES[parseInt(k.slice(5, 7)) - 1],
      receita: Math.round(v.receita),
      despesa: Math.round(v.despesa),
    })));

    // Top clients by spending
    const clientSpend: Record<string, number> = {};
    const clientVisits: Record<string, number> = {};
    txs.filter(t => t.type === 'receita' || t.type === 'income').forEach(t => {
      if (t.client_id) {
        clientSpend[t.client_id] = (clientSpend[t.client_id] || 0) + parseFloat(t.amount || 0);
      }
    });
    apts.forEach((a: any) => {
      if (a.client_id) clientVisits[a.client_id] = (clientVisits[a.client_id] || 0) + 1;
    });
    const topClientIds = Object.entries(clientSpend).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
    if (topClientIds.length > 0) {
      const { data: clientsData } = await supabase.from('clients').select('id,name').in('id', topClientIds);
      const clientNameMap: Record<string, string> = {};
      (clientsData || []).forEach((c: any) => { clientNameMap[c.id] = c.name; });
      setTopClients(topClientIds.map(id => ({
        name: clientNameMap[id] || 'Cliente',
        total: Math.round((clientSpend[id] || 0) * 100) / 100,
        visits: clientVisits[id] || 0,
      })));
    } else {
      // Fallback: top clients by visit count from appointments
      const visitClientIds = Object.entries(clientVisits).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
      if (visitClientIds.length > 0) {
        const { data: clientsData } = await supabase.from('clients').select('id,name').in('id', visitClientIds);
        const clientNameMap: Record<string, string> = {};
        (clientsData || []).forEach((c: any) => { clientNameMap[c.id] = c.name; });
        setTopClients(visitClientIds.map(id => ({
          name: clientNameMap[id] || 'Cliente',
          total: 0,
          visits: clientVisits[id] || 0,
        })));
      } else {
        setTopClients([]);
      }
    }

    setLoading(false);
  };

  const displayChart = chartMonths === 6 ? monthlyChart.slice(-6) : monthlyChart;

  const totalApts = profPerformance.reduce((s, e) => s + e.apts, 0);
  const totalProfRev = profPerformance.reduce((s, e) => s + e.rev, 0);
  const totalProfComm = profPerformance.reduce((s, e) => s + e.comm, 0);

  const tabBtn = (t: TabType, label: string, Icon: any) => (
    <button onClick={()=>setTab(t)} className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 font-bold text-sm transition-colors ${tab===t?'border-brand-primary text-brand-primary':'border-transparent text-gray-500 hover:text-gray-700'}`}>
      <Icon className="w-4 h-4" variant="Outline" /> {label}
    </button>
  );

  return (
    <FeatureGate featureKey="relatorios_basicos">
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Relatórios" />
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Desempenho</h1>
            <p className="text-gray-500 text-sm mt-1">Resultados reais do seu negócio</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              {([['week','7 Dias'],['month','Este Mês'],['year','Este Ano'],['custom','Personalizado']] as [Period,string][]).map(([p,l])=>(
                <button key={p} onClick={()=>setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period===p?'bg-brand-primary text-white':'text-gray-600 hover:bg-gray-50'}`}>{l}</button>
              ))}
            </div>
            {period === 'custom' && (
              <div className="flex gap-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm" />
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm" />
              </div>
            )}
          </div>
        </div>

        <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-2 pt-2">
          {tabBtn('resumo','Resumo',Chart2)}
          {tabBtn('caixa','Fluxo de Caixa',Receipt)}
          {tabBtn('performance','Performance',Chart)}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
        ) : (
          <div className="space-y-6">

            {tab === 'resumo' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label:'Receita', value:fmt(revenue), color:'border-t-green-500 text-green-500', Icon: TrendUp },
                    { label:'Despesas', value:fmt(expenses), color:'border-t-red-500 text-red-500', Icon: TrendDown },
                    { label:'Lucro Líquido', value:fmt(revenue-expenses), color:'border-t-brand-primary text-brand-primary', Icon: DollarCircle },
                    { label:'Agendamentos', value:String(appointmentCount), color:'border-t-brand-secondary text-brand-secondary', Icon: Calendar },
                  ].map(c=>(
                    <div key={c.label} className={`bg-white rounded-2xl p-5 border border-gray-100 border-t-4 ${c.color} shadow-sm`}>
                      <c.Icon className={`w-6 h-6 mb-2 ${c.color.split(' ')[1]}`} variant="Outline" />
                      <p className="text-gray-500 text-sm font-medium">{c.label}</p>
                      <p className={`text-2xl font-bold ${c.color.split(' ')[1]}`}>{c.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-50"><h3 className="font-bold text-gray-900">Receita por método de pagamento</h3></div>
                    {byMethod.length===0
                      ? <div className="p-6 text-center text-gray-400 text-sm">Nenhuma receita no período</div>
                      : <div className="p-5 space-y-4">{byMethod.map((m,i)=>(
                          <div key={i}>
                            <div className="flex justify-between mb-1"><span className="text-sm font-medium text-gray-700">{m.method}</span><span className="text-sm font-bold text-green-600">{fmt(m.amount)}</span></div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-brand-primary rounded-full" style={{width:`${m.pct}%`}} /></div>
                            <p className="text-xs text-gray-400 mt-0.5">{m.pct}%</p>
                          </div>
                        ))}</div>
                    }
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Serviços mais realizados</h3>
                      <Award className="w-5 h-5 text-amber-500" variant="Outline" />
                    </div>
                    {topServices.length===0
                      ? <div className="p-6 text-center text-gray-400 text-sm">Nenhum agendamento no período</div>
                      : <div className="divide-y divide-gray-50">{topServices.map((s,i)=>(
                          <div key={i} className="p-4 flex items-center gap-3 hover:bg-gray-50">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i===0?'bg-amber-100 text-amber-600':'bg-gray-100 text-gray-500'}`}>{i+1}</div>
                            <div className="flex-1"><p className="font-semibold text-gray-900 text-sm">{s.name}</p><p className="text-xs text-gray-400">{s.count} realizados</p></div>
                            <span className="text-sm font-bold text-green-600">{fmt(s.total)}</span>
                          </div>
                        ))}</div>
                    }
                  </div>
                </div>

                {/* Monthly evolution chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Evolução Mensal</h3>
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      {([6, 12] as const).map(n => (
                        <button key={n} onClick={() => setChartMonths(n)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${chartMonths === n ? 'bg-brand-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                          {n} meses
                        </button>
                      ))}
                    </div>
                  </div>
                  {displayChart.length === 0
                    ? <div className="p-10 text-center text-gray-400 text-sm">Sem dados</div>
                    : <div className="p-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={displayChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: any) => [fmt(Number(v)), '']} />
                            <Bar dataKey="receita" name="Receita" fill="#6666cc" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="despesa" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        {displayChart.length > 0 && (() => {
                          const best = [...displayChart].sort((a, b) => b.receita - a.receita)[0];
                          const worst = [...displayChart].filter(d => d.receita > 0).sort((a, b) => a.receita - b.receita)[0];
                          const avgReceita = displayChart.filter(d => d.receita > 0).reduce((s, d) => s + d.receita, 0) / (displayChart.filter(d => d.receita > 0).length || 1);
                          return (
                            <div className="grid grid-cols-3 gap-3 mt-4 px-2">
                              <div className="bg-green-50 rounded-xl p-3 text-center">
                                <TrendUp className="w-4 h-4 text-green-500 mx-auto mb-1" variant="Outline" />
                                <p className="text-xs text-gray-500">Melhor mês</p>
                                <p className="text-sm font-bold text-green-600">{best ? `${best.mes} (${fmt(best.receita)})` : '—'}</p>
                              </div>
                              <div className="bg-red-50 rounded-xl p-3 text-center">
                                <TrendDown className="w-4 h-4 text-red-500 mx-auto mb-1" variant="Outline" />
                                <p className="text-xs text-gray-500">Pior mês</p>
                                <p className="text-sm font-bold text-red-500">{worst ? `${worst.mes} (${fmt(worst.receita)})` : '—'}</p>
                              </div>
                              <div className="bg-brand-primary/5 rounded-xl p-3 text-center">
                                <p className="text-sm text-gray-500 mb-1">≈</p>
                                <p className="text-xs text-gray-500">Média mensal</p>
                                <p className="text-sm font-bold text-brand-primary">{fmt(Math.round(avgReceita))}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                  }
                </div>
              </div>
            )}

            {tab === 'caixa' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-50"><h3 className="font-bold text-gray-900">Gráfico de Fluxo</h3></div>
                  {chartData.length===0
                    ? <div className="p-10 text-center text-gray-400 text-sm">Nenhuma movimentação no período</div>
                    : <div className="p-4"><ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v:any)=>[fmt(Number(v)),'']} />
                          <Bar dataKey="receita" name="Receita" fill="#6666cc" radius={[4,4,0,0]} />
                          <Bar dataKey="despesa" name="Despesa" fill="#0BBDB6" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer></div>
                  }
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-50"><h3 className="font-bold text-gray-900">Movimentações por dia</h3></div>
                  {dailyFlow.length===0
                    ? <div className="p-8 text-center text-gray-400 text-sm">Nenhuma movimentação no período</div>
                    : <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead><tr className="bg-gray-50/60">
                            {['Data','Receita','Despesa','Resultado'].map(h=><th key={h} className="p-3 text-xs font-bold text-gray-500 uppercase">{h}</th>)}
                          </tr></thead>
                          <tbody className="divide-y divide-gray-50">
                            {dailyFlow.map((r,i)=>(
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="p-3 font-medium text-gray-900 text-sm">{r.day}</td>
                                <td className="p-3 text-green-600 font-semibold text-sm">{r.receita>0?fmt(r.receita):'-'}</td>
                                <td className="p-3 text-red-500 font-semibold text-sm">{r.despesa>0?fmt(r.despesa):'-'}</td>
                                <td className={`p-3 font-bold text-sm ${r.net>=0?'text-brand-primary':'text-red-500'}`}>{fmt(r.net)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                            <tr>
                              <td className="p-3 text-gray-900 text-sm">TOTAL</td>
                              <td className="p-3 text-green-600 text-sm">{fmt(revenue)}</td>
                              <td className="p-3 text-red-500 text-sm">{fmt(expenses)}</td>
                              <td className={`p-3 text-sm ${revenue-expenses>=0?'text-brand-primary':'text-red-500'}`}>{fmt(revenue-expenses)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                  }
                </div>
              </div>
            )}

            {tab === 'performance' && (
              <div className="space-y-6">

                {/* Performance Summary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total agendamentos', value: String(totalApts) },
                    { label: 'Receita total', value: fmt(totalProfRev) },
                    { label: 'Total comissões', value: fmt(totalProfComm) },
                    { label: 'Receita empresa', value: fmt(totalProfRev - totalProfComm) },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <p className="text-gray-500 text-sm font-medium">{kpi.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Top Clients */}
                {topClients.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Top Clientes</h3>
                      <Award className="w-5 h-5 text-amber-500" variant="Outline" />
                    </div>
                    <div className="divide-y divide-gray-50">
                      {topClients.map((c, i) => (
                        <div key={i} className="p-4 flex items-center gap-3 hover:bg-gray-50">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.visits} visita{c.visits !== 1 ? 's' : ''}</p>
                          </div>
                          {c.total > 0 && <span className="text-sm font-bold text-green-600">{fmt(c.total)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="font-bold text-gray-900 text-lg">Performance da Equipe</h3>
                {profPerformance.length===0
                  ? <div className="bg-white rounded-2xl p-10 text-center text-gray-400"><User className="w-12 h-12 mx-auto mb-3 opacity-30" variant="Outline" /><p>Nenhum profissional cadastrado</p></div>
                  : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {profPerformance.map((p,i)=>(
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-full bg-brand-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-brand-primary" variant="Outline" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.apts} agendamentos</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                              <p className="text-xs text-gray-400 mb-0.5">Receita</p>
                              <p className="font-bold text-green-600 text-sm">{fmt(p.rev)}</p>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                              <p className="text-xs text-amber-500 mb-0.5">Comissão</p>
                              <p className="font-bold text-amber-600 text-sm">{fmt(p.comm)}</p>
                            </div>
                          </div>
                          {p.commPct>0 && (
                            <div>
                              <div className="h-1.5 bg-brand-primary/20 rounded-full overflow-hidden flex">
                                <div className="h-full bg-amber-400" style={{width:`${Math.min(p.commPct,100)}%`}} />
                                <div className="h-full bg-brand-primary" style={{width:`${Math.max(100-p.commPct,0)}%`}} />
                              </div>
                              <p className="text-right text-xs text-gray-400 mt-1">Comissão {p.commPct}% · Empresa {100-p.commPct}%</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

          </div>
        )}
      </main>
    </div>
    </FeatureGate>
  );
}
