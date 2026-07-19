import React, { useEffect } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { DollarCircle, Chart, Card, ArrowRight2 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Input } from '@/components/ui/Input';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import * as Haptics from 'expo-haptics';

export default function Step6Fees() {
  const router = useRouter();
  const business = useOnboardingStore(s => s.business);
  const updateBusiness = useOnboardingStore(s => s.updateBusiness);
  const setCurrentStep = useOnboardingStore(s => s.setCurrentStep);

  useEffect(() => {
    setCurrentStep(6);
  }, [setCurrentStep]);

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/onboarding/step-7');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <OnboardingHeader
        currentStep={6}
        totalSteps={6}
        title="Meta e Taxas"
        subtitle="Configure sua meta mensal e as taxas de pagamento"
      />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 200 }} automaticallyAdjustKeyboardInsets={true}
      >
        <View className="pt-4">

          {/* Meta Mensal */}
          <View className="mb-6">
            <View className="flex-row items-center mb-2">
              <Chart size={18} color={colors.primary} variant="Outline" />
              <Text className="text-gray-700 text-sm font-semibold ml-2">Meta mensal de faturamento</Text>
            </View>
            <Text className="text-gray-500 text-xs mb-3 leading-4">
              Defina quanto você deseja faturar por mês. Essa meta aparecerá no painel principal como uma barra de progresso.
            </Text>
            <Input
              value={business.monthlyGoal}
              onChangeText={(text) => updateBusiness({ monthlyGoal: text.replace(/[^0-9.,]/g, '') })}
              placeholder="Ex: 10000"
              keyboardType="numeric"
              icon={<DollarCircle size={18} color={colors.textMuted} variant="Outline" />}
              className="mb-0"
            />
            <Text className="text-gray-400 text-xs mt-1">Opcional — você pode alterar depois em Configurações</Text>
          </View>

          {/* Taxas de Pagamento */}
          <View className="mb-8">
            <View className="flex-row items-center mb-2">
              <Card size={18} color={colors.primary} variant="Outline" />
              <Text className="text-gray-700 text-sm font-semibold ml-2">Taxas de pagamento</Text>
            </View>
            <Text className="text-gray-500 text-xs mb-4 leading-4">
              Configure as taxas cobradas pela maquininha em cada forma de pagamento: Crédito (por parcela e bandeira), Débito e PIX.
            </Text>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/admin/settings/payment-fees');
              }}
              className="rounded-xl p-4 flex-row items-center"
              style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="w-12 h-12 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: colors.primary + '10' }}>
                <Card size={24} color={colors.primary} variant="Outline" />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Configurar Taxas</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Crédito, Débito, PIX, bandeiras e parcelas</Text>
              </View>
              <ArrowRight2 size={18} color={colors.textMuted} variant="Outline" />
            </Pressable>

            <View className="rounded-xl p-3 mt-3" style={{ backgroundColor: colors.primary + '08', borderWidth: 1, borderColor: colors.primary + '15' }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>
                💡 Você pode pular esta etapa e configurar as taxas depois em Configurações → Taxas de Pagamento.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <OnboardingFooter
        onContinue={handleContinue}
        continueLabel="Continuar"
      />
    </View>
  );
}
