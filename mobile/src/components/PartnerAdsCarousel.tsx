import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ExportSquare, Star1, ShoppingBag } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_MARGIN = 8;

export type BusinessType = 'barbershop' | 'salon' | 'clinic';

interface PartnerProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  discount?: number;
  tag?: string;
  url: string;
  businessTypes: BusinessType[];
}


interface PartnerAdsCarouselProps {
  businessType: BusinessType;
}

export function PartnerAdsCarousel({ businessType }: PartnerAdsCarouselProps) {
  const router = useRouter();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  useEffect(() => {
    async function fetchAds() {
      const { data } = await (supabase as any).rpc('get_carousel_ads');

      if (data && (data as any[]).length > 0) {
        const mapped: PartnerProduct[] = (data as any[])
          .filter((ad: any) => !ad.business_types || ad.business_types.includes(businessType))
          .map((ad: any) => ({
            id: ad.id,
            name: ad.product_name,
            brand: ad.partner_name,
            description: ad.description ?? '',
            price: ad.price ?? 0,
            originalPrice: ad.original_price ?? undefined,
            image: ad.image_url ?? 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
            rating: 5.0,
            discount: ad.discount ?? undefined,
            tag: ad.tag ?? undefined,
            url: ad.url,
            businessTypes: (ad.business_types ?? ['barbershop', 'salon', 'clinic']) as BusinessType[],
          }));
        setProducts(mapped);
      }
    }
    fetchAds();
  }, [businessType]);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % products.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (CARD_WIDTH + CARD_MARGIN * 2),
        animated: true,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, products.length]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleProductPress = (product: PartnerProduct) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/offer/${product.id}`);
  };

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (products.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between px-5 mb-3">
        <View className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-lg items-center justify-center mr-2"
            style={{ backgroundColor: colors.secondary + '20' }}
          >
            <ShoppingBag size={16} color={colors.secondary}  variant="Outline" />
          </View>
          <View>
            <Text className="text-gray-900 font-semibold text-sm">Ofertas de Parceiros</Text>
            <Text className="text-gray-900/40 text-xs">Produtos selecionados para você</Text>
          </View>
        </View>
        <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
          <Text className="text-xs" style={{ color: colors.primary }}>Patrocinado</Text>
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        contentContainerStyle={{ paddingHorizontal: 20 - CARD_MARGIN }}
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            scrollX={scrollX}
            onPress={() => handleProductPress(product)}
            formatPrice={formatPrice}
          />
        ))}
      </Animated.ScrollView>

      <View className="flex-row justify-center mt-3">
        {products.map((_, index) => (
          <PaginationDot key={index} index={index} scrollX={scrollX} />
        ))}
      </View>
    </View>
  );
}

interface ProductCardProps {
  product: PartnerProduct;
  index: number;
  scrollX: Animated.SharedValue<number>;
  onPress: () => void;
  formatPrice: (price: number) => string;
}

function ProductCard({ product, index, scrollX, onPress, formatPrice }: ProductCardProps) {
  const inputRange = [
    (index - 1) * (CARD_WIDTH + CARD_MARGIN * 2),
    index * (CARD_WIDTH + CARD_MARGIN * 2),
    (index + 1) * (CARD_WIDTH + CARD_MARGIN * 2),
  ];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scrollX.value, inputRange, [0.95, 1, 0.95], 'clamp') }],
    opacity: interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], 'clamp'),
  }));

  return (
    <Animated.View style={[{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }, animatedStyle]}>
      <Pressable onPress={onPress}>
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
          <View className="relative">
            <Image source={{ uri: product.image }} className="w-full h-36" resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 }}
            />
            <View className="absolute top-3 left-3 flex-row">
              {product.discount && (
                <View className="px-2 py-1 rounded-full mr-2" style={{ backgroundColor: colors.error }}>
                  <Text className="text-white text-xs font-bold">-{product.discount}%</Text>
                </View>
              )}
              {product.tag && (
                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white text-xs font-medium">{product.tag}</Text>
                </View>
              )}
            </View>
            <View className="absolute bottom-3 left-3">
              <Text className="text-white text-xs font-semibold">{product.brand}</Text>
            </View>
            <View
              className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <ExportSquare size={14} color="#fff"  variant="Outline" />
            </View>
          </View>

          <View className="p-4">
            <Text className="text-gray-900 font-semibold text-base mb-1" numberOfLines={1}>{product.name}</Text>
            <Text className="text-gray-900/50 text-sm mb-3" numberOfLines={1}>{product.description}</Text>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold" style={{ color: colors.secondary }}>
                  {formatPrice(product.price)}
                </Text>
                {product.originalPrice && (
                  <Text className="text-gray-900/40 text-sm line-through">{formatPrice(product.originalPrice)}</Text>
                )}
              </View>
              <View className="flex-row items-center">
                <Star1 size={14} color="#FFB547" fill="#FFB547"  variant="Outline" />
                <Text className="text-gray-900/70 text-sm ml-1">{product.rating}</Text>
              </View>
            </View>
            <Pressable className="mt-3 py-2.5 rounded-xl items-center" style={{ backgroundColor: colors.primary }}>
              <Text className="text-white font-semibold text-sm">Ver oferta</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface PaginationDotProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
}

function PaginationDot({ index, scrollX }: PaginationDotProps) {
  const inputRange = [
    (index - 1) * (CARD_WIDTH + CARD_MARGIN * 2),
    index * (CARD_WIDTH + CARD_MARGIN * 2),
    (index + 1) * (CARD_WIDTH + CARD_MARGIN * 2),
  ];

  const animatedStyle = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, inputRange, [6, 20, 6], 'clamp'),
    opacity: interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], 'clamp'),
  }));

  return (
    <Animated.View
      className="h-1.5 rounded-full mx-1"
      style={[{ backgroundColor: colors.primary }, animatedStyle]}
    />
  );
}
