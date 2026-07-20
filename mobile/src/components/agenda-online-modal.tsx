import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { ArrowRight2, Clock, Calendar as CalendarIcon, User, CloseCircle, Link2, Scissor } from 'iconsax-react-native';
import { colors, statusColors } from '@/lib/theme';
import { Appointment } from '@/lib/types';
import { toLocalDateStr } from '@/lib/utils/date';
import * as Haptics from 'expo-haptics';

const PERIOD_OPTIONS = [
  { label: 'Últimos 15 dias', days: 15 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 60 dias', days: 60 },
  { label: 'Últimos 90 dias', days: 90 },
];

export function OnlineAppointmentsModal({
  visible, onClose, appointments, servicesList, statusLabel, onSelectAppointment,
}: {
  visible: boolean;
  onClose: () => void;
  appointments: Appointment[];
  servicesList: any[];
  statusLabel: Record<string, string>;
  onSelectAppointment: (apt: Appointment) => void;
}) {
  const [search, setSearch] = useState('');
  const [periodDays, setPeriodDays] = useState(15);
  const [showPeriodSheet, setShowPeriodSheet] = useState(false);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffStr = toLocalDateStr(cutoff);

  const onlineApts = appointments
    .filter(a => a.clientName && a.clientName.trim() !== '')
    .filter(a => a.date >= cutoffStr)
    .filter(a => !search.trim() || a.clientName?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const total = onlineApts.reduce((sum, a) => {
    const svc = servicesList.find((s: any) => s.id === a.serviceId);
    return sum + (svc?.price ?? 0);
  }, 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>

        {/* Header */}
        <View className="px-5 pt-5 pb-3 flex-row items-center justify-between border-b border-gray-100">
          <Pressable onPress={onClose}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>Fechar</Text>
          </Pressable>
          <Text className="text-base font-bold text-gray-900">Agendamentos Online</Text>
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
            <Link2 size={18} color={colors.primary}  variant="Outline" />
          </View>
        </View>

        {/* Busca + Período */}
        <View className="px-5 pt-3 pb-2">
          <View className="flex-row gap-2 mb-2">
            {/* Campo de busca */}
            <View className="flex-1 flex-row items-center rounded-xl px-3 h-10" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
              <User size={14} color={colors.textMuted}  variant="Outline" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar nome do cliente..."
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, marginLeft: 8, fontSize: 13, color: colors.textPrimary }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <CloseCircle size={14} color={colors.textMuted}  variant="Outline" />
                </Pressable>
              )}
            </View>

            {/* Período */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPeriodSheet(true); }}
              className="flex-row items-center px-3 h-10 rounded-xl gap-1"
              style={{ backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary + '30' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                Últimos {periodDays} dias
              </Text>
              <ArrowRight2 size={12} color={colors.primary}  variant="Outline" />
            </Pressable>
          </View>

          <Text className="text-xs" style={{ color: colors.textMuted }}>
            Resultados são ordenados por data de criação
          </Text>
        </View>

        {/* Total */}
        <View className="mx-5 mb-3 p-3 rounded-xl flex-row items-center justify-between"
          style={{ backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '25' }}>
          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
            {onlineApts.length} agendamento{onlineApts.length !== 1 ? 's' : ''}
          </Text>
          <Text className="font-bold text-base" style={{ color: colors.primary }}>{fmt(total)}</Text>
        </View>

        {/* Lista */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {onlineApts.length === 0 ? (
            <View className="items-center py-16">
              <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: colors.primary + '15' }}>
                <Link2 size={24} color={colors.primary}  variant="Outline" />
              </View>
              <Text className="font-bold text-gray-900">Nenhum agendamento online</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                {search ? 'Tente outro nome' : `Nenhum nos últimos ${periodDays} dias`}
              </Text>
            </View>
          ) : onlineApts.map((apt, i) => {
            const svc = servicesList.find((s: any) => s.id === apt.serviceId);
            const d = new Date(apt.date);
            const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)} (${weekDays[d.getDay()]})`;
            const profLine = apt.notes?.split('\n').find(l => l.startsWith('Profissional:'));
            const profName = profLine?.replace('Profissional:', '').trim();
            const sc = statusColors[apt.status as keyof typeof statusColors] ?? colors.primary;

            return (
              <Pressable
                key={apt.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectAppointment(apt); }}
                className="mb-3 rounded-2xl overflow-hidden active:opacity-70"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: sc }} />
                <View className="px-4 py-3 pl-5">
                  {/* Linha 1: avatar + nome + preço */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.primary + '20' }}>
                        <User size={15} color={colors.primary}  variant="Outline" />
                      </View>
                      <Text className="font-bold text-gray-900 flex-1" numberOfLines={1}>{apt.clientName}</Text>
                    </View>
                    <Text className="font-bold" style={{ color: colors.primary }}>{fmt(svc?.price ?? 0)}</Text>
                  </View>

                  {/* Linha 2: data/hora */}
                  <View className="flex-row items-center gap-1 mb-1 ml-10">
                    <CalendarIcon size={12} color={sc}  variant="Outline" />
                    <Text className="text-xs font-medium" style={{ color: sc }}>{dateStr}</Text>
                    <Clock size={12} color={colors.textMuted} style={{ marginLeft: 6 }}  variant="Outline" />
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{apt.time}</Text>
                  </View>

                  {/* Linha 3: serviço + profissional */}
                  <View className="flex-row items-center justify-between ml-10">
                    <View className="flex-row items-center gap-1 flex-1">
                      <Scissor size={12} color={colors.textMuted}  variant="Outline" />
                      <Text className="text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>{svc?.name ?? '—'}</Text>
                    </View>
                    {profName && (
                      <Text className="text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                        {profName}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Sheet de período */}
        <Modal visible={showPeriodSheet} transparent animationType="fade" onRequestClose={() => setShowPeriodSheet(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setShowPeriodSheet(false)}>
            <View style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>
              <Text style={{ textAlign: 'center', fontWeight: '700', fontSize: 15, color: colors.textPrimary, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                Período
              </Text>
              {PERIOD_OPTIONS.map(opt => (
                <Pressable key={opt.days} onPress={() => { setPeriodDays(opt.days); setShowPeriodSheet(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 15, color: colors.textPrimary, fontWeight: opt.days === periodDays ? '700' : '400' }}>{opt.label}</Text>
                  <ArrowRight2 size={16} color={opt.days === periodDays ? colors.primary : colors.textMuted}  variant="Outline" />
                </Pressable>
              ))}
              <Pressable onPress={() => setShowPeriodSheet(false)} style={{ marginTop: 8, alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>Fechar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}
