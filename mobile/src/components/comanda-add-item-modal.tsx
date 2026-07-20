import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Add, CloseCircle, SearchNormal1, Scissor, Box } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils/comanda-format';
import { type AddItemState } from '@/lib/comanda-ui-types';
import * as Haptics from 'expo-haptics';

// ── Modal Adicionar Item ──────────────────────────────────────────────────────
export function AddItemModal({
  state, onClose, onAdd, servicesData, productsData,
}: {
  state: AddItemState;
  onClose: () => void;
  onAdd: (item: any, type: 'service' | 'product') => void;
  servicesData: any[];
  productsData: any[];
}) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'service' | 'product'>(state.tab);
  const [search, setSearch] = useState('');

  React.useEffect(() => { setTab(state.tab); }, [state.tab]);

  const data = (tab === 'service' ? servicesData : productsData).filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={state.visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(260)}
          exiting={SlideOutDown.duration(220)}
          style={{
            backgroundColor: colors.backgroundCard,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingBottom: insets.bottom + 12,
            height: '80%',
          }}
        >
          <LinearGradient
            colors={tab === 'service' ? [colors.primary + '15', 'transparent'] : [colors.secondary + '12', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />

          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Adicionar item</Text>
            <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <CloseCircle size={16} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          {/* Tab selector */}
          <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: '#F3F4F6', borderRadius: 14, padding: 4 }}>
            {(['service', 'product'] as const).map((t) => {
              const active = tab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
                  style={{ flex: 1, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
                    backgroundColor: active ? (t === 'service' ? colors.primary : colors.secondary) : 'transparent',
                  }}
                >
                  {t === 'service'
                    ? <Scissor size={14} color={active ? '#fff' : '#9CA3AF'}  variant="Outline" />
                    : <Box size={14} color={active ? '#fff' : '#9CA3AF'}  variant="Outline" />
                  }
                  <Text style={{ color: active ? '#fff' : '#9CA3AF', fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
                    {t === 'service' ? 'Serviços' : 'Produtos'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Search */}
          <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, height: 42, borderWidth: 1.5, borderColor: colors.border }}>
              <SearchNormal1 size={14} color={colors.textMuted}  variant="Outline" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={`Buscar ${tab === 'service' ? 'serviço' : 'produto'}...`}
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, color: colors.textPrimary, fontSize: 14, marginLeft: 8 }}
              />
            </View>
          </View>

          <FlatList
            data={data}
            keyExtractor={i => i.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onAdd(item, tab);
                  setSearch('');
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 12, paddingHorizontal: 14,
                  borderRadius: 14, marginBottom: 6,
                  backgroundColor: pressed ? colors.primary + '10' : colors.backgroundCard,
                  borderWidth: 1, borderColor: colors.border,
                })}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 12, marginRight: 12,
                  backgroundColor: tab === 'service' ? colors.primary + '15' : colors.secondary + '15',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {tab === 'service'
                    ? <Scissor size={18} color={colors.primary}  variant="Outline" />
                    : <Box size={18} color={colors.secondary}  variant="Outline" />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{item.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: tab === 'service' ? colors.primary : colors.secondary, fontWeight: '800', fontSize: 15 }}>
                    {formatCurrency(item.price)}
                  </Text>
                  <View style={{ marginTop: 4, width: 28, height: 28, borderRadius: 8, backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
                    <Add size={14} color={colors.primary}  variant="Outline" />
                  </View>
                </View>
              </Pressable>
            )}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
