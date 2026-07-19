import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, DocumentUpload, TickSquare, Eye } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { uploadFile } from '@/lib/upload';
import { useAuthStore } from '@/lib/state/auth-store';
import { useUpdateEstablishment } from '@/lib/hooks/use-establishment';
import { isSupabaseConfigured } from '@/lib/supabase';

const primaryColorOptions = [
  '#5333ed', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4',
];

const secondaryColorOptions = [
  '#2cd4d9', '#60A5FA', '#34D399', '#FBBF24',
  '#F87171', '#F472B6', '#A78BFA', '#22D3EE',
];

export default function EditBrandingScreen() {
  const router = useRouter();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const updateEstablishment = useUpdateEstablishment(establishmentId ?? '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    logo: '',
    primaryColor: '#6666cc',
    secondaryColor: '#7ccad0',
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploading(true);
      try {
        let logoUrl: string;

        if (isSupabaseConfigured()) {
          try {
            const uploaded = await uploadFile(
              asset.uri,
              asset.fileName ?? `logo-${Date.now()}.jpg`,
              asset.mimeType ?? 'image/jpeg'
            );
            logoUrl = uploaded.url;
          } catch {
            // Bucket não configurado — salva como base64 local
            const base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            logoUrl = `data:${asset.mimeType ?? 'image/jpeg'};base64,${base64}`;
          }
        } else {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          logoUrl = `data:${asset.mimeType ?? 'image/jpeg'};base64,${base64}`;
        }

        setForm(f => ({ ...f, logo: logoUrl }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar a imagem. Tente novamente.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!isSupabaseConfigured() || !establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado.');
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateEstablishment.mutateAsync({
        ...(form.logo ? { logo_url: form.logo } : {}),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e?.message || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            <ArrowLeft size={20} color={colors.textPrimary}  variant="Outline" />
          </Pressable>
          <Text className="text-gray-900 font-bold text-lg">Identidade Visual</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
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
                  borderColor: form.logo ? form.primaryColor : colors.border,
                  borderStyle: 'dashed',
                }}
              >
                {uploading ? (
                  <View className="items-center">
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text className="text-gray-400 text-sm mt-2">Enviando logo...</Text>
                  </View>
                ) : form.logo ? (
                  <View className="relative w-full h-full items-center justify-center">
                    <Image
                      source={{ uri: form.logo }}
                      className="w-24 h-24 rounded-xl"
                      resizeMode="cover"
                    />
                    <View
                      className="absolute bottom-3 right-3 rounded-full px-3 py-1.5 flex-row items-center"
                      style={{ backgroundColor: form.primaryColor }}
                    >
                      <DocumentUpload size={14} color="#fff"  variant="Outline" />
                      <Text className="text-white text-xs font-medium ml-1">Alterar</Text>
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
                    <Text className="text-gray-700 font-medium text-base">Enviar logo</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Primary Color */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-medium mb-3">Cor principal</Text>
              <View className="flex-row flex-wrap gap-3">
                {primaryColorOptions.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setForm({ ...form, primaryColor: color }); }}
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: color, borderWidth: form.primaryColor === color ? 3 : 0, borderColor: '#fff' }}
                  >
                    {form.primaryColor === color && <TickSquare size={20} color="#fff" strokeWidth={3}  variant="Outline" />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Secondary Color */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-medium mb-3">Cor secundária</Text>
              <View className="flex-row flex-wrap gap-3">
                {secondaryColorOptions.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setForm({ ...form, secondaryColor: color }); }}
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: color, borderWidth: form.secondaryColor === color ? 3 : 0, borderColor: '#fff' }}
                  >
                    {form.secondaryColor === color && <TickSquare size={20} color="#fff" strokeWidth={3}  variant="Outline" />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Preview Toggle */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPreview(!showPreview); }}
              className="flex-row items-center justify-center py-3 rounded-xl mb-4"
              style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}
            >
              <Eye size={18} color={form.primaryColor}  variant="Outline" />
              <Text className="text-sm font-medium ml-2" style={{ color: form.primaryColor }}>
                {showPreview ? 'Ocultar' : 'Ver'} pré-visualização
              </Text>
            </Pressable>

            {/* Preview */}
            {showPreview && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="rounded-2xl overflow-hidden mb-8"
                style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}
              >
                {/* Preview header — intentionally uses white text on colored gradient */}
                <LinearGradient
                  colors={[form.primaryColor, form.primaryColor + '80']}
                  style={{ padding: 20 }}
                >
                  <View className="flex-row items-center">
                    {form.logo ? (
                      <Image source={{ uri: form.logo }} className="w-12 h-12 rounded-xl" resizeMode="cover" />
                    ) : (
                      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <Text className="text-white font-bold text-lg">B</Text>
                      </View>
                    )}
                    <View className="ml-3">
                      <Text className="text-white font-bold text-lg">Barbearia Premium</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Agende seu horário</Text>
                    </View>
                  </View>
                </LinearGradient>

                <View className="p-4">
                  <View className="rounded-xl py-3 items-center" style={{ backgroundColor: form.secondaryColor }}>
                    <Text className="text-white font-semibold">Agendar</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="px-5 py-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button onPress={handleSave} loading={loading} fullWidth size="lg">
            Salvar alterações
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
