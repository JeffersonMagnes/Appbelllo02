import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal, TextInput } from 'react-native';
import { Calendar as CalendarIcon, Clock, InfoCircle, Slash } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Employee } from '@/lib/types';
import * as Haptics from 'expo-haptics';

export function BlockSlotModal({
  visible,
  onClose,
  professionals,
  blockDate,
  setBlockDate,
  blockStartTime,
  setBlockStartTime,
  blockEndTime,
  setBlockEndTime,
  blockReason,
  setBlockReason,
  blockEmployeeId,
  setBlockEmployeeId,
  onSubmit,
  isSubmitting,
}: {
  visible: boolean;
  onClose: () => void;
  professionals: Employee[];
  blockDate: string;
  setBlockDate: (v: string) => void;
  blockStartTime: string;
  setBlockStartTime: (v: string) => void;
  blockEndTime: string;
  setBlockEndTime: (v: string) => void;
  blockReason: string;
  setBlockReason: (v: string) => void;
  blockEmployeeId: string | null;
  setBlockEmployeeId: (v: string | null) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View className="px-5 pt-5 pb-3 flex-row items-center justify-between border-b" style={{ borderBottomColor: colors.border }}>
          <Pressable onPress={onClose}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>Cancelar</Text>
          </Pressable>
          <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>Bloquear Horário</Text>
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.textMuted + '15' }}>
            <Slash size={18} color={colors.textMuted} variant="Outline" />
          </View>
        </View>

        <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
          {/* Date */}
          <View className="mb-4">
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Data</Text>
            <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
              <View className="flex-row items-center px-4 h-12">
                <CalendarIcon size={16} color={colors.primary} variant="Outline" />
                <TextInput
                  value={blockDate}
                  onChangeText={setBlockDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                />
              </View>
            </View>
          </View>

          {/* Start / End Time */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Hora início</Text>
              <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                <View className="flex-row items-center px-4 h-12">
                  <Clock size={16} color={colors.primary} variant="Outline" />
                  <TextInput
                    value={blockStartTime}
                    onChangeText={setBlockStartTime}
                    placeholder="09:00"
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                  />
                </View>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Hora fim</Text>
              <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                <View className="flex-row items-center px-4 h-12">
                  <Clock size={16} color={colors.primary} variant="Outline" />
                  <TextInput
                    value={blockEndTime}
                    onChangeText={setBlockEndTime}
                    placeholder="10:00"
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Professional Selector */}
          <View className="mb-4">
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Profissional (opcional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBlockEmployeeId(null); }}
                className="flex-row items-center px-4 py-2.5 rounded-xl mr-2"
                style={{ backgroundColor: blockEmployeeId === null ? colors.primary : colors.backgroundCard, borderWidth: 1, borderColor: blockEmployeeId === null ? colors.primary : colors.border }}
              >
                <Text className="text-sm font-semibold" style={{ color: blockEmployeeId === null ? 'white' : colors.textSecondary }}>
                  Todos
                </Text>
              </Pressable>
              {professionals.map((prof) => (
                <Pressable
                  key={prof.id}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBlockEmployeeId(prof.id); }}
                  className="flex-row items-center px-3 py-2 rounded-xl mr-2"
                  style={{ backgroundColor: blockEmployeeId === prof.id ? colors.primary : colors.backgroundCard, borderWidth: 1, borderColor: blockEmployeeId === prof.id ? colors.primary : colors.border }}
                >
                  {prof.avatar ? (
                    <Image
                      source={{ uri: prof.avatar }}
                      className="w-6 h-6 rounded-full mr-2"
                      style={{ borderWidth: blockEmployeeId === prof.id ? 2 : 0, borderColor: 'white' }}
                    />
                  ) : null}
                  <Text className="text-sm font-semibold" style={{ color: blockEmployeeId === prof.id ? 'white' : colors.textSecondary }}>
                    {prof.name.split(' ')[0]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Reason */}
          <View className="mb-6">
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Motivo (opcional)</Text>
            <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
              <View className="flex-row items-center px-4 h-12">
                <InfoCircle size={16} color={colors.textMuted} variant="Outline" />
                <TextInput
                  value={blockReason}
                  onChangeText={setBlockReason}
                  placeholder="Ex: Almoço, Reunião..."
                  placeholderTextColor={colors.textMuted}
                  style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                />
              </View>
            </View>
          </View>

          {/* Preview */}
          <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex-row items-center mb-2">
              <Slash size={16} color={colors.textMuted} variant="Outline" />
              <Text className="ml-2 text-sm font-bold" style={{ color: colors.textSecondary }}>Pré-visualização</Text>
            </View>
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              {blockDate || 'Data'} • {blockStartTime || '00:00'} - {blockEndTime || '00:00'}
            </Text>
            {blockReason ? <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>{blockReason}</Text> : null}
            <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>
              {blockEmployeeId ? professionals.find(p => p.id === blockEmployeeId)?.name ?? 'Profissional' : 'Todos os profissionais'}
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="px-5 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable
            onPress={onSubmit}
            className="py-4 rounded-2xl items-center flex-row justify-center gap-2"
            style={{ backgroundColor: isSubmitting ? colors.textMuted : colors.primary, opacity: isSubmitting ? 0.7 : 1 }}
          >
            <Slash size={18} color="white" variant="Outline" />
            <Text className="text-white font-bold text-base">
              {isSubmitting ? 'Bloqueando...' : 'Bloquear Horário'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
