import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft2, ShoppingBag, TickCircle, CloseCircle, Eye } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/lib/state/auth-store';
import { useProducts, useUpdateProduct } from '@/lib/hooks/use-products';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CatalogoScreen() {
  const router = useRouter();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: products = [], isLoading } = useProducts(establishmentId ?? undefined);
  const updateProduct = useUpdateProduct();

  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [toggling, setToggling] = useState<string | null>(null);

  const onlineCount = products.filter(p => p.sell_online).length;
  const offlineCount = products.filter(p => !p.sell_online).length;

  const filtered = filter === 'all' ? products :
    filter === 'online' ? products.filter(p => p.sell_online) :
    products.filter(p => !p.sell_online);

  const toggleOnline = async (product: typeof products[0]) => {
    if (!establishmentId) return;
    setToggling(product.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateProduct.mutateAsync({
      id: product.id,
      establishmentId,
      sell_online: !product.sell_online,
    });
    setToggling(null);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.backgroundCard }}>
            <ArrowLeft2 size={24} color="#1C1C1E" variant="Outline" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-gray-900 text-xl font-bold">Catálogo Online</Text>
            <Text className="text-gray-400 text-xs">Produtos visíveis no seu link</Text>
          </View>
        </View>

        {/* Info banner */}
        <View className="mx-5 mb-4 p-4 rounded-2xl" style={{ backgroundColor: colors.primary + '12' }}>
          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>Configure seu catálogo</Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Escolha quais produtos aparecem no catálogo público do seu link. Clientes poderão ver produtos, preços e fotos.
          </Text>
        </View>

        {/* Stats */}
        <View className="px-5 mb-4 flex-row gap-3">
          <View className="flex-1 p-3 rounded-2xl" style={{ backgroundColor: colors.backgroundCard }}>
            <Text className="text-gray-400 text-xs mb-1">Total</Text>
            <Text className="font-bold text-sm" style={{ color: colors.primary }}>{products.length}</Text>
          </View>
          <View className="flex-1 p-3 rounded-2xl" style={{ backgroundColor: colors.backgroundCard }}>
            <Text className="text-gray-400 text-xs mb-1">No catálogo</Text>
            <Text className="font-bold text-sm" style={{ color: colors.success }}>{onlineCount}</Text>
          </View>
          <View className="flex-1 p-3 rounded-2xl" style={{ backgroundColor: colors.backgroundCard }}>
            <Text className="text-gray-400 text-xs mb-1">Ocultos</Text>
            <Text className="font-bold text-sm" style={{ color: colors.textMuted }}>{offlineCount}</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-4" style={{ flexGrow: 0 }}>
          {([
            { key: 'all' as const, label: 'Todos', count: products.length },
            { key: 'online' as const, label: 'No catálogo', count: onlineCount },
            { key: 'offline' as const, label: 'Ocultos', count: offlineCount },
          ]).map(f => {
            const active = filter === f.key;
            return (
              <Pressable key={f.key} onPress={() => setFilter(f.key)}
                className="mr-2 px-4 py-2 rounded-xl flex-row items-center"
                style={{ backgroundColor: active ? colors.primary : colors.backgroundCard }}>
                <Text className="text-sm font-semibold" style={{ color: active ? 'white' : colors.textMuted }}>
                  {f.label} ({f.count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : products.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <ShoppingBag size={48} color={colors.textMuted} variant="Outline" />
            <Text className="text-gray-500 mt-3 font-medium text-center">Nenhum produto cadastrado</Text>
            <Text className="text-gray-400 text-sm mt-1 text-center">Cadastre produtos na seção de Estoque para adicioná-los ao catálogo.</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/products'); }}
              className="mt-4 px-6 py-3 rounded-2xl"
              style={{ backgroundColor: colors.primary }}>
              <Text className="text-white font-bold text-sm">Ir para Estoque</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 font-medium">
              Nenhum produto {filter === 'online' ? 'no catálogo' : 'oculto'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item: p }) => (
              <View className="rounded-2xl p-3 flex-row items-center" style={{ backgroundColor: colors.backgroundCard }}>
                {/* Image */}
                <View className="w-14 h-14 rounded-xl overflow-hidden mr-3" style={{ backgroundColor: colors.surface }}>
                  {p.image_url ? (
                    <View className="w-full h-full items-center justify-center">
                      <ShoppingBag size={20} color={colors.textMuted} variant="Outline" />
                    </View>
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <ShoppingBag size={20} color={colors.textMuted} variant="Outline" />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View className="flex-1 mr-3">
                  <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>{p.name}</Text>
                  <View className="flex-row items-center mt-0.5 gap-2">
                    <Text className="font-bold text-sm" style={{ color: colors.primary }}>{fmt(p.price)}</Text>
                    {p.category && (
                      <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: colors.surface }}>
                        <Text className="text-gray-400 text-xs">{p.category}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Toggle */}
                <View className="items-center">
                  <Pressable
                    onPress={() => toggleOnline(p)}
                    disabled={toggling === p.id}
                    style={{
                      width: 44, height: 24, borderRadius: 12, padding: 2,
                      backgroundColor: p.sell_online ? colors.success : colors.border,
                      opacity: toggling === p.id ? 0.5 : 1,
                    }}
                  >
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: 'white',
                      alignSelf: p.sell_online ? 'flex-end' : 'flex-start',
                    }} />
                  </Pressable>
                  <Text className="text-xs mt-1 font-medium" style={{ color: p.sell_online ? colors.success : colors.textMuted }}>
                    {p.sell_online ? 'Visível' : 'Oculto'}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Bottom tip */}
        {products.length > 0 && (
          <View className="px-5 pb-6 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/products'); }}
              className="py-3 rounded-2xl items-center"
              style={{ backgroundColor: colors.backgroundCard }}>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Para editar produtos, acesse o <Text className="font-bold" style={{ color: colors.primary }}>Estoque</Text>
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
