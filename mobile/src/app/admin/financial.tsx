import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator, TextInput } from 'react-native';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { ArrowLeft2, TrendUp, TrendDown, DollarCircle, Card, Money, Mobile, ArrangeHorizontal, Calendar, Filter, TickSquare, CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useAuthStore } from '@/lib/state/auth-store';
import { usePaymentFeesStore } from '@/lib/state/payment-fees-store';

type PeriodType = 'day' | 'week' | 'month' | 'custom';
type PaymentFilter = 'all' | 'pix' | 'credit' | 'debit' | 'cash' | 'transfer' | 'cheque' | 'cortesia';

const PAYMENT_METHODS: { id: PaymentFilter; label: string }[] = [
  { id: 'all',      label: 'Todos'         },
  { id: 'pix',      label: 'PIX'           },
  { id: 'credit',   label: 'Crédito'       },
  { id: 'debit',    label: 'Débito'        },
  { id: 'cash',     label: 'Dinheiro'      },
  { id: 'transfer', label: 'Transferência' },
  { id: 'cheque',   label: 'Cheque'        },
  { id: 'cortesia', label: 'Cortesia'      },
];

function isInPeriod(dateStr: string, period: PeriodType, customStart?: string, customEnd?: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  if (period === 'day') return d.toDateString() === now.toDateString();
  if (period === 'week') {
    const week = new Date(now); week.setDate(now.getDate() - 7);
    return d >= week;
  }
  if (period === 'custom') {
    const start = customStart ? new Date(customStart + 'T00:00:00') : new Date(now.getFullYear(), 0, 1);
    const end = customEnd ? new Date(customEnd + 'T23:59:59') : now;
    return d >= start && d <= end;
  }
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function FinancialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod]               = useState<PeriodType>('month');
  const [customStart, setCustomStart]     = useState('');
  const [customEnd, setCustomEnd]         = useState('');
  const [showIncome, setShowIncome]       = useState(true);
  const [showExpenses, setShowExpenses]   = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: transactions = [], isLoading } = useTransactions(establishmentId ?? undefined);

  const calcFeeByMethod = usePaymentFeesStore(s => s.calcFeeByMethod);

  const CASH_REGISTER_CATS = ['abertura', 'fechamento', 'sangria', 'reforco'];

  // Todos filtrados por período
  const periodTransactions = transactions.filter(t => isInPeriod(t.date, period, customStart, customEnd));

  const monthlyRevenue  = periodTransactions.filter(t => t.type === 'income'  && t.status === 'paid' && !CASH_REGISTER_CATS.includes(t.category)).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = periodTransactions.filter(t => t.type === 'expense' && t.status === 'paid' && !CASH_REGISTER_CATS.includes(t.category)).reduce((s, t) => s + t.amount, 0);
  const totalFees = periodTransactions
    .filter(t => t.type === 'income' && t.status === 'paid' && !CASH_REGISTER_CATS.includes(t.category))
    .reduce((sum, t) => sum + calcFeeByMethod(t.amount, t.paymentMethod), 0);
  const netRevenue = monthlyRevenue - totalFees;
  const netProfit  = netRevenue - monthlyExpenses;

  // Lista filtrada por tipo + método de pagamento (sem lançamentos de caixa)
  const filteredTransactions = periodTransactions.filter(t => {
    if (CASH_REGISTER_CATS.includes(t.category)) return false;
    if (!showIncome   && t.type === 'income')  return false;
    if (!showExpenses && t.type === 'expense') return false;
    if (paymentFilter !== 'all' && t.paymentMethod !== paymentFilter) return false;
    return true;
  });

  const incomeByMethod = periodTransactions
    .filter(t => t.type === 'income' && t.status === 'paid' && !CASH_REGISTER_CATS.includes(t.category))
    .reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate     = (s: string) => new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit': case 'debit': return <Card   size={14} color={colors.textMuted} />;
      case 'cash':                 return <Money      size={14} color={colors.textMuted} />;
      case 'pix':                  return <Mobile    size={14} color={colors.textMuted} />;
      case 'transfer':             return <ArrangeHorizontal size={14} color={colors.textMuted}  variant="Outline" />;
      default:                     return <DollarCircle    size={14} color={colors.textMuted}  variant="Outline" />;
    }
  };

  const getMethodLabel = (method: string) =>
    ({ credit:'Crédito', debit:'Débito', cash:'Dinheiro', pix:'PIX', transfer:'Transferência', cheque:'Cheque', cortesia:'Cortesia' }[method] ?? method);

  const activeFiltersCount = (paymentFilter !== 'all' ? 1 : 0);

  return (
    <FeatureGate featureKey="financeiro">
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View className="px-5 pt-2 pb-4 flex-row items-center" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Pressable onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.backgroundCard }}>
              <ArrowLeft2 size={24} color={colors.textPrimary}  variant="Outline" />
            </Pressable>
            <Text className="text-gray-900 text-xl font-bold flex-1">Resumo Financeiro</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFilterSheet(true); }}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.backgroundCard }}>
              <Filter size={20} color={activeFiltersCount > 0 ? '#fff' : colors.textMuted} />
              {activeFiltersCount > 0 && (
                <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.error }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{activeFiltersCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Period Selector */}
          <View className="px-5 mb-4 mt-4">
            <View className="flex-row rounded-xl p-1"
              style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
              {(['day', 'week', 'month', 'custom'] as PeriodType[]).map(p => (
                <Pressable key={p} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeriod(p); }}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ backgroundColor: period === p ? colors.primary : 'transparent' }}>
                  <Text className="text-sm font-semibold"
                    style={{ color: period === p ? '#fff' : colors.textMuted }}>
                    {p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Personalizado'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {period === 'custom' && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
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
          </View>

          {/* Summary Cards */}
          <View className="px-5 mb-6">
            <View className="flex-row mb-3">
              <View className="flex-1 mr-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center mb-2">
                  <TrendUp size={18} color={colors.success}  variant="Outline" />
                  <Text className="text-gray-500 text-xs ml-2">Entradas brutas</Text>
                </View>
                <Text style={{ color: colors.success }} className="text-xl font-bold" numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(monthlyRevenue)}
                </Text>
              </View>
              <View className="flex-1 ml-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center mb-2">
                  <TrendDown size={18} color={colors.error}  variant="Outline" />
                  <Text className="text-gray-500 text-xs ml-2">Saídas</Text>
                </View>
                <Text style={{ color: colors.error }} className="text-xl font-bold" numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(monthlyExpenses)}
                </Text>
              </View>
            </View>

            <View className="p-4 rounded-xl mb-3"
              style={{ backgroundColor: colors.warning + '12', borderWidth: 1, borderColor: colors.warning + '30' }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.warning }}>Taxas de máquina / PIX</Text>
                  <Text className="font-bold text-lg" style={{ color: colors.warning }}>
                    - {formatCurrency(totalFees)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-gray-400 mb-0.5">Receita líquida</Text>
                  <Text className="font-bold" style={{ color: colors.success }}>{formatCurrency(netRevenue)}</Text>
                </View>
              </View>
            </View>

            <View className="p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-500 text-xs mb-1">Lucro Líquido</Text>
                  <Text className="text-3xl font-bold"
                    style={{ color: netProfit >= 0 ? colors.secondary : colors.error }}>
                    {formatCurrency(netProfit)}
                  </Text>
                </View>
                <View className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: (netProfit >= 0 ? colors.secondary : colors.error) + '20' }}>
                  {netProfit >= 0
                    ? <TrendUp size={28} color={colors.secondary}  variant="Outline" />
                    : <TrendDown size={28} color={colors.error}  variant="Outline" />}
                </View>
              </View>
            </View>
          </View>

          {/* Por Método */}
          <View className="px-5 mb-6">
            <Text className="text-gray-900 font-semibold mb-3">Entradas por Método</Text>
            <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
              {Object.entries(incomeByMethod).length === 0 ? (
                <Text className="text-center text-gray-400 py-6 text-sm">Sem movimentações neste período</Text>
              ) : Object.entries(incomeByMethod).map(([method, amount], index) => {
                const feeAmount = calcFeeByMethod(amount, method);
                const feeRate   = feeAmount > 0 ? parseFloat(((feeAmount / amount) * 100).toFixed(2)) : 0;
                return (
                  <View key={method} className="p-4"
                    style={{ borderTopWidth: index > 0 ? 1 : 0, borderTopColor: colors.border }}>
                    <View className="flex-row items-center mb-2">
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: colors.backgroundLight }}>
                        {getMethodIcon(method)}
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-medium">{getMethodLabel(method)}</Text>
                        <Text className="text-gray-400 text-xs">
                          {monthlyRevenue > 0 ? ((amount / monthlyRevenue) * 100).toFixed(1) : '0'}% do total
                          {feeRate > 0 ? ` · taxa ${feeRate}%` : ''}
                        </Text>
                      </View>
                      <Text style={{ color: colors.success }} className="font-bold">{formatCurrency(amount)}</Text>
                    </View>
                    {feeRate > 0 && (
                      <View className="flex-row justify-between pl-14"
                        style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
                        <Text className="text-xs" style={{ color: colors.warning }}>
                          - Taxa ({formatCurrency(feeAmount)})
                        </Text>
                        <Text className="text-xs font-semibold" style={{ color: colors.success }}>
                          Líquido: {formatCurrency(amount - feeAmount)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Filtros tipo */}
          <View className="px-5 mb-4 flex-row gap-3">
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowIncome(!showIncome); }}
              className="flex-1 py-2 rounded-lg items-center flex-row justify-center"
              style={{ backgroundColor: showIncome ? colors.success + '20' : colors.backgroundCard, borderWidth: 1, borderColor: showIncome ? colors.success : 'transparent' }}>
              <TrendUp size={16} color={showIncome ? colors.success : colors.textMuted}  variant="Outline" />
              <Text className="ml-2 font-medium text-sm" style={{ color: showIncome ? colors.success : colors.textMuted }}>Entradas</Text>
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowExpenses(!showExpenses); }}
              className="flex-1 py-2 rounded-lg items-center flex-row justify-center"
              style={{ backgroundColor: showExpenses ? colors.error + '20' : colors.backgroundCard, borderWidth: 1, borderColor: showExpenses ? colors.error : 'transparent' }}>
              <TrendDown size={16} color={showExpenses ? colors.error : colors.textMuted}  variant="Outline" />
              <Text className="ml-2 font-medium text-sm" style={{ color: showExpenses ? colors.error : colors.textMuted }}>Saídas</Text>
            </Pressable>
          </View>

          {/* Lista */}
          <View className="px-5 mb-8">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 font-semibold">
                Movimentações {filteredTransactions.length > 0 ? `(${filteredTransactions.length})` : ''}
              </Text>
              {paymentFilter !== 'all' && (
                <Pressable onPress={() => setPaymentFilter('all')}
                  className="flex-row items-center px-2 py-1 rounded-lg"
                  style={{ backgroundColor: colors.primary + '15' }}>
                  <Text className="text-xs font-semibold mr-1" style={{ color: colors.primary }}>
                    {getMethodLabel(paymentFilter)}
                  </Text>
                  <CloseCircle size={12} color={colors.primary}  variant="Outline" />
                </Pressable>
              )}
            </View>
            {filteredTransactions.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-gray-400 text-sm">Nenhuma movimentação neste período</Text>
              </View>
            ) : filteredTransactions.map(t => (
              <View key={t.id} className="flex-row items-center p-4 rounded-xl mb-2"
                style={{ backgroundColor: colors.backgroundCard }}>
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: t.type === 'income' ? colors.success + '20' : colors.error + '20' }}>
                  {t.type === 'income'
                    ? <TrendUp size={18} color={colors.success}  variant="Outline" />
                    : <TrendDown size={18} color={colors.error}  variant="Outline" />}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium" numberOfLines={1}>{t.description}</Text>
                  <View className="flex-row items-center mt-1">
                    <Calendar size={12} color={colors.textMuted}  variant="Outline" />
                    <Text className="text-gray-500 text-xs ml-1">{formatDate(t.date)}</Text>
                    <Text className="text-gray-400 mx-2">•</Text>
                    {getMethodIcon(t.paymentMethod)}
                    <Text className="text-gray-500 text-xs ml-1">{getMethodLabel(t.paymentMethod)}</Text>
                  </View>
                </View>
                <Text className="font-bold"
                  style={{ color: t.type === 'income' ? colors.success : colors.error }}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </Text>
              </View>
            ))}
          </View>

        </ScrollView>
        )}
      </SafeAreaView>

      {/* Filter Sheet — por método de pagamento */}
      <Modal visible={showFilterSheet} transparent animationType="none" onRequestClose={() => setShowFilterSheet(false)}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowFilterSheet(false)} />
          <Animated.View entering={SlideInDown.springify().damping(22).stiffness(260)}
            exiting={SlideOutDown.duration(220)}
            style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 16 }}>

            <View style={{ alignItems: 'center', paddingTop: 12 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="text-gray-900 text-lg font-bold">Filtrar por método</Text>
              <Pressable onPress={() => setShowFilterSheet(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.surface }}>
                <CloseCircle size={16} color={colors.textMuted}  variant="Outline" />
              </Pressable>
            </View>

            <View className="px-5 gap-2">
              {PAYMENT_METHODS.map(m => {
                const active = paymentFilter === m.id;
                return (
                  <Pressable key={m.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPaymentFilter(m.id); setShowFilterSheet(false); }}
                    className="flex-row items-center justify-between p-4 rounded-xl"
                    style={{ backgroundColor: active ? colors.primary + '15' : colors.background, borderWidth: 1, borderColor: active ? colors.primary : colors.border }}>
                    <Text className="font-semibold" style={{ color: active ? colors.primary : colors.textPrimary }}>{m.label}</Text>
                    {active && <TickSquare size={18} color={colors.primary}  variant="Outline" />}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
    </FeatureGate>
  );
}
