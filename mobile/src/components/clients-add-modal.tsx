import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloseCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';

export function ClientAddModal({
  visible,
  onClose,
  newClientName,
  setNewClientName,
  newClientPhone,
  setNewClientPhone,
  newClientEmail,
  setNewClientEmail,
  newClientBirthDate,
  setNewClientBirthDate,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  newClientPhone: string;
  setNewClientPhone: (v: string) => void;
  newClientEmail: string;
  setNewClientEmail: (v: string) => void;
  newClientBirthDate: string;
  setNewClientBirthDate: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <View className="px-5 py-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text className="text-gray-900 text-xl font-bold">Novo Cliente</Text>
            <Pressable onPress={onClose} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.backgroundCard }}>
              <CloseCircle size={20} color={colors.textMuted} variant="Outline" />
            </Pressable>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <ScrollView className="flex-1 px-5 pt-6" keyboardShouldPersistTaps="handled">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">Nome *</Text>
              <TextInput value={newClientName} onChangeText={setNewClientName} placeholder="Nome completo"
                placeholderTextColor={colors.textMuted}
                className="text-gray-900 px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: colors.backgroundCard, fontSize: 16 }} />
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">Telefone</Text>
              <TextInput value={newClientPhone} onChangeText={setNewClientPhone} placeholder="(11) 99999-9999"
                placeholderTextColor={colors.textMuted} keyboardType="phone-pad"
                className="text-gray-900 px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: colors.backgroundCard, fontSize: 16 }} />
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">E-mail</Text>
              <TextInput value={newClientEmail} onChangeText={setNewClientEmail} placeholder="email@exemplo.com"
                placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none"
                className="text-gray-900 px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: colors.backgroundCard, fontSize: 16 }} />
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">Data de Nascimento</Text>
              <TextInput value={newClientBirthDate} onChangeText={setNewClientBirthDate} placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.textMuted} keyboardType="numeric"
                className="text-gray-900 px-4 py-3 rounded-xl mb-6" style={{ backgroundColor: colors.backgroundCard, fontSize: 16 }} />
              <Pressable onPress={onSubmit} className="py-4 rounded-xl items-center mb-4" style={{ backgroundColor: colors.primary }}>
                <Text className="text-white font-bold text-base">Cadastrar Cliente</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
