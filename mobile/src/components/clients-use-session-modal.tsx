import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { CloseCircle, Box, TickSquare } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { expiresLabel } from '@/lib/utils/client-package-format';
import { type ClientPackage } from '@/lib/state/client-packages-store';
import type { Service } from '@/lib/types';

export function ClientsUseSessionModal({
  visible,
  onClose,
  useSessionPkg,
  services,
  sessionNote,
  setSessionNote,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  useSessionPkg: ClientPackage | null;
  services: Service[];
  sessionNote: string;
  setSessionNote: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text className="text-gray-900 text-lg font-bold">Registrar Sessão</Text>
          <Pressable onPress={onClose}
            className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
            <CloseCircle size={18} color={colors.textMuted} variant="Outline" />
          </Pressable>
        </View>
        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
          {useSessionPkg && (
            <>
              <View className="rounded-2xl p-4 mb-5" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '15' }}>
                    <Box size={18} color={colors.primary} variant="Outline" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-xs">Pacote</Text>
                    <Text className="text-gray-900 font-bold">{useSessionPkg.packageName}</Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 text-sm">Sessões utilizadas</Text>
                  <Text className="font-bold text-sm" style={{ color: colors.primary }}>
                    {useSessionPkg.usedSessions} / {useSessionPkg.totalSessions}
                  </Text>
                </View>
                <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
                  <View style={{ height: 8, borderRadius: 4, width: `${(useSessionPkg.usedSessions / useSessionPkg.totalSessions) * 100}%`, backgroundColor: colors.primary }} />
                </View>
                <Text className="text-gray-400 text-xs mt-2">
                  {useSessionPkg.totalSessions - useSessionPkg.usedSessions} sessão(ões) restante(s) · Expira em {expiresLabel(useSessionPkg.expiresAt)}
                </Text>
              </View>
              <Text className="text-gray-700 text-sm font-medium mb-2">Serviços do pacote</Text>
              <View className="rounded-xl mb-5 overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                {services.filter(s => useSessionPkg.serviceIds.includes(s.id)).map((svc, idx) => (
                  <View key={svc.id} className="flex-row items-center px-4 py-3" style={idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : {}}>
                    <Text className="text-gray-900 text-sm flex-1">{svc.name}</Text>
                    <Text className="text-gray-400 text-xs">{svc.duration} min</Text>
                  </View>
                ))}
              </View>
              <Text className="text-gray-700 text-sm font-medium mb-2">Observação (opcional)</Text>
              <TextInput value={sessionNote} onChangeText={setSessionNote}
                placeholder="Ex: Realizado corte + barba hoje..." placeholderTextColor={colors.textMuted}
                multiline numberOfLines={3}
                className="rounded-xl px-4 py-3 text-gray-900 mb-8"
                style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }} />
            </>
          )}
        </ScrollView>
        <View className="px-5 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable onPress={onConfirm}
            className="py-4 rounded-2xl items-center flex-row justify-center"
            style={{ backgroundColor: colors.primary }}>
            <TickSquare size={18} color="white" variant="Outline" />
            <Text className="text-white font-bold text-base ml-2">Confirmar Sessão</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
