import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Calendar, Cup, CloseCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useSetupStore } from '@/lib/state/setup-store';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

const weekDays = [
  { key: 'dom', label: 'Dom' },
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
];

const timeOptions = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

const durationOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 horas' },
];

const cancellationOptions = [
  { value: 1, label: '1 hora' },
  { value: 2, label: '2 horas' },
  { value: 6, label: '6 horas' },
  { value: 12, label: '12 horas' },
  { value: 24, label: '24 horas' },
  { value: 48, label: '48 horas' },
];

export default function Step5Settings() {
  const router = useRouter();
  const settings = useOnboardingStore(s => s.settings);
  const updateSettings = useOnboardingStore(s => s.updateSettings);
  const setCurrentStep = useOnboardingStore(s => s.setCurrentStep);
  const completeStep = useSetupStore(s => s.completeStep);

  const [showOpeningPicker, setShowOpeningPicker] = useState(false);
  const [showClosingPicker, setShowClosingPicker] = useState(false);
  const [showBreakStartPicker, setShowBreakStartPicker] = useState(false);
  const [showBreakEndPicker, setShowBreakEndPicker] = useState(false);

  useEffect(() => {
    setCurrentStep(5);
  }, [setCurrentStep]);

  const toggleWorkingDay = (day: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDays = settings.workingDays.includes(day)
      ? settings.workingDays.filter((d) => d !== day)
      : [...settings.workingDays, day];
    updateSettings({ workingDays: newDays });
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeStep('hours');
    router.push('/onboarding/step-7');
  };

  const isFormValid = settings.workingDays.length > 0;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <OnboardingHeader
        currentStep={5}
        totalSteps={6}
        title="Configurações Iniciais"
        subtitle="Defina o funcionamento básico do seu negócio"
      />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 200 }} automaticallyAdjustKeyboardInsets={true}
      >
        <View className="pt-4">
          {/* Working Hours */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Clock size={18} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Horário de funcionamento
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TimeSelector
                label="Abre às"
                value={settings.openingTime}
                isOpen={showOpeningPicker}
                onToggle={() => {
                  setShowOpeningPicker(!showOpeningPicker);
                  setShowClosingPicker(false);
                }}
                onSelect={(time) => {
                  updateSettings({ openingTime: time });
                  setShowOpeningPicker(false);
                }}
              />
              <TimeSelector
                label="Fecha às"
                value={settings.closingTime}
                isOpen={showClosingPicker}
                onToggle={() => {
                  setShowClosingPicker(!showClosingPicker);
                  setShowOpeningPicker(false);
                }}
                onSelect={(time) => {
                  updateSettings({ closingTime: time });
                  setShowClosingPicker(false);
                }}
              />
            </View>
          </View>

          {/* Working Days */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Calendar size={18} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Dias de atendimento
              </Text>
            </View>

            <View className="flex-row justify-between">
              {weekDays.map((day) => {
                const isSelected = settings.workingDays.includes(day.key);
                return (
                  <Pressable
                    key={day.key}
                    onPress={() => toggleWorkingDay(day.key)}
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.backgroundCard,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: isSelected ? '#fff' : colors.textMuted,
                      }}
                    >
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Break Time */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Cup size={18} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Intervalo / Pausa
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TimeSelector
                label="Início"
                value={settings.breakStart}
                isOpen={showBreakStartPicker}
                onToggle={() => {
                  setShowBreakStartPicker(!showBreakStartPicker);
                  setShowBreakEndPicker(false);
                }}
                onSelect={(time) => {
                  updateSettings({ breakStart: time });
                  setShowBreakStartPicker(false);
                }}
              />
              <TimeSelector
                label="Fim"
                value={settings.breakEnd}
                isOpen={showBreakEndPicker}
                onToggle={() => {
                  setShowBreakEndPicker(!showBreakEndPicker);
                  setShowBreakStartPicker(false);
                }}
                onSelect={(time) => {
                  updateSettings({ breakEnd: time });
                  setShowBreakEndPicker(false);
                }}
              />
            </View>
          </View>

          {/* Cancellation Policy */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Política de cancelamento
              </Text>
            </View>
            <Text className="text-gray-500 text-xs mb-3">
              Cancelamento permitido até quantas horas antes do agendamento
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {cancellationOptions.map((option) => {
                const isSelected = settings.cancellationPolicy === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateSettings({ cancellationPolicy: option.value });
                    }}
                    className="rounded-xl px-4 py-2"
                    style={{
                      backgroundColor: isSelected
                        ? colors.primary + '20'
                        : colors.backgroundCard,
                      borderWidth: isSelected ? 1.5 : 0,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: isSelected ? colors.primary : colors.textSecondary,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Default Service Duration */}
          <View className="mb-8">
            <View className="flex-row items-center mb-3">
              <Clock size={18} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Duração padrão dos serviços
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {durationOptions.map((option) => {
                const isSelected = settings.defaultServiceDuration === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateSettings({ defaultServiceDuration: option.value });
                    }}
                    className="rounded-xl px-4 py-2"
                    style={{
                      backgroundColor: isSelected
                        ? colors.primary + '20'
                        : colors.backgroundCard,
                      borderWidth: isSelected ? 1.5 : 0,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: isSelected ? colors.primary : colors.textSecondary,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <OnboardingFooter
        onContinue={handleContinue}
        disabled={!isFormValid}
      />
    </View>
  );
}

interface TimeSelectorProps {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (time: string) => void;
}

function TimeSelector({ label, value, isOpen, onToggle, onSelect }: TimeSelectorProps) {
  return (
    <View className="flex-1">
      <Text className="text-gray-500 text-xs mb-2">{label}</Text>
      <Pressable
        onPress={onToggle}
        className="rounded-xl px-4 py-3"
        style={{ backgroundColor: colors.backgroundCard }}
      >
        <Text className="text-gray-900 font-medium text-center">{value}</Text>
      </Pressable>

      {isOpen && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="absolute top-full left-0 right-0 z-10 mt-2 rounded-xl overflow-hidden"
          style={{
            backgroundColor: colors.backgroundCard,
            maxHeight: 200,
          }}
        >
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {timeOptions.map((time) => (
              <Pressable
                key={time}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(time);
                }}
                className="px-4 py-3"
                style={{
                  backgroundColor: time === value ? colors.primary + '20' : 'transparent',
                }}
              >
                <Text
                  className="text-center font-medium"
                  style={{
                    color: time === value ? colors.primary : colors.textSecondary,
                  }}
                >
                  {time}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
