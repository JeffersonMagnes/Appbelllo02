import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Image,
  Dimensions, Linking, Share, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star1, ShoppingCart, Share as ShareIcon, Heart, TickSquare, Truck, Shield, Clock, ExportSquare, ArrowRight2, Box } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Ad {
  id: string;
  product_name: string;
  partner_name: string;
  description: string | null;
  full_description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  images: string[] | null;
  discount: number | null;
  tag: string | null;
  url: string;
  benefits: string[] | null;
  specs: Record<string, string> | null;
}

export default function OfferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [ad, setAd] = useState<Ad | null>(null);
  const [otherAds, setOtherAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('partner_ads').select('*').eq('id', id).single();
      if (data) {
        const current = data as Ad;
        setAd(current);
        // Fetch other ads from same partner
        const { data: others } = await supabase
          .from('partner_ads')
          .select('*')
          .eq('partner_name', current.partner_name)
          .neq('id', id)
          .eq('status', 'active')
          .limit(6);
        setOtherAds((others as Ad[]) || []);
      }
      setLoading(false);
    }
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!ad) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text style={{ color: colors.textMuted }}>Oferta não encontrada</Text>
      </View>
    );
  }

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const images = (ad.images && ad.images.length > 0)
    ? ad.images
    : [ad.image_url ?? 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800'];

  const supplierSlug = ad.partner_name.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const handleBack = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartScale.value = withSpring(1.3, {}, () => { heartScale.value = withSpring(1); });
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: `Confira: ${ad.product_name} por ${formatPrice(ad.price)}! ${ad.url}` });
    } catch {}
  };

  const handleOpenUrl = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (await Linking.canOpenURL(ad.url)) await Linking.openURL(ad.url);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Floating header */}
        <View className="absolute top-0 left-0 right-0 z-10">
          <SafeAreaView edges={['top']}>
            <View className="flex-row items-center justify-between px-5 py-3">
              <Pressable onPress={handleBack} className="w-10 h-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <ArrowLeft size={20} color="#fff"  variant="Outline" />
              </Pressable>
              <View className="flex-row">
                <Pressable onPress={handleShare} className="w-10 h-10 items-center justify-center rounded-full mr-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <ShareIcon size={20} color="#fff" />
                </Pressable>
                <Animated.View style={heartAnimatedStyle}>
                  <Pressable onPress={handleFavorite} className="w-10 h-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Heart size={20} color={isFavorite ? colors.error : '#fff'} fill={isFavorite ? colors.error : 'transparent'} />
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Image Gallery */}
          <View>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setSelectedImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}>
              {images.map((img, i) => (
                <Image key={i} source={{ uri: img }} style={{ width: SCREEN_WIDTH, height: 320 }} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
                {images.map((_, i) => (
                  <View key={i} className="w-2 h-2 rounded-full mx-1"
                    style={{ backgroundColor: i === selectedImageIndex ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                ))}
              </View>
            )}
            {/* Tags */}
            <View style={{ position: 'absolute', top: 72, left: 16, flexDirection: 'row' }}>
              {ad.discount ? (
                <View className="px-3 py-1.5 rounded-full mr-2" style={{ backgroundColor: colors.error }}>
                  <Text className="text-white text-sm font-bold">-{ad.discount}%</Text>
                </View>
              ) : null}
              {ad.tag ? (
                <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white text-sm font-medium">{ad.tag}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Content */}
          <View className="px-5 pt-5 pb-36">
            {/* Brand & Rating */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)} className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>{ad.partner_name}</Text>
              <View className="flex-row items-center">
                <Star1 size={16} color="#FFB547" fill="#FFB547"  variant="Outline" />
                <Text className="font-medium ml-1" style={{ color: colors.textPrimary }}>5.0</Text>
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.Text entering={FadeInDown.duration(400).delay(150)} className="text-2xl font-bold mb-3" style={{ color: colors.textPrimary }}>
              {ad.product_name}
            </Animated.Text>

            {/* Price */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)} className="flex-row items-baseline mb-4">
              <Text className="text-3xl font-bold" style={{ color: colors.secondary }}>{formatPrice(ad.price)}</Text>
              {ad.original_price ? (
                <Text className="text-lg line-through ml-3" style={{ color: colors.textMuted }}>{formatPrice(ad.original_price)}</Text>
              ) : null}
            </Animated.View>

            {/* Delivery badges */}
            <Animated.View entering={FadeInDown.duration(400).delay(250)} className="flex-row mb-6">
              {[
                { icon: Truck, label: 'Frete grátis', color: colors.success },
                { icon: Shield, label: 'Garantia', color: colors.info },
                { icon: Clock, label: 'Entrega rápida', color: colors.warning },
              ].map(({ icon: Icon, label, color }) => (
                <View key={label} className="flex-1 flex-row items-center p-3 rounded-xl mr-2 last:mr-0" style={{ backgroundColor: colors.backgroundCard }}>
                  <Icon size={16} color={color} />
                  <Text className="text-xs ml-1.5" style={{ color: colors.textSecondary }}>{label}</Text>
                </View>
              ))}
            </Animated.View>

            {/* Description */}
            {(ad.full_description || ad.description) ? (
              <Animated.View entering={FadeInDown.duration(400).delay(300)} className="mb-6">
                <Text className="font-semibold text-base mb-2" style={{ color: colors.textPrimary }}>Descrição</Text>
                <Text className="leading-6" style={{ color: colors.textSecondary }}>
                  {ad.full_description || ad.description}
                </Text>
              </Animated.View>
            ) : null}

            {/* Benefits */}
            {ad.benefits && ad.benefits.length > 0 ? (
              <Animated.View entering={FadeInDown.duration(400).delay(350)} className="mb-6">
                <Text className="font-semibold text-base mb-3" style={{ color: colors.textPrimary }}>Benefícios</Text>
                <View className="rounded-xl p-4" style={{ backgroundColor: colors.backgroundCard }}>
                  {ad.benefits.map((b, i) => (
                    <View key={i} className="flex-row items-center mb-2 last:mb-0">
                      <View className="w-5 h-5 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.success + '20' }}>
                        <TickSquare size={12} color={colors.success}  variant="Outline" />
                      </View>
                      <Text className="flex-1" style={{ color: colors.textSecondary }}>{b}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            ) : null}

            {/* Specs */}
            {ad.specs && Object.keys(ad.specs).length > 0 ? (
              <Animated.View entering={FadeInDown.duration(400).delay(400)} className="mb-6">
                <Text className="font-semibold text-base mb-3" style={{ color: colors.textPrimary }}>Especificações</Text>
                <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
                  {Object.entries(ad.specs).map(([key, value], i) => (
                    <View key={key} className="flex-row items-center justify-between px-4 py-3"
                      style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border }}>
                      <Text style={{ color: colors.textMuted }}>{key}</Text>
                      <Text className="font-medium" style={{ color: colors.textPrimary }}>{value}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            ) : null}

            {/* Supplier / Ver todos */}
            <Animated.View entering={FadeInDown.duration(400).delay(450)} className="mb-6">
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/supplier/${supplierSlug}`); }}
                className="flex-row items-center p-4 rounded-xl"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '20' }}>
                  <Box size={24} color={colors.primary}  variant="Outline" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold" style={{ color: colors.textPrimary }}>{ad.partner_name}</Text>
                  <Text className="text-sm" style={{ color: colors.textMuted }}>Ver todos os produtos</Text>
                </View>
                <ArrowRight2 size={20} color={colors.textMuted}  variant="Outline" />
              </Pressable>
            </Animated.View>

            {/* Other products from same partner */}
            {otherAds.length > 0 ? (
              <Animated.View entering={FadeInDown.duration(400).delay(500)}>
                <Text className="font-semibold text-base mb-3" style={{ color: colors.textPrimary }}>
                  Outros produtos de {ad.partner_name}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  {otherAds.map((other) => (
                    <Pressable
                      key={other.id}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/offer/${other.id}`); }}
                      className="mr-3 rounded-xl overflow-hidden"
                      style={{ width: 140, backgroundColor: colors.backgroundCard }}
                    >
                      <Image
                        source={{ uri: other.image_url ?? 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400' }}
                        style={{ width: 140, height: 100 }}
                        resizeMode="cover"
                      />
                      {other.discount ? (
                        <View className="absolute top-2 left-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.error }}>
                          <Text className="text-white text-xs font-bold">-{other.discount}%</Text>
                        </View>
                      ) : null}
                      <View className="p-2.5">
                        <Text className="text-xs font-semibold mb-1" style={{ color: colors.textPrimary }} numberOfLines={2}>{other.product_name}</Text>
                        <Text className="text-sm font-bold" style={{ color: colors.secondary }}>{formatPrice(other.price)}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <Animated.View entering={FadeInUp.duration(400)} className="absolute bottom-0 left-0 right-0">
          <LinearGradient colors={['transparent', colors.background, colors.background]} style={{ paddingTop: 20 }}>
            <SafeAreaView edges={['bottom']}>
              <View className="px-5 pb-4 flex-row">
                <Pressable onPress={handleOpenUrl} className="w-14 h-14 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.backgroundCard }}>
                  <ExportSquare size={24} color={colors.primary}  variant="Outline" />
                </Pressable>
                <View className="flex-1">
                  <Button onPress={handleOpenUrl} fullWidth size="lg">
                    <View className="flex-row items-center">
                      <ShoppingCart size={20} color="#fff" />
                      <Text className="text-white font-semibold text-base ml-2">Comprar agora</Text>
                    </View>
                  </Button>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
