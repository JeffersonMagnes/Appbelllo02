import React from 'react';
import { View, Text, Pressable, Modal, FlatList, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardText, SearchNormal1, CloseCircle, User, ArrowRight2 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import type { Client } from '@/lib/types';

export function ClientsPickerModal({
  visible,
  onClose,
  clientPickerSearch,
  setClientPickerSearch,
  clientsData,
}: {
  visible: boolean;
  onClose: () => void;
  clientPickerSearch: string;
  setClientPickerSearch: (v: string) => void;
  clientsData: Client[];
}) {
  const router = useRouter();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
          borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 11,
              backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardText size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>Nova Ficha</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Selecione o cliente</Text>
            </View>
          </View>
          <Pressable onPress={onClose}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <CloseCircle size={16} color={colors.textMuted} variant="Outline" />
          </Pressable>
        </View>

        {/* Busca */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard,
            borderRadius: 12, paddingHorizontal: 12, height: 44,
            borderWidth: 1, borderColor: colors.border }}>
            <SearchNormal1 size={15} color={colors.textMuted} variant="Outline" />
            <TextInput
              value={clientPickerSearch}
              onChangeText={setClientPickerSearch}
              placeholder="Buscar cliente..."
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, marginLeft: 10, color: colors.textPrimary, fontSize: 14 }}
            />
            {clientPickerSearch.length > 0 && (
              <Pressable onPress={() => setClientPickerSearch('')}>
                <CloseCircle size={14} color={colors.textMuted} variant="Outline" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Lista de clientes */}
        <FlatList
          data={clientsData.filter(c =>
            !clientPickerSearch || c.name.toLowerCase().includes(clientPickerSearch.toLowerCase())
          )}
          keyExtractor={c => c.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
          renderItem={({ item: client }) => {
            const initials = client.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
            return (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onClose();
                  router.push({
                    pathname: '/admin/anamnesis-templates',
                    params: { clientId: client.id, clientName: client.name },
                  });
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
                  backgroundColor: pressed ? colors.primary + '08' : 'transparent',
                })}>
                {client.avatar
                  ? <Image source={{ uri: client.avatar }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
                  : <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '18',
                      alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>{initials}</Text>
                    </View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                    {client.name}
                  </Text>
                  {client.phone ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>{client.phone}</Text> : null}
                </View>
                <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <User size={36} color={colors.textMuted} variant="Outline" />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
                {clientPickerSearch ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
