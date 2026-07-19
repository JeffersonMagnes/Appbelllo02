import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Call, Sms, Calendar, DocumentText, Edit, MessageCircle, Clock, ArrowRight2, ClipboardText, User, Heart, Warning2, Health, MagicStar, Scissor, Camera, Add, ImportCircle, Gift } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAnamnesisStore, PhotoComparison } from '@/lib/state/anamnesis-store';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { generateClientPDF } from '@/lib/utils/generate-client-pdf';
import { useAuthStore } from '@/lib/state/auth-store';
import { useClients } from '@/lib/hooks/use-clients';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useServices } from '@/lib/hooks/use-services';
import { useProfessionals } from '@/lib/hooks/use-professionals';
import type { ClientAnamnesis } from '@/lib/types';

export default function ClientDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'info' | 'anamnese' | 'history'>('info');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const establishmentId = useAuthStore((s) => s.establishmentId);
  const { filledAnamnesis, templates } = useAnamnesisStore();
  const { business, branding } = useOnboardingStore();

  const { data: clientsData, isLoading: loadingClients } = useClients(establishmentId ?? undefined);
  const { data: appointmentsData, isLoading: loadingAppointments } = useAppointments(establishmentId ?? undefined);
  const { data: servicesData, isLoading: loadingServices } = useServices(establishmentId ?? undefined);
  const { data: professionalsData, isLoading: loadingProfessionals } = useProfessionals(establishmentId ?? undefined);

  const allClients = clientsData ?? [];
  const allAppointments = appointmentsData ?? [];
  const allServices = servicesData ?? [];
  const allProfessionals = professionalsData ?? [];

  const isLoading = loadingClients || loadingAppointments || loadingServices || loadingProfessionals;

  const client = useMemo(
    () => allClients.find((c) => c.id === params.id),
    [params.id, allClients]
  );

  // Kept only for compatibility with clients that may receive the legacy shape.
  const legacyAnamnesis = null as ClientAnamnesis | null;

  const newAnamnesis = useMemo(
    () => filledAnamnesis.filter((a) => a.clientId === params.id),
    [params.id, filledAnamnesis]
  );

  const clientAppointments = useMemo(
    () => allAppointments.filter((a) => a.clientId === params.id),
    [params.id, allAppointments]
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text className="text-gray-900">Cliente não encontrado</Text>
      </View>
    );
  }

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${client.phone.replace(/\D/g, '')}`);
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const phone = client.phone.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=55${phone}`);
  };

  const handleEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${client.email}`);
  };

  const handleBirthdayNotification = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!client?.birthDate) {
      Alert.alert('Data não cadastrada', 'Este cliente não tem data de nascimento cadastrada.');
      return;
    }

    const businessName = business.businessName || 'nossa equipe';
    const message = `Olá ${client.name}! 🎉\n\nNós da ${businessName} desejamos um Feliz Aniversário! 🎂🎈\n\nQue seu dia seja muito especial. Como presente, preparamos uma condição especial para você neste mês de aniversário. Venha nos visitar!\n\nAbraços!`;

    Alert.alert('Notificação de Aniversário', 'Deseja enviar a mensagem de parabéns via WhatsApp?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Copiar Texto', 
        onPress: () => {
          Alert.alert('Texto da Mensagem', message);
        }
      },
      {
        text: 'Enviar no WhatsApp',
        onPress: () => {
          const phone = client.phone.replace(/\D/g, '');
          Linking.openURL(`whatsapp://send?phone=55${phone}&text=${encodeURIComponent(message)}`);
        }
      }
    ]);
  };

  const handleNewAnamnesis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/admin/anamnesis-templates',
      params: {
        clientId: client.id,
        clientName: client.name,
      },
    });
  };

  const handleExportPDF = async () => {
    if (!client) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingPDF(true);
    try {
      await generateClientPDF({
        client,
        legacyAnamnesis,
        filledAnamnesis: newAnamnesis,
        templates,
        businessName: business.businessName || 'Appbello',
        businessLogo: branding.logoUrl || '',
        primaryColor: branding.primaryColor || '#5333ed',
      });
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getServiceName = (serviceId: string) => {
    return allServices.find((s) => s.id === serviceId)?.name || 'Serviço';
  };

  const getProfessionalName = (professionalId: string) => {
    return allProfessionals.find((p) => p.id === professionalId)?.name || 'Profissional';
  };

  const TabButton = ({ tab, label }: { tab: 'info' | 'anamnese' | 'history'; label: string }) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveTab(tab);
      }}
      className="flex-1 py-3 items-center"
      style={{
        borderBottomWidth: 2,
        borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
      }}
    >
      <Text
        className="font-medium"
        style={{ color: activeTab === tab ? colors.primary : colors.textMuted }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary + '18', colors.background]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center justify-between">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={20} color={colors.textPrimary}  variant="Outline" />
          </Pressable>
          <Text className="text-gray-900 font-bold text-lg">Detalhes do Cliente</Text>
          <Pressable
            onPress={handleExportPDF}
            disabled={generatingPDF}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.06)', opacity: generatingPDF ? 0.6 : 1 }}
          >
            {generatingPDF
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <ImportCircle size={18} color={colors.textPrimary} />
            }
          </Pressable>
        </View>

        {/* Profile Card */}
        <Animated.View
          entering={FadeIn.duration(400)}
          className="px-5 mb-4"
        >
          <View
            className="rounded-2xl p-5 items-center"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            {client.avatar ? (
              <Image
                source={{ uri: client.avatar }}
                className="w-24 h-24 rounded-full mb-4"
              />
            ) : (
              <View
                className="w-24 h-24 rounded-full mb-4 items-center justify-center"
                style={{ backgroundColor: colors.primary + '30' }}
              >
                <User size={40} color={colors.primary}  variant="Outline" />
              </View>
            )}

            <Text className="text-gray-900 font-bold text-xl mb-1">{client.name}</Text>

            {client.birthDate && (
              <Text className="text-gray-500 text-sm mb-4">
                {calculateAge(client.birthDate)} anos
              </Text>
            )}

            {/* Quick Actions */}
            <View className="flex-row justify-center gap-3 w-full px-2">
              <Pressable
                onPress={handleCall}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.success + '20' }}
              >
                <Call size={20} color={colors.success} />
              </Pressable>
              <Pressable
                onPress={handleWhatsApp}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: '#25D366' + '20' }}
              >
                <MessageCircle size={20} color="#25D366"  variant="Outline" />
              </Pressable>
              <Pressable
                onPress={handleEmail}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.info + '20' }}
              >
                <Sms size={20} color={colors.info}  variant="Outline" />
              </Pressable>
              <Pressable
                onPress={handleBirthdayNotification}
                className="w-12 h-12 rounded-full items-center justify-center relative"
                style={{ backgroundColor: '#FFB547' + '20' }}
              >
                <Gift size={20} color="#FFB547" />
                {client.birthDate && (calculateAge(client.birthDate) % 1 === 0) && new Date().getMonth() === new Date(client.birthDate).getMonth() && (
                  <View className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: colors.error }} />
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Tabs */}
        <View
          className="flex-row mx-5 mb-4 rounded-xl overflow-hidden"
          style={{ backgroundColor: colors.backgroundCard }}
        >
          <TabButton tab="info" label="Informações" />
          <TabButton tab="anamnese" label="Anamnese" />
          <TabButton tab="history" label="Histórico" />
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Info Tab */}
          {activeTab === 'info' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {/* Contact Info */}
              <View
                className="rounded-2xl p-4 mb-4"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                  Contato
                </Text>

                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.surface }}>
                    <Call size={18} color={colors.textMuted} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-xs">Telefone</Text>
                    <Text className="text-gray-900 font-medium">{client.phone}</Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.surface }}>
                    <Sms size={18} color={colors.textMuted}  variant="Outline" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-xs">E-mail</Text>
                    <Text className="text-gray-900 font-medium">{client.email}</Text>
                  </View>
                </View>

                {client.birthDate && (
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.surface }}>
                      <Calendar size={18} color={colors.textMuted}  variant="Outline" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 text-xs">Data de Nascimento</Text>
                      <Text className="text-gray-900 font-medium">
                        {formatDate(client.birthDate)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Notes */}
              {client.notes && (
                <View
                  className="rounded-2xl p-4 mb-4"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                    Observações
                  </Text>
                  <View className="flex-row items-start">
                    <DocumentText size={18} color={colors.warning}  variant="Outline" />
                    <Text className="text-gray-700 ml-3 flex-1">{client.notes}</Text>
                  </View>
                </View>
              )}

              {/* Stats */}
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                  Estatísticas
                </Text>
                <View className="flex-row">
                  <View className="flex-1 items-center py-2">
                    <Text className="text-2xl font-bold" style={{ color: colors.secondary }}>
                      {clientAppointments.length}
                    </Text>
                    <Text className="text-gray-500 text-xs">Atendimentos</Text>
                  </View>
                  <View className="w-px" style={{ backgroundColor: colors.border }} />
                  <View className="flex-1 items-center py-2">
                    <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {newAnamnesis.length + (legacyAnamnesis ? 1 : 0)}
                    </Text>
                    <Text className="text-gray-500 text-xs">Fichas</Text>
                  </View>
                  <View className="w-px" style={{ backgroundColor: colors.border }} />
                  <View className="flex-1 items-center py-2">
                    <Text className="text-2xl font-bold" style={{ color: colors.success }}>
                      {formatDate(client.createdAt).split(' ')[0]}
                    </Text>
                    <Text className="text-gray-500 text-xs">Cliente desde</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Anamnese Tab */}
          {activeTab === 'anamnese' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <Pressable
                  onPress={handleNewAnamnesis}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: colors.primary,
                  }}
                >
                  <Add size={18} color="#fff"  variant="Outline" />
                  <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 }}>
                    Nova Ficha
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleExportPDF}
                  disabled={generatingPDF}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: colors.backgroundCard,
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.08)',
                    opacity: generatingPDF ? 0.6 : 1,
                  }}
                >
                  {generatingPDF
                    ? <ActivityIndicator size="small" color={colors.secondary} />
                    : <>
                        <ImportCircle size={18} color={colors.secondary} />
                        <Text style={{ color: colors.secondary, fontWeight: '700', marginLeft: 6, fontSize: 14 }}>
                          PDF
                        </Text>
                      </>
                  }
                </Pressable>
              </View>

              {/* Legacy Anamnesis (from mockData) */}
              {legacyAnamnesis && (
                <View
                  className="rounded-2xl p-4 mb-4"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-gray-900 font-semibold">Ficha Geral</Text>
                    <Text className="text-gray-400 text-xs">
                      Atualizado em {formatDate(legacyAnamnesis.lastUpdate)}
                    </Text>
                  </View>

                  {legacyAnamnesis.allergies && (
                    <View className="flex-row items-start mb-3">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: colors.error + '20' }}
                      >
                        <Warning2 size={16} color={colors.error}  variant="Outline" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 text-xs">Alergias</Text>
                        <Text className="text-gray-900">{legacyAnamnesis.allergies}</Text>
                      </View>
                    </View>
                  )}

                  {legacyAnamnesis.medications && (
                    <View className="flex-row items-start mb-3">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: colors.warning + '20' }}
                      >
                        <Health size={16} color={colors.warning} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 text-xs">Medicamentos</Text>
                        <Text className="text-gray-900">{legacyAnamnesis.medications}</Text>
                      </View>
                    </View>
                  )}

                  {legacyAnamnesis.skinType && (
                    <View className="flex-row items-start mb-3">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: colors.info + '20' }}
                      >
                        <MagicStar size={16} color={colors.info}  variant="Outline" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 text-xs">Tipo de Pele</Text>
                        <Text className="text-gray-900">{legacyAnamnesis.skinType}</Text>
                      </View>
                    </View>
                  )}

                  {legacyAnamnesis.hairType && (
                    <View className="flex-row items-start mb-3">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: colors.secondary + '20' }}
                      >
                        <Scissor size={16} color={colors.secondary}  variant="Outline" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 text-xs">Tipo de Cabelo</Text>
                        <Text className="text-gray-900">{legacyAnamnesis.hairType}</Text>
                      </View>
                    </View>
                  )}

                  {legacyAnamnesis.preferences && (
                    <View className="flex-row items-start mb-3">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: colors.success + '20' }}
                      >
                        <Heart size={16} color={colors.success} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 text-xs">Preferências</Text>
                        <Text className="text-gray-900">{legacyAnamnesis.preferences}</Text>
                      </View>
                    </View>
                  )}

                  {legacyAnamnesis.observations && (
                    <View className="flex-row items-start">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: colors.primary + '20' }}
                      >
                        <DocumentText size={16} color={colors.primary}  variant="Outline" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-400 text-xs">Observações</Text>
                        <Text className="text-gray-900">{legacyAnamnesis.observations}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* New Anamnesis Cards */}
              {newAnamnesis.map((anamnesis, index) => {
                const photos = anamnesis.data.fotos as PhotoComparison | undefined;
                const hasPhotos = photos && (photos.before?.length > 0 || photos.after?.length > 0);

                return (
                  <Animated.View
                    key={anamnesis.id}
                    entering={FadeInDown.duration(300).delay(index * 50)}
                  >
                    <View
                      className="rounded-2xl p-4 mb-4"
                      style={{ backgroundColor: colors.backgroundCard }}
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          <View
                            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: colors.primary + '20' }}
                          >
                            <ClipboardText size={20} color={colors.primary} />
                          </View>
                          <View>
                            <Text className="text-gray-900 font-semibold">
                              {anamnesis.templateName}
                            </Text>
                            <Text className="text-gray-400 text-xs">
                              {formatDate(anamnesis.filledAt)}
                            </Text>
                          </View>
                        </View>
                        <ArrowRight2 size={18} color={colors.textMuted}  variant="Outline" />
                      </View>

                      {/* Photos Preview */}
                      {hasPhotos && (
                        <View className="mt-2">
                          <View className="flex-row items-center mb-2">
                            <Camera size={14} color={colors.textMuted} />
                            <Text className="text-gray-400 text-xs ml-1">
                              Fotos comparativas
                            </Text>
                          </View>
                          <View className="flex-row gap-2">
                            {photos?.before?.slice(0, 2).map((uri, idx) => (
                              <View key={`before-${idx}`} className="relative">
                                <Image
                                  source={{ uri }}
                                  className="w-16 h-16 rounded-lg"
                                  resizeMode="cover"
                                />
                                <View
                                  className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: colors.warning }}
                                >
                                  <Text className="text-white text-xs font-bold">A</Text>
                                </View>
                              </View>
                            ))}
                            {photos?.after?.slice(0, 2).map((uri, idx) => (
                              <View key={`after-${idx}`} className="relative">
                                <Image
                                  source={{ uri }}
                                  className="w-16 h-16 rounded-lg"
                                  resizeMode="cover"
                                />
                                <View
                                  className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: colors.success }}
                                >
                                  <Text className="text-white text-xs font-bold">D</Text>
                                </View>
                              </View>
                            ))}
                            {((photos?.before?.length || 0) + (photos?.after?.length || 0)) > 4 && (
                              <View
                                className="w-16 h-16 rounded-lg items-center justify-center"
                                style={{ backgroundColor: colors.surface }}
                              >
                                <Text className="text-gray-400 text-sm">
                                  +{(photos?.before?.length || 0) + (photos?.after?.length || 0) - 4}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}

              {/* Empty State */}
              {!legacyAnamnesis && newAnamnesis.length === 0 && (
                <View className="items-center py-10">
                  <ClipboardText size={48} color={colors.textMuted} />
                  <Text className="text-gray-400 text-base mt-4">
                    Nenhuma ficha de anamnese
                  </Text>
                  <Text className="text-gray-300 text-sm mt-1">
                    Adicione uma ficha para registrar informações do cliente
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {clientAppointments.length > 0 ? (
                clientAppointments.map((appointment, index) => (
                  <Animated.View
                    key={appointment.id}
                    entering={FadeInDown.duration(300).delay(index * 50)}
                  >
                    <View
                      className="rounded-2xl p-4 mb-3"
                      style={{ backgroundColor: colors.backgroundCard }}
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 font-semibold">
                          {getServiceName(appointment.serviceId)}
                        </Text>
                        <View
                          className="px-2 py-1 rounded"
                          style={{
                            backgroundColor:
                              appointment.status === 'completed'
                                ? colors.success + '20'
                                : appointment.status === 'cancelled'
                                ? colors.error + '20'
                                : colors.warning + '20',
                          }}
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{
                              color:
                                appointment.status === 'completed'
                                  ? colors.success
                                  : appointment.status === 'cancelled'
                                  ? colors.error
                                  : colors.warning,
                            }}
                          >
                            {appointment.status === 'completed'
                              ? 'Concluído'
                              : appointment.status === 'cancelled'
                              ? 'Cancelado'
                              : 'Agendado'}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center">
                        <Calendar size={14} color={colors.textMuted}  variant="Outline" />
                        <Text className="text-gray-500 text-sm ml-2">
                          {formatDate(appointment.date)}
                        </Text>
                        <View className="w-1 h-1 rounded-full mx-2" style={{ backgroundColor: colors.border }} />
                        <Clock size={14} color={colors.textMuted}  variant="Outline" />
                        <Text className="text-gray-500 text-sm ml-2">
                          {appointment.time}
                        </Text>
                      </View>

                      <View className="flex-row items-center mt-2">
                        <User size={14} color={colors.textMuted}  variant="Outline" />
                        <Text className="text-gray-500 text-sm ml-2">
                          {getProfessionalName(appointment.professionalId)}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                ))
              ) : (
                <View className="items-center py-10">
                  <Calendar size={48} color={colors.textMuted}  variant="Outline" />
                  <Text className="text-gray-400 text-base mt-4">
                    Nenhum atendimento registrado
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
