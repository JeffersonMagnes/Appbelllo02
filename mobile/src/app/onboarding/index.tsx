import React, { useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions, Animated, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/state/auth-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DollarCircle, MagicStar } from 'iconsax-react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: <Calendar size={28} color="#6666cc"  variant="Outline" />,
    badge: 'Agendamentos',
    title: 'Organize seu negócio\ncom facilidade',
    description: 'Gerencie agendamentos, clientes e serviços em um só lugar. Chega de caderninho e confusão de horários.',
    highlight: 'Tudo na palma da mão.',
    image: require('@/assets/images/onboarding/onboarding_1.png'),
  },
  {
    id: '2',
    icon: <Calendar size={28} color="#6666cc"  variant="Outline" />,
    badge: 'Agenda',
    title: 'Agenda simples\ne eficiente',
    description: 'Evite conflitos de horário e tenha controle total dos atendimentos. Seus clientes podem agendar pelo link personalizado.',
    highlight: 'Sem erros, sem esquecimentos.',
    image: require('@/assets/images/onboarding/onboarding_2.png'),
  },
  {
    id: '3',
    icon: <DollarCircle size={28} color="#6666cc"  variant="Outline" />,
    badge: 'Financeiro',
    title: 'Controle total\ndos seus ganhos',
    description: 'Acompanhe faturamento, despesas e lucro em tempo real. Saiba exatamente quanto seu negócio está rendendo.',
    highlight: 'Cresça com mais segurança.',
    image: require('@/assets/images/onboarding/onboarding_3.png'),
  },
  {
    id: '4',
    icon: <MagicStar size={28} color="#6666cc"  variant="Outline" />,
    badge: 'Assistente IA',
    title: 'Mais clientes,\nmenos esforço',
    description: 'Use o Assistente IA para responder dúvidas, analisar seu desempenho e receber sugestões para crescer mais rápido.',
    highlight: 'Profissionalize seu negócio hoje.',
    image: require('@/assets/images/onboarding/onboarding_4.png'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setHasSeenAppbelloOnboarding = useAuthStore((s) => s.setHasSeenAppbelloOnboarding);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length > 0) setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleSkip = () => {
    setHasSeenAppbelloOnboarding(true);
    router.replace('/login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleSkip();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-2">
        <Image source={require('@/assets/images/logo.png')} style={{ width: 120, height: 32 }} resizeMode="contain" />
        <TouchableOpacity onPress={handleSkip} className="px-4 py-2 rounded-full bg-gray-100">
          <Text className="text-gray-500 font-medium text-sm">Pular</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={SLIDES}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 px-6">
            {/* Image */}
            <View style={{ width: '100%', height: height * 0.38 }} className="mb-6 rounded-3xl overflow-hidden">
              <Image
                source={item.image}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              {/* Badge sobre a imagem */}
              <View className="absolute top-4 left-4 flex-row items-center px-3 py-1.5 rounded-full bg-white/90"
                style={{ gap: 6 }}>
                {item.icon}
                <Text className="text-sm font-semibold" style={{ color: '#6666cc' }}>{item.badge}</Text>
              </View>
            </View>

            {/* Texts */}
            <Text className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {item.title}
            </Text>
            <Text className="text-gray-500 text-base leading-7 mb-3">
              {item.description}
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#6666cc' }} />
              <Text className="font-semibold" style={{ color: '#6666cc' }}>{item.highlight}</Text>
            </View>
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
        ref={slidesRef}
      />

      {/* Footer */}
      <View className="px-6 pb-10 pt-4">
        <View className="flex-row justify-between items-center">
          {/* Dots */}
          <View className="flex-row items-center" style={{ gap: 6 }}>
            {SLIDES.map((_, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange, outputRange: [8, 28, 8], extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={i.toString()}
                  style={{ width: dotWidth, opacity, backgroundColor: '#6666cc' }}
                  className="h-2 rounded-full"
                />
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            className="px-8 py-4 rounded-2xl"
            style={{ backgroundColor: '#6666cc' }}
          >
            <Text className="text-white font-bold text-base">
              {currentIndex === SLIDES.length - 1 ? 'Começar' : 'Próximo'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
