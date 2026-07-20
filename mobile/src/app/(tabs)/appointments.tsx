import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ConfirmModal, useToast, NoAppointments } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '@/lib/theme';
import { Appointment } from '@/lib/types';
import { useAppointments, useUpdateAppointmentStatus, useRescheduleAppointment } from '@/lib/hooks/use-appointments';
import { useServices } from '@/lib/hooks/use-services';
import { useClients } from '@/lib/hooks/use-clients';
import { useEmployees } from '@/lib/hooks/use-employees';
import { useAuthStore } from '@/lib/state/auth-store';
import { useBlockedSlots, useCreateBlockedSlot, useDeleteBlockedSlot, type BlockedSlot } from '@/lib/hooks/use-blocked-slots';
import { useEstablishmentOrMock } from '@/lib/hooks/use-establishment';
import { toLocalDateStr } from '@/lib/utils/date';
import { getDayHours } from '@/lib/utils/business-hours';
import { formatMonthYear, formatYear } from '@/lib/utils/agenda-calendar';
import { useAgendaFilters, type AgendaViewMode as ViewMode } from '@/lib/hooks/use-agenda-filters';
import { APPOINTMENT_STATUS_LABEL } from '@/lib/appointment-status';
import * as Haptics from 'expo-haptics';
import { DayTimelineGrid } from '@/components/agenda-timeline-grid';
import { WeekOverviewModal } from '@/components/agenda-week-overview';
import { OnlineAppointmentsModal } from '@/components/agenda-online-modal';
import { AgendaHeader } from '@/components/agenda-header';
import { AgendaMonthView } from '@/components/agenda-month-view';
import { AgendaYearView } from '@/components/agenda-year-view';
import { ProfessionalFilterBar } from '@/components/agenda-professional-filter';
import { AgendaItemsList } from '@/components/agenda-items-list';
import { AppointmentDetailModal } from '@/components/agenda-detail-modal';
import { BlockSlotModal } from '@/components/agenda-block-modal';

export default function AgendaScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showWeekOverview, setShowWeekOverview] = useState(false);
  const [weekOverviewAnchor, setWeekOverviewAnchor] = useState(new Date());
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [aptPayment, setAptPayment] = useState<string>('');
  const [aptStatus, setAptStatus] = useState<string>('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockEmployeeId, setBlockEmployeeId] = useState<string | null>(null);
  const [showDeleteBlockConfirm, setShowDeleteBlockConfirm] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<BlockedSlot | null>(null);
  const [editingDateTime, setEditingDateTime] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const { show: showToast, ToastComponent } = useToast();

  const establishmentId = useAuthStore(s => s.establishmentId);
  const currentUser = useAuthStore(s => s.currentUser);
  const { data: establishmentData } = useEstablishmentOrMock(currentUser?.id ?? undefined);
  const hoursJson = (establishmentData as any)?.hours_json as Record<string, { open: string; close: string; active: boolean }> | null | undefined;
  const { data: appointments = [] } = useAppointments(establishmentId ?? undefined);
  const { data: servicesList = [] } = useServices(establishmentId ?? undefined);
  const { data: clientsList = [] } = useClients(establishmentId ?? undefined);
  const { data: employeesList = [] } = useEmployees(establishmentId ?? undefined);
  const updateStatus = useUpdateAppointmentStatus();
  const reschedule = useRescheduleAppointment();
  const { data: blockedSlots = [] } = useBlockedSlots(establishmentId ?? undefined);
  const createBlock = useCreateBlockedSlot();
  const deleteBlock = useDeleteBlockedSlot();

  const { filteredAppointments, mergedItems, gridAppointments, gridBlockedSlots } = useAgendaFilters(
    appointments,
    blockedSlots,
    selectedDate,
    selectedProfessional,
    viewMode,
  );

  const openAppointmentDetail = (apt: Appointment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAppointment(apt);
    setAptStatus(apt.status);
    setAptPayment('');
    setEditingDateTime(false);
    setEditDate(apt.date);
    setEditTime(apt.time);
    setShowDetailModal(true);
  };

  const openBlockModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBlockDate(toLocalDateStr(selectedDate));
    setBlockStartTime('');
    setBlockEndTime('');
    setBlockReason('');
    setBlockEmployeeId(null);
    setShowBlockModal(true);
  };

  const handleCreateBlock = () => {
    if (!establishmentId) return;
    if (!blockDate || !blockStartTime || !blockEndTime) {
      showToast('Preencha data, hora início e hora fim.', 'warning');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createBlock.mutate(
      {
        establishment_id: establishmentId,
        employee_id: blockEmployeeId,
        date: blockDate,
        start_time: blockStartTime,
        end_time: blockEndTime,
        reason: blockReason || null,
      },
      {
        onSuccess: () => {
          setShowBlockModal(false);
          showToast('Horário bloqueado com sucesso!', 'success');
        },
        onError: () => {
          showToast('Erro ao bloquear horário.', 'error');
        },
      },
    );
  };

  const handleDeleteBlock = (slot: BlockedSlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBlockToDelete(slot);
    setShowDeleteBlockConfirm(true);
  };

  const confirmDeleteBlock = () => {
    if (!blockToDelete || !establishmentId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deleteBlock.mutate(
      { id: blockToDelete.id, establishmentId },
      {
        onSuccess: () => {
          setShowDeleteBlockConfirm(false);
          setBlockToDelete(null);
          showToast('Bloqueio removido.', 'info');
        },
        onError: () => {
          showToast('Erro ao remover bloqueio.', 'error');
        },
      },
    );
  };

  const weekOverviewStart = useMemo(() => {
    const d = new Date(weekOverviewAnchor);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [weekOverviewAnchor]);

  const openWeekOverview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeekOverviewAnchor(selectedDate);
    setShowWeekOverview(true);
  };

  const navigateWeekOverview = (direction: 'prev' | 'next') => {
    setWeekOverviewAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
      return d;
    });
  };

  const handleTimelineSlotPress = (time: string) => {
    const params: Record<string, string> = {
      date: toLocalDateStr(selectedDate),
      time,
    };
    if (selectedProfessional) params.professionalId = selectedProfessional;
    router.push({ pathname: '/booking', params });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnimationDirection(direction === 'next' ? 'right' : 'left');
    const newDate = new Date(selectedDate);

    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setViewMode(mode);
  };

  const handleAgendaModeSelect = (key: ViewMode | 'week') => {
    if (key === 'week') {
      openWeekOverview();
    } else {
      handleViewModeChange(key);
    }
  };

  const professionals = employeesList.filter((e) => e.role === 'professional' && e.active);

  const getNavigationTitle = () => {
    if (viewMode === 'year') return formatYear(selectedDate);
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' });
    }
    return formatMonthYear(selectedDate);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <AgendaHeader
          appointmentsCount={filteredAppointments.length}
          onOpenOnline={() => setShowOnlineModal(true)}
          onOpenBlock={openBlockModal}
          onNew={() => router.push('/booking')}
          viewMode={viewMode}
          onSelectMode={handleAgendaModeSelect}
          selectedDate={selectedDate}
          navigationTitle={getNavigationTitle()}
          onNavigate={navigateDate}
          onGoToday={() => setSelectedDate(new Date())}
        />

        {/* Month View */}
        {viewMode === 'month' && (
          <AgendaMonthView
            selectedDate={selectedDate}
            appointments={appointments}
            clientsList={clientsList}
            servicesList={servicesList}
            onSelectDate={setSelectedDate}
            onSelectAppointment={openAppointmentDetail}
          />
        )}

        {/* Year View */}
        {viewMode === 'year' && (
          <AgendaYearView
            selectedDate={selectedDate}
            appointments={appointments}
            onSelectMonth={(date) => { setSelectedDate(date); setViewMode('month'); }}
          />
        )}

        {/* Professional Filter */}
        <ProfessionalFilterBar
          professionals={professionals}
          selectedProfessional={selectedProfessional}
          onSelect={setSelectedProfessional}
        />

        {/* Selected Date Info */}
        {viewMode !== 'year' && (
          <View className="px-5 mb-3">
            <Text className="text-gray-900 font-bold text-base">
              {selectedDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
        )}

        {/* Appointments + Blocked Slots */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {viewMode === 'day' ? (
            gridAppointments.length === 0 && gridBlockedSlots.length === 0 ? (
              <Animated.View entering={FadeIn}>
                <NoAppointments onAdd={() => router.push('/booking')} />
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(200)}>
                <DayTimelineGrid
                  date={selectedDate}
                  appointments={gridAppointments}
                  blockedSlots={gridBlockedSlots}
                  servicesList={servicesList}
                  clientsList={clientsList}
                  openHour={getDayHours(hoursJson, selectedDate).openHour}
                  closeHour={getDayHours(hoursJson, selectedDate).closeHour}
                  onAppointmentPress={openAppointmentDetail}
                  onBlockedPress={handleDeleteBlock}
                  onSlotPress={handleTimelineSlotPress}
                />
              </Animated.View>
            )
          ) : mergedItems.length === 0 ? (
            <Animated.View entering={FadeIn}>
              <NoAppointments onAdd={() => router.push('/booking')} />
            </Animated.View>
          ) : (
            <AgendaItemsList
              mergedItems={mergedItems}
              servicesList={servicesList}
              clientsList={clientsList}
              employeesList={employeesList}
              onSelectAppointment={openAppointmentDetail}
              onSelectBlocked={handleDeleteBlock}
            />
          )}

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          servicesList={servicesList}
          clientsList={clientsList}
          employeesList={employeesList}
          establishmentId={establishmentId ?? undefined}
          aptStatus={aptStatus}
          setAptStatus={setAptStatus}
          aptPayment={aptPayment}
          setAptPayment={setAptPayment}
          editingDateTime={editingDateTime}
          setEditingDateTime={setEditingDateTime}
          editDate={editDate}
          setEditDate={setEditDate}
          editTime={editTime}
          setEditTime={setEditTime}
          showPaymentSheet={showPaymentSheet}
          setShowPaymentSheet={setShowPaymentSheet}
          showStatusSheet={showStatusSheet}
          setShowStatusSheet={setShowStatusSheet}
          reschedule={reschedule}
          showToast={showToast}
          onRequestCancel={() => setShowCancelConfirm(true)}
          onMarkCompleted={() => {
            setShowDetailModal(false);
            showToast('Agendamento marcado como concluído!', 'success');
          }}
        />
      )}

      <ConfirmModal
        visible={showCancelConfirm}
        title="Cancelar Agendamento"
        message={`Deseja cancelar o agendamento de ${selectedAppointment ? (clientsList.find(c => c.id === selectedAppointment.clientId)?.name ?? 'cliente') : 'cliente'}?`}
        confirmLabel="Cancelar"
        cancelLabel="Não"
        variant="danger"
        onConfirm={() => {
          setShowCancelConfirm(false);
          setShowDetailModal(false);
          showToast('Agendamento cancelado.', 'info');
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <ToastComponent />

      {/* Modal — Agendamentos Online */}
      <OnlineAppointmentsModal
        visible={showOnlineModal}
        onClose={() => setShowOnlineModal(false)}
        appointments={appointments}
        servicesList={servicesList}
        statusLabel={APPOINTMENT_STATUS_LABEL}
        onSelectAppointment={(apt) => {
          setSelectedAppointment(apt);
          setShowDetailModal(true);
        }}
      />

      {/* Modal — Visão Semanal (todos os dias lado a lado) */}
      <WeekOverviewModal
        visible={showWeekOverview}
        onClose={() => setShowWeekOverview(false)}
        weekStart={weekOverviewStart}
        onNavigateWeek={navigateWeekOverview}
        appointments={selectedProfessional ? appointments.filter((a) => a.professionalId === selectedProfessional) : appointments}
        blockedSlots={selectedProfessional ? blockedSlots.filter((s) => !s.employeeId || s.employeeId === selectedProfessional) : blockedSlots}
        servicesList={servicesList}
        clientsList={clientsList}
        openHour={getDayHours(hoursJson, weekOverviewStart).openHour}
        closeHour={getDayHours(hoursJson, weekOverviewStart).closeHour}
        professionalLabel={selectedProfessional ? professionals.find((p) => p.id === selectedProfessional)?.name : 'Todos'}
        onSelectAppointment={(apt) => {
          setShowWeekOverview(false);
          openAppointmentDetail(apt);
        }}
        onOpenMonth={() => {
          setShowWeekOverview(false);
          setViewMode('month');
        }}
      />

      {/* Modal — Bloquear Horário */}
      <BlockSlotModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        professionals={professionals}
        blockDate={blockDate}
        setBlockDate={setBlockDate}
        blockStartTime={blockStartTime}
        setBlockStartTime={setBlockStartTime}
        blockEndTime={blockEndTime}
        setBlockEndTime={setBlockEndTime}
        blockReason={blockReason}
        setBlockReason={setBlockReason}
        blockEmployeeId={blockEmployeeId}
        setBlockEmployeeId={setBlockEmployeeId}
        onSubmit={handleCreateBlock}
        isSubmitting={createBlock.isPending}
      />

      {/* Confirm Delete Block */}
      <ConfirmModal
        visible={showDeleteBlockConfirm}
        title="Remover Bloqueio"
        message={blockToDelete ? `Deseja remover o bloqueio de ${blockToDelete.startTime} - ${blockToDelete.endTime}${blockToDelete.reason ? ` (${blockToDelete.reason})` : ''}?` : ''}
        confirmLabel="Remover"
        cancelLabel="Manter"
        variant="danger"
        onConfirm={confirmDeleteBlock}
        onCancel={() => { setShowDeleteBlockConfirm(false); setBlockToDelete(null); }}
      />
    </View>
  );
}
