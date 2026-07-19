import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { DocumentUpload, Colorfilter, TickSquare, Eye } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useSetupStore } from '@/lib/state/setup-store';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { uploadFile } from '@/lib/upload';

const primaryColorOptions = [
  '#5333ed', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
];

const secondaryColorOptions = [
  '#2cd4d9', // Turquoise
  '#60A5FA', // Light Blue
  '#34D399', // Emerald
  '#FBBF24', // Yellow
  '#F87171', // Light Red
  '#F472B6', // Light Pink
  '#A78BFA', // Light Violet
  '#22D3EE', // Light Cyan
];

export default function Step4Branding() {
  const router = useRouter();
  const branding = useOnboardingStore(s => s.branding);
  const business = useOnboardingStore(s => s.business);
  const updateBranding = useOnboardingStore(s => s.updateBranding);
  const setCurrentStep = useOnboardingStore(s => s.setCurrentStep);
  const completeStep = useSetupStore(s => s.completeStep);

  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploading(true);
      try {
        const uploaded = await uploadFile(
          asset.uri,
          asset.fileName ?? `logo-${Date.now()}.jpg`,
          asset.mimeType ?? 'image/jpeg'
        );
        updateBranding({ logoUrl: uploaded.url });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível enviar a logo. Tente novamente.');
      } finally {
        setUploading(false);
      }
    }
  };

  const selectPrimaryColor = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateBranding({ primaryColor: color });
  };

  const selectSecondaryColor = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateBranding({ secondaryColor: color });
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeStep('branding');
    router.push('/onboarding/step-5');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <OnboardingHeader
        currentStep={4}
        totalSteps={6}
        title="Identidade Visual"
        subtitle="Personalize a aparência do seu portal de agendamento"
      />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 200 }} automaticallyAdjustKeyboardInsets={true}
      >
        <View className="pt-4">
          {/* Logo Upload */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-3">
              Logo do estabelecimento
            </Text>
            <Pressable
              onPress={pickImage}
              disabled={uploading}
              className="items-center justify-center rounded-2xl overflow-hidden"
              style={{
                backgroundColor: colors.backgroundCard,
                height: 140,
                borderWidth: 2,
                borderColor: branding.logoUrl ? branding.primaryColor : 'transparent',
                borderStyle: 'dashed',
              }}
            >
              {uploading ? (
                <View className="items-center">
                  <ActivityIndicator color={colors.primary} size="large" />
                  <Text className="text-white/50 text-sm mt-2">Enviando logo...</Text>
                </View>
              ) : branding.logoUrl ? (
                <View className="relative w-full h-full items-center justify-center">
                  <Image
                    source={{ uri: branding.logoUrl }}
                    className="w-24 h-24 rounded-xl"
                    resizeMode="cover"
                  />
                  <View
                    className="absolute bottom-3 right-3 rounded-full px-3 py-1.5 flex-row items-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <DocumentUpload size={14} color="#fff"  variant="Outline" />
                    <Text className="text-white text-xs font-medium ml-1">
                      Alterar
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="items-center">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <DocumentUpload size={28} color={colors.textMuted}  variant="Outline" />
                  </View>
                  <Text className="text-white font-medium text-base">
                    Enviar logo
                  </Text>
                  <Text className="text-white/50 text-sm mt-1">
                    PNG, JPG até 5MB
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Primary Color */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Colorfilter size={18} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Cor principal
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {primaryColorOptions.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => selectPrimaryColor(color)}
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: color,
                    borderWidth: branding.primaryColor === color ? 3 : 0,
                    borderColor: '#fff',
                  }}
                >
                  {branding.primaryColor === color && (
                    <Animated.View entering={FadeIn.duration(200)}>
                      <TickSquare size={20} color="#fff" strokeWidth={3}  variant="Outline" />
                    </Animated.View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Secondary Color */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Colorfilter size={18} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-700 text-sm font-medium ml-2">
                Cor secundária
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {secondaryColorOptions.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => selectSecondaryColor(color)}
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: color,
                    borderWidth: branding.secondaryColor === color ? 3 : 0,
                    borderColor: '#fff',
                  }}
                >
                  {branding.secondaryColor === color && (
                    <Animated.View entering={FadeIn.duration(200)}>
                      <TickSquare size={20} color="#fff" strokeWidth={3}  variant="Outline" />
                    </Animated.View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Preview Toggle */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPreview(!showPreview);
            }}
            className="flex-row items-center justify-center py-3 rounded-xl mb-4"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            <Eye size={18} color={colors.primary}  variant="Outline" />
            <Text className="text-sm font-medium ml-2" style={{ color: colors.primary }}>
              {showPreview ? 'Ocultar' : 'Ver'} pré-visualização
            </Text>
          </Pressable>

          {/* Preview Card */}
          {showPreview && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="rounded-2xl overflow-hidden mb-8"
              style={{ backgroundColor: colors.backgroundCard }}
            >
              <LinearGradient
                colors={[branding.primaryColor, branding.primaryColor + '80']}
                style={{ padding: 20 }}
              >
                <View className="flex-row items-center">
                  {branding.logoUrl ? (
                    <Image
                      source={{ uri: branding.logoUrl }}
                      className="w-12 h-12 rounded-xl"
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                    >
                      <Text className="text-white font-bold text-lg">
                        {business.businessName?.charAt(0) || 'A'}
                      </Text>
                    </View>
                  )}
                  <View className="ml-3">
                    <Text className="text-white font-bold text-lg">
                      {business.businessName || 'Seu Estabelecimento'}
                    </Text>
                    <Text className="text-white/70 text-sm">
                      Agende seu horário
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              <View className="p-4">
                <View
                  className="rounded-xl p-4 mb-3"
                  style={{ backgroundColor: colors.surface }}
                >
                  <Text className="text-white font-medium mb-1">
                    Serviço exemplo
                  </Text>
                  <Text className="text-white/50 text-sm">
                    30 min • R$ 50,00
                  </Text>
                </View>
                <View
                  className="rounded-xl py-3 items-center"
                  style={{ backgroundColor: branding.secondaryColor }}
                >
                  <Text className="text-white font-semibold">
                    Agendar
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <OnboardingFooter
        onContinue={handleContinue}
        showSecondary
        secondaryLabel="Pular por agora"
        onSecondary={handleContinue}
      />
    </View>
  );
}
