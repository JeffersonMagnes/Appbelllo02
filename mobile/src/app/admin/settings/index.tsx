import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, ArrowRight2, Buildings2, Location, Colorfilter, Clock,
  Profile2User, Card, Global, CloseCircle, Setting2, User, Shield, Chart2, Layer, Trash,
} from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/state/auth-store';
import { useEstablishment } from '@/lib/hooks/use-establishment';
import { supabase } from '@/lib/supabase';
import { seedDemoData, clearDemoData, checkHasDemoData } from '@/lib/demo-data';
import { useQueryClient } from '@tanstack/react-query';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
}

const SettingsRow = ({ icon, label, subtitle, onPress, danger }: SettingsRowProps) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center px-4 py-4 active:opacity-70"
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 13,
        backgroundColor: danger ? colors.error + '15' : colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}
    >
      {icon}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: danger ? colors.error : colors.textPrimary, fontWeight: '700', fontSize: 15 }}>
        {label}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
        {subtitle}
      </Text>
    </View>
    <ArrowRight2 size={18} color={danger ? colors.error + '80' : colors.textMuted} variant="Outline" />
  </Pressable>
);

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

const Section = ({ label, children }: SectionProps) => (
  <View style={{ marginBottom: 28 }}>
    <Text style={{
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
      marginLeft: 4,
    }}>
      {label}
    </Text>
    <View style={{
      backgroundColor: colors.backgroundCard,
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    }}>
      {children}
    </View>
  </View>
);

const Divider = () => (
  <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 72 }} />
);

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const currentUser = useAuthStore(s => s.currentUser);
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: establishment } = useEstablishment(currentUser?.id);
  const queryClient = useQueryClient();
  const [hasDemoData, setHasDemoData] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (establishmentId) {
      checkHasDemoData(supabase as any, establishmentId).then(setHasDemoData);
    }
  }, [establishmentId]);

  const handleDemoData = async () => {
    if (!establishmentId) return;
    const action = hasDemoData ? 'limpar' : 'preencher';
    Alert.alert(
      hasDemoData ? 'Limpar dados de exemplo' : 'Dados de exemplo',
      hasDemoData
        ? 'Isso vai remover todos os dados de exemplo. Dados reais não serão afetados. Continuar?'
        : 'Isso vai preencher o app com dados fictícios para exploração. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: hasDemoData ? 'Limpar' : 'Preencher',
          style: hasDemoData ? 'destructive' : 'default',
          onPress: async () => {
            setDemoLoading(true);
            try {
              if (hasDemoData) {
                await clearDemoData(supabase as any, establishmentId);
                setHasDemoData(false);
              } else {
                await seedDemoData(supabase as any, establishmentId);
                setHasDemoData(true);
              }
              queryClient.invalidateQueries();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sucesso', hasDemoData ? 'Dados de exemplo removidos.' : 'Dados de exemplo inseridos!');
            } catch {
              Alert.alert('Erro', `Não foi possível ${action} dados de exemplo.`);
            } finally {
              setDemoLoading(false);
            }
          },
        },
      ]
    );
  };

  const go = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  const estName = establishment?.name ?? currentUser?.name ?? 'Meu Estabelecimento';

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
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary, lineHeight: 24 }}>
              Configurações
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
            <Setting2 size={22} color={colors.primary} variant="Outline" />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* CONTA */}
          <Section label="Conta">
            <SettingsRow
              icon={<User size={20} color={colors.primary} variant="Outline" />}
              label="Meu Perfil"
              subtitle="Alterar dados pessoais"
              onPress={() => go('/(tabs)/profile')}
            />
            <Divider />
            <SettingsRow
              icon={<Colorfilter size={20} color={colors.primary} variant="Outline" />}
              label="Identidade Visual"
              subtitle="Logo e cores do aplicativo"
              onPress={() => go('/admin/settings/branding')}
            />
          </Section>

          {/* ESTABELECIMENTO */}
          <Section label="Estabelecimento">
            <SettingsRow
              icon={<Buildings2 size={20} color={colors.primary} variant="Outline" />}
              label="Dados do Negócio"
              subtitle="Nome, telefone e endereço"
              onPress={() => go('/admin/settings/business')}
            />
            <Divider />
            <SettingsRow
              icon={<Clock size={20} color={colors.primary} variant="Outline" />}
              label="Horários de Atendimento"
              subtitle="Funcionamento e intervalos"
              onPress={() => go('/admin/settings/hours')}
            />
            <Divider />
            <SettingsRow
              icon={<Location size={20} color={colors.primary} variant="Outline" />}
              label="Endereço"
              subtitle="Localização do estabelecimento"
              onPress={() => go('/admin/settings/address')}
            />
            <Divider />
            <SettingsRow
              icon={<Global size={20} color={colors.primary} variant="Outline" />}
              label="Link de Agendamento"
              subtitle="Link público para clientes"
              onPress={() => go('/admin/booking-link')}
            />
          </Section>

          {/* FINANCEIRO */}
          <Section label="Financeiro">
            <SettingsRow
              icon={<Chart2 size={20} color={colors.primary} variant="Outline" />}
              label="Meta Mensal"
              subtitle="Lucro alvo por mês"
              onPress={() => go('/admin/settings/goals')}
            />
          </Section>

          {/* EQUIPE */}
          <Section label="Equipe">
            <SettingsRow
              icon={<Profile2User size={20} color={colors.primary} variant="Outline" />}
              label="Profissionais"
              subtitle="Gerenciar equipe e cargos"
              onPress={() => go('/admin/employees')}
            />
            <Divider />
            <SettingsRow
              icon={<Shield size={20} color={colors.primary} variant="Outline" />}
              label="Permissões por Cargo"
              subtitle="Defina o que cada cargo pode acessar"
              onPress={() => go('/admin/settings/permissions')}
            />
            <Divider />
            <SettingsRow
              icon={<Card size={20} color={colors.primary} variant="Outline" />}
              label="Taxas de Pagamento"
              subtitle="Crédito, débito e PIX"
              onPress={() => go('/admin/settings/payment-fees')}
            />
          </Section>

          {/* DADOS DE EXEMPLO */}
          <Section label="Dados de Exemplo">
            <Pressable
              onPress={handleDemoData}
              disabled={demoLoading}
              className="flex-row items-center px-4 py-4 active:opacity-70"
            >
              <View style={{
                width: 44, height: 44, borderRadius: 13,
                backgroundColor: hasDemoData ? colors.error + '15' : colors.primary + '15',
                alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>
                {demoLoading ? (
                  <ActivityIndicator size="small" color={hasDemoData ? colors.error : colors.primary} />
                ) : hasDemoData ? (
                  <Trash size={20} color={colors.error} variant="Outline" />
                ) : (
                  <Layer size={20} color={colors.primary} variant="Outline" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: hasDemoData ? colors.error : colors.textPrimary, fontWeight: '700', fontSize: 15 }}>
                  {hasDemoData ? 'Limpar dados de exemplo' : 'Preencher com exemplos'}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {hasDemoData ? 'Remove os dados fictícios inseridos' : 'Explore o app com dados fictícios'}
                </Text>
              </View>
              <ArrowRight2 size={18} color={hasDemoData ? colors.error + '80' : colors.textMuted} variant="Outline" />
            </Pressable>
          </Section>

          {/* ZONA DE PERIGO */}
          <Section label="Zona de Perigo">
            <SettingsRow
              icon={<CloseCircle size={20} color={colors.error} variant="Outline" />}
              label="Desativar estabelecimento"
              subtitle="Suspende temporariamente os agendamentos"
              danger
              onPress={() =>
                Alert.alert(
                  'Desativar estabelecimento',
                  'Isso irá suspender temporariamente os agendamentos. Deseja continuar?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Desativar', style: 'destructive' },
                  ]
                )
              }
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
