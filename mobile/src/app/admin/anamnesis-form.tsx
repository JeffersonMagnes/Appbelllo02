import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, TickSquare, ArrowDown2, Calendar, User, Camera, CloseCircle, Image as ImageIcon, TickCircle, Link2 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  useAnamnesisStore,
  AnamnesisField,
  PhotoComparison,
} from '@/lib/state/anamnesis-store';
import { uploadFile } from '@/lib/upload';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useOnboardingStore } from '@/lib/state/onboarding-store';

export default function AnamnesisFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    templateId: string;
    clientId?: string;
    clientName?: string;
    anamnesisId?: string;
  }>();

  const { templates, filledAnamnesis: allFilledAnamnesis, addFilledAnamnesis } = useAnamnesisStore();
  const { business } = useOnboardingStore();
  const establishmentName = business.businessName || 'Appbello';

  const template = useMemo(
    () => templates.find((t) => t.id === params.templateId),
    [templates, params.templateId]
  );

  const existingAnamnesis = useMemo(
    () => params.anamnesisId ? allFilledAnamnesis.find((a) => a.id === params.anamnesisId) : undefined,
    [allFilledAnamnesis, params.anamnesisId]
  );
  const isViewMode = !!existingAnamnesis;

  const [formData, setFormData] = useState<Record<string, string | boolean | string[] | PhotoComparison>>(
    () => existingAnamnesis?.data ?? {}
  );
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showSelectOptions, setShowSelectOptions] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedShareToken, setSavedShareToken] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  if (!template) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text className="text-gray-900">Template não encontrado</Text>
      </View>
    );
  }

  const currentSection = template.sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === template.sections.length - 1;
  const isFirstSection = currentSectionIndex === 0;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isViewMode || isFirstSection) {
      router.back();
    } else {
      setCurrentSectionIndex((prev) => prev - 1);
    }
  };

  const validateSection = () => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    currentSection.fields.forEach((field) => {
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
      handleSave();
    } else {
      setCurrentSectionIndex((prev) => prev + 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    let shareToken = '';
    if (params.clientId) {
      if (isSupabaseConfigured()) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('client_anamnesis').upsert({
            client_id: params.clientId,
            template_id: template.id,
            template_name: template.name,
            data: formData,
            filled_at: new Date().toISOString(),
          });
        } catch {
          // falha silenciosa — salva localmente abaixo
        }
      }
      const created = addFilledAnamnesis({
        clientId: params.clientId,
        templateId: template.id,
        templateName: template.name,
        data: formData,
      });
      shareToken = created.shareToken;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaving(false);
    setSavedShareToken(shareToken);
    setShowSuccessModal(true);
  };

  const buildFichaHtml = () => {
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const sectionsHtml = template.sections.map(section => {
      const rows = section.fields
        .filter(f => f.type !== 'photo_comparison')
        .map(field => {
          const val = formData[field.id];
          if (val === undefined || val === '' || val === null) return '';
          let display = typeof val === 'boolean' ? (val ? 'Sim' : 'Não') : typeof val === 'string' ? val : Array.isArray(val) ? (val as string[]).join(', ') : '';
          if (!display) return '';
          return `<tr><td class="lb">${field.label}</td><td class="vl">${display}</td></tr>`;
        }).filter(Boolean).join('');
      if (!rows) return '';
      return `<div class="card"><h3>${section.title}</h3><table>${rows}</table></div>`;
    }).filter(Boolean).join('');
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${establishmentName} — ${template.name}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#F0F2F5;padding:16px;color:#111}.top{text-align:center;padding:20px 0 12px;}.salon{font-size:20px;font-weight:800;color:#111;letter-spacing:-0.5px}.powered{font-size:11px;color:#aaa;margin-top:2px}.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:16px;padding:24px;margin-bottom:16px}.badge{display:inline-block;background:rgba(255,255,255,.2);border-radius:20px;padding:4px 12px;font-size:12px;margin-bottom:10px}h1{font-size:20px;font-weight:700;margin-bottom:6px}.meta{font-size:13px;opacity:.85;margin-top:4px}.card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px}h3{font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}table{width:100%;border-collapse:collapse}.lb{color:#888;font-size:13px;padding:8px 0;border-bottom:1px solid #f0f0f0;width:45%;vertical-align:top}.vl{font-size:13px;font-weight:600;padding:8px 0 8px 8px;border-bottom:1px solid #f0f0f0}.footer{text-align:center;color:#bbb;font-size:11px;margin-top:20px;padding-bottom:20px}</style></head><body><div class="top"><div class="salon">${establishmentName}</div><div class="powered">via Appbello</div></div><div class="header"><div class="badge">📋 Ficha de Anamnese</div><h1>${template.name}</h1>${params.clientName ? `<div class="meta">👤 ${params.clientName}</div>` : ''}<div class="meta">📅 ${date}</div></div>${sectionsHtml}<div class="footer">${establishmentName} · Gerado pelo Appbello</div></body></html>`;
  };

  const shareAsText = async () => {
    const lines: string[] = [`📋 *${template.name}*`];
    if (params.clientName) lines.push(`👤 ${params.clientName}`);
    lines.push('');
    for (const section of template.sections) {
      const sLines: string[] = [];
      for (const field of section.fields) {
        if (field.type === 'photo_comparison') continue;
        const val = formData[field.id];
        if (val === undefined || val === '' || val === null) continue;
        const display = typeof val === 'boolean' ? (val ? 'Sim' : 'Não') : typeof val === 'string' ? val : '';
        if (display) sLines.push(`• ${field.label}: ${display}`);
      }
      if (sLines.length) { lines.push(`*${section.title}*`); lines.push(...sLines); lines.push(''); }
    }
    lines.push('_Gerado pelo Appbello_');
    await Share.share({ message: lines.join('\n') });
  };

  const handleShareLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSharing(true);
    try {
      if (isSupabaseConfigured() && savedShareToken) {
        try {
          await (supabase as any).storage.createBucket('public-fichas', { public: true }).catch(() => {});
          const html = buildFichaHtml();
          const { error } = await (supabase as any).storage
            .from('public-fichas')
            .upload(`${savedShareToken}.html`, html, {
              contentType: 'text/html; charset=utf-8',
              cacheControl: '86400',
              upsert: true,
            });
          if (!error) {
            const { data: urlData } = (supabase as any).storage
              .from('public-fichas')
              .getPublicUrl(`${savedShareToken}.html`);
            if (urlData?.publicUrl) {
              await Share.share({
                message: `📋 *${template.name}*${params.clientName ? `\n👤 ${params.clientName}` : ''}\n\nAcesse sua ficha:\n${urlData.publicUrl}`,
                url: urlData.publicUrl,
              });
              return;
            }
          }
        } catch (error) {
          console.error('Failed to share anamnesis via public link, falling back to text:', error);
        }
      }
      await shareAsText();
    } finally {
      setIsSharing(false);
    }
  };

  const updateField = (fieldId: string, value: string | boolean | string[] | PhotoComparison) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const pickImage = async (fieldId: string, type: 'before' | 'after') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingPhoto(fieldId);
      try {
        const uploaded = await uploadFile(
          asset.uri,
          asset.fileName ?? `photo-${Date.now()}.jpg`,
          asset.mimeType ?? 'image/jpeg'
        );
        const currentPhotos = (formData[fieldId] as PhotoComparison) || { before: [], after: [] };
        updateField(fieldId, { ...currentPhotos, [type]: [...currentPhotos[type], uploaded.url] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível enviar a foto. Tente novamente.');
      } finally {
        setUploadingPhoto(null);
      }
    }
  };

  const takePhoto = async (fieldId: string, type: 'before' | 'after') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingPhoto(fieldId);
      try {
        const uploaded = await uploadFile(
          asset.uri,
          asset.fileName ?? `photo-${Date.now()}.jpg`,
          asset.mimeType ?? 'image/jpeg'
        );
        const currentPhotos = (formData[fieldId] as PhotoComparison) || { before: [], after: [] };
        updateField(fieldId, { ...currentPhotos, [type]: [...currentPhotos[type], uploaded.url] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível enviar a foto. Tente novamente.');
      } finally {
        setUploadingPhoto(null);
      }
    }
  };

  const removePhoto = (fieldId: string, type: 'before' | 'after', index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const currentPhotos = (formData[fieldId] as PhotoComparison) || { before: [], after: [] };
    const updatedPhotos = {
      ...currentPhotos,
      [type]: currentPhotos[type].filter((_, i) => i !== index),
    };
    updateField(fieldId, updatedPhotos);
  };

  const showPhotoOptions = (fieldId: string, type: 'before' | 'after') => {
    Alert.alert(
      'Adicionar foto',
      'Como você deseja adicionar a foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Galeria', onPress: () => pickImage(fieldId, type) },
        { text: 'Câmera', onPress: () => takePhoto(fieldId, type) },
      ]
    );
  };

  const renderField = (field: AnamnesisField, index: number) => {
    const hasError = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <Animated.View
            key={field.id}
            entering={FadeInDown.duration(300).delay(index * 50)}
            className="mb-5"
          >
            <Text className="text-gray-900/70 text-sm mb-2">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
            <View
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1 : 0,
                borderColor: colors.error,
              }}
            >
              <TextInput
                value={(formData[field.id] as string) || ''}
                onChangeText={(text) => updateField(field.id, text)}
                placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
                placeholderTextColor={colors.textMuted}
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                editable={!isViewMode}
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
            entering={FadeInDown.duration(300).delay(index * 50)}
            className="mb-5"
          >
            <Text className="text-gray-900/70 text-sm mb-2">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
            <View
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1 : 0,
                borderColor: colors.error,
              }}
            >
              <TextInput
                value={(formData[field.id] as string) || ''}
                onChangeText={(text) => updateField(field.id, text)}
                placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                editable={!isViewMode}
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
            entering={FadeInDown.duration(300).delay(index * 50)}
            className="mb-5"
          >
            <Text className="text-gray-900/70 text-sm mb-2">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
            <View
              className="rounded-xl px-4 py-3 flex-row items-center"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1 : 0,
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
                editable={!isViewMode}
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
            entering={FadeInDown.duration(300).delay(index * 50)}
            className="mb-5"
          >
            <Text className="text-gray-900/70 text-sm mb-2">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
            <Pressable
              onPress={() => !isViewMode && setShowSelectOptions(showSelectOptions === field.id ? null : field.id)}
              className="rounded-xl px-4 py-3 flex-row items-center justify-between"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1 : 0,
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
                    {formData[field.id] === option && (
                      <TickSquare size={18} color={colors.success}  variant="Outline" />
                    )}
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
            entering={FadeInDown.duration(300).delay(index * 50)}
            className="mb-5"
          >
            <Text className="text-gray-900/70 text-sm mb-3">
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
                      if (isViewMode) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateField(field.id, option);
                    }}
                    className="px-4 py-2.5 rounded-xl flex-row items-center"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.backgroundCard,
                      borderWidth: hasError && !isSelected ? 1 : 0,
                      borderColor: colors.error,
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
                        <View
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: '#fff' }}
                        />
                      )}
                    </View>
                    <Text
                      className="font-medium"
                      style={{ color: isSelected ? '#fff' : colors.textPrimary }}
                    >
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

      case 'checkbox':
        const isChecked = formData[field.id] === true;
        return (
          <Animated.View
            key={field.id}
            entering={FadeInDown.duration(300).delay(index * 50)}
            className="mb-5"
          >
            <Pressable
              onPress={() => {
                if (isViewMode) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateField(field.id, !isChecked);
              }}
              className="flex-row items-start p-4 rounded-xl"
              style={{
                backgroundColor: colors.backgroundCard,
                borderWidth: hasError ? 1 : 0,
                borderColor: colors.error,
              }}
            >
              <View
                className="w-6 h-6 rounded-md mr-3 items-center justify-center"
                style={{
                  backgroundColor: isChecked ? colors.primary : 'transparent',
                  borderWidth: isChecked ? 0 : 2,
                  borderColor: colors.textMuted,
                }}
              >
                {isChecked && <TickSquare size={16} color="#fff"  variant="Outline" />}
              </View>
              <Text className="flex-1 text-gray-900/80 text-sm leading-5">
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

      case 'photo_comparison':
        const photos = (formData[field.id] as PhotoComparison) || { before: [], after: [] };
        return (
          <Animated.View
            key={field.id}
            entering={FadeInDown.duration(300).delay(index * 50)}
            className="mb-5"
          >
            <Text className="text-gray-900/70 text-sm mb-4">
              {field.label}
              {field.required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>

            {/* Antes */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colors.warning }}
                />
                <Text className="text-white font-semibold">ANTES</Text>
                <Text className="text-gray-900/40 text-xs ml-2">
                  ({photos.before.length} foto{photos.before.length !== 1 ? 's' : ''})
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {photos.before.map((uri, idx) => (
                  <View key={`before-${idx}`} className="relative">
                    <Image
                      source={{ uri }}
                      className="w-28 h-28 rounded-xl"
                      resizeMode="cover"
                    />
                    {!isViewMode && (
                      <Pressable
                        onPress={() => removePhoto(field.id, 'before', idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.error }}
                      >
                        <CloseCircle size={14} color="#fff"  variant="Outline" />
                      </Pressable>
                    )}
                  </View>
                ))}

                {!isViewMode && (
                  <Pressable
                    onPress={() => showPhotoOptions(field.id, 'before')}
                    disabled={uploadingPhoto === field.id}
                    className="w-28 h-28 rounded-xl items-center justify-center border-2 border-dashed"
                    style={{ borderColor: colors.warning + '60' }}
                  >
                    {uploadingPhoto === field.id ? (
                      <ActivityIndicator color={colors.warning} />
                    ) : (
                      <>
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mb-2"
                          style={{ backgroundColor: colors.warning + '20' }}
                        >
                          <Camera size={20} color={colors.warning} />
                        </View>
                        <Text className="text-xs" style={{ color: colors.warning }}>
                          Adicionar
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </ScrollView>
            </View>

            {/* Depois */}
            <View>
              <View className="flex-row items-center mb-3">
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colors.success }}
                />
                <Text className="text-white font-semibold">DEPOIS</Text>
                <Text className="text-gray-900/40 text-xs ml-2">
                  ({photos.after.length} foto{photos.after.length !== 1 ? 's' : ''})
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {photos.after.map((uri, idx) => (
                  <View key={`after-${idx}`} className="relative">
                    <Image
                      source={{ uri }}
                      className="w-28 h-28 rounded-xl"
                      resizeMode="cover"
                    />
                    {!isViewMode && (
                      <Pressable
                        onPress={() => removePhoto(field.id, 'after', idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.error }}
                      >
                        <CloseCircle size={14} color="#fff"  variant="Outline" />
                      </Pressable>
                    )}
                  </View>
                ))}

                {!isViewMode && (
                  <Pressable
                    onPress={() => showPhotoOptions(field.id, 'after')}
                    disabled={uploadingPhoto === field.id}
                    className="w-28 h-28 rounded-xl items-center justify-center border-2 border-dashed"
                    style={{ borderColor: colors.success + '60' }}
                  >
                    {uploadingPhoto === field.id ? (
                      <ActivityIndicator color={colors.success} />
                    ) : (
                      <>
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mb-2"
                          style={{ backgroundColor: colors.success + '20' }}
                        >
                          <Camera size={20} color={colors.success} />
                        </View>
                        <Text className="text-xs" style={{ color: colors.success }}>
                          Adicionar
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </ScrollView>
            </View>

            {/* Dica */}
            {!isViewMode && (
              <View
                className="flex-row items-center mt-4 p-3 rounded-xl"
                style={{ backgroundColor: colors.info + '10' }}
              >
                <ImageIcon size={16} color={colors.info} />
                <Text className="text-gray-900/60 text-xs ml-2 flex-1">
                  Adicione fotos do antes e depois para acompanhar a evolução do cliente.
                </Text>
              </View>
            )}
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary + '20', colors.background]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 py-4">
          <View className="flex-row items-center mb-4">
            <Pressable
              onPress={handleBack}
              className="w-10 h-10 items-center justify-center rounded-full mr-3"
              style={{ backgroundColor: colors.surface }}
            >
              <ArrowLeft size={20} color={colors.textPrimary} variant="Outline" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-lg">{template.name}</Text>
              {params.clientName && (
                <View className="flex-row items-center mt-0.5">
                  <User size={12} color={colors.secondary}  variant="Outline" />
                  <Text className="text-gray-900/50 text-xs ml-1">{params.clientName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Progress */}
          {isViewMode ? (
            <View className="flex-row items-center mb-2">
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.info + '20' }}>
                <Text className="text-xs font-medium" style={{ color: colors.info }}>Visualizando ficha</Text>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center mb-2">
              <View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surface }}>
                <View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: colors.primary,
                    width: `${((currentSectionIndex + 1) / template.sections.length) * 100}%`,
                  }}
                />
              </View>
              <Text className="text-gray-900/40 text-xs ml-3">
                {currentSectionIndex + 1}/{template.sections.length}
              </Text>
            </View>
          )}
        </View>

        {/* Section Title */}
        {!isViewMode && (
          <Animated.View
            key={currentSection.id}
            entering={FadeIn.duration(300)}
            className="px-5 mb-4"
          >
            <Text className="text-gray-900 font-semibold text-xl">{currentSection.title}</Text>
          </Animated.View>
        )}

        {/* Form Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={100}
        >
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {isViewMode
              ? template.sections.map((section, sIdx) => (
                  <View key={section.id} style={{ marginTop: sIdx > 0 ? 20 : 0 }}>
                    <Text
                      className="text-gray-900 font-semibold text-xl mb-4"
                    >
                      {section.title}
                    </Text>
                    {section.fields.map((field, index) => renderField(field, index))}
                  </View>
                ))
              : currentSection.fields.map((field, index) => renderField(field, index))
            }
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Navigation */}
        <View
          className="absolute bottom-0 left-0 right-0"
          style={{ backgroundColor: colors.background }}
        >
          <LinearGradient
            colors={['transparent', colors.background]}
            style={{ height: 30 }}
          />
          <SafeAreaView edges={['bottom']}>
            <View className="px-5 pb-4 flex-row gap-3">
              {isViewMode ? (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
                  className="flex-1 py-4 rounded-2xl items-center"
                  style={{ backgroundColor: colors.surface }}
                >
                  <Text className="text-gray-900 font-semibold">Fechar</Text>
                </Pressable>
              ) : (
                <>
                  {!isFirstSection && (
                    <Pressable
                      onPress={handleBack}
                      className="flex-1 py-4 rounded-2xl items-center"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <Text className="text-gray-900 font-semibold">Voltar</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={handleNext}
                    disabled={isSaving}
                    className="flex-1 py-4 rounded-2xl items-center"
                    style={{
                      backgroundColor: colors.primary,
                      flex: isFirstSection ? 1 : 1,
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    <Text className="text-white font-bold">
                      {isSaving ? 'Salvando...' : isLastSection ? 'Salvar Ficha' : 'Próximo'}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaView>

      {/* Success Modal */}
      {showSuccessModal && (
        <View
          className="absolute inset-0 items-center justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => { setShowSuccessModal(false); router.back(); router.back(); }}
          />
          <Animated.View
            entering={FadeInDown.duration(350).springify()}
            className="w-full rounded-t-3xl px-6 pb-8 pt-6"
            style={{ backgroundColor: colors.background }}
          >
            <View className="w-10 h-1 rounded-full self-center mb-5" style={{ backgroundColor: colors.border }} />

            <View className="items-center mb-6">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.success + '18' }}
              >
                <TickCircle size={36} color={colors.success} variant="Bold" />
              </View>
              <Text className="text-gray-900 font-bold text-2xl">Ficha salva!</Text>
              {params.clientName && (
                <Text className="text-gray-900/50 text-sm mt-1">{params.clientName}</Text>
              )}
            </View>

            {savedShareToken ? (
              <Pressable
                onPress={handleShareLink}
                disabled={isSharing}
                className="py-4 rounded-2xl items-center flex-row justify-center mb-3"
                style={{ backgroundColor: colors.primary, opacity: isSharing ? 0.7 : 1 }}
              >
                {isSharing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Link2 size={18} color="#fff" variant="Outline" />
                    <Text className="text-white font-bold text-base ml-2">Gerar Link para Cliente</Text>
                  </>
                )}
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSuccessModal(false);
                router.back();
                router.back();
              }}
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-gray-900 font-semibold">Fechar</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
