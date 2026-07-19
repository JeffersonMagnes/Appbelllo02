import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CloseCircle, ArrowLeft2, ArrowRight2, Clock, TickSquare, Star1, Add, User } from 'iconsax-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { colors } from '@/lib/theme';
import { generateTimeSlots } from '@/lib/mockData';
import { useServices } from '@/lib/hooks/use-services';
import { useEmployees } from '@/lib/hooks/use-employees';
import { useClients } from '@/lib/hooks/use-clients';
import { useCreateAppointment } from '@/lib/hooks/use-appointments';
import { useEstablishmentOrMock } from '@/lib/hooks/use-establishment';
import { useAuthStore } from '@/lib/state/auth-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toLocalDateStr, localDateFromStr } from '@/lib/utils/date';

// Day-of-week mapping: JS getDay() index -> hours_json key
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

type HoursEntry = { open: string; close: string; active: boolean };
type HoursJson = Record<string, HoursEntry>;

/**
 * Generate time slots based on the establishment's hours_json for the given date.
 * Falls back to the mock generator if no hours data is available.
 */
function generateTimeSlotsFromHours(
  date: Date,
  professionalId: string,
  hoursJson: HoursJson | null | undefined,
): { time: string; available: boolean }[] {
  if (!hoursJson) {
    // Fallback to mock if no hours configured
    return generateTimeSlots(date.toISOString(), professionalId);
  }

  const dayKey = DAY_KEYS[date.getDay()];
  const dayHours = hoursJson[dayKey];

  // If the day is not active (closed), return empty
  if (!dayHours || !dayHours.active) return [];

  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);
  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  const slots: { time: string; available: boolean }[] = [];
  for (let m = openMinutes; m < closeMinutes; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const time = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    // All slots are available by default; existing appointments will be filtered later
    slots.push({ time, available: true });
  }

  return slots;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type BookingStep = 'service' | 'professional' | 'datetime' | 'confirm';

export default function BookingScreen() {
  const router = useRouter();
  const { serviceId, date: prefilledDate, time: prefilledTime, professionalId: prefilledProfessionalId } = useLocalSearchParams<{
    serviceId?: string;
    date?: string;
    time?: string;
    professionalId?: string;
  }>();

  const establishmentId = useAuthStore(s => s.establishmentId);
  const currentUser = useAuthStore(s => s.currentUser);
  const { data: establishmentData } = useEstablishmentOrMock(currentUser?.id ?? undefined);
  const hoursJson = (establishmentData as any)?.hours_json as HoursJson | null | undefined;
  const { data: services = [] } = useServices(establishmentId ?? undefined);
  const { data: employeesList = [] } = useEmployees(establishmentId ?? undefined);
  const { data: clientsList = [] } = useClients(establishmentId ?? undefined);

  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  const professionals = (() => {
    const list = employeesList.filter(e => e.role === 'professional').map(e => ({
      id: e.id,
      name: e.name,
      avatar: e.avatar,
      specialty: e.specialty ?? '',
      rating: 0,
      reviewCount: 0,
      services: [] as string[],
    }));
    if (list.length === 0 && currentUser) {
      return [{
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar ?? '',
        specialty: 'Proprietário',
        rating: 0,
        reviewCount: 0,
        services: [] as string[],
      }];
    }
    return list;
  })();
  const createAppointment = useCreateAppointment();

  const [currentStep, setCurrentStep] = useState<BookingStep>(serviceId ? 'professional' : 'service');
  const [selectedService, setSelectedService] = useState<string | null>(serviceId || null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(prefilledProfessionalId || null);
  const [selectedDate, setSelectedDate] = useState<Date>(prefilledDate ? localDateFromStr(prefilledDate) : new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(prefilledTime || null);

  const service = services.find(s => s.id === selectedService);
  const professional = professionals.find(p => p.id === selectedProfessional);

  const availableProfessionals = useMemo(() => {
    return professionals;
  }, [professionals]);

  const timeSlots = useMemo(() => {
    if (!selectedProfessional || !selectedDate) return [];
    return generateTimeSlotsFromHours(selectedDate, selectedProfessional, hoursJson);
  }, [selectedProfessional, selectedDate, hoursJson]);

  // Generate dates for the next 30 days
  const dates = useMemo(() => {
    const result = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  const formatDateShort = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
    };
  };

  const goToNextStep = () => {
    if (currentStep === 'service' && selectedService) {
      setCurrentStep('professional');
    } else if (currentStep === 'professional' && selectedProfessional) {
      setCurrentStep('datetime');
    } else if (currentStep === 'datetime' && selectedTime) {
      setCurrentStep('confirm');
    }
  };

  const goToPrevStep = () => {
    if (currentStep === 'professional') {
      setCurrentStep('service');
    } else if (currentStep === 'datetime') {
      setCurrentStep('professional');
    } else if (currentStep === 'confirm') {
      setCurrentStep('datetime');
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      Alert.alert('Atenção', 'Informe o nome do cliente.');
      return;
    }
    if (!establishmentId || !isSupabaseConfigured()) return;
    setCreatingClient(true);
    try {
      const { data, error } = await supabase.from('clients').insert({
        establishment_id: establishmentId,
        name: newClientName.trim(),
        phone: newClientPhone.trim() || null,
      }).select('id').single();
      if (error) throw error;
      setSelectedClient(data.id);
      setShowNewClient(false);
      setNewClientName('');
      setNewClientPhone('');
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível cadastrar o cliente.');
    } finally {
      setCreatingClient(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedProfessional || !selectedTime) {
      Alert.alert('Atenção', 'Selecione serviço, profissional e horário.');
      return;
    }
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Faça login novamente.');
      return;
    }
    const dateStr = toLocalDateStr(selectedDate);
    if (isSupabaseConfigured()) {
      try {
        await createAppointment.mutateAsync({
          establishment_id: establishmentId,
          service_id: selectedService,
          employee_id: selectedProfessional,
          date: dateStr,
          time: selectedTime,
          status: 'pending',
          notes: null,
          client_id: selectedClient,
          client_name: selectedClient ? (clientsList.find(c => c.id === selectedClient)?.name ?? null) : null,
        });
        const svc = services.find(s => s.id === selectedService);
        const prof = employeesList.find(e => e.id === selectedProfessional);
        router.replace({
          pathname: '/booking-success',
          params: {
            service: svc?.name ?? '',
            professional: prof?.name ?? '',
            date: dateStr,
            time: selectedTime,
          },
        });
      } catch (e: any) {
        Alert.alert('Erro ao salvar', e?.message || 'Não foi possível criar o agendamento. Tente novamente.');
      }
    } else {
      router.back();
    }
  };

  const steps: { key: BookingStep; label: string }[] = [
    { key: 'service', label: 'Serviço' },
    { key: 'professional', label: 'Profissional' },
    { key: 'datetime', label: 'Data/Hora' },
    { key: 'confirm', label: 'Confirmar' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable
            onPress={() => (currentStepIndex > 0 ? goToPrevStep() : router.back())}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            {currentStepIndex > 0 ? (
              <ArrowLeft2 size={24} color={colors.textPrimary}  variant="Outline" />
            ) : (
              <CloseCircle size={22} color={colors.textPrimary}  variant="Outline" />
            )}
          </Pressable>
          <Text className="text-gray-900 text-lg font-semibold">Agendar</Text>
          <View className="w-10" />
        </View>

        {/* Progress Steps */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <View className="items-center">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{
                      backgroundColor:
                        index <= currentStepIndex ? colors.secondary : colors.backgroundCard,
                    }}
                  >
                    {index < currentStepIndex ? (
                      <TickSquare size={16} color={colors.background}  variant="Outline" />
                    ) : (
                      <Text
                        className="text-sm font-bold"
                        style={{
                          color: index <= currentStepIndex ? colors.background : colors.textMuted,
                        }}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    className="text-xs mt-1"
                    style={{
                      color: index <= currentStepIndex ? colors.textPrimary : colors.textMuted,
                    }}
                  >
                    {step.label}
                  </Text>
                </View>
                {index < steps.length - 1 && (
                  <View
                    className="flex-1 h-0.5 mx-2"
                    style={{
                      backgroundColor:
                        index < currentStepIndex ? colors.secondary : colors.backgroundCard,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Step: Service */}
          {currentStep === 'service' && (
            <Animated.View entering={FadeIn}>
              <Text className="text-gray-900 text-xl font-bold mb-4">
                Escolha o serviço
              </Text>
              {services.map((svc) => (
                <Pressable
                  key={svc.id}
                  onPress={() => setSelectedService(svc.id)}
                  className="mb-3 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: colors.backgroundCard,
                    borderWidth: selectedService === svc.id ? 2 : 0,
                    borderColor: colors.secondary,
                  }}
                >
                  <View className="p-4 flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold">{svc.name}</Text>
                      <Text className="text-gray-500 text-sm mt-1">{svc.description}</Text>
                      <View className="flex-row items-center mt-2">
                        <Clock size={14} color={colors.textMuted}  variant="Outline" />
                        <Text className="text-gray-500 text-xs ml-1">{svc.duration >= 60 ? `${Math.floor(svc.duration / 60)}h${svc.duration % 60 > 0 ? svc.duration % 60 + 'min' : ''}` : `${svc.duration}min`}</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.secondary }} className="font-bold text-lg">
                      R$ {svc.price.toFixed(2)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* Step: Professional */}
          {currentStep === 'professional' && (
            <Animated.View entering={FadeIn}>
              <Text className="text-gray-900 text-xl font-bold mb-4">
                Escolha o profissional
              </Text>
              {availableProfessionals.map((prof) => (
                <Pressable
                  key={prof.id}
                  onPress={() => setSelectedProfessional(prof.id)}
                  className="mb-3 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: colors.backgroundCard,
                    borderWidth: selectedProfessional === prof.id ? 2 : 0,
                    borderColor: colors.secondary,
                  }}
                >
                  <View className="p-4 flex-row items-center">
                    <Image
                      source={{ uri: prof.avatar }}
                      className="w-16 h-16 rounded-full mr-4"
                    />
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold text-base">{prof.name}</Text>
                      <Text className="text-gray-500 text-sm">{prof.specialty}</Text>
                      <View className="flex-row items-center mt-2">
                        <Star1 size={14} color="#FFB547" fill="#FFB547"  variant="Outline" />
                        <Text className="text-gray-700 text-sm ml-1">
                          {prof.rating} ({prof.reviewCount} avaliações)
                        </Text>
                      </View>
                    </View>
                    {selectedProfessional === prof.id && (
                      <View
                        className="w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.secondary }}
                      >
                        <TickSquare size={14} color={colors.background}  variant="Outline" />
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* Step: DateTime */}
          {currentStep === 'datetime' && (
            <Animated.View entering={FadeIn}>
              <Text className="text-gray-900 text-xl font-bold mb-4">
                Escolha data e horário
              </Text>

              {/* Date Selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-6"
                style={{ marginHorizontal: -20, paddingHorizontal: 20, flexGrow: 0 }}
              >
                {dates.map((date) => {
                  const formatted = formatDateShort(date);
                  const isSelected =
                    date.toDateString() === selectedDate.toDateString();
                  return (
                    <Pressable
                      key={date.toISOString()}
                      onPress={() => setSelectedDate(date)}
                      className="mr-3 items-center px-4 py-3 rounded-xl"
                      style={{
                        backgroundColor: isSelected ? colors.secondary : colors.backgroundCard,
                        minWidth: 70,
                      }}
                    >
                      <Text
                        className="text-xs uppercase"
                        style={{ color: isSelected ? colors.background : colors.textMuted }}
                      >
                        {formatted.day}
                      </Text>
                      <Text
                        className="text-xl font-bold mt-1"
                        style={{ color: isSelected ? colors.background : colors.textPrimary }}
                      >
                        {formatted.date}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: isSelected ? colors.background : colors.textMuted }}
                      >
                        {formatted.month}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Time Slots */}
              <Text className="text-gray-900 font-semibold mb-3">Horários disponíveis</Text>
              {timeSlots.length === 0 ? (
                <View className="py-8 items-center rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                  <Clock size={28} color={colors.textMuted} variant="Outline" />
                  <Text className="text-gray-500 text-sm mt-2 text-center px-6">
                    Estabelecimento fechado neste dia. Selecione outra data.
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap">
                  {timeSlots.map((slot) => (
                    <Pressable
                      key={slot.time}
                      onPress={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className="mr-2 mb-2 px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor:
                          selectedTime === slot.time
                            ? colors.secondary
                            : slot.available
                            ? colors.backgroundCard
                            : colors.backgroundLight,
                        opacity: slot.available ? 1 : 0.4,
                      }}
                    >
                      <Text
                        className="font-medium"
                        style={{
                          color:
                            selectedTime === slot.time
                              ? colors.background
                              : slot.available
                              ? colors.textPrimary
                              : colors.textMuted,
                        }}
                      >
                        {slot.time}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {/* Step: Confirm */}
          {currentStep === 'confirm' && service && professional && (
            <Animated.View entering={FadeInDown}>
              <Text className="text-gray-900 text-xl font-bold mb-4">
                Confirme seu agendamento
              </Text>

              {/* Client Selection */}
              <View className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="p-4">
                  <Text className="text-gray-500 text-xs uppercase mb-3">Cliente (opcional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View className="flex-row" style={{ gap: 8 }}>
                      <Pressable
                        onPress={() => setSelectedClient(null)}
                        className="px-4 py-2 rounded-xl"
                        style={{
                          backgroundColor: !selectedClient ? colors.primary : colors.backgroundLight,
                        }}
                      >
                        <Text style={{ color: !selectedClient ? '#fff' : colors.textMuted, fontWeight: '600', fontSize: 13 }}>
                          Sem cliente
                        </Text>
                      </Pressable>
                      {clientsList.map(c => (
                        <Pressable
                          key={c.id}
                          onPress={() => setSelectedClient(c.id)}
                          className="px-4 py-2 rounded-xl"
                          style={{
                            backgroundColor: selectedClient === c.id ? colors.primary : colors.backgroundLight,
                          }}
                        >
                          <Text style={{ color: selectedClient === c.id ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                            {c.name}
                          </Text>
                        </Pressable>
                      ))}
                      <Pressable
                        onPress={() => setShowNewClient(!showNewClient)}
                        className="px-4 py-2 rounded-xl flex-row items-center"
                        style={{ backgroundColor: colors.secondary + '20' }}
                      >
                        <Add size={16} color={colors.secondary} variant="Outline" />
                        <Text style={{ color: colors.secondary, fontWeight: '700', fontSize: 13, marginLeft: 4 }}>
                          Novo
                        </Text>
                      </Pressable>
                    </View>
                  </ScrollView>

                  {showNewClient && (
                    <View className="mt-3 p-3 rounded-xl" style={{ backgroundColor: colors.backgroundLight }}>
                      <TextInput
                        value={newClientName}
                        onChangeText={setNewClientName}
                        placeholder="Nome do cliente *"
                        placeholderTextColor={colors.textMuted}
                        className="p-3 rounded-lg mb-2"
                        style={{ backgroundColor: colors.backgroundCard, color: colors.textPrimary }}
                      />
                      <TextInput
                        value={newClientPhone}
                        onChangeText={setNewClientPhone}
                        placeholder="Telefone (opcional)"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        className="p-3 rounded-lg mb-3"
                        style={{ backgroundColor: colors.backgroundCard, color: colors.textPrimary }}
                      />
                      <Pressable
                        onPress={handleCreateClient}
                        disabled={creatingClient || !newClientName.trim()}
                        className="py-3 rounded-lg items-center"
                        style={{ backgroundColor: colors.secondary, opacity: creatingClient || !newClientName.trim() ? 0.5 : 1 }}
                      >
                        {creatingClient ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text className="text-white font-bold text-sm">Cadastrar Cliente</Text>
                        )}
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>

              <View
                className="rounded-xl overflow-hidden mb-6"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                {/* Service */}
                <View className="p-4 border-b" style={{ borderColor: colors.border }}>
                  <Text className="text-gray-500 text-xs uppercase mb-2">Serviço</Text>
                  <Text className="text-gray-900 font-semibold text-lg">{service.name}</Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={14} color={colors.textMuted}  variant="Outline" />
                    <Text className="text-gray-500 text-sm ml-1">{service.duration >= 60 ? `${Math.floor(service.duration / 60)}h${service.duration % 60 > 0 ? service.duration % 60 + 'min' : ''}` : `${service.duration}min`}</Text>
                  </View>
                </View>

                {/* Professional */}
                <View className="p-4 flex-row items-center" style={{ borderBottomWidth: 1, borderColor: colors.border }}>
                  <Image
                    source={{ uri: professional.avatar }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <View>
                    <Text className="text-gray-500 text-xs uppercase mb-1">Profissional</Text>
                    <Text className="text-gray-900 font-semibold">{professional.name}</Text>
                  </View>
                </View>

                {/* Date/Time */}
                <View className="p-4" style={{ borderBottomWidth: 1, borderColor: colors.border }}>
                  <Text className="text-gray-500 text-xs uppercase mb-2">Data e Horário</Text>
                  <Text className="text-gray-900 font-semibold">
                    {selectedDate.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                  <Text style={{ color: colors.secondary }} className="font-bold text-lg mt-1">
                    {selectedTime}
                  </Text>
                </View>

                {/* Total */}
                <View className="p-4 flex-row items-center justify-between">
                  <Text className="text-gray-500 text-sm">Total</Text>
                  <Text style={{ color: colors.secondary }} className="font-bold text-2xl">
                    R$ {service.price.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          <View className="h-32" />
        </ScrollView>

        {/* Bottom Button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4"
          style={{ backgroundColor: colors.background }}
        >
          <Pressable
            onPress={currentStep === 'confirm' ? handleConfirm : goToNextStep}
            disabled={
              (currentStep === 'service' && !selectedService) ||
              (currentStep === 'professional' && !selectedProfessional) ||
              (currentStep === 'datetime' && !selectedTime)
            }
            className="py-4 rounded-xl items-center"
            style={{
              backgroundColor:
                (currentStep === 'service' && !selectedService) ||
                (currentStep === 'professional' && !selectedProfessional) ||
                (currentStep === 'datetime' && !selectedTime)
                  ? colors.backgroundCard
                  : colors.primary,
            }}
          >
            <Text
              className="font-bold text-base"
              style={{
                color:
                  (currentStep === 'service' && !selectedService) ||
                  (currentStep === 'professional' && !selectedProfessional) ||
                  (currentStep === 'datetime' && !selectedTime)
                    ? colors.textMuted
                    : colors.textPrimary,
              }}
            >
              {currentStep === 'confirm' ? 'Confirmar Agendamento' : 'Continuar'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
