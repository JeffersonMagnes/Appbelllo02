import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Image,
  Dimensions, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star1, Box, Filter, Grid2, TextalignLeft, ArrowRight2 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Ad {
  id: string;
  product_name: string;
  partner_name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  discount: number | null;
  tag: string | null;
  url: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'price_asc' | 'price_desc';

export default function SupplierScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [ads, setAds] = useState<Ad[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAds() {
      // Convert slug back to search pattern — match any partner_name that slugifies to this id
      const { data } = await supabase
        .from('partner_ads')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: false });

      if (data && data.length > 0) {
        // Filter by slug match
        const filtered = (data as Ad[]).filter(ad =>
          ad.partner_name.toLowerCase().replace(/[^a-z0-9]/g, '-') === id
        );
        setAds(filtered);
        if (filtered.length > 0) setPartnerName(filtered[0].partner_name);
      }
      setLoading(false);
    }
    if (id) fetchAds();
  }, [id]);

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const sortedAds = [...ads].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    return 0;
  });

  const handleBack = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (ads.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <SafeAreaView edges={['top']}>
          <View className="px-5 py-3">
            <Pressable onPress={handleBack} className="w-10 h-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.backgroundCard }}>
              <ArrowLeft size={20} color={colors.textPrimary}  variant="Outline" />
            </Pressable>
          </View>
        </SafeAreaView>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.textMuted }}>Nenhum produto encontrado</Text>
        </View>
      </View>
    );
  }

  const coverImage = ads[0].image_url ?? 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800';

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header com imagem de capa */}
      <View className="relative">
        <Image source={{ uri: coverImage }} style={{ width: SCREEN_WIDTH, height: 180 }} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', colors.background]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View className="px-5 py-3">
            <Pressable onPress={handleBack} className="w-10 h-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <ArrowLeft size={20} color="#fff"  variant="Outline" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* Partner Info Card */}
      <View className="px-5 -mt-12">
        <Animated.View entering={FadeInDown.duration(400)} className="rounded-2xl p-4" style={{ backgroundColor: colors.backgroundCard }}>
          <View className="flex-row items-center mb-3">
            <View className="w-16 h-16 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: colors.primary + '20' }}>
              <Box size={32} color={colors.primary}  variant="Outline" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-xl" style={{ color: colors.textPrimary }}>{partnerName}</Text>
              <View className="flex-row items-center mt-1">
                <Star1 size={14} color="#FFB547" fill="#FFB547"  variant="Outline" />
                <Text className="font-medium ml-1" style={{ color: colors.textPrimary }}>5.0</Text>
                <Text className="text-sm ml-1" style={{ color: colors.textMuted }}>· Parceiro oficial</Text>
              </View>
            </View>
          </View>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {ads.length} {ads.length === 1 ? 'oferta disponível' : 'ofertas disponíveis'}
          </Text>
        </Animated.View>
      </View>

      {/* Products */}
      <View className="flex-1 mt-4">
        {/* Filters */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} className="flex-row items-center justify-between px-5 mb-4">
          <Text className="font-semibold" style={{ color: colors.textPrimary }}>
            {sortedAds.length} {sortedAds.length === 1 ? 'produto' : 'produtos'} em oferta
          </Text>
          <View className="flex-row items-center">
            <View className="flex-row mr-3">
              {(['grid', 'list'] as ViewMode[]).map((mode, i) => (
                <Pressable key={mode} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode(mode); }}
                  className={`w-9 h-9 items-center justify-center ${i === 0 ? 'rounded-l-lg' : 'rounded-r-lg'}`}
                  style={{ backgroundColor: viewMode === mode ? colors.primary : colors.backgroundCard }}>
                  {mode === 'grid' ? <Grid2 size={18} color={viewMode === mode ? '#fff' : colors.textMuted} /> : <TextalignLeft size={18} color={viewMode === mode ? '#fff' : colors.textMuted} />}
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const opts: SortOption[] = ['relevance', 'price_asc', 'price_desc'];
              setSortBy(opts[(opts.indexOf(sortBy) + 1) % opts.length]);
            }} className="flex-row items-center px-3 py-2 rounded-lg" style={{ backgroundColor: colors.backgroundCard }}>
              <Filter size={16} color={colors.textMuted} />
              <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                {sortBy === 'relevance' ? 'Relevância' : sortBy === 'price_asc' ? 'Menor preço' : 'Maior preço'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {viewMode === 'grid' ? (
            <View className="flex-row flex-wrap justify-between">
              {sortedAds.map((ad, index) => (
                <Animated.View key={ad.id} entering={FadeInDown.duration(400).delay(index * 50)}
                  style={{ width: (SCREEN_WIDTH - 52) / 2 }} className="mb-4">
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/offer/${ad.id}`); }}
                    className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
                    <View className="relative">
                      <Image source={{ uri: ad.image_url ?? 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400' }}
                        className="w-full h-32" resizeMode="cover" />
                      {ad.discount ? (
                        <View className="absolute top-2 left-2 px-2 py-1 rounded-full" style={{ backgroundColor: colors.error }}>
                          <Text className="text-white text-xs font-bold">-{ad.discount}%</Text>
                        </View>
                      ) : ad.tag ? (
                        <View className="absolute top-2 left-2 px-2 py-1 rounded-full" style={{ backgroundColor: colors.primary }}>
                          <Text className="text-white text-xs font-medium">{ad.tag}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="p-3">
                      <Text className="font-medium text-sm mb-1" style={{ color: colors.textPrimary }} numberOfLines={2}>{ad.product_name}</Text>
                      <View className="flex-row items-center mb-1">
                        <Star1 size={12} color="#FFB547" fill="#FFB547"  variant="Outline" />
                        <Text className="text-xs ml-1" style={{ color: colors.textMuted }}>5.0</Text>
                      </View>
                      <Text className="font-bold" style={{ color: colors.secondary }}>{formatPrice(ad.price)}</Text>
                      {ad.original_price ? (
                        <Text className="text-xs line-through" style={{ color: colors.textMuted }}>{formatPrice(ad.original_price)}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View>
              {sortedAds.map((ad, index) => (
                <Animated.View key={ad.id} entering={FadeInDown.duration(400).delay(index * 50)}>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/offer/${ad.id}`); }}
                    className="flex-row rounded-xl overflow-hidden mb-3" style={{ backgroundColor: colors.backgroundCard }}>
                    <View className="relative">
                      <Image source={{ uri: ad.image_url ?? 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400' }}
                        className="w-28 h-28" resizeMode="cover" />
                      {ad.discount ? (
                        <View className="absolute top-2 left-2 px-2 py-1 rounded-full" style={{ backgroundColor: colors.error }}>
                          <Text className="text-white text-xs font-bold">-{ad.discount}%</Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="flex-1 p-3 justify-center">
                      <Text className="font-medium mb-1" style={{ color: colors.textPrimary }} numberOfLines={2}>{ad.product_name}</Text>
                      <View className="flex-row items-center mb-2">
                        <Star1 size={12} color="#FFB547" fill="#FFB547"  variant="Outline" />
                        <Text className="text-xs ml-1" style={{ color: colors.textMuted }}>5.0</Text>
                        {ad.tag ? (
                          <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.primary + '30' }}>
                            <Text className="text-xs" style={{ color: colors.primary }}>{ad.tag}</Text>
                          </View>
                        ) : null}
                      </View>
                      <View className="flex-row items-baseline">
                        <Text className="font-bold text-lg" style={{ color: colors.secondary }}>{formatPrice(ad.price)}</Text>
                        {ad.original_price ? (
                          <Text className="text-sm line-through ml-2" style={{ color: colors.textMuted }}>{formatPrice(ad.original_price)}</Text>
                        ) : null}
                      </View>
                    </View>
                    <View className="justify-center pr-3">
                      <ArrowRight2 size={20} color={colors.textMuted}  variant="Outline" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
