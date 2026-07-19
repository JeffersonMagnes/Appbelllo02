import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { TickSquare } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Input } from '@/components/ui/Input';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useAuthStore } from '@/lib/state/auth-store';
import * as Haptics from 'expo-haptics';

export default function Step1CreateAccount() {
  const router = useRouter();
  const account = useOnboardingStore(s => s.account);
  const updateAccount = useOnboardingStore(s => s.updateAccount);
  const setCurrentStep = useOnboardingStore(s => s.setCurrentStep);
  const resetOnboarding = useOnboardingStore(s => s.resetOnboarding);
  const signUpOwner = useAuthStore(s => s.signUpOwner);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    resetOnboarding();
    setCurrentStep(1);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!account.fullName.trim()) {
      newErrors.fullName = 'Nome é obrigatório';
    }

    if (!account.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!validateEmail(account.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!account.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (account.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (account.password !== account.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (!account.acceptedTerms) {
      newErrors.acceptedTerms = 'Você precisa aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation
  useEffect(() => {
    if (errors.email && account.email && validateEmail(account.email)) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    if (errors.fullName && account.fullName.trim()) {
      setErrors(prev => ({ ...prev, fullName: '' }));
    }
    if (errors.password && account.password.length >= 6) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
    if (errors.confirmPassword && account.password === account.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  }, [account, errors]);

  const handleContinue = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsLoading(true);
    try {
      const res = await signUpOwner(account.email, account.password, account.fullName);
      if (res.needsEmailConfirmation) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/onboarding/step-2');
      } else if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/onboarding/step-2');
      } else {
        setErrors({ email: res.error || 'Erro ao criar conta' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setErrors({ email: err.message || 'Erro inesperado' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTerms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateAccount({ acceptedTerms: !account.acceptedTerms });
    if (errors.acceptedTerms) {
      setErrors(prev => ({ ...prev, acceptedTerms: '' }));
    }
  };

  const isFormValid =
    account.fullName.trim() &&
    validateEmail(account.email) &&
    account.password.length >= 6 &&
    account.password === account.confirmPassword &&
    account.acceptedTerms;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <OnboardingHeader
        currentStep={1}
        totalSteps={6}
        title="Criar Conta"
        subtitle="Insira seus dados para criar sua conta de administrador"
      />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 200 }} automaticallyAdjustKeyboardInsets={true}
      >
        <View className="pt-4">
          <Input
            label="Nome completo"
            value={account.fullName}
            onChangeText={(text) => updateAccount({ fullName: text })}
            placeholder="Ex: João da Silva"
            autoCapitalize="words"
            error={errors.fullName}
          />

          <Input
            label="E-mail"
            value={account.email}
            onChangeText={(text) => updateAccount({ email: text.toLowerCase() })}
            placeholder="seuemail@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Senha"
            value={account.password}
            onChangeText={(text) => updateAccount({ password: text })}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirmar senha"
            value={account.confirmPassword}
            onChangeText={(text) => updateAccount({ confirmPassword: text })}
            placeholder="Digite a senha novamente"
            secureTextEntry
            error={errors.confirmPassword}
          />

          {/* Terms checkbox */}
          <Pressable
            onPress={toggleTerms}
            className="flex-row items-start mt-2 mb-8"
          >
            <View
              className="w-6 h-6 rounded-md items-center justify-center mr-3 mt-0.5"
              style={{
                backgroundColor: account.acceptedTerms
                  ? colors.primary
                  : 'transparent',
                borderWidth: account.acceptedTerms ? 0 : 2,
                borderColor: errors.acceptedTerms
                  ? colors.error
                  : colors.textMuted,
              }}
            >
              {account.acceptedTerms && (
                <TickSquare size={16} color="#fff" strokeWidth={3}  variant="Outline" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 text-sm leading-5">
                Li e concordo com os{' '}
                <Text
                  style={{ color: colors.primary, textDecorationLine: 'underline' }}
                  onPress={() => Linking.openURL('https://appbello-portal.netlify.app/termos')}
                >
                  Termos de Uso
                </Text>
                {' '}e{' '}
                <Text
                  style={{ color: colors.primary, textDecorationLine: 'underline' }}
                  onPress={() => Linking.openURL('https://appbello-portal.netlify.app/privacidade')}
                >
                  Política de Privacidade
                </Text>
              </Text>
              {errors.acceptedTerms && (
                <Text className="text-red-400 text-xs mt-1">
                  {errors.acceptedTerms}
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <OnboardingFooter
        onContinue={handleContinue}
        disabled={!isFormValid || isLoading}
        continueLabel={isLoading ? "Criando..." : "Criar conta"}
      />
    </View>
  );
}
