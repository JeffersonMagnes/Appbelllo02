'use client';

import { useEffect, useState } from 'react';
import { FeatureGate } from '@/components/dashboard/FeatureGate';
import { Add, TrendUp as TrendingUp, TrendDown as TrendingDown, DollarCircle, Money, Mobile, Card, Warning2 } from 'iconsax-react';
import { Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/dashboard/Header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import type { Transaction } from '@/lib/supabase/types';

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  credito: 'Cartão Crédito',
  debito: 'Cartão Débito',
  pix: 'PIX',
  misto: 'Misto',
  outro: 'Outro',
};

const METHOD_META: Record<string, { Icon: any; color: string }> = {
  pix: { Icon: Mobile, color: '#0BBDB6' },
  credito: { Icon: Card, color: '#7C3AED' },
  debito: { Icon: Card, color: '#3B82F6' },
  dinheiro: { Icon: Money, color: '#22C55E' },
  outro: { Icon: DollarCircle, color: '#9CA3AF' },
  misto: { Icon: DollarCircle, color: '#F59E0B' },
};

const DEFAULT_FEES: Record<string, number> = { pix: 0, dinheiro: 0, credito: 3.5, debito: 1.5 };

type ChartMonth = { mes: string; receitas: number; despesas: number };
type Period = 'hoje' | 'semana' | 'mes' | 'custom';

export default function FinanceiroPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [estId, setEstId] = useState('');
  const [filter, setFilter] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [period, setPeriod] = useState<Period>('mes');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chartData, setChartData] = useState<ChartMonth[]>([]);
  const [fees, setFees] = useState<Record<string, number>>(DEFAULT_FEES);
  const [form, setForm] = useState({ type: 'income', amount: '', description: '', payment_method: 'pix', date: new Date().toISOString().split('T')[0] });

  const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: estRaw } = await supabase.from('establishments').select('id, payment_fees').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string; payment_fees?: Record<string, string> } | null;
    if (!est) return;
    setEstId(est.id);
    if (est.payment_fees) {
      const parsed: Record<string, number> = {};
      for (const [k, v] of Object.entries(est.payment_fees)) {
        parsed[k] = parseFloat(v as string) || 0;
      }
      setFees({ ...DEFAULT_FEES, ...parsed });
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 4, 1).toISOString().split('T')[0];

    const [txRes, chartRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('establishment_id', est.id).order('date', { ascending: false }).limit(200),
      (supabase as any).from('transactions').select('type,amount,date').eq('establishment_id', est.id).gte('date', startDate),
    ]);

    setAllTransactions(txRes.data || []);

    const monthMap: Record<string, { receitas: number; despesas: number }> = {};
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { receitas: 0, despesas: 0 };
    }
    const CASH_CATS = ['abertura', 'fechamento', 'sangria', 'reforco'];
    (chartRes.data || []).forEach((t: any) => {
      if (CASH_CATS.includes(t.category)) return;
      const key = t.date?.slice(0, 7);
      if (monthMap[key]) {
        if ((t.type as string) === 'receita' || (t.type as string) === 'income') monthMap[key].receitas += parseFloat(t.amount || 0);
        else monthMap[key].despesas += parseFloat(t.amount || 0);
      }
    });
    const chart = Object.entries(monthMap).map(([k, v]) => ({
      mes: MONTH_NAMES[parseInt(k.slice(5, 7)) - 1],
      receitas: Math.round(v.receitas),
      despesas: Math.round(v.despesas),
    }));
    setChartData(chart);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Filter by period
  const getPeriodStart = (): string => {
    const now = new Date();
    if (period === 'hoje') return now.toISOString().split('T')[0];
    if (period === 'semana') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    }
    if (period === 'custom') return customStart || new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  };

  const getPeriodEnd = (): string => {
    if (period === 'custom' && customEnd) return customEnd;
    return new Date().toISOString().split('T')[0];
  };

  const periodStart = getPeriodStart();
  const periodEnd = getPeriodEnd();
  const CASH_CATS = ['abertura', 'fechamento', 'sangria', 'reforco'];
  const periodTransactions = (period === 'custom'
    ? allTransactions.filter(t => t.date >= periodStart && t.date <= periodEnd)
    : allTransactions.filter(t => t.date >= periodStart)
  ).filter(t => !CASH_CATS.includes((t as any).category));
  const displayTransactions = periodTransactions.filter(t => {
    if (filter === 'todos') return true;
    if (filter === 'receita') return (t.type as string) === 'receita' || (t.type as string) === 'income';
    if (filter === 'despesa') return (t.type as string) === 'despesa' || (t.type as string) === 'expense';
    return false;
  });

  const totalReceitas = periodTransactions.filter(t => (t.type as string) === 'receita' || (t.type as string) === 'income').reduce((s, t) => s + t.amount, 0);
  const totalDespesas = periodTransactions.filter(t => (t.type as string) === 'despesa' || (t.type as string) === 'expense').reduce((s, t) => s + t.amount, 0);
  const lucro = totalReceitas - totalDespesas;

  // Income by method
  const incomeByMethod: Record<string, number> = {};
  periodTransactions.filter(t => (t.type as string) === 'receita' || (t.type as string) === 'income').forEach(t => {
    const m = t.payment_method || 'outro';
    incomeByMethod[m] = (incomeByMethod[m] || 0) + t.amount;
  });
  const methodEntries = Object.entries(incomeByMethod).sort((a, b) => b[1] - a[1]);

  // Fees calculation
  let totalFees = 0;
  for (const [method, amount] of methodEntries) {
    const feeRate = fees[method] || 0;
    totalFees += (amount * feeRate) / 100;
  }
  const netRevenue = totalReceitas - totalFees;

  const handleSave = async () => {
    if (!form.amount || !form.date) return;
    setSaving(true);
    const supabase = createClient();
    await (supabase as any).from('transactions').insert({ type: form.type, amount: parseFloat(form.amount), description: form.description || null, payment_method: form.payment_method, date: form.date, establishment_id: estId });
    setSaving(false);
    setShowForm(false);
    setForm({ type: 'income', amount: '', description: '', payment_method: 'pix', date: new Date().toISOString().split('T')[0] });
    load();
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <FeatureGate featureKey="financeiro">
    <div className="flex flex-col min-h-screen">
      <Header title="Financeiro" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">

        {/* Period selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
              {([
                { v: 'hoje' as Period, l: 'Hoje' },
                { v: 'semana' as Period, l: 'Semana' },
                { v: 'mes' as Period, l: 'Mês' },
                { v: 'custom' as Period, l: 'Personalizado' },
              ]).map(p => (
                <button key={p.v} onClick={() => setPeriod(p.v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p.v ? 'bg-brand-primary text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                  {p.l}
                </button>
              ))}
            </div>
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

        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" variant="Outline" /></div>
              <div className="text-sm text-gray-500">Receitas</div>
            </div>
            <div className="text-2xl font-extrabold text-green-600">{fmt(totalReceitas)}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-500" variant="Outline" /></div>
              <div className="text-sm text-gray-500">Despesas</div>
            </div>
            <div className="text-2xl font-extrabold text-red-500">{fmt(totalDespesas)}</div>
          </div>
          <div className={`bg-white rounded-2xl p-5 border-2 shadow-sm ${lucro >= 0 ? 'border-green-100' : 'border-red-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lucro >= 0 ? 'bg-brand-primary/10' : 'bg-red-50'}`}>
                <DollarCircle className={`w-5 h-5 ${lucro >= 0 ? 'text-brand-primary' : 'text-red-500'}`} />
              </div>
              <div className="text-sm text-gray-500">Lucro Líquido</div>
            </div>
            <div className={`text-2xl font-extrabold ${lucro >= 0 ? 'text-brand-primary' : 'text-red-500'}`}>{fmt(lucro)}</div>
          </div>
        </div>

        {/* Fees card */}
        {totalFees > 0 && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Warning2 className="w-5 h-5 text-amber-600" variant="Outline" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Taxas de máquina / PIX</p>
              <p className="text-xs text-gray-600">Total de taxas descontadas no período</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-amber-600">-{fmt(totalFees)}</p>
              <p className="text-xs text-gray-500">Líquido: {fmt(netRevenue)}</p>
            </div>
          </div>
        )}

        {/* Income by payment method */}
        {methodEntries.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Entradas por Método</h3>
            <div className="space-y-3">
              {methodEntries.map(([method, amount]) => {
                const meta = METHOD_META[method] || METHOD_META.outro;
                const Icon = meta.Icon;
                const pct = totalReceitas > 0 ? (amount / totalReceitas) * 100 : 0;
                const feeRate = fees[method] || 0;
                const feeAmount = (amount * feeRate) / 100;
                return (
                  <div key={method} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.color + '15' }}>
                      <Icon className="w-4.5 h-4.5" style={{ color: meta.color }} variant="Outline" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{paymentLabels[method] || method}</span>
                        <span className="text-sm font-bold text-gray-900">{fmt(amount)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{pct.toFixed(1)}% do total</span>
                        {feeRate > 0 && (
                          <span className="text-xs text-amber-600">Taxa {feeRate}% = -{fmt(feeAmount)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Receitas vs Despesas (últimos 5 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, '']} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="#6666cc" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#7ccad0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-50">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(['todos', 'receita', 'despesa'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-white shadow text-brand-primary' : 'text-gray-500'}`}>
                  {f === 'todos' ? 'Todos' : f === 'receita' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowForm(true)} className="gradient-primary text-white border-0 rounded-xl h-9 text-sm">
              <Add className="w-4 h-4 mr-1" variant="Outline" /> Registrar
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-brand-primary animate-spin" /></div>
          ) : displayTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <DollarCircle className="w-12 h-12 mx-auto mb-3 opacity-30" variant="Outline" />
              <p className="font-medium">Nenhuma transação no período</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {displayTransactions.map((t) => {
                const isReceita = (t.type as string) === 'receita' || (t.type as string) === 'income';
                return (
                  <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isReceita ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isReceita ? <ArrowUpCircle className="w-5 h-5 text-green-600" /> : <ArrowDownCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{t.description || (isReceita ? 'Receita' : 'Despesa')}</div>
                      <div className="text-xs text-gray-500 flex gap-2">
                        <span>{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        {t.payment_method && <span>• {paymentLabels[t.payment_method] || t.payment_method}</span>}
                      </div>
                    </div>
                    <div className={`font-bold text-sm flex-shrink-0 ${isReceita ? 'text-green-600' : 'text-red-500'}`}>
                      {isReceita ? '+' : '-'}{fmt(t.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-xl">Registrar Transação</h3>
              <div className="space-y-3">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {[{ v: 'income', l: 'Receita' }, { v: 'expense', l: 'Despesa' }].map((o) => (
                    <button key={o.v} onClick={() => setForm({ ...form, type: o.v })} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.type === o.v ? 'bg-white shadow text-brand-primary' : 'text-gray-500'}`}>{o.l}</button>
                  ))}
                </div>
                <div><Label className="text-gray-700 font-medium text-sm">Valor (R$) *</Label><Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div><Label className="text-gray-700 font-medium text-sm">Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div><Label className="text-gray-700 font-medium text-sm">Forma de pagamento</Label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-brand-primary">
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="credito">Cartão Crédito</option>
                    <option value="debito">Cartão Débito</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div><Label className="text-gray-700 font-medium text-sm">Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-primary text-white border-0 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </FeatureGate>
  );
}
