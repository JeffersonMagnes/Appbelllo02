import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowLeft2, ArrowRight2, Clock, Calendar as CalendarIcon, Calendar, CalendarTick, Add, Link2, Slash } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui';
import { isToday } from '@/lib/utils/agenda-calendar';
import * as Haptics from 'expo-haptics';

export type AgendaViewMode = 'day' | 'month' | 'year';
type AgendaModeKey = AgendaViewMode | 'week';

export function AgendaHeader({
  appointmentsCount,
  onOpenOnline,
  onOpenBlock,
  onNew,
  viewMode,
  onSelectMode,
  selectedDate,
  navigationTitle,
  onNavigate,
  onGoToday,
}: {
  appointmentsCount: number;
  onOpenOnline: () => void;
  onOpenBlock: () => void;
  onNew: () => void;
  viewMode: AgendaViewMode;
  onSelectMode: (key: AgendaModeKey) => void;
  selectedDate: Date;
  navigationTitle: string;
  onNavigate: (direction: 'prev' | 'next') => void;
  onGoToday: () => void;
}) {
  return (
    <View className="px-5 pt-2 pb-3">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-gray-900 text-2xl font-bold">Agenda</Text>
          <Text style={{ color: colors.textMuted }} className="text-sm">
            {appointmentsCount} agendamentos
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenOnline(); }}
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary + '40' }}
          >
            <Link2 size={18} color={colors.primary}  variant="Outline" />
          </Pressable>
          <Pressable
            onPress={onOpenBlock}
            className="flex-row items-center px-3 py-2.5 rounded-xl gap-1.5"
            style={{ backgroundColor: colors.textMuted + '20', borderWidth: 1, borderColor: colors.textMuted + '40' }}
          >
            <Slash size={16} color={colors.textMuted} variant="Outline" />
            <Text className="text-xs font-semibold" style={{ color: colors.textMuted }}>Bloquear</Text>
          </Pressable>
          <Button
            onPress={onNew}
            variant="primary"
            size="sm"
            icon={<Add size={18} color="white"  variant="Outline" />}
          >
            Novo
          </Button>
        </View>
      </View>

      {/* View Mode Selector - Modern Pills */}
      <View className="flex-row mb-4">
        <View
          className="flex-row rounded-2xl p-1.5 flex-1"
          style={{ backgroundColor: colors.backgroundCard }}
        >
          {[
            { key: 'day', label: 'Dia', icon: Clock },
            { key: 'week', label: 'Semana', icon: Calendar },
            { key: 'month', label: 'Mês', icon: CalendarIcon },
            { key: 'year', label: 'Ano', icon: CalendarTick },
          ].map(({ key, label, icon: Icon }) => {
            const isActive = key !== 'week' && viewMode === key;
            return (
              <Pressable
                key={key}
                onPress={() => onSelectMode(key as AgendaModeKey)}
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                style={{
                  backgroundColor: isActive ? colors.primary : 'transparent',
                }}
              >
                <Icon size={16} color={isActive ? 'white' : colors.textMuted} />
                <Text
                  className="ml-1.5 text-sm font-semibold"
                  style={{ color: isActive ? 'white' : colors.textMuted }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Date Navigation */}
      <View className="flex-row items-center justify-between mb-2">
        <Pressable
          onPress={() => onNavigate('prev')}
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.backgroundCard }}
        >
          <ArrowLeft2 size={20} color={colors.textSecondary}  variant="Outline" />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onGoToday();
          }}
          className="flex-row items-center"
        >
          <Text className="text-gray-900 font-bold text-lg capitalize">
            {navigationTitle}
          </Text>
          {!isToday(selectedDate) && (
            <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.primary + '30' }}>
              <Text className="text-xs font-medium" style={{ color: colors.secondary }}>
                Hoje
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={() => onNavigate('next')}
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.backgroundCard }}
        >
          <ArrowRight2 size={20} color={colors.textSecondary}  variant="Outline" />
        </Pressable>
      </View>
    </View>
  );
}
