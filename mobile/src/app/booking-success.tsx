import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TickSquare, Calendar, Clock, User, Scissor, CloseCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    service?: string;
    professional?: string;
    date?: string;
    time?: string;
    establishment?: string;
  }>();

  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  const serviceName = params.service ?? '';
  const professionalName = params.professional ?? '';
  const dateStr = params.date ?? '';
  const timeStr = params.time ?? '';
  const establishmentName = params.establishment ?? '';

  const formattedDate = dateStr
    ? new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    checkScale.value = withSequence(
      withDelay(200, withSpring(1.2, { damping: 8, stiffness: 100 })),
      withSpring(1, { damping: 12, stiffness: 150 })
    );
    checkOpacity.value = withDelay(200, withSpring(1));
  }, []);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.success + '30', colors.background]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Close Button */}
        <View className="flex-row justify-end px-5 py-4">
          <Pressable
            onPress={handleClose}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
          >
            <CloseCircle size={20} color="#fff" variant="Outline" />
          </Pressable>
        </View>

        <View className="flex-1 px-5 items-center justify-center">
          {/* Success Animation */}
          <Animated.View
            style={[
              {
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.success,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                shadowColor: colors.success,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
              },
              checkAnimatedStyle,
            ]}
          >
            <TickSquare size={56} color="#fff" strokeWidth={3} variant="Outline" />
          </Animated.View>

          {/* Success Message */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(400)}
            className="items-center mb-8"
          >
            <Text className="text-gray-900 text-2xl font-bold mb-2">
              Agendamento Confirmado!
            </Text>
            <Text className="text-gray-500 text-center">
              Seu atendimento foi agendado com sucesso
            </Text>
          </Animated.View>

          {/* Booking Details Card */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(500)}
            className="w-full rounded-2xl p-5 mb-6"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            <Text className="text-gray-500 text-xs uppercase tracking-wide mb-4">
              Detalhes do agendamento
            </Text>

            <View className="mb-4">
              {!!serviceName && (
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.secondary + '20' }}
                  >
                    <Scissor size={18} color={colors.secondary} variant="Outline" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs">Serviço</Text>
                    <Text className="text-gray-900 font-semibold">{serviceName}</Text>
                  </View>
                </View>
              )}

              {!!professionalName && (
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <User size={18} color={colors.primary} variant="Outline" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs">Profissional</Text>
                    <Text className="text-gray-900 font-semibold">{professionalName}</Text>
                  </View>
                </View>
              )}

              {!!formattedDate && (
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.warning + '20' }}
                  >
                    <Calendar size={18} color={colors.warning} variant="Outline" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs">Data</Text>
                    <Text className="text-gray-900 font-semibold">{formattedDate}</Text>
                  </View>
                </View>
              )}

              {!!timeStr && (
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.info + '20' }}
                  >
                    <Clock size={18} color={colors.info} variant="Outline" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs">Horário</Text>
                    <Text className="text-gray-900 font-semibold">{timeStr}</Text>
                  </View>
                </View>
              )}
            </View>

            {!!establishmentName && (
              <>
                <View className="h-px my-4" style={{ backgroundColor: colors.border }} />
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500 text-sm">Local</Text>
                  <Text className="text-gray-900 font-semibold">{establishmentName}</Text>
                </View>
              </>
            )}
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.duration(400).delay(600)} className="w-full">
            <Pressable
              onPress={handleClose}
              className="flex-row items-center justify-center py-4 rounded-2xl"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">Concluído</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Footer Note */}
        <Animated.View entering={FadeIn.duration(400).delay(700)} className="px-5 pb-4">
          <Text className="text-gray-400 text-xs text-center">
            Caso precise cancelar ou remarcar, entre em contato com pelo menos 2 horas de antecedência.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
