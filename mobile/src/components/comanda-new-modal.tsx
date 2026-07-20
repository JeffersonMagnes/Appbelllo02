import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, TextInput, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Add, User, CloseCircle, SearchNormal1, ArrowRight2 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Client } from '@/lib/types';
import { type NewComandaState } from '@/lib/comanda-ui-types';
import * as Haptics from 'expo-haptics';

interface NewComandaModalProps {
  state: NewComandaState;
  onClose: () => void;
  onCreate: (client: Client) => void;
  clientsData: Client[];
  isLoadingClients: boolean;
}

// ── Modal Nova Comanda ────────────────────────────────────────────────────────
export function NewComandaModal({
  state, onClose, onCreate, clientsData, isLoadingClients,
}: NewComandaModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = clientsData.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={state.visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(260)}
          exiting={SlideOutDown.duration(220)}
          style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 12, height: '75%' }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>Nova Comanda</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 2 }}>Selecione o cliente</Text>
            </View>
            <Pressable onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <CloseCircle size={16} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          {/* Search */}
          <View style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: colors.border }}>
              <SearchNormal1 size={15} color={colors.textMuted}  variant="Outline" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar cliente..."
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, color: colors.textPrimary, fontSize: 14, marginLeft: 10 }}
              />
            </View>
          </View>

          {/* Lista */}
          {isLoadingClients ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>Carregando clientes...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={c => c.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <User size={30} color={colors.primary} variant="Outline" />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                    {search.length > 0 ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                    {search.length > 0
                      ? `Nenhum cliente com "${search}"`
                      : 'Cadastre um cliente para criar uma comanda'}
                  </Text>
                  {search.length === 0 && (
                    <Pressable
                      onPress={() => { onClose(); router.push('/admin/clients'); }}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.primary, gap: 8 }}
                    >
                      <Add size={16} color="#fff" variant="Outline" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Cadastrar cliente</Text>
                    </Pressable>
                  )}
                </View>
              }
              renderItem={({ item: client }) => (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCreate(client); setSearch(''); }}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 12, paddingHorizontal: 14,
                    borderRadius: 14, marginBottom: 6,
                    backgroundColor: pressed ? colors.primary + '10' : colors.background,
                    borderWidth: 1, borderColor: pressed ? colors.primary + '40' : colors.border,
                  })}
                >
                  {client.avatar
                    ? <Image source={{ uri: client.avatar }} style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12 }} />
                    : <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <User size={20} color={colors.primary} variant="Outline" />
                      </View>
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{client.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>
                      {client.phone || 'Cliente'}
                    </Text>
                  </View>
                  <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" />
                </Pressable>
              )}
            />
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
