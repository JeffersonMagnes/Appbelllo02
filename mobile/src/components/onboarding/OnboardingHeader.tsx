import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'iconsax-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function OnboardingHeader({
  currentStep,
  totalSteps,
  title,
  subtitle,
  showBack = true,
  onBack,
}: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progress = (currentStep / totalSteps) * 100;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress}%`, {
      duration: 400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }),
  }));

  return (
    <View style={{ paddingTop: insets.top }} className="px-5 pb-4">
      {/* Logo */}
      <View className="items-center mb-4">
        <Image source={require('@/assets/images/logo.png')} style={{ width: 120, height: 32 }} resizeMode="contain" />
      </View>

      {/* Back button and step indicator */}
      <View className="flex-row items-center justify-between mb-6">
        {showBack ? (
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            <ArrowLeft size={20} color={colors.textPrimary}  variant="Outline" />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}

        <View className="flex-row items-center">
          <Text className="text-gray-900/60 text-sm font-medium">
            Passo {currentStep} de {totalSteps}
          </Text>
        </View>

        <View className="w-10" />
      </View>

      {/* Progress bar */}
      <View
        className="h-1.5 rounded-full overflow-hidden mb-6"
        style={{ backgroundColor: colors.backgroundCard }}
      >
        <Animated.View
          className="h-full rounded-full"
          style={[
            { backgroundColor: colors.primary },
            progressStyle
          ]}
        />
      </View>

      {/* Title and subtitle */}
      <View className="mb-2">
        <Text className="text-gray-900 text-2xl font-bold mb-2">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-gray-900/60 text-base leading-6">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
