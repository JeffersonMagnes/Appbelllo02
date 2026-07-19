import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, TextInput,
  Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Buildings2, Call, Camera, Gallery, Global, Sms } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuthStore } from '@/lib/state/auth-store';
import { useEstablishment, useUpdateEstablishment } from '@/lib/hooks/use-establishment';
import { uploadFile } from '@/lib/upload';
import { isSupabaseConfigured } from '@/lib/supabase';

interface FlatFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  icon?: React.ReactNode;
  last?: boolean;
}

const FlatField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', icon, last }: FlatFieldProps) => (
  <View style={{
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: colors.border,
  }}>
    <Text style={{
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
    }}>
      {label}
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        style={{
          flex: 1,
          fontSize: 15,
          color: colors.textPrimary,
          paddingVertical: 0,
        }}
      />
    </View>
  </View>
);

export default function EditBusinessScreen() {
  const router = useRouter();
  const currentUser = useAuthStore(s => s.currentUser);
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: establishment } = useEstablishment(currentUser?.id);
  const updateEstablishment = useUpdateEstablishment(establishmentId ?? '');
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    cnpj: '',
    instagram: '',
    email: '',
    website: '',
  });

  React.useEffect(() => {
    if (establishment) {
      setForm({
        name: establishment.name ?? '',
        phone: establishment.phone ?? '',
        address: establishment.address ?? '',
        cnpj: (establishment as any).cnpj ?? '',
        instagram: (establishment as any).instagram ?? '',
        email: (establishment as any).email ?? '',
        website: (establishment as any).website ?? '',
      });
      setLogoPreview(establishment.logo_url ?? null);
    }
  }, [establishment?.id]);

  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadLogo(result.assets[0]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera nas configurações do dispositivo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadLogo(result.assets[0]);
    }
  };

  const uploadLogo = async (asset: ImagePicker.ImagePickerAsset) => {
    setLogoUploading(true);
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
      setLogoPreview(logoUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a imagem. Tente novamente.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do estabelecimento.');
      return;
    }
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado.');
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateEstablishment.mutateAsync({
        name: form.name.trim(),
        phone: form.phone || null,
        address: form.address || null,
        cnpj: form.cnpj || null,
        instagram: form.instagram || null,
        email: form.email || null,
        website: form.website || null,
        ...(logoPreview ? { logo_url: logoPreview } : {}),
      } as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Salvo!', 'Dados atualizados com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e?.message || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const estName = establishment?.name ?? (form.name || 'Meu Estabelecimento');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: colors.backgroundCard,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} variant="Outline" />
          </Pressable>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: colors.textPrimary, lineHeight: 23 }}>
              Dados do Estabelecimento
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 1 }}>
              {estName}
            </Text>
          </View>

          <View style={{
            backgroundColor: colors.primary + '15',
            borderRadius: 13,
            padding: 10,
          }}>
            <Buildings2 size={22} color={colors.primary} variant="Outline" />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* LOGO */}
          <Text style={sectionLabel}>Logo</Text>
          <View style={card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
              {/* Preview */}
              <View style={{
                width: 84, height: 84, borderRadius: 16,
                backgroundColor: colors.surface,
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {logoUploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : logoPreview ? (
                  <Image source={{ uri: logoPreview }} style={{ width: 84, height: 84 }} resizeMode="cover" />
                ) : (
                  <Buildings2 size={34} color={colors.textMuted} variant="Outline" />
                )}
              </View>

              {/* Buttons */}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Pressable
                  onPress={handlePickLogo}
                  disabled={logoUploading}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    paddingVertical: 11,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundCard,
                    marginBottom: 8,
                  }}
                >
                  <Gallery size={16} color={colors.textPrimary} variant="Outline" />
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginLeft: 8 }}>
                    Escolher da galeria
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleTakePhoto}
                  disabled={logoUploading}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    paddingVertical: 11,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundCard,
                  }}
                >
                  <Camera size={16} color={colors.textPrimary} variant="Outline" />
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginLeft: 8 }}>
                    Tirar foto
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* INFORMAÇÕES */}
          <Text style={sectionLabel}>Informações</Text>
          <View style={card}>
            <FlatField
              label="Nome do estabelecimento"
              value={form.name}
              onChangeText={t => setForm(f => ({ ...f, name: t }))}
              placeholder="Ex: Barbearia Premium"
            />
            <FlatField
              label="Telefone / WhatsApp"
              value={form.phone}
              onChangeText={t => setForm(f => ({ ...f, phone: t }))}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
              icon={<Call size={16} color={colors.textMuted} variant="Outline" />}
            />
            <FlatField
              label="Endereço completo"
              value={form.address}
              onChangeText={t => setForm(f => ({ ...f, address: t }))}
              placeholder="Rua, número, bairro, cidade"
            />
            <FlatField
              label="CNPJ / CPF"
              value={form.cnpj}
              onChangeText={t => setForm(f => ({ ...f, cnpj: t.replace(/\D/g, '') }))}
              placeholder="00.000.000/0000-00"
              keyboardType="numeric"
            />
            <FlatField
              label="Instagram"
              value={form.instagram}
              onChangeText={t => setForm(f => ({ ...f, instagram: t.startsWith('@') ? t : `@${t.replace(/^@/, '')}` }))}
              placeholder="@seuperfil"
              icon={<Global size={16} color={colors.textMuted} variant="Outline" />}
            />
            <FlatField
              label="E-mail comercial"
              value={form.email}
              onChangeText={t => setForm(f => ({ ...f, email: t.toLowerCase() }))}
              placeholder="contato@exemplo.com"
              keyboardType="email-address"
              icon={<Sms size={16} color={colors.textMuted} variant="Outline" />}
              last
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={{
              backgroundColor: loading ? colors.primary + '80' : colors.primary,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              marginTop: 8,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {loading && <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />}
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Salvar dados</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const sectionLabel: object = {
  fontSize: 11,
  fontWeight: '700',
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 8,
  marginTop: 20,
  marginLeft: 4,
};

const card: object = {
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
};
