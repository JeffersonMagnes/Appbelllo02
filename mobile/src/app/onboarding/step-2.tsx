import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Buildings2, Scissor, MagicStar, TickSquare, DollarCircle, Card, Lovely, Brush2 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Input } from '@/components/ui/Input';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useSetupStore } from '@/lib/state/setup-store';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

const businessTypes = [
  {
    value: 'clinic',
    label: 'Clínicas',
    icon: Buildings2,
    description: 'Consultórios, estéticas, dermatologia',
  },
  {
    value: 'barbershop',
    label: 'Barbearia',
    icon: Scissor,
    description: 'Corte masculino e barba',
  },
  {
    value: 'salon',
    label: 'Salão de Beleza',
    icon: MagicStar,
    description: 'Cabelo, unhas, maquiagem',
  },
  {
    value: 'spa',
    label: 'Spa',
    icon: Lovely,
    description: 'Massagens, relaxamento, bem-estar',
  },
  {
    value: 'studio',
    label: 'Estúdio',
    icon: Brush2,
    description: 'Tatuagem, piercing, design',
  },
] as const;

export default function Step2BusinessData() {
  const router = useRouter();
  const business = useOnboardingStore(s => s.business);
  const updateBusiness = useOnboardingStore(s => s.updateBusiness);
  const setCurrentStep = useOnboardingStore(s => s.setCurrentStep);
  const completeStep = useSetupStore(s => s.completeStep);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCNPJorCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!business.businessName.trim()) {
      newErrors.businessName = 'Nome do estabelecimento é obrigatório';
    }

    if (!business.businessType) {
      newErrors.businessType = 'Selecione o tipo de negócio';
    }

    if (!business.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (business.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido';
    }

    if (!business.businessEmail.trim()) {
      newErrors.businessEmail = 'E-mail comercial é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.businessEmail)) {
      newErrors.businessEmail = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeStep('business');
      router.push('/onboarding/step-3');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const selectBusinessType = (type: typeof business.businessType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateBusiness({ businessType: type });
    if (errors.businessType) {
      setErrors(prev => ({ ...prev, businessType: '' }));
    }
  };

  const isFormValid =
    business.businessName.trim() &&
    business.businessType &&
    business.phone.replace(/\D/g, '').length >= 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.businessEmail);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <OnboardingHeader
        currentStep={2}
        totalSteps={6}
        title="Dados do Estabelecimento"
        subtitle="Informações básicas sobre seu negócio"
      />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 200 }} automaticallyAdjustKeyboardInsets={true}
      >
        <View className="pt-4">
          <Input
            label="Nome do estabelecimento"
            value={business.businessName}
            onChangeText={(text) => updateBusiness({ businessName: text })}
            placeholder="Ex: Barbearia Premium"
            autoCapitalize="words"
            error={errors.businessName}
          />

          {/* Business Type Selection */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-3">
              Tipo de negócio
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {businessTypes.map((type) => {
                const isSelected = business.businessType === type.value;
                const Icon = type.icon;

                return (
                  <Pressable
                    key={type.value}
                    onPress={() => selectBusinessType(type.value)}
                    className="flex-1 min-w-[100px] rounded-xl p-4"
                    style={{
                      backgroundColor: isSelected
                        ? colors.primary + '20'
                        : colors.backgroundCard,
                      borderWidth: 2,
                      borderColor: isSelected
                        ? colors.primary
                        : errors.businessType
                        ? colors.error
                        : 'transparent',
                    }}
                  >
                    <View className="items-center">
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mb-2"
                        style={{
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surface,
                        }}
                      >
                        <Icon
                          size={24}
                          color={isSelected ? '#fff' : colors.textMuted}
                        />
                      </View>
                      <Text
                        className="text-sm font-semibold text-center"
                        style={{
                          color: isSelected ? colors.primary : colors.textPrimary,
                        }}
                      >
                        {type.label}
                      </Text>
                      <Text
                        className="text-xs text-center mt-1"
                        style={{ color: colors.textMuted }}
                      >
                        {type.description}
                      </Text>
                      {isSelected && (
                        <Animated.View
                          entering={FadeIn.duration(200)}
                          className="absolute top-2 right-2"
                        >
                          <View
                            className="w-5 h-5 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <TickSquare size={12} color="#fff" strokeWidth={3}  variant="Outline" />
                          </View>
                        </Animated.View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {errors.businessType && (
              <Text className="text-red-400 text-xs mt-2">
                {errors.businessType}
              </Text>
            )}
          </View>

          <Input
            label="CPF / CNPJ (opcional)"
            value={business.cnpj}
            onChangeText={(text) => updateBusiness({ cnpj: formatCNPJorCPF(text) })}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            keyboardType="numeric"
          />

          <Input
            label="Telefone / WhatsApp"
            value={business.phone}
            onChangeText={(text) => updateBusiness({ phone: formatPhone(text) })}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Input
            label="E-mail comercial"
            value={business.businessEmail}
            onChangeText={(text) =>
              updateBusiness({ businessEmail: text.toLowerCase() })
            }
            placeholder="contato@seuestablecimento.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.businessEmail}
            className="mb-8"
          />
        </View>
      </ScrollView>

      <OnboardingFooter
        onContinue={handleContinue}
        disabled={!isFormValid}
      />
    </View>
  );
}
