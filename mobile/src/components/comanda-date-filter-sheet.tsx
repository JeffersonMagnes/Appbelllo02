import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Calendar, CloseCircle, TickSquare } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';

export type ComandaDateFilter = 'all' | 'day' | 'month' | 'year';

const OPTIONS: { key: ComandaDateFilter; label: string; sub: string }[] = [
  { key: 'all',   label: 'Todas as comandas', sub: 'Sem filtro de data' },
  { key: 'day',   label: 'Hoje',              sub: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) },
  { key: 'month', label: 'Este mês',          sub: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) },
  { key: 'year',  label: 'Este ano',          sub: String(new Date().getFullYear()) },
];

// ── Modal — Filtro por Data ───────────────────────────────────────────────────
export function ComandaDateFilterSheet({
  visible,
  onClose,
  dateFilter,
  onSelect,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  dateFilter: ComandaDateFilter;
  onSelect: (key: ComandaDateFilter) => void;
  onClear: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View entering={SlideInDown.springify().damping(22).stiffness(260)}
          exiting={SlideOutDown.duration(220)}
          style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>

          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} color={colors.primary}  variant="Outline" />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>Filtrar por período</Text>
            </View>
            <Pressable onPress={onClose}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <CloseCircle size={14} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          {/* Opções */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
            {OPTIONS.map(opt => {
              const active = dateFilter === opt.key;
              return (
                <Pressable key={opt.key}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(opt.key); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
                    borderRadius: 14, borderWidth: 1.5,
                    backgroundColor: active ? colors.primary + '10' : colors.background,
                    borderColor: active ? colors.primary + '40' : colors.border,
                  }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: active ? '700' : '500', color: active ? colors.primary : colors.textPrimary }}>{opt.label}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{opt.sub}</Text>
                  </View>
                  {active && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <TickSquare size={13} color="#fff" strokeWidth={3}  variant="Outline" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Limpar filtro */}
          {dateFilter !== 'all' && (
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClear(); }}
              style={{ marginHorizontal: 16, marginTop: 12, height: 44, borderRadius: 12, backgroundColor: colors.error + '12', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.error + '30' }}>
              <Text style={{ color: colors.error, fontWeight: '700', fontSize: 14 }}>Limpar filtro de data</Text>
            </Pressable>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
