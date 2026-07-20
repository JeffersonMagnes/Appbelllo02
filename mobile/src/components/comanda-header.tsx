import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowLeft2, Add, Clock, DollarCircle, Filter } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils/comanda-format';
import * as Haptics from 'expo-haptics';

export type ComandaStatusFilter = 'all' | 'open' | 'paid';

export function ComandaHeader({
  onBack,
  dateFilterActive,
  onOpenDateFilter,
  onNew,
  openCount,
  totalOpen,
  filter,
  onSelectFilter,
}: {
  onBack: () => void;
  dateFilterActive: boolean;
  onOpenDateFilter: () => void;
  onNew: () => void;
  openCount: number;
  totalOpen: number;
  filter: ComandaStatusFilter;
  onSelectFilter: (filter: ComandaStatusFilter) => void;
}) {
  return (
    <>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={onBack}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.backgroundCard, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
          >
            <ArrowLeft2 size={24} color={colors.textPrimary}  variant="Outline" />
          </Pressable>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>Comandas</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenDateFilter(); }}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: dateFilterActive ? colors.primary + '20' : colors.backgroundCard,
              borderWidth: dateFilterActive ? 1 : 0,
              borderColor: colors.primary + '50',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Filter size={18} color={dateFilterActive ? colors.primary : colors.textMuted} />
            {dateFilterActive && (
              <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
            )}
          </Pressable>
          <Pressable
            onPress={onNew}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Add size={20} color="#fff"  variant="Outline" />
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12 }}>
        <View style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: colors.backgroundCard }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Clock size={14} color={colors.warning}  variant="Outline" />
            <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 6 }}>Em aberto</Text>
          </View>
          <Text style={{ color: colors.warning, fontSize: 26, fontWeight: '800' }}>{openCount}</Text>
        </View>
        <View style={{ flex: 2, padding: 16, borderRadius: 16, backgroundColor: colors.backgroundCard }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <DollarCircle size={14} color={colors.secondary}  variant="Outline" />
            <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 6 }}>Total em aberto</Text>
          </View>
          <Text style={{ color: colors.secondary, fontSize: 26, fontWeight: '800' }}>{formatCurrency(totalOpen)}</Text>
        </View>
      </View>

      {/* Filtro */}
      <View style={{ marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', backgroundColor: colors.backgroundCard, borderRadius: 14, padding: 4 }}>
        {(['all', 'open', 'paid'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => onSelectFilter(f)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: filter === f ? colors.primary : 'transparent' }}
          >
            <Text style={{ color: filter === f ? '#fff' : colors.textMuted, fontWeight: '600', fontSize: 13 }}>
              {f === 'all' ? 'Todas' : f === 'open' ? 'Abertas' : 'Pagas'}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
