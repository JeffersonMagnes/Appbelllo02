import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2, Profile2User, UserAdd, Award, ArrowDown2 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { toLocalDateStr } from '@/lib/utils/date';
import { useAuthStore } from '@/lib/state/auth-store';
import { useClients } from '@/lib/hooks/use-clients';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useTransactions } from '@/lib/hooks/use-transactions';

type Period = '12m' | '6m' | 'month' | 'year' | 'lastyear' | 'custom';
type ReportType = 'receita' | 'atendimentos';

const PERIODS: { key: Period; label: string }[] = [
  { key: '12m', label: 'Últimos 12 meses' },
  { key: '6m', label: 'Últimos 6 meses' },
  { key: 'month', label: 'Este mês' },
  { key: 'year', label: 'Este ano' },
  { key: 'lastyear', label: 'Ano passado' },
  { key: 'custom', label: 'Personalizado' },
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function getDateRange(period: Period, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;
  switch (period) {
    case '12m': start = new Date(now); start.setMonth(start.getMonth() - 12); break;
    case '6m': start = new Date(now); start.setMonth(start.getMonth() - 6); break;
    case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'year': start = new Date(now.getFullYear(), 0, 1); break;
    case 'lastyear': start = new Date(now.getFullYear() - 1, 0, 1); return { start, end: new Date(now.getFullYear() - 1, 11, 31) };
    case 'custom': return { start: customStart ?? new Date(now.getFullYear(), 0, 1), end: customEnd ?? now };
  }
  return { start, end };
}

export default function TopClientsScreen() {
  const router = useRouter();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: clients = [], isLoading: loadingClients } = useClients(establishmentId ?? undefined);
  const { data: appointments = [], isLoading: loadingApts } = useAppointments(establishmentId ?? undefined);
  const { data: transactions = [], isLoading: loadingTxs } = useTransactions(establishmentId ?? undefined);

  const [period, setPeriod] = useState<Period>('12m');
  const [reportType, setReportType] = useState<ReportType>('receita');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [customStartStr, setCustomStartStr] = useState('');
  const [customEndStr, setCustomEndStr] = useState('');

  const isLoading = loadingClients || loadingApts || loadingTxs;

  const customStart = customStartStr ? new Date(customStartStr + 'T00:00:00') : undefined;
  const customEnd = customEndStr ? new Date(customEndStr + 'T23:59:59') : undefined;
  const { start, end } = getDateRange(period, customStart, customEnd);
  const startStr = toLocalDateStr(start);
  const endStr = toLocalDateStr(end);

  const periodApts = useMemo(() =>
    appointments.filter(a => a.date >= startStr && a.date <= endStr),
    [appointments, startStr, endStr]
  );

  const periodTxs = useMemo(() =>
    transactions.filter(t => t.date >= startStr && t.date <= endStr && t.type === 'income'),
    [transactions, startStr, endStr]
  );

  const newClientsCount = useMemo(() => {
    return clients.filter(c => {
      const created = (c as any).createdAt ?? '';
      return created >= startStr && created <= endStr;
    }).length;
  }, [clients, startStr, endStr]);

  const rankedClients = useMemo(() => {
    if (reportType === 'receita') {
      const revenueMap: Record<string, number> = {};
      periodTxs.forEach(t => {
        if (t.clientId) {
          revenueMap[t.clientId] = (revenueMap[t.clientId] || 0) + t.amount;
        }
      });
      periodApts.filter(a => a.status === 'completed').forEach(a => {
        if (a.clientId && !revenueMap[a.clientId]) {
          revenueMap[a.clientId] = 0;
        }
      });
      return Object.entries(revenueMap)
        .map(([clientId, revenue]) => {
          const client = clients.find(c => c.id === clientId);
          return { id: clientId, name: client?.name ?? 'Cliente', value: revenue };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 30);
    } else {
      const countMap: Record<string, number> = {};
      periodApts.forEach(a => {
        if (a.clientId) {
          countMap[a.clientId] = (countMap[a.clientId] || 0) + 1;
        }
      });
      return Object.entries(countMap)
        .map(([clientId, count]) => {
          const client = clients.find(c => c.id === clientId);
          return { id: clientId, name: client?.name ?? 'Cliente', value: count };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 30);
    }
  }, [reportType, periodApts, periodTxs, clients]);

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? '';
  const formatPeriodDates = `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft2 size={22} color={colors.textPrimary} variant="Outline" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>Top Clientes</Text>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Summary Cards */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: colors.backgroundCard, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>Total de Clientes</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '900', marginTop: 4 }}>{clients.length}</Text>
                </View>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Profile2User size={22} color={colors.primary} variant="Outline" />
                </View>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.backgroundCard, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>Novos Clientes</Text>
                  <Text style={{ color: colors.secondary, fontSize: 28, fontWeight: '900', marginTop: 4 }}>{newClientsCount}</Text>
                </View>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.secondary + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <UserAdd size={22} color={colors.secondary} variant="Outline" />
                </View>
              </View>
            </View>

            {/* Filters */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12 }}>
              {/* Period Picker */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>Selecione o período</Text>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPeriodPicker(!showPeriodPicker); setShowTypePicker(false); }}
                  style={{ backgroundColor: colors.backgroundCard, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{periodLabel}</Text>
                  <ArrowDown2 size={14} color={colors.textMuted} variant="Outline" style={{ transform: [{ rotate: showPeriodPicker ? '180deg' : '0deg' }] }} />
                </Pressable>
                {showPeriodPicker && (
                  <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 12, marginTop: 4, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
                    {PERIODS.map(p => (
                      <Pressable
                        key={p.key}
                        onPress={() => { setPeriod(p.key); setShowPeriodPicker(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={{ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: period === p.key ? colors.primary + '10' : 'transparent', borderBottomWidth: 0.5, borderBottomColor: colors.border }}
                      >
                        <Text style={{ color: period === p.key ? colors.primary : colors.textPrimary, fontSize: 13, fontWeight: period === p.key ? '700' : '500' }}>{p.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {period === 'custom' && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TextInput
                      value={customStartStr}
                      onChangeText={setCustomStartStr}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, backgroundColor: colors.backgroundCard, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                    />
                    <TextInput
                      value={customEndStr}
                      onChangeText={setCustomEndStr}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, backgroundColor: colors.backgroundCard, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                    />
                  </View>
                )}
              </View>

              {/* Report Type Picker */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>Tipo de relatório</Text>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowTypePicker(!showTypePicker); setShowPeriodPicker(false); }}
                  style={{ backgroundColor: colors.backgroundCard, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{reportType === 'receita' ? 'Por Receita' : 'Por Atendimentos'}</Text>
                  <ArrowDown2 size={14} color={colors.textMuted} variant="Outline" style={{ transform: [{ rotate: showTypePicker ? '180deg' : '0deg' }] }} />
                </Pressable>
                {showTypePicker && (
                  <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 12, marginTop: 4, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
                    {[
                      { key: 'receita' as ReportType, label: 'Por Receita' },
                      { key: 'atendimentos' as ReportType, label: 'Por Nº de Atendimentos' },
                    ].map(t => (
                      <Pressable
                        key={t.key}
                        onPress={() => { setReportType(t.key); setShowTypePicker(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={{ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: reportType === t.key ? colors.primary + '10' : 'transparent', borderBottomWidth: 0.5, borderBottomColor: colors.border }}
                      >
                        <Text style={{ color: reportType === t.key ? colors.primary : colors.textPrimary, fontSize: 13, fontWeight: reportType === t.key ? '700' : '500' }}>{t.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Title */}
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                Rank top 30 melhores clientes {reportType === 'receita' ? 'por receita' : 'por atendimentos'}.
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 2 }}>
                De {formatPeriodDates}
              </Text>
            </View>

            {/* Table */}
            <View style={{ marginHorizontal: 20, backgroundColor: colors.backgroundCard, borderRadius: 16, overflow: 'hidden' }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ width: 36, color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>#</Text>
                <Text style={{ flex: 1, color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>Nome</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'right' }}>
                  {reportType === 'receita' ? 'Receita' : 'Atendimentos'}
                </Text>
              </View>

              {rankedClients.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Profile2User size={32} color={colors.textMuted} variant="Outline" />
                  <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>Nenhum dado para este período</Text>
                </View>
              ) : (
                rankedClients.map((client, i) => (
                  <Animated.View key={client.id} entering={FadeInDown.duration(200).delay(i * 30)}>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14,
                      borderBottomWidth: i < rankedClients.length - 1 ? 0.5 : 0,
                      borderBottomColor: colors.border,
                      backgroundColor: i < 3 ? colors.primary + '05' : 'transparent',
                    }}>
                      <View style={{
                        width: 28, height: 28, borderRadius: 14,
                        backgroundColor: i === 0 ? '#FFD700' + '20' : i === 1 ? '#C0C0C0' + '20' : i === 2 ? '#CD7F32' + '20' : colors.border + '50',
                        alignItems: 'center', justifyContent: 'center', marginRight: 8,
                      }}>
                        <Text style={{
                          fontSize: 12, fontWeight: '800',
                          color: i === 0 ? '#B8860B' : i === 1 ? '#808080' : i === 2 ? '#8B4513' : colors.textMuted,
                        }}>
                          {i + 1}º
                        </Text>
                      </View>
                      <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: i < 3 ? '700' : '500' }} numberOfLines={1}>
                        {client.name}
                      </Text>
                      <Text style={{ color: i < 3 ? colors.primary : colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                        {reportType === 'receita' ? fmt(client.value) : `${client.value} atend.`}
                      </Text>
                    </View>
                  </Animated.View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
