import { toLocalDateStr } from '@/lib/utils/date';
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, Dimensions, ActivityIndicator, TextInput,
} from 'react-native';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2, TrendUp, TrendDown, Profile2User, Calendar, Star1, Award, Chart, Chart2, Receipt, User, Card, Money, Mobile, ArrangeHorizontal, DollarCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import type { Transaction } from '@/lib/types';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useEmployees } from '@/lib/hooks/use-employees';
import { useServices } from '@/lib/hooks/use-services';
import { useClients } from '@/lib/hooks/use-clients';
import { useAuthStore } from '@/lib/state/auth-store';

const { width: SW } = Dimensions.get('window');
type TabType = 'resumo' | 'caixa' | 'performance';
type ReportPeriod = 'week' | 'month' | 'year' | 'custom';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtK = (v: number) => v >= 1000 ? `R$${(v/1000).toFixed(0)}mil` : fmt(v);

function isInPeriod(dateStr: string, period: ReportPeriod, customStart?: string, customEnd?: string): boolean {
  const d = new Date(dateStr), now = new Date();
  if (period === 'week') { const w = new Date(now); w.setDate(now.getDate()-7); return d >= w; }
  if (period === 'month') return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  if (period === 'custom') {
    const start = customStart ? new Date(customStart + 'T00:00:00') : new Date(now.getFullYear(), 0, 1);
    const end = customEnd ? new Date(customEnd + 'T23:59:59') : now;
    return d >= start && d <= end;
  }
  return d.getFullYear()===now.getFullYear();
}

// Categorias de caixa que NÃO entram no P&L (receitas/despesas reais)
const CASH_REGISTER_CATS = ['abertura', 'fechamento', 'sangria', 'reforco'];

// Últimos N meses para gráfico
function getMonthlyData(n: number, transactions: { date: string; type: string; status: string; amount: number; category: string }[]) {
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n-1-i), 1);
    const income  = transactions.filter(t => {
      const td = new Date(t.date);
      return t.type==='income' && t.status==='paid' && !CASH_REGISTER_CATS.includes(t.category) && td.getMonth()===d.getMonth() && td.getFullYear()===d.getFullYear();
    }).reduce((s,t)=>s+t.amount,0);
    const expense = transactions.filter(t => {
      const td = new Date(t.date);
      return t.type==='expense' && t.status==='paid' && !CASH_REGISTER_CATS.includes(t.category) && td.getMonth()===d.getMonth() && td.getFullYear()===d.getFullYear();
    }).reduce((s,t)=>s+t.amount,0);
    return { month: months[d.getMonth()], income, expense, net: income-expense };
  });
}

// Fluxo diário do período
function getDailyFlow(period: ReportPeriod, transactions: { date: string; type: string; status: string; amount: number; category: string }[], customStart?: string, customEnd?: string) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  if (period==='week') { startDate=new Date(now); startDate.setDate(now.getDate()-7); }
  else if (period==='month') { startDate=new Date(now.getFullYear(), now.getMonth(), 1); }
  else if (period==='custom') {
    startDate = customStart ? new Date(customStart + 'T00:00:00') : new Date(now.getFullYear(), 0, 1);
    endDate = customEnd ? new Date(customEnd + 'T23:59:59') : now;
  }
  else { startDate=new Date(now.getFullYear(), 0, 1); }

  const byDay: Record<string, {income:number; expense:number}> = {};
  transactions.forEach(t => {
    if (CASH_REGISTER_CATS.includes(t.category)) return;
    const d = new Date(t.date);
    if (d < startDate || d > endDate) return;
    const key = t.date.split('T')[0];
    if (!byDay[key]) byDay[key] = { income:0, expense:0 };
    if (t.type==='income' && t.status==='paid') byDay[key].income += t.amount;
    if (t.type==='expense' && t.status==='paid') byDay[key].expense += t.amount;
  });

  return Object.entries(byDay)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      day: parseInt(date.split('-')[2]),
      income: vals.income,
      expense: vals.expense,
      net: vals.income - vals.expense,
    }));
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────────
function BarChartCustom({
  data, colorIncome, colorExpense, showExpense = false,
}: {
  data: { month: string; income: number; expense: number }[];
  colorIncome: string; colorExpense: string; showExpense?: boolean;
}) {
  const maxVal = Math.max(...data.map(d => Math.max(d.income, showExpense ? d.expense : 0)), 1);
  const BAR_H = 130;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_H + 32, paddingHorizontal: 4 }}>
      {data.map((d, i) => {
        const incH = Math.max((d.income / maxVal) * BAR_H, d.income > 0 ? 4 : 0);
        const expH = Math.max((d.expense / maxVal) * BAR_H, d.expense > 0 ? 4 : 0);
        const isLast = i === data.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            {/* Valor no topo */}
            {d.income > 0 && (
              <Text style={{ fontSize: 7, color: colors.textMuted, marginBottom: 2, textAlign: 'center' }} numberOfLines={1}>
                {fmtK(d.income)}
              </Text>
            )}
            {/* Barras */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
              {/* Receita */}
              <View style={{
                width: showExpense ? 8 : 16,
                height: incH,
                borderRadius: 3,
                backgroundColor: isLast ? colorIncome : colorIncome + 'AA',
              }} />
              {/* Despesa */}
              {showExpense && (
                <View style={{
                  width: 8,
                  height: expH,
                  borderRadius: 3,
                  backgroundColor: colorExpense + 'CC',
                }} />
              )}
            </View>
            {/* Label mês */}
            <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4 }}>{d.month}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Tela Principal ─────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const router = useRouter();
  const [tab, setTab]       = useState<TabType>('resumo');
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [chartView, setChartView] = useState<'6m' | 'year'>('6m');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(establishmentId ?? undefined);
  const { data: mockAppointments = [], isLoading: isLoadingAppointments } = useAppointments(establishmentId ?? undefined);
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees(establishmentId ?? undefined);
  const { data: services = [], isLoading: isLoadingServices } = useServices(establishmentId ?? undefined);
  const { data: clients = [], isLoading: isLoadingClients } = useClients(establishmentId ?? undefined);

  const isLoading = isLoadingTransactions || isLoadingAppointments || isLoadingEmployees || isLoadingServices || isLoadingClients;

  const periodAppointments = mockAppointments.filter(a => isInPeriod(a.date, period, customStart, customEnd));
  const periodTransactions = transactions.filter(t => isInPeriod(t.date, period, customStart, customEnd));

  const revenue  = periodTransactions.filter(t=>t.type==='income' && t.status==='paid' && !CASH_REGISTER_CATS.includes(t.category)).reduce((s,t)=>s+t.amount,0);
  const expenses = periodTransactions.filter(t=>t.type==='expense' && t.status==='paid' && !CASH_REGISTER_CATS.includes(t.category)).reduce((s,t)=>s+t.amount,0);
  const net      = revenue - expenses;


  const monthlyData = getMonthlyData(chartView === '6m' ? 6 : 12, transactions);
  const dailyFlow   = getDailyFlow(period, transactions, customStart, customEnd);

  const bestMonth  = [...monthlyData].sort((a,b)=>b.income-a.income)[0];
  const worstMonth = [...monthlyData].filter(d=>d.income>0).sort((a,b)=>a.income-b.income)[0];
  const avgIncome  = monthlyData.filter(d=>d.income>0).reduce((s,d)=>s+d.income,0) / (monthlyData.filter(d=>d.income>0).length||1);

  // Performance por profissional
  const profPerf = employees
    .filter(e => e.role === 'professional')
    .map(emp => {
      const apts = periodAppointments.filter(a => a.professionalId === emp.id);
      const rev = apts.filter(a=>a.status==='completed').reduce((s,a)=>{
        const svc = services.find(sv=>sv.id===a.serviceId);
        return s + (svc?.price||0);
      }, 0);
      const empTxs = transactions.filter(t => t.type === 'income' && t.employeeId === emp.id);
      const empRevenue = empTxs.reduce((s, t) => s + t.amount, 0);
      const comm = (emp as any).commissionType === 'percentage'
        ? empRevenue * (((emp as any).commissionValue ?? 0) / 100)
        : ((emp as any).commissionValue ?? 0) * empTxs.length;
      return { ...emp, apts: apts.length, rev, comm, compRev: rev-comm };
    }).sort((a,b)=>b.rev-a.rev);

  const totalApts  = profPerf.reduce((s,e)=>s+e.apts,0);
  const totalRev   = profPerf.reduce((s,e)=>s+e.rev,0);
  const totalComm  = profPerf.reduce((s,e)=>s+e.comm,0);
  const totalComp  = totalRev - totalComm;

  // Serviços mais vendidos
  const svcRanking = services.map(s=>{
    const count = periodAppointments.filter(a=>a.serviceId===s.id).length;
    return { ...s, count, total: count*s.price };
  }).filter(s=>s.count>0).sort((a,b)=>b.count-a.count);

  // Incomes por método
  const byMethod = periodTransactions.filter(t=>t.type==='income'&&t.status==='paid')
    .reduce((acc,t)=>{ acc[t.paymentMethod]=(acc[t.paymentMethod]||0)+t.amount; return acc; }, {} as Record<string,number>);

  const TABS: { id: TabType; icon: React.ReactNode; label: string }[] = [
    { id:'resumo',      icon:<Chart2 size={20} />,  label:'Resumo'     },
    { id:'caixa',       icon:<Receipt size={20} />,   label:'Fluxo de Caixa' },
    { id:'performance', icon:<Chart size={20} />, label:'Performance'},
  ];

  const PERIOD_LABELS: Record<ReportPeriod,string> = { week:'7 dias', month:'Este mês', year:'Este ano', custom:'Personalizado' };

  const methodLabel = (m:string) => ({ pix:'PIX',credit:'Crédito',debit:'Débito',cash:'Dinheiro',transfer:'Transferência' }[m]??m);
  const methodIcon  = (m:string) => {
    if (m==='pix')    return <Mobile size={14} color={colors.textMuted}/>;
    if (m==='credit'||m==='debit') return <Card size={14} color={colors.textMuted}/>;
    if (m==='cash')   return <Money size={14} color={colors.textMuted}/>;
    return <ArrangeHorizontal size={14} color={colors.textMuted} variant="Outline" />;
  };

  return (
    <FeatureGate featureKey="relatorios_basicos">
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>

        {/* Header */}
        <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable onPress={()=>router.back()}
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.backgroundCard }}>
              <ArrowLeft2 size={24} color={colors.textPrimary}  variant="Outline" />
            </Pressable>
            <Text className="text-gray-900 text-xl font-bold">Relatórios</Text>
          </View>

          {/* Period pill */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row bg-white rounded-xl border border-gray-100 p-0.5">
              {(['week','month','year','custom'] as ReportPeriod[]).map(p => (
                <Pressable key={p} onPress={()=>{ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeriod(p); }}
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: period===p ? colors.primary : 'transparent' }}>
                  <Text style={{ color: period===p ? '#fff' : colors.textMuted, fontSize: 11, fontWeight:'600' }}>
                    {PERIOD_LABELS[p]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Custom date inputs */}
        {period === 'custom' && (
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 }}>
            <TextInput
              value={customStart}
              onChangeText={setCustomStart}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, backgroundColor: colors.backgroundCard, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
            />
            <TextInput
              value={customEnd}
              onChangeText={setCustomEnd}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, backgroundColor: colors.backgroundCard, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
            />
          </View>
        )}

        {/* Tabs */}
        <View className="flex-row border-b border-gray-100 bg-white">
          {TABS.map(t => (
            <Pressable key={t.id} onPress={()=>{ Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t.id); }}
              className="flex-1 items-center py-3 gap-1">
              <View style={{ color: tab===t.id ? colors.primary : colors.textMuted } as any}>
                {React.cloneElement(t.icon as any, { color: tab===t.id ? colors.primary : colors.textMuted })}
              </View>
              <Text style={{ fontSize: 10, fontWeight:'600', color: tab===t.id ? colors.primary : colors.textMuted }}>
                {t.label}
              </Text>
              {tab===t.id && (
                <View style={{ position:'absolute', bottom:0, left:'20%', right:'20%', height:2, backgroundColor:colors.primary, borderRadius:1 }} />
              )}
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

          {/* ── TAB: RESUMO ─────────────────────────────────────────────── */}
          {tab === 'resumo' && (
            <Animated.View entering={FadeInDown.duration(300)}>

              {/* KPI Cards */}
              <View className="px-5 pt-4 mb-4">
                <View className="flex-row mb-3 gap-3">
                  <View className="flex-1 p-4 rounded-2xl bg-white">
                    <TrendUp size={16} color="#6666cc" variant="Outline" />
                    <Text className="text-xs mt-2 text-gray-400">Receita</Text>
                    <Text className="font-bold text-lg mt-0.5 text-gray-900" numberOfLines={1} adjustsFontSizeToFit>{fmt(revenue)}</Text>
                  </View>
                  <View className="flex-1 p-4 rounded-2xl bg-white">
                    <TrendDown size={16} color="#6666cc" variant="Outline" />
                    <Text className="text-xs mt-2 text-gray-400">Despesas</Text>
                    <Text className="font-bold text-lg mt-0.5 text-gray-900" numberOfLines={1} adjustsFontSizeToFit>{fmt(expenses)}</Text>
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1 p-4 rounded-2xl bg-white">
                    <DollarCircle size={16} color="#6666cc" variant="Outline" />
                    <Text className="text-xs mt-2 text-gray-400">Lucro líquido</Text>
                    <Text className="font-bold text-lg mt-0.5 text-gray-900" numberOfLines={1} adjustsFontSizeToFit>{fmt(net)}</Text>
                  </View>
                  <View className="flex-1 p-4 rounded-2xl bg-white">
                    <Calendar size={16} color="#6666cc" variant="Outline" />
                    <Text className="text-xs mt-2 text-gray-400">Agendamentos</Text>
                    <Text className="font-bold text-lg mt-0.5 text-gray-900">{periodAppointments.length}</Text>
                  </View>
                </View>
              </View>

              {/* Gráfico mensal */}
              <View className="mx-5 mb-4 p-4 rounded-2xl" style={{ backgroundColor:colors.backgroundCard }}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-bold text-gray-900">Evolução da receita</Text>
                  <View className="flex-row gap-1 p-0.5 rounded-lg" style={{ backgroundColor:colors.surface }}>
                    {(['6m','year'] as const).map(v=>(
                      <Pressable key={v} onPress={()=>setChartView(v)}
                        className="px-2.5 py-1 rounded-md"
                        style={{ backgroundColor: chartView===v ? colors.primary : 'transparent' }}>
                        <Text style={{ fontSize:11, fontWeight:'600', color: chartView===v ? '#fff' : colors.textMuted }}>
                          {v==='6m' ? '6 meses' : '12 meses'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Destaque melhor/pior/média */}
                <View className="flex-row mb-4 gap-2">
                  <View className="flex-1 items-center p-2 rounded-xl" style={{ backgroundColor: colors.surface }}>
                    <TrendUp size={12} color={colors.textMuted} variant="Outline" />
                    <Text style={{ fontSize:9, color:colors.textMuted, marginTop:2 }}>Melhor mês</Text>
                    <Text style={{ fontSize:11, fontWeight:'800', color:colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{bestMonth ? fmtK(bestMonth.income) : '—'}</Text>
                  </View>
                  <View className="flex-1 items-center p-2 rounded-xl" style={{ backgroundColor: colors.surface }}>
                    <TrendDown size={12} color={colors.textMuted} variant="Outline" />
                    <Text style={{ fontSize:9, color:colors.textMuted, marginTop:2 }}>Pior mês</Text>
                    <Text style={{ fontSize:11, fontWeight:'800', color:colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{worstMonth ? fmtK(worstMonth.income) : '—'}</Text>
                  </View>
                  <View className="flex-1 items-center p-2 rounded-xl" style={{ backgroundColor: colors.surface }}>
                    <Text style={{ fontSize:11, color:colors.textMuted }}>≈</Text>
                    <Text style={{ fontSize:9, color:colors.textMuted, marginTop:2 }}>Média mensal</Text>
                    <Text style={{ fontSize:11, fontWeight:'800', color:colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{fmtK(avgIncome)}</Text>
                  </View>
                </View>

                {/* Barra de receita */}
                <Text className="text-xs font-semibold text-gray-500 mb-2">Receita</Text>
                <BarChartCustom data={monthlyData} colorIncome={colors.success} colorExpense={colors.error} />

                {/* Barra receita x despesa */}
                <Text className="text-xs font-semibold text-gray-500 mt-4 mb-2">Receita × Despesa</Text>
                <BarChartCustom data={monthlyData} colorIncome={colors.success} colorExpense={colors.error} showExpense />

                <View className="flex-row gap-4 mt-2">
                  <View className="flex-row items-center gap-1">
                    <View style={{ width:10, height:10, borderRadius:2, backgroundColor:colors.success+'AA' }} />
                    <Text style={{ fontSize:10, color:colors.textMuted }}>Receita</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <View style={{ width:10, height:10, borderRadius:2, backgroundColor:colors.error+'CC' }} />
                    <Text style={{ fontSize:10, color:colors.textMuted }}>Despesa</Text>
                  </View>
                </View>
              </View>

              {/* Por método de pagamento */}
              <View className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ backgroundColor:colors.backgroundCard }}>
                <View className="px-4 py-3 border-b border-gray-100">
                  <Text className="font-bold text-gray-900">Receita por método</Text>
                </View>
                {Object.entries(byMethod).length === 0 ? (
                  <Text className="text-center text-gray-400 py-6 text-sm">Sem dados neste período</Text>
                ) : Object.entries(byMethod).sort((a,b)=>b[1]-a[1]).map(([method, amount], i) => {
                  const pct = revenue > 0 ? (amount/revenue)*100 : 0;
                  return (
                    <View key={method} className="px-4 py-3" style={{ borderTopWidth:i>0?1:0, borderTopColor:colors.border }}>
                      <View className="flex-row items-center mb-2">
                        <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor:colors.backgroundLight }}>
                          {methodIcon(method)}
                        </View>
                        <Text className="flex-1 font-medium text-gray-900">{methodLabel(method)}</Text>
                        <Text className="font-bold" style={{ color: colors.textPrimary }}>{fmt(amount)}</Text>
                      </View>
                      <View style={{ height:4, backgroundColor:colors.surface, borderRadius:2, overflow:'hidden' }}>
                        <View style={{ height:4, width:`${pct}%`, backgroundColor:colors.primary, borderRadius:2 }} />
                      </View>
                      <Text style={{ fontSize:10, color:colors.textMuted, marginTop:3 }}>{pct.toFixed(1)}% do total</Text>
                    </View>
                  );
                })}
              </View>

              {/* Serviços mais vendidos */}
              <View className="mx-5 mb-8 rounded-2xl overflow-hidden" style={{ backgroundColor:colors.backgroundCard }}>
                <View className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
                  <Text className="font-bold text-gray-900">Serviços mais vendidos</Text>
                  <Award size={16} color={colors.textMuted} />
                </View>
                {svcRanking.slice(0,5).map((s,i)=>(
                  <View key={s.id} className="flex-row items-center px-4 py-3" style={{ borderTopWidth:i>0?1:0, borderTopColor:colors.border }}>
                    <View className="w-7 h-7 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: colors.surface }}>
                      <Text style={{ fontSize:12, fontWeight:'800', color: colors.textMuted }}>
                        {i+1}
                      </Text>
                    </View>
                    <Text className="flex-1 font-medium text-gray-900" numberOfLines={1}>{s.name}</Text>
                    <View className="items-end">
                      <Text className="font-bold text-gray-900">{s.count}x</Text>
                      <Text style={{ fontSize:11, color: colors.textMuted }}>{fmt(s.total)}</Text>
                    </View>
                  </View>
                ))}
                {svcRanking.length === 0 && (
                  <Text className="text-center text-gray-400 py-6 text-sm">Sem dados neste período</Text>
                )}
              </View>
            </Animated.View>
          )}

          {/* ── TAB: FLUXO DE CAIXA ────────────────────────────────────── */}
          {tab === 'caixa' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View className="px-5 pt-4 mb-3">
                <Text className="text-gray-900 font-bold text-lg">Fluxo de caixa diário</Text>
                <Text className="text-gray-400 text-xs mt-1">
                  Dias sem movimentação são omitidos. Período: {PERIOD_LABELS[period]}.
                </Text>
              </View>

              {/* Resumo rápido */}
              <View className="mx-5 mb-4 flex-row gap-3">
                <View className="flex-1 p-3 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                  <Text style={{ fontSize:10, color:colors.textMuted }}>Total receitas</Text>
                  <Text className="font-bold" style={{ color: colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{fmt(revenue)}</Text>
                </View>
                <View className="flex-1 p-3 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                  <Text style={{ fontSize:10, color:colors.textMuted }}>Total despesas</Text>
                  <Text className="font-bold" style={{ color: colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{fmt(expenses)}</Text>
                </View>
                <View className="flex-1 p-3 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                  <Text style={{ fontSize:10, color:colors.textMuted }}>Resultado</Text>
                  <Text className="font-bold" style={{ color: colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{fmt(net)}</Text>
                </View>
              </View>

              {/* Tabela */}
              <View className="mx-5 mb-8 rounded-2xl overflow-hidden" style={{ backgroundColor:colors.backgroundCard }}>
                {/* Cabeçalho */}
                <View className="flex-row px-4 py-2.5" style={{ backgroundColor:colors.surface }}>
                  <Text className="w-10 text-xs font-bold text-gray-500">Dia</Text>
                  <Text className="flex-1 text-xs font-bold text-gray-500 text-right">Receita</Text>
                  <Text className="flex-1 text-xs font-bold text-gray-500 text-right">Despesa</Text>
                  <Text className="flex-1 text-xs font-bold text-gray-500 text-right">Resultado</Text>
                </View>

                {dailyFlow.length === 0 ? (
                  <View className="py-12 items-center">
                    <Receipt size={32} color={colors.textMuted} />
                    <Text className="text-gray-400 text-sm mt-3">Sem movimentações neste período</Text>
                  </View>
                ) : dailyFlow.map((row, i) => {
                  const isToday = row.date === toLocalDateStr(new Date());
                  return (
                    <View key={row.date} className="flex-row items-center px-4 py-3"
                      style={{
                        borderTopWidth: i>0?1:0, borderTopColor:colors.border,
                        backgroundColor: isToday ? colors.primary+'08' : 'transparent',
                      }}>
                      <View className="w-10">
                        <Text className="font-bold text-sm" style={{ color: isToday ? colors.primary : colors.textPrimary }}>
                          {String(row.day).padStart(2,'0')}
                        </Text>
                        {isToday && <Text style={{ fontSize:8, color:colors.primary, fontWeight:'700' }}>HOJE</Text>}
                      </View>
                      <Text className="flex-1 text-right text-sm font-semibold" style={{ color:colors.textPrimary }}>
                        {fmt(row.income)}
                      </Text>
                      <Text className="flex-1 text-right text-sm" style={{ color: row.expense>0 ? colors.error : colors.textMuted }}>
                        {row.expense > 0 ? fmt(row.expense) : 'R$ 0,00'}
                      </Text>
                      <Text className="flex-1 text-right text-sm font-bold"
                        style={{ color: row.net>=0 ? colors.success : colors.error }}>
                        {fmt(row.net)}
                      </Text>
                    </View>
                  );
                })}

                {/* Total */}
                {dailyFlow.length > 0 && (
                  <View className="flex-row px-4 py-3 border-t-2" style={{ borderTopColor:colors.border, backgroundColor:colors.surface }}>
                    <Text className="w-10 text-xs font-bold text-gray-500">Total</Text>
                    <Text className="flex-1 text-right text-sm font-bold" style={{ color:colors.textPrimary }}>{fmt(revenue)}</Text>
                    <Text className="flex-1 text-right text-sm font-bold" style={{ color:colors.textPrimary }}>{fmt(expenses)}</Text>
                    <Text className="flex-1 text-right text-sm font-bold" style={{ color: net>=0?colors.success:colors.error }}>{fmt(net)}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* ── TAB: PERFORMANCE ───────────────────────────────────────── */}
          {tab === 'performance' && (
            <Animated.View entering={FadeInDown.duration(300)}>

              {/* Resumo geral */}
              <View className="px-5 pt-4 mb-4">
                <Text className="font-bold text-gray-900 mb-3">Desempenho por período</Text>
                <View className="flex-row flex-wrap gap-3">
                  {[
                    { label:'Todos agendamentos', value: String(totalApts) },
                    { label:'Total dos agendamentos', value: fmt(totalRev) },
                    { label:'Total comissão', value: fmt(totalComm) },
                    { label:'Receitas da empresa', value: fmt(totalComp) },
                  ].map(kpi => (
                    <View key={kpi.label} className="rounded-2xl p-4" style={{ width:(SW-52)/2, backgroundColor:colors.backgroundCard }}>
                      <Text className="font-bold text-lg" style={{ color: colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>
                        {kpi.value}
                      </Text>
                      <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>{kpi.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Por profissional */}
              <View className="px-5 mb-4">
                <Text className="font-bold text-gray-900 mb-3">Por profissional</Text>
              </View>

              {profPerf.length === 0 ? (
                <View className="items-center py-10">
                  <Profile2User size={32} color={colors.textMuted}  variant="Outline" />
                  <Text className="text-gray-400 text-sm mt-3">Sem dados neste período</Text>
                </View>
              ) : profPerf.map((emp, i) => {
                const commPct = emp.rev > 0 ? (emp.comm / emp.rev) * 100 : 0;
                return (
                  <Animated.View key={emp.id} entering={FadeInDown.delay(i*60).duration(300)}
                    className="mx-5 mb-3 rounded-2xl overflow-hidden"
                    style={{ backgroundColor:colors.backgroundCard }}>
                    {/* Header profissional */}
                    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                      {(emp as any).avatar ? (
                        <Image source={{ uri:(emp as any).avatar }} className="w-11 h-11 rounded-full mr-3" />
                      ) : (
                        <View className="w-11 h-11 rounded-full mr-3 items-center justify-center"
                          style={{ backgroundColor:colors.primary+'20' }}>
                          <User size={20} color={colors.primary}  variant="Outline" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="font-bold text-gray-900">{emp.name}</Text>
                        <Text className="text-xs text-gray-400">{(emp as any).specialty || (emp as any).role}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold" style={{ color: colors.textPrimary }}>{emp.apts}</Text>
                        <Text className="text-xs text-gray-400">agendamentos</Text>
                      </View>
                    </View>

                    {/* Grid de valores */}
                    <View className="flex-row">
                      <View className="flex-1 p-3 items-center border-r border-b border-gray-100">
                        <Text className="font-bold text-sm" style={{ color: colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{fmt(emp.rev)}</Text>
                        <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Receita total</Text>
                      </View>
                      <View className="flex-1 p-3 items-center border-b border-gray-100">
                        <Text className="font-bold text-sm" style={{ color: colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{fmt(emp.compRev)}</Text>
                        <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Receita empresa</Text>
                      </View>
                    </View>
                    <View className="flex-row">
                      <View className="flex-1 p-3 items-center border-r border-gray-100">
                        <Text className="font-bold text-sm" style={{ color: colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{fmt(emp.comm)}</Text>
                        <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Comissão</Text>
                      </View>
                      <View className="flex-1 p-3 items-center">
                        <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>{commPct.toFixed(0)}%</Text>
                        <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>% comissão</Text>
                      </View>
                    </View>

                    {/* Barra de split comissão/empresa */}
                    {emp.rev > 0 && (
                      <View className="px-4 pb-3">
                        <View style={{ height:6, borderRadius:3, overflow:'hidden', backgroundColor:colors.surface }}>
                          <View style={{ height:6, borderRadius:3, width:`${commPct}%`, backgroundColor:colors.primary }} />
                        </View>
                        <View className="flex-row justify-between mt-1">
                          <Text style={{ fontSize:9, color:colors.textMuted }}>Comissão {commPct.toFixed(0)}%</Text>
                          <Text style={{ fontSize:9, color:colors.textMuted }}>Empresa {(100-commPct).toFixed(0)}%</Text>
                        </View>
                      </View>
                    )}
                  </Animated.View>
                );
              })}

              {/* Top clientes */}
              <View className="mx-5 mt-2 mb-8 rounded-2xl overflow-hidden" style={{ backgroundColor:colors.backgroundCard }}>
                <View className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
                  <Text className="font-bold text-gray-900">Melhores clientes</Text>
                  <Star1 size={16} color={colors.textMuted} variant="Outline" />
                </View>
                {clients
                  .map(c => {
                    const apts = periodAppointments.filter(a=>a.clientId===c.id);
                    const spent = apts.reduce((s,a)=>{
                      const svc = services.find(sv=>sv.id===a.serviceId);
                      return s+(svc?.price||0);
                    },0);
                    return { ...c, apts:apts.length, spent };
                  })
                  .filter(c=>c.apts>0)
                  .sort((a,b)=>b.spent-a.spent)
                  .slice(0,5)
                  .map((client,i) => (
                    <View key={client.id} className="flex-row items-center px-4 py-3"
                      style={{ borderTopWidth:i>0?1:0, borderTopColor:colors.border }}>
                      <Text className="w-6 text-xs font-bold text-gray-400">{i+1}</Text>
                      <View className="w-9 h-9 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor:colors.primary+'20' }}>
                        <User size={16} color={colors.primary}  variant="Outline" />
                      </View>
                      <Text className="flex-1 font-medium text-gray-900" numberOfLines={1}>{client.name}</Text>
                      <View className="items-end">
                        <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>{fmt(client.spent)}</Text>
                        <Text className="text-xs text-gray-400">{client.apts} visita{client.apts!==1?'s':''}</Text>
                      </View>
                    </View>
                  ))
                }
                {clients.filter(c=>periodAppointments.some(a=>a.clientId===c.id)).length===0 && (
                  <Text className="text-center text-gray-400 py-6 text-sm">Sem dados neste período</Text>
                )}
              </View>

            </Animated.View>
          )}

        </ScrollView>
        )}
      </SafeAreaView>
    </View>
    </FeatureGate>
  );
}
