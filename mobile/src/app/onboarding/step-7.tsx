import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Briefcase, DollarCircle, Clock, Add, CloseCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Input } from '@/components/ui/Input';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useSetupStore } from '@/lib/state/setup-store';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';
import { getBusinessPreset } from '@/lib/business-presets';

export default function Step6Professional() {
  const router = useRouter();
  const professional = useOnboardingStore(s => s.professional);
  const business = useOnboardingStore(s => s.business);
  const settings = useOnboardingStore(s => s.settings);
  const updateProfessional = useOnboardingStore(s => s.updateProfessional);
  const setCurrentStep = useOnboardingStore(s => s.setCurrentStep);
  const completeStep = useSetupStore(s => s.completeStep);
  const establishmentId = useAuthStore(s => s.establishmentId);

  const preset = getBusinessPreset(business.businessType as any);
  const roleOptions = preset.roles;
  const serviceExamples = preset.services;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [customService, setCustomService] = useState('');

  useEffect(() => {
    setCurrentStep(7);
  }, [setCurrentStep]);

  useEffect(() => {
    // Set default working hours based on settings
    if (!professional.workingHoursStart) {
      updateProfessional({
        workingHoursStart: settings.openingTime,
        workingHoursEnd: settings.closingTime,
      });
    }
  }, [settings, professional.workingHoursStart, updateProfessional]);

  const toggleService = (service: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newServices = professional.services.includes(service)
      ? professional.services.filter((s) => s !== service)
      : [...professional.services, service];
    updateProfessional({ services: newServices });
  };

  const addCustomService = () => {
    if (customService.trim() && !professional.services.includes(customService.trim())) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateProfessional({
        services: [...professional.services, customService.trim()],
      });
      setCustomService('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!professional.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!professional.role.trim()) {
      newErrors.role = 'Função é obrigatória';
    }

    if (professional.services.length === 0) {
      newErrors.services = 'Selecione pelo menos um serviço';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (isSupabaseConfigured() && establishmentId) {
      try {
        // Salva o profissional
        await supabase.from('employees').insert({
          establishment_id: establishmentId,
          name: professional.name,
          role: 'professional',
          specialty: professional.role || null,
          commission_type: professional.commissionType ?? 'percentage',
          commission_value: professional.commissionValue ?? 0,
          active: true,
        } as any);

        // Salva os serviços
        if (professional.services.length > 0) {
          const serviceRows = professional.services.map(name => ({
            establishment_id: establishmentId,
            name,
            price: 0,
            duration: 30,
            active: true,
          }));
          await supabase.from('services').insert(serviceRows as any);
        }
      } catch (_) {
        // Salva localmente mesmo se Supabase falhar
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeStep('professional');
    router.push('/onboarding/step-8');
  };

  const isFormValid =
    professional.name.trim() &&
    professional.role.trim() &&
    professional.services.length > 0;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <OnboardingHeader
        currentStep={6}
        totalSteps={6}
        title="Primeiro Profissional"
        subtitle="Cadastre você ou o primeiro membro da equipe"
      />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 200 }} automaticallyAdjustKeyboardInsets={true}
      >
        <View className="pt-4">
          {/* Name */}
          <Input
            label="Nome do profissional"
            value={professional.name}
            onChangeText={(text) => updateProfessional({ name: text })}
            placeholder="Ex: João Silva"
            autoCapitalize="words"
            error={errors.name}
            icon={<User size={20} color={colors.textMuted}  variant="Outline" />}
          />

          {/* Role */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Briefcase size={16} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Função
              </Text>
            </View>
            <Pressable
              onPress={() => setShowRoleOptions(!showRoleOptions)}
              className="rounded-xl px-4 py-4 flex-row items-center justify-between"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: errors.role ? 1.5 : 0,
                borderColor: colors.error,
              }}
            >
              <Text
                style={{
                  color: professional.role ? colors.textPrimary : colors.textMuted,
                }}
              >
                {professional.role || 'Selecione a função'}
              </Text>
              <Text className="text-gray-400">▼</Text>
            </Pressable>
            {errors.role && (
              <Text className="text-red-400 text-xs mt-1">{errors.role}</Text>
            )}

            {showRoleOptions && (
              <Animated.View
                entering={FadeIn.duration(200)}
                className="mt-2 rounded-xl overflow-hidden"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                {roleOptions.map((role, index) => (
                  <Pressable
                    key={role}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateProfessional({ role });
                      setShowRoleOptions(false);
                      if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
                    }}
                    className="px-4 py-3"
                    style={{
                      backgroundColor:
                        role === professional.role ? colors.primary + '20' : 'transparent',
                      borderTopWidth: index > 0 ? 1 : 0,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          role === professional.role
                            ? colors.primary
                            : colors.textSecondary,
                      }}
                    >
                      {role}
                    </Text>
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </View>

          {/* Services */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-3">
              Serviços que realiza
            </Text>
            {errors.services && (
              <Text className="text-red-400 text-xs mb-2">{errors.services}</Text>
            )}

            <View className="flex-row flex-wrap gap-2 mb-3">
              {serviceExamples.map((service) => {
                const isSelected = professional.services.includes(service);
                return (
                  <Pressable
                    key={service}
                    onPress={() => toggleService(service)}
                    className="rounded-full px-4 py-2"
                    style={{
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.backgroundCard,
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: isSelected ? '#fff' : colors.textSecondary,
                      }}
                    >
                      {service}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Selected Services */}
            {professional.services.filter(s => !serviceExamples.includes(s)).length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-3">
                {professional.services
                  .filter(s => !serviceExamples.includes(s))
                  .map((service) => (
                    <Animated.View
                      key={service}
                      entering={FadeIn.duration(200)}
                      exiting={FadeOut.duration(200)}
                      className="flex-row items-center rounded-full px-3 py-2"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-white text-sm mr-1">{service}</Text>
                      <Pressable onPress={() => toggleService(service)}>
                        <CloseCircle size={14} color="#fff"  variant="Outline" />
                      </Pressable>
                    </Animated.View>
                  ))}
              </View>
            )}

            {/* Add Custom Service */}
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  value={customService}
                  onChangeText={setCustomService}
                  placeholder="Adicionar outro serviço"
                  className="mb-0"
                />
              </View>
              <Pressable
                onPress={addCustomService}
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Add size={24} color="#fff"  variant="Outline" />
              </Pressable>
            </View>
          </View>

          {/* Commission */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <DollarCircle size={18} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Comissão
              </Text>
            </View>

            <View className="flex-row gap-3 mb-3">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateProfessional({ commissionType: 'percentage' });
                }}
                className="flex-1 rounded-xl py-3 items-center"
                style={{
                  backgroundColor:
                    professional.commissionType === 'percentage'
                      ? colors.primary + '20'
                      : colors.backgroundCard,
                  borderWidth: professional.commissionType === 'percentage' ? 1.5 : 0,
                  borderColor: colors.primary,
                }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color:
                      professional.commissionType === 'percentage'
                        ? colors.primary
                        : colors.textSecondary,
                  }}
                >
                  Porcentagem (%)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateProfessional({ commissionType: 'fixed' });
                }}
                className="flex-1 rounded-xl py-3 items-center"
                style={{
                  backgroundColor:
                    professional.commissionType === 'fixed'
                      ? colors.primary + '20'
                      : colors.backgroundCard,
                  borderWidth: professional.commissionType === 'fixed' ? 1.5 : 0,
                  borderColor: colors.primary,
                }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color:
                      professional.commissionType === 'fixed'
                        ? colors.primary
                        : colors.textSecondary,
                  }}
                >
                  Valor fixo (R$)
                </Text>
              </Pressable>
            </View>

            <Input
              value={professional.commissionValue ? String(professional.commissionValue) : ''}
              onChangeText={(text) =>
                updateProfessional({ commissionValue: Number(text.replace(/\D/g, '')) })
              }
              placeholder={
                professional.commissionType === 'percentage' ? 'Ex: 40' : 'Ex: 50'
              }
              keyboardType="numeric"
              className="mb-0"
            />
          </View>

          {/* Working Hours */}
          <View className="mb-8">
            <View className="flex-row items-center mb-3">
              <Clock size={18} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Horário de trabalho
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-gray-500 text-xs mb-2">Início</Text>
                <TextInput
                  value={professional.workingHoursStart}
                  onChangeText={(t) => updateProfessional({ workingHoursStart: t })}
                  placeholder="09:00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                  className="rounded-xl px-4 py-3 text-center"
                  style={{ backgroundColor: colors.backgroundCard, color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-xs mb-2">Fim</Text>
                <TextInput
                  value={professional.workingHoursEnd}
                  onChangeText={(t) => updateProfessional({ workingHoursEnd: t })}
                  placeholder="18:00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                  className="rounded-xl px-4 py-3 text-center"
                  style={{ backgroundColor: colors.backgroundCard, color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <OnboardingFooter
        onContinue={handleContinue}
        disabled={!isFormValid}
        continueLabel="Salvar e continuar"
      />
    </View>
  );
}
