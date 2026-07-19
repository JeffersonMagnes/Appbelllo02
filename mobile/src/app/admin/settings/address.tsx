import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, SearchNormal1 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/state/auth-store';
import { useEstablishment, useUpdateEstablishment } from '@/lib/hooks/use-establishment';

export default function EditAddressScreen() {
  const router = useRouter();
  const currentUser = useAuthStore(s => s.currentUser);
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: establishment } = useEstablishment(currentUser?.id);
  const updateEstablishment = useUpdateEstablishment(establishmentId ?? '');

  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [form, setForm] = useState({
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  });

  // Carrega endereço real do Supabase
  React.useEffect(() => {
    if (establishment?.address) {
      // O endereço está armazenado como string completa; tenta parsear
      setForm(f => ({ ...f, street: establishment.address ?? '' }));
    }
  }, [establishment?.id]);

  const formatCEP = (value: string) => {
    const n = value.replace(/\D/g, '');
    return n.length <= 5 ? n : `${n.slice(0, 5)}-${n.slice(5, 8)}`;
  };

  const fetchAddressByCEP = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          street: data.logradouro || f.street,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
    finally { setLoadingCep(false); }
  };

  const handleCepChange = (text: string) => {
    const formatted = formatCEP(text);
    setForm(f => ({ ...f, cep: formatted }));
    if (formatted.replace(/\D/g, '').length === 8) fetchAddressByCEP(formatted);
  };

  const handleSave = async () => {
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Faça login novamente.');
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const fullAddress = [
        form.street,
        form.number && `nº ${form.number}`,
        form.complement,
        form.neighborhood,
        form.city && form.state ? `${form.city} - ${form.state}` : form.city || form.state,
        form.cep && `CEP ${form.cep}`,
      ].filter(Boolean).join(', ');

      await updateEstablishment.mutateAsync({ address: fullAddress } as any);
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
        <View className="flex-row items-center justify-between px-5 py-4">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.backgroundCard }}>
            <ArrowLeft size={20} color={colors.textPrimary}  variant="Outline" />
          </Pressable>
          <Text className="text-gray-900 font-bold text-lg">Endereço</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="pt-4">
            <Input label="CEP" value={form.cep} onChangeText={handleCepChange}
              placeholder="00000-000" keyboardType="numeric"
              icon={loadingCep
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <SearchNormal1 size={20} color={colors.textMuted}  variant="Outline" />}
            />
            <Input label="Rua / Logradouro" value={form.street}
              onChangeText={t => setForm(f => ({ ...f, street: t }))}
              placeholder="Nome da rua" autoCapitalize="words" />
            <View className="flex-row" style={{ gap: 12 }}>
              <View className="flex-1">
                <Input label="Número" value={form.number}
                  onChangeText={t => setForm(f => ({ ...f, number: t }))}
                  placeholder="123" keyboardType="numeric" />
              </View>
              <View style={{ flex: 2 }}>
                <Input label="Complemento" value={form.complement}
                  onChangeText={t => setForm(f => ({ ...f, complement: t }))}
                  placeholder="Sala 10" />
              </View>
            </View>
            <Input label="Bairro" value={form.neighborhood}
              onChangeText={t => setForm(f => ({ ...f, neighborhood: t }))}
              placeholder="Centro" autoCapitalize="words" />
            <View className="flex-row" style={{ gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Input label="Cidade" value={form.city}
                  onChangeText={t => setForm(f => ({ ...f, city: t }))}
                  placeholder="São Paulo" autoCapitalize="words" />
              </View>
              <View className="flex-1">
                <Input label="Estado" value={form.state}
                  onChangeText={t => setForm(f => ({ ...f, state: t.toUpperCase().slice(0, 2) }))}
                  placeholder="SP" autoCapitalize="characters" />
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="px-5 py-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button onPress={handleSave} loading={loading} fullWidth size="lg">
            Salvar endereço
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
