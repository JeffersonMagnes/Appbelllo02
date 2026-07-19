import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Location, SearchNormal1 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Input } from '@/components/ui/Input';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useSetupStore } from '@/lib/state/setup-store';
import * as Haptics from 'expo-haptics';

export default function Step3Address() {
  const router = useRouter();
  const address = useOnboardingStore(s => s.address);
  const updateAddress = useOnboardingStore(s => s.updateAddress);
  const setCurrentStep = useOnboardingStore(s => s.setCurrentStep);
  const completeStep = useSetupStore(s => s.completeStep);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        updateAddress({
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (text: string) => {
    const formatted = formatCEP(text);
    updateAddress({ cep: formatted });

    if (errors.cep) {
      setErrors(prev => ({ ...prev, cep: '' }));
    }

    // Auto-fetch when CEP is complete
    if (formatted.replace(/\D/g, '').length === 8) {
      fetchAddressByCEP(formatted);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!address.cep.trim() || address.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP é obrigatório';
    }

    if (!address.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }

    if (!address.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }

    if (!address.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }

    if (!address.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!address.state.trim()) {
      newErrors.state = 'Estado é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeStep('address');
      router.push('/onboarding/step-4');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const isFormValid =
    address.cep.replace(/\D/g, '').length === 8 &&
    address.street.trim() &&
    address.number.trim() &&
    address.neighborhood.trim() &&
    address.city.trim() &&
    address.state.trim();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <OnboardingHeader
        currentStep={3}
        totalSteps={6}
        title="Endereço"
        subtitle="Onde seu estabelecimento está localizado"
      />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }} automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-4">
          {/* CEP with auto-complete indicator */}
          <View className="relative">
            <Input
              label="CEP"
              value={address.cep}
              onChangeText={handleCepChange}
              placeholder="00000-000"
              keyboardType="numeric"
              error={errors.cep}
              icon={
                loadingCep ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <SearchNormal1 size={20} color={colors.textMuted}  variant="Outline" />
                )
              }
            />
            {loadingCep && (
              <Text className="text-xs mb-4 -mt-2" style={{ color: colors.primary }}>
                Buscando endereço...
              </Text>
            )}
          </View>

          <Input
            label="Rua"
            value={address.street}
            onChangeText={(text) => updateAddress({ street: text })}
            placeholder="Nome da rua"
            autoCapitalize="words"
            error={errors.street}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Número"
                value={address.number}
                onChangeText={(text) => updateAddress({ number: text })}
                placeholder="123"
                keyboardType="numeric"
                error={errors.number}
              />
            </View>
            <View className="flex-[2]">
              <Input
                label="Complemento"
                value={address.complement}
                onChangeText={(text) => updateAddress({ complement: text })}
                placeholder="Sala 10, Bloco A"
              />
            </View>
          </View>

          <Input
            label="Bairro"
            value={address.neighborhood}
            onChangeText={(text) => updateAddress({ neighborhood: text })}
            placeholder="Centro"
            autoCapitalize="words"
            error={errors.neighborhood}
          />

          <View className="flex-row gap-3">
            <View className="flex-[2]">
              <Input
                label="Cidade"
                value={address.city}
                onChangeText={(text) => updateAddress({ city: text })}
                placeholder="São Paulo"
                autoCapitalize="words"
                error={errors.city}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Estado"
                value={address.state}
                onChangeText={(text) =>
                  updateAddress({ state: text.toUpperCase().slice(0, 2) })
                }
                placeholder="SP"
                autoCapitalize="characters"
                error={errors.state}
              />
            </View>
          </View>

          {/* Map preview placeholder */}
          {address.street && address.city && (
            <View
              className="rounded-xl overflow-hidden mt-2 mb-8"
              style={{ backgroundColor: colors.backgroundCard }}
            >
              <View className="h-32 items-center justify-center">
                <Location size={32} color={colors.primary}  variant="Outline" />
                <Text className="text-white/60 text-sm mt-2 text-center px-4">
                  {address.street}, {address.number}
                  {'\n'}
                  {address.neighborhood} - {address.city}/{address.state}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <OnboardingFooter
        onContinue={handleContinue}
        disabled={!isFormValid}
      />
    </View>
  );
}
