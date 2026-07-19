import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Calendar, Clock, User, Logout, ArrowRight2, TickCircle, InfoCircle, CloseCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/lib/state/auth-store';
import { toLocalDateStr } from '@/lib/utils/date';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useServices } from '@/lib/hooks/use-services';
import { useClients } from '@/lib/hooks/use-clients';
import { useEmployees } from '@/lib/hooks/use-employees';

export default function EmployeeHomeScreen() {
  const router = useRouter();
  const { currentUser, logout, hasPermission } = useAuthStore();
  const establishmentId = useAuthStore((s) => s.establishmentId);
  const [refreshing, setRefreshing] = useState(false);

  const { data: appointmentsData, isLoading: loadingAppointments } = useAppointments(establishmentId ?? undefined);
  const { data: servicesData, isLoading: loadingServices } = useServices(establishmentId ?? undefined);
  const { data: clientsData, isLoading: loadingClients } = useClients(establishmentId ?? undefined);
  const { data: employeesData, isLoading: loadingEmployees } = useEmployees(establishmentId ?? undefined);

  const allAppointments = appointmentsData ?? [];
  const allServices = servicesData ?? [];
  const allClients = clientsData ?? [];
  const allEmployees = employeesData ?? [];

  const isLoading = loadingAppointments || loadingServices || loadingClients || loadingEmployees;

  // Get employee data
  const employee = allEmployees.find((e) => e.id === currentUser?.employeeId);

  // Filter appointments for the logged-in employee only
  const employeeAppointments = allAppointments.filter(
    (a) => a.professionalId === currentUser?.employeeId
  );

  // Get today's appointments for this employee
  const today = toLocalDateStr();
  const todayAppointments = employeeAppointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Get upcoming appointments (next 7 days)
  const upcomingAppointments = employeeAppointments
    .filter((a) => {
      const appointmentDate = new Date(a.date);
      const todayDate = new Date(today);
      const weekLater = new Date(todayDate);
      weekLater.setDate(weekLater.getDate() + 7);
      return (
        appointmentDate > todayDate &&
        appointmentDate <= weekLater
      );
    })
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      case 'completed':
        return colors.secondary;
      default:
        return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <TickCircle size={16} color={colors.success}  variant="Outline" />;
      case 'pending':
        return <InfoCircle size={16} color={colors.warning} />;
      case 'cancelled':
        return <CloseCircle size={16} color={colors.error}  variant="Outline" />;
      case 'completed':
        return <TickCircle size={16} color={colors.secondary}  variant="Outline" />;
      default:
        return <Clock size={16} color={colors.textMuted}  variant="Outline" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
    router.replace('/login');
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderAppointmentCard = (appointment: (typeof allAppointments)[0], index: number, showDate = false) => {
    const service = allServices.find((s) => s.id === appointment.serviceId);
    const client = allClients.find((c) => c.id === appointment.clientId);

    return (
      <Animated.View
        key={appointment.id}
        entering={SlideInRight.delay(index * 100)}
        className="mb-3"
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Could navigate to appointment detail
          }}
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.backgroundCard }}
        >
          <View className="flex-row items-start">
            {/* Time */}
            <View
              className="w-16 h-16 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <Text style={{ color: colors.primary }} className="text-lg font-bold">
                {appointment.time}
              </Text>
              {showDate && (
                <Text style={{ color: colors.primary }} className="text-xs">
                  {formatDate(appointment.date).split(',')[0]}
                </Text>
              )}
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-base">
                {service?.name || 'Serviço'}
              </Text>
              <View className="flex-row items-center mt-1">
                <User size={14} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-500 text-sm ml-1">
                  {client?.name || 'Cliente'}
                </Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Clock size={14} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-500 text-sm ml-1">
                  {service?.duration || 30} min
                </Text>
              </View>
            </View>

            {/* Status */}
            <View className="items-end">
              <View
                className="flex-row items-center px-2 py-1 rounded-full"
                style={{ backgroundColor: getStatusColor(appointment.status) + '20' }}
              >
                {getStatusIcon(appointment.status)}
                <Text
                  style={{ color: getStatusColor(appointment.status) }}
                  className="text-xs font-medium ml-1"
                >
                  {getStatusLabel(appointment.status)}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View className="px-5 pt-2 pb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {employee?.avatar ? (
                  <Image
                    source={{ uri: employee.avatar }}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary + '30' }}
                  >
                    <User size={24} color={colors.primary}  variant="Outline" />
                  </View>
                )}
                <View className="ml-3">
                  <Text className="text-gray-500 text-sm">Olá,</Text>
                  <Text className="text-gray-900 text-xl font-bold">
                    {employee?.name || currentUser?.name || 'Funcionário'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleLogout}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <Logout size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Today's Stats */}
          <Animated.View entering={FadeInDown.delay(100)} className="px-5 mb-6">
            <View className="flex-row">
              <View className="flex-1 mr-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                <Calendar size={20} color={colors.secondary}  variant="Outline" />
                <Text style={{ color: colors.secondary }} className="text-3xl font-bold mt-2">
                  {todayAppointments.length}
                </Text>
                <Text className="text-gray-500 text-xs">Agendamentos hoje</Text>
              </View>
              <View className="flex-1 ml-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                <Clock size={20} color={colors.warning}  variant="Outline" />
                <Text style={{ color: colors.warning }} className="text-3xl font-bold mt-2">
                  {upcomingAppointments.length}
                </Text>
                <Text className="text-gray-500 text-xs">Próximos 7 dias</Text>
              </View>
            </View>
          </Animated.View>

          {/* Today's Appointments */}
          <Animated.View entering={FadeInDown.delay(200)} className="px-5 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 font-semibold text-lg">Agenda de Hoje</Text>
              <Text className="text-gray-500 text-sm">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>

            {todayAppointments.length > 0 ? (
              todayAppointments.map((appointment, index) => renderAppointmentCard(appointment, index))
            ) : (
              <View
                className="rounded-xl p-8 items-center"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <Calendar size={48} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-500 text-center mt-4">
                  Nenhum agendamento para hoje
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} className="px-5 mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 font-semibold text-lg">Próximos Dias</Text>
                <ArrowRight2 size={20} color={colors.textMuted}  variant="Outline" />
              </View>

              {upcomingAppointments.slice(0, 5).map((appointment, index) =>
                renderAppointmentCard(appointment, index, true)
              )}
            </Animated.View>
          )}

          {/* Permissions Notice */}
          <View className="px-5 mb-8">
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: colors.warning + '10', borderWidth: 1, borderColor: colors.warning + '30' }}
            >
              <View className="flex-row items-center">
                <InfoCircle size={20} color={colors.warning} />
                <Text className="text-gray-700 ml-3 flex-1">
                  Você está no modo funcionário com acesso limitado à agenda.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
