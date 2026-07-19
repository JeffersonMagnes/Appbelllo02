import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TickSquare, ArrowDown2, Calendar, ArrowLeft, TickCircle, ClipboardText, Scissor } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAnamnesisStore, AnamnesisField } from '@/lib/state/anamnesis-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type FormValue = string | boolean | string[];

export default function AnamnesisPublicScreen() {
  const params = useLocalSearchParams<{ templateId: string; estId?: string }>();
  const { templates } = useAnamnesisStore();

  const template = useMemo(
    () => templates.find((t) => t.id === params.templateId),
    [templates, params.templateId]
  );

  const [formData, setFormData] = useState<Record<string, FormValue>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showSelectOptions, setShowSelectOptions] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!template) {
    return (
      <View className="flex-1 items-center justify-center p-8" style={{ backgroundColor: colors.background }}>
        <ClipboardText size={56} color={colors.textMuted} />
        <Text className="text-gray-500 text-lg mt-5 text-center font-semibold">
          Ficha não encontrada
        </Text>
        <Text className="text-gray-400 text-sm mt-2 text-center">
          Peça ao seu profissional um novo link.
        </Text>
      </View>
    );
  }

  // Skip sections that only have photo_comparison fields
  const sections = template.sections.filter(
    (s) => !s.fields.every((f) => f.type === 'photo_comparison')
  );

  const currentSection = sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === sections.length - 1;
  const isFirstSection = currentSectionIndex === 0;
  const progress = (currentSectionIndex + 1) / sections.length;

  const updateField = (fieldId: string, value: FormValue) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const validateSection = () => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;
    currentSection.fields.forEach((field) => {
      if (field.type === 'photo_comparison') return;
      if (field.required) {
        const value = formData[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.id] = true;
          isValid = false;
        }
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (!validateSection()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLastSection) {
      handleSubmit();
    } else {
      setCurrentSectionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isFirstSection) {
      setCurrentSectionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('anamnesis_submissions').insert({
          template_id: template.id,
          establishment_id: params.estId ?? null,
          data: formData,
          submitted_at: new Date().toISOString(),
        });
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 800));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <View className="flex-1 items-center justify-center p-8" style={{ backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.success + '25', colors.background]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 350 }}
        />
        <Animated.View entering={FadeIn.duration(600)} className="items-center">
          <View
            className="w-28 h-28 rounded-full items-center justify-center mb-7"
            style={{ backgroundColor: colors.success + '20' }}
          >
            <TickCircle size={56} color={colors.success}  variant="Outline" />
          </View>
          <Text className="text-gray-900 font-bold text-2xl mb-4 text-center">
            Ficha enviada! 🎉
          </Text>
          <Text className="text-gray-500 text-base text-center leading-6 mb-2">
            Sua ficha de{' '}
            <Text className="font-semibold" style={{ color: colors.primary }}>
              {template.name}
            </Text>{' '}
            foi enviada com sucesso.
          </Text>
          <Text className="text-gray-400 text-sm text-center leading-5">
            O profissional terá acesso às suas informações antes do atendimento.
          </Text>
        </Animated.View>
      </View>
    );
  }

  const renderField = (field: AnamnesisField, index: number) => {
    if (field.type === 'photo_comparison') return null;
    const hasError = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <Animated.View
            key={field.id}
            entering={FadeInDown.duration(250).delay(index * 40)}
            className="mb-5"
          >
            <Text className="text-gray-600 text-sm mb-2 font-medium">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
            <View
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1.5 : 0,
                borderColor: colors.error,
              }}
            >
              <TextInput
                value={(formData[field.id] as string) || ''}
                onChangeText={(text) => updateField(field.id, text)}
                placeholder={field.placeholder || `Digite aqui...`}
                placeholderTextColor={colors.textMuted}
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                className="text-gray-900 text-base"
              />
            </View>
            {hasError && (
              <Text className="text-xs mt-1" style={{ color: colors.error }}>
                Campo obrigatório
              </Text>
            )}
          </Animated.View>
        );

      case 'textarea':
        return (
          <Animated.View
            key={field.id}
            entering={FadeInDown.duration(250).delay(index * 40)}
            className="mb-5"
          >
            <Text className="text-gray-600 text-sm mb-2 font-medium">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
            <View
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1.5 : 0,
                borderColor: colors.error,
              }}
            >
              <TextInput
                value={(formData[field.id] as string) || ''}
                onChangeText={(text) => updateField(field.id, text)}
                placeholder={field.placeholder || 'Digite aqui...'}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                className="text-gray-900 text-base"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
            {hasError && (
              <Text className="text-xs mt-1" style={{ color: colors.error }}>
                Campo obrigatório
              </Text>
            )}
          </Animated.View>
        );

      case 'date':
        return (
          <Animated.View
            key={field.id}
            entering={FadeInDown.duration(250).delay(index * 40)}
            className="mb-5"
          >
            <Text className="text-gray-600 text-sm mb-2 font-medium">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
            <View
              className="rounded-xl px-4 py-3 flex-row items-center"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1.5 : 0,
                borderColor: colors.error,
              }}
            >
              <Calendar size={18} color={colors.textMuted}  variant="Outline" />
              <TextInput
                value={(formData[field.id] as string) || ''}
                onChangeText={(text) => updateField(field.id, text)}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                className="flex-1 text-gray-900 text-base ml-3"
              />
            </View>
            {hasError && (
              <Text className="text-xs mt-1" style={{ color: colors.error }}>
                Campo obrigatório
              </Text>
            )}
          </Animated.View>
        );

      case 'select':
        return (
          <Animated.View
            key={field.id}
            entering={FadeInDown.duration(250).delay(index * 40)}
            className="mb-5"
          >
            <Text className="text-gray-600 text-sm mb-2 font-medium">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
            <Pressable
              onPress={() => setShowSelectOptions(showSelectOptions === field.id ? null : field.id)}
              className="rounded-xl px-4 py-3 flex-row items-center justify-between"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1.5 : 0,
                borderColor: colors.error,
              }}
            >
              <Text
                className="text-base"
                style={{ color: formData[field.id] ? colors.textPrimary : colors.textMuted }}
              >
                {(formData[field.id] as string) || 'Selecione uma opção'}
              </Text>
              <ArrowDown2 size={18} color={colors.textMuted} />
            </Pressable>
            {showSelectOptions === field.id && (
              <View
                className="rounded-xl mt-2 overflow-hidden"
                style={{ backgroundColor: colors.surface }}
              >
                {field.options?.map((option, idx) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateField(field.id, option);
                      setShowSelectOptions(null);
                    }}
                    className="px-4 py-3 flex-row items-center justify-between"
                    style={{
                      borderBottomWidth: idx < (field.options?.length || 0) - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text className="text-gray-900">{option}</Text>
                    {formData[field.id] === option && <TickSquare size={18} color={colors.success}  variant="Outline" />}
                  </Pressable>
                ))}
              </View>
            )}
            {hasError && (
              <Text className="text-xs mt-1" style={{ color: colors.error }}>
                Campo obrigatório
              </Text>
            )}
          </Animated.View>
        );

      case 'radio':
        return (
          <Animated.View
            key={field.id}
            entering={FadeInDown.duration(250).delay(index * 40)}
            className="mb-5"
          >
            <Text className="text-gray-600 text-sm mb-3 font-medium">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {field.options?.map((option) => {
                const isSelected = formData[field.id] === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateField(field.id, option);
                    }}
                    className="px-4 py-2.5 rounded-xl flex-row items-center"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.backgroundCard,
                    }}
                  >
                    <View
                      className="w-5 h-5 rounded-full mr-2 items-center justify-center"
                      style={{
                        borderWidth: 2,
                        borderColor: isSelected ? '#fff' : colors.textMuted,
                      }}
                    >
                      {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#fff' }} />
                      )}
                    </View>
                    <Text className="font-medium" style={{ color: isSelected ? '#fff' : colors.textPrimary }}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {hasError && (
              <Text className="text-xs mt-1" style={{ color: colors.error }}>
                Campo obrigatório
              </Text>
            )}
          </Animated.View>
        );

      case 'checkbox': {
        const isChecked = formData[field.id] === true;
        return (
          <Animated.View
            key={field.id}
            entering={FadeInDown.duration(250).delay(index * 40)}
            className="mb-5"
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateField(field.id, !isChecked);
              }}
              className="flex-row items-start p-4 rounded-xl"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1.5 : 0,
                borderColor: colors.error,
              }}
            >
              <View
                className="w-6 h-6 rounded-md mr-3 items-center justify-center"
                style={{
                  backgroundColor: isChecked ? colors.primary : 'transparent',
                  borderWidth: isChecked ? 0 : 2,
                  borderColor: colors.textMuted,
                  marginTop: 1,
                }}
              >
                {isChecked && <TickSquare size={16} color="#fff"  variant="Outline" />}
              </View>
              <Text className="flex-1 text-gray-700 text-sm leading-5">
                {field.label}
                {field.required && <Text style={{ color: colors.error }}> *</Text>}
              </Text>
            </Pressable>
            {hasError && (
              <Text className="text-xs mt-1" style={{ color: colors.error }}>
                Campo obrigatório
              </Text>
            )}
          </Animated.View>
        );
      }

      default:
        return null;
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary + '18', colors.background]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 py-4">
          <View className="flex-row items-center mb-4">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <Scissor size={20} color={colors.primary}  variant="Outline" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-lg">{template.name}</Text>
              <Text className="text-gray-500 text-xs">Ficha de Anamnese</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View>
            <View
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: colors.surface }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  width: `${progress * 100}%`,
                }}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-1.5 text-right">
              {currentSectionIndex + 1} de {sections.length}
            </Text>
          </View>
        </View>

        {/* Section Title */}
        <Animated.View
          key={currentSection.id}
          entering={FadeIn.duration(250)}
          className="px-5 mb-4"
        >
          <Text className="text-gray-900 font-semibold text-xl">{currentSection.title}</Text>
        </Animated.View>

        {/* Form */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={100}
        >
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 130 }}
            keyboardShouldPersistTaps="handled"
          >
            {currentSection.fields.map((field, index) => renderField(field, index))}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Navigation buttons */}
        <View className="absolute bottom-0 left-0 right-0">
          <LinearGradient
            colors={['transparent', colors.background]}
            style={{ height: 30 }}
          />
          <SafeAreaView edges={['bottom']}>
            <View className="px-5 pb-4 flex-row gap-3">
              {!isFirstSection && (
                <Pressable
                  onPress={handleBack}
                  className="py-4 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: colors.surface, width: 56 }}
                >
                  <ArrowLeft size={20} color={colors.textPrimary}  variant="Outline" />
                </Pressable>
              )}
              <Pressable
                onPress={handleNext}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-2xl items-center flex-row justify-center"
                style={{
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-base mr-2">
                      {isLastSection ? 'Enviar Ficha' : 'Próximo'}
                    </Text>
                    {!isLastSection && <ArrowDown2 size={18} color="#fff" style={{ transform: [{ rotate: '-90deg' }] }} />}
                    {isLastSection && <TickSquare size={18} color="#fff"  variant="Outline" />}
                  </>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaView>
    </View>
  );
}
