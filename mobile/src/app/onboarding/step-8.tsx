import React, { useEffect } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TickCircle, Scissor, Box, Link2, Profile2User, ArrowRight, Copy } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useSetupStore } from '@/lib/state/setup-store';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export default function Step7Complete() {
  const router = useRouter();
  const business = useOnboardingStore(s => s.business);
  const setCurrentStep = useOnboardingStore(s => s.setCurrentStep);
  const resetOnboarding = useOnboardingStore(s => s.resetOnboarding);
  const completeStep = useSetupStore(s => s.completeStep);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    setCurrentStep(8);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeStep('business');
    completeStep('address');
    completeStep('branding');
    completeStep('hours');
    completeStep('professional');

    pulseScale.value = withRepeat(
      withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [setCurrentStep, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const bookingLink = `appbello.com/${business.businessName?.toLowerCase().replace(/\s+/g, '-') || 'seu-estabelecimento'}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(`https://${bookingLink}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const shareLink = async () => {
    try {
      await Share.share({
        message: `Agende seu horário em ${business.businessName}: https://${bookingLink}`,
      });
    } catch (error) {
      console.error('shareLink failed:', error);
    }
  };

  const goToDashboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 px-6">
          {/* Success Animation */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            className="items-center justify-center flex-1"
          >
            <Animated.View
              style={[
                pulseStyle,
                {
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: colors.success + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                },
              ]}
            >
              <View
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.success + '20' }}
              >
                <TickCircle size={48} color={colors.success} variant="Outline" />
              </View>
            </Animated.View>

            <Text style={{ color: colors.textPrimary }} className="text-3xl font-bold text-center mb-3">
              Tudo pronto!
            </Text>
            <Text style={{ color: colors.textMuted }} className="text-base text-center leading-6 px-4">
              Seu estabelecimento foi configurado com sucesso e está pronto para receber agendamentos
            </Text>
          </Animated.View>

          {/* Booking Link */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(300)}
            className="mb-6"
          >
            <Text style={{ color: colors.textMuted }} className="text-sm font-medium mb-3 text-center">
              Seu link de agendamento
            </Text>
            <Pressable
              onPress={copyLink}
              className="rounded-2xl p-4 flex-row items-center justify-between"
              style={{ backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <Link2 size={20} color={colors.primary} variant="Outline" />
                </View>
                <Text style={{ color: colors.textPrimary }} className="font-medium flex-1" numberOfLines={1}>
                  {bookingLink}
                </Text>
              </View>
              <Copy size={20} color={colors.textMuted} variant="Outline" />
            </Pressable>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(400)}
            className="mb-6"
          >
            <Text style={{ color: colors.textMuted }} className="text-sm font-medium mb-3">
              Próximos passos
            </Text>

            <View className="gap-3">
              <QuickAction
                icon={<Scissor size={20} color={colors.primary} variant="Outline" />}
                title="Criar serviços"
                description="Adicione os serviços que você oferece"
                onPress={() => { resetOnboarding(); router.replace('/(tabs)/services'); }}
              />
              <QuickAction
                icon={<Box size={20} color={colors.primary} variant="Outline" />}
                title="Cadastrar produtos"
                description="Produtos para venda no estabelecimento"
                onPress={() => router.push('/admin/products')}
              />
              <QuickAction
                icon={<Profile2User size={20} color={colors.primary} variant="Outline" />}
                title="Convidar equipe"
                description="Adicione mais profissionais"
                onPress={() => router.push('/admin/employees')}
              />
            </View>
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(500)}
            className="pb-4"
          >
            <Button onPress={goToDashboard} fullWidth size="lg">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-lg mr-2">
                  Ir para o Início
                </Text>
                <ArrowRight size={20} color="#fff" variant="Outline" />
              </View>
            </Button>

            <Pressable onPress={shareLink} className="mt-4 py-3">
              <Text className="text-center font-medium" style={{ color: colors.primary }}>
                Compartilhar link de agendamento
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

function QuickAction({ icon, title, description, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl p-4 flex-row items-center"
      style={{ backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: colors.border }}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: colors.primary + '10' }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text style={{ color: colors.textPrimary }} className="font-semibold text-base">{title}</Text>
        <Text style={{ color: colors.textMuted }} className="text-sm">{description}</Text>
      </View>
      <ArrowRight size={18} color={colors.textMuted} variant="Outline" />
    </Pressable>
  );
}
