import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions, StyleSheet, Modal, TextInput } from 'react-native';
import { ConfirmModal, useToast } from '@/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInRight,
  SlideInRight,
  SlideInLeft,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft2, ArrowRight2, Clock, Calendar as CalendarIcon, Calendar, CalendarTick, Add, User, MagicStar, CloseCircle, Call, Scissor, DollarCircle, TickCircle, InfoCircle, Link2, Money, Mobile, Card, Slash, Lock } from 'iconsax-react-native';
import { colors, statusColors } from '@/lib/theme';
import Svg, { Circle } from 'react-native-svg';
import { Button, StatusBadge, SectionHeader, NoAppointments } from '@/components/ui';
import { Appointment } from '@/lib/types';
import { useAppointments, useUpdateAppointmentStatus, useRescheduleAppointment } from '@/lib/hooks/use-appointments';
import { useServices } from '@/lib/hooks/use-services';
import { useClients } from '@/lib/hooks/use-clients';
import { useEmployees } from '@/lib/hooks/use-employees';
import { useAuthStore } from '@/lib/state/auth-store';
import { useBlockedSlots, useCreateBlockedSlot, useDeleteBlockedSlot, type BlockedSlot } from '@/lib/hooks/use-blocked-slots';
import { useEstablishmentOrMock } from '@/lib/hooks/use-establishment';
import { toLocalDateStr, localDateFromStr } from '@/lib/utils/date';
import * as Haptics from 'expo-haptics';
import { DayTimelineGrid } from '@/components/agenda-timeline-grid';
import { WeekOverviewModal } from '@/components/agenda-week-overview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const YEAR_MONTH_WIDTH = (SCREEN_WIDTH - 64) / 3;

// Day-of-week mapping: JS getDay() index -> hours_json key
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

type ViewMode = 'day' | 'month' | 'year';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PERIOD_OPTIONS = [
  { label: 'Últimos 15 dias', days: 15 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 60 dias', days: 60 },
  { label: 'Últimos 90 dias', days: 90 },
];

function OnlineAppointmentsModal({
  visible, onClose, appointments, servicesList, statusLabel, onSelectAppointment,
}: {
  visible: boolean;
  onClose: () => void;
  appointments: Appointment[];
  servicesList: any[];
  statusLabel: Record<string, string>;
  onSelectAppointment: (apt: Appointment) => void;
}) {
  const [search, setSearch] = useState('');
  const [periodDays, setPeriodDays] = useState(15);
  const [showPeriodSheet, setShowPeriodSheet] = useState(false);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffStr = toLocalDateStr(cutoff);

  const onlineApts = appointments
    .filter(a => a.clientName && a.clientName.trim() !== '')
    .filter(a => a.date >= cutoffStr)
    .filter(a => !search.trim() || a.clientName?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const total = onlineApts.reduce((sum, a) => {
    const svc = servicesList.find((s: any) => s.id === a.serviceId);
    return sum + (svc?.price ?? 0);
  }, 0);

  const periodLabel = PERIOD_OPTIONS.find(p => p.days === periodDays)?.label ?? 'Período';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>

        {/* Header */}
        <View className="px-5 pt-5 pb-3 flex-row items-center justify-between border-b border-gray-100">
          <Pressable onPress={onClose}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>Fechar</Text>
          </Pressable>
          <Text className="text-base font-bold text-gray-900">Agendamentos Online</Text>
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
            <Link2 size={18} color={colors.primary}  variant="Outline" />
          </View>
        </View>

        {/* Busca + Período */}
        <View className="px-5 pt-3 pb-2">
          <View className="flex-row gap-2 mb-2">
            {/* Campo de busca */}
            <View className="flex-1 flex-row items-center rounded-xl px-3 h-10" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
              <User size={14} color={colors.textMuted}  variant="Outline" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar nome do cliente..."
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, marginLeft: 8, fontSize: 13, color: colors.textPrimary }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <CloseCircle size={14} color={colors.textMuted}  variant="Outline" />
                </Pressable>
              )}
            </View>

            {/* Período */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPeriodSheet(true); }}
              className="flex-row items-center px-3 h-10 rounded-xl gap-1"
              style={{ backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary + '30' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                Últimos {periodDays} dias
              </Text>
              <ArrowRight2 size={12} color={colors.primary}  variant="Outline" />
            </Pressable>
          </View>

          <Text className="text-xs" style={{ color: colors.textMuted }}>
            Resultados são ordenados por data de criação
          </Text>
        </View>

        {/* Total */}
        <View className="mx-5 mb-3 p-3 rounded-xl flex-row items-center justify-between"
          style={{ backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '25' }}>
          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
            {onlineApts.length} agendamento{onlineApts.length !== 1 ? 's' : ''}
          </Text>
          <Text className="font-bold text-base" style={{ color: colors.primary }}>{fmt(total)}</Text>
        </View>

        {/* Lista */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {onlineApts.length === 0 ? (
            <View className="items-center py-16">
              <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: colors.primary + '15' }}>
                <Link2 size={24} color={colors.primary}  variant="Outline" />
              </View>
              <Text className="font-bold text-gray-900">Nenhum agendamento online</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                {search ? 'Tente outro nome' : `Nenhum nos últimos ${periodDays} dias`}
              </Text>
            </View>
          ) : onlineApts.map((apt, i) => {
            const svc = servicesList.find((s: any) => s.id === apt.serviceId);
            const d = new Date(apt.date);
            const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)} (${weekDays[d.getDay()]})`;
            const profLine = apt.notes?.split('\n').find(l => l.startsWith('Profissional:'));
            const profName = profLine?.replace('Profissional:', '').trim();
            const sc = statusColors[apt.status as keyof typeof statusColors] ?? colors.primary;

            return (
              <Pressable
                key={apt.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectAppointment(apt); }}
                className="mb-3 rounded-2xl overflow-hidden active:opacity-70"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: sc }} />
                <View className="px-4 py-3 pl-5">
                  {/* Linha 1: avatar + nome + preço */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.primary + '20' }}>
                        <User size={15} color={colors.primary}  variant="Outline" />
                      </View>
                      <Text className="font-bold text-gray-900 flex-1" numberOfLines={1}>{apt.clientName}</Text>
                    </View>
                    <Text className="font-bold" style={{ color: colors.primary }}>{fmt(svc?.price ?? 0)}</Text>
                  </View>

                  {/* Linha 2: data/hora */}
                  <View className="flex-row items-center gap-1 mb-1 ml-10">
                    <CalendarIcon size={12} color={sc}  variant="Outline" />
                    <Text className="text-xs font-medium" style={{ color: sc }}>{dateStr}</Text>
                    <Clock size={12} color={colors.textMuted} style={{ marginLeft: 6 }}  variant="Outline" />
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{apt.time}</Text>
                  </View>

                  {/* Linha 3: serviço + profissional */}
                  <View className="flex-row items-center justify-between ml-10">
                    <View className="flex-row items-center gap-1 flex-1">
                      <Scissor size={12} color={colors.textMuted}  variant="Outline" />
                      <Text className="text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>{svc?.name ?? '—'}</Text>
                    </View>
                    {profName && (
                      <Text className="text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                        {profName}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Sheet de período */}
        <Modal visible={showPeriodSheet} transparent animationType="fade" onRequestClose={() => setShowPeriodSheet(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setShowPeriodSheet(false)}>
            <View style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>
              <Text style={{ textAlign: 'center', fontWeight: '700', fontSize: 15, color: colors.textPrimary, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                Período
              </Text>
              {PERIOD_OPTIONS.map(opt => (
                <Pressable key={opt.days} onPress={() => { setPeriodDays(opt.days); setShowPeriodSheet(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 15, color: colors.textPrimary, fontWeight: opt.days === periodDays ? '700' : '400' }}>{opt.label}</Text>
                  <ArrowRight2 size={16} color={opt.days === periodDays ? colors.primary : colors.textMuted}  variant="Outline" />
                </Pressable>
              ))}
              <Pressable onPress={() => setShowPeriodSheet(false)} style={{ marginTop: 8, alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>Fechar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}

export default function AgendaScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [calendarView, setCalendarView] = useState<'counter' | 'list'>('counter');
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

  const statusLabel: Record<string, string> = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  const statusIcon: Record<string, React.ReactNode> = {
    confirmed: <TickCircle size={16} color={statusColors.confirmed} />,
    pending: <InfoCircle size={16} color={statusColors.pending} />,
    completed: <TickCircle size={16} color={statusColors.completed} />,
    cancelled: <CloseCircle size={16} color={statusColors.cancelled}  variant="Outline" />,
  };

  // Generate days for current month view
  const monthData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [selectedDate]);

  // Generate months for year view
  const yearMonths = useMemo(() => {
    const year = selectedDate.getFullYear();
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  }, [selectedDate]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    if (selectedProfessional) {
      filtered = filtered.filter((a: Appointment) => a.professionalId === selectedProfessional);
    }

    if (viewMode === 'day') {
      const dateStr = toLocalDateStr(selectedDate);
      filtered = filtered.filter((a: Appointment) => a.date === dateStr);
    } else if (viewMode === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      filtered = filtered.filter((a: Appointment) => {
        const d = localDateFromStr(a.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    } else if (viewMode === 'year') {
      const year = selectedDate.getFullYear();
      filtered = filtered.filter((a: Appointment) => localDateFromStr(a.date).getFullYear() === year);
    }

    return filtered.sort((a: Appointment, b: Appointment) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  }, [appointments, selectedDate, selectedProfessional, viewMode]);

  // Filter blocked slots for the current view
  const filteredBlockedSlots = useMemo(() => {
    let filtered = [...blockedSlots];

    if (selectedProfessional) {
      filtered = filtered.filter((s: BlockedSlot) => s.employeeId === selectedProfessional || s.employeeId === null);
    }

    if (viewMode === 'day') {
      const dateStr = toLocalDateStr(selectedDate);
      filtered = filtered.filter((s: BlockedSlot) => s.date === dateStr);
    } else if (viewMode === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      filtered = filtered.filter((s: BlockedSlot) => {
        const d = localDateFromStr(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    } else if (viewMode === 'year') {
      const year = selectedDate.getFullYear();
      filtered = filtered.filter((s: BlockedSlot) => localDateFromStr(s.date).getFullYear() === year);
    }

    return filtered.sort((a: BlockedSlot, b: BlockedSlot) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [blockedSlots, selectedDate, selectedProfessional, viewMode]);

  // Merge appointments + blocked slots into a unified sorted list for display
  type AgendaItem =
    | { type: 'appointment'; data: Appointment }
    | { type: 'blocked'; data: BlockedSlot };

  const mergedItems: AgendaItem[] = useMemo(() => {
    const items: AgendaItem[] = [
      ...filteredAppointments.map((a) => ({ type: 'appointment' as const, data: a })),
      ...filteredBlockedSlots.map((s) => ({ type: 'blocked' as const, data: s })),
    ];
    return items.sort((a, b) => {
      const dateA = a.type === 'appointment' ? a.data.date : a.data.date;
      const dateB = b.type === 'appointment' ? b.data.date : b.data.date;
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.type === 'appointment' ? a.data.time : a.data.startTime;
      const timeB = b.type === 'appointment' ? b.data.time : b.data.startTime;
      return timeA.localeCompare(timeB);
    });
  }, [filteredAppointments, filteredBlockedSlots]);

  // Appointments + blocked slots for exactly the selected date, used by the timeline grid
  // (day and week modes show a single-day grid, regardless of the wider list filter above)
  const selectedDateStr = toLocalDateStr(selectedDate);
  const gridAppointments = useMemo(() => {
    return appointments.filter((a: Appointment) =>
      a.date === selectedDateStr && (!selectedProfessional || a.professionalId === selectedProfessional)
    );
  }, [appointments, selectedDateStr, selectedProfessional]);

  const gridBlockedSlots = useMemo(() => {
    return blockedSlots.filter((s: BlockedSlot) =>
      s.date === selectedDateStr && (!selectedProfessional || s.employeeId === selectedProfessional || s.employeeId === null)
    );
  }, [blockedSlots, selectedDateStr, selectedProfessional]);

  // Get appointments count for a specific date
  const getAppointmentsForDate = useCallback((date: Date | null) => {
    if (!date) return [];
    const dateStr = toLocalDateStr(date);
    return appointments.filter((a: Appointment) => a.date === dateStr);
  }, [appointments]);

  // Get appointments count for a specific month
  const getAppointmentsForMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return appointments.filter((a: Appointment) => {
      const d = localDateFromStr(a.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [appointments]);

  // Working hours for the timeline grid, based on establishment config for the given weekday
  const getDayHours = useCallback((date: Date) => {
    const dayKey = DAY_KEYS[date.getDay()];
    const dayHours = hoursJson?.[dayKey];
    if (!dayHours || !dayHours.active) return { openHour: 7, closeHour: 21 };
    const openHour = parseInt(dayHours.open.split(':')[0], 10) || 7;
    const closeHour = parseInt(dayHours.close.split(':')[0], 10) || 21;
    return { openHour, closeHour: Math.max(closeHour, openHour + 1) };
  }, [hoursJson]);

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

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatYear = (date: Date) => {
    return date.getFullYear().toString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const handleDateSelect = (date: Date | null) => {
    if (!date) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
  };

  const handleMonthSelect = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
    setViewMode('month');
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

  const professionals = employeesList.filter((e) => e.role === 'professional' && e.active);
  const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
        {/* Header */}
        <View className="px-5 pt-2 pb-3">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-gray-900 text-2xl font-bold">Agenda</Text>
              <Text style={{ color: colors.textMuted }} className="text-sm">
                {filteredAppointments.length} agendamentos
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowOnlineModal(true); }}
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary + '40' }}
              >
                <Link2 size={18} color={colors.primary}  variant="Outline" />
              </Pressable>
              <Pressable
                onPress={openBlockModal}
                className="flex-row items-center px-3 py-2.5 rounded-xl gap-1.5"
                style={{ backgroundColor: colors.textMuted + '20', borderWidth: 1, borderColor: colors.textMuted + '40' }}
              >
                <Slash size={16} color={colors.textMuted} variant="Outline" />
                <Text className="text-xs font-semibold" style={{ color: colors.textMuted }}>Bloquear</Text>
              </Pressable>
              <Button
                onPress={() => router.push('/booking')}
                variant="primary"
                size="sm"
                icon={<Add size={18} color="white"  variant="Outline" />}
              >
                Novo
              </Button>
            </View>
          </View>

          {/* View Mode Selector - Modern Pills */}
          <View className="flex-row mb-4">
            <View
              className="flex-row rounded-2xl p-1.5 flex-1"
              style={{ backgroundColor: colors.backgroundCard }}
            >
              {[
                { key: 'day', label: 'Dia', icon: Clock },
                { key: 'week', label: 'Semana', icon: Calendar },
                { key: 'month', label: 'Mês', icon: CalendarIcon },
                { key: 'year', label: 'Ano', icon: CalendarTick },
              ].map(({ key, label, icon: Icon }) => {
                const isActive = key !== 'week' && viewMode === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => key === 'week' ? openWeekOverview() : handleViewModeChange(key as ViewMode)}
                    className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                    style={{
                      backgroundColor: isActive ? colors.primary : 'transparent',
                    }}
                  >
                    <Icon size={16} color={isActive ? 'white' : colors.textMuted} />
                    <Text
                      className="ml-1.5 text-sm font-semibold"
                      style={{ color: isActive ? 'white' : colors.textMuted }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Date Navigation */}
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={() => navigateDate('prev')}
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.backgroundCard }}
            >
              <ArrowLeft2 size={20} color={colors.textSecondary}  variant="Outline" />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDate(new Date());
              }}
              className="flex-row items-center"
            >
              <Text className="text-gray-900 font-bold text-lg capitalize">
                {getNavigationTitle()}
              </Text>
              {!isToday(selectedDate) && (
                <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.primary + '30' }}>
                  <Text className="text-xs font-medium" style={{ color: colors.secondary }}>
                    Hoje
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => navigateDate('next')}
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.backgroundCard }}
            >
              <ArrowRight2 size={20} color={colors.textSecondary}  variant="Outline" />
            </Pressable>
          </View>
        </View>


        {/* Month View */}
        {viewMode === 'month' && (
          <Animated.View entering={FadeIn.duration(300)} className="px-4 mb-4">

            {/* Toggle Visão Contador / Lista */}
            <View className="flex-row items-center justify-center mb-4" style={{ gap: 24 }}>
              <Pressable onPress={() => setCalendarView('counter')} className="flex-row items-center" style={{ gap: 8 }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                  borderColor: colors.primary,
                  backgroundColor: calendarView === 'counter' ? colors.primary : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {calendarView === 'counter' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />}
                </View>
                <Text className="text-sm font-semibold" style={{ color: calendarView === 'counter' ? colors.primary : colors.textMuted }}>
                  Visão Contador
                </Text>
              </Pressable>
              <Pressable onPress={() => setCalendarView('list')} className="flex-row items-center" style={{ gap: 8 }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                  borderColor: colors.primary,
                  backgroundColor: calendarView === 'list' ? colors.primary : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {calendarView === 'list' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />}
                </View>
                <Text className="text-sm font-semibold" style={{ color: calendarView === 'list' ? colors.primary : colors.textMuted }}>
                  Visão Lista
                </Text>
              </Pressable>
            </View>

            {/* Day Headers */}
            <View className="flex-row mb-2">
              {dayNames.map((day, idx) => (
                <View key={idx} style={{ flex: 1 }} className="items-center">
                  <Text className="text-xs font-semibold" style={{ color: colors.textMuted }}>{day}</Text>
                </View>
              ))}
            </View>

            {/* VISÃO CONTADOR */}
            {calendarView === 'counter' && (() => {
              const cellSize = Math.floor((SCREEN_WIDTH - 32) / 7); // 32px = px-4 * 2
              const svgSize = cellSize - 6;
              const R = svgSize / 2 - 4;
              const CX = svgSize / 2;
              const CY = svgSize / 2;
              const CIRCUMFERENCE = 2 * Math.PI * R;
              const STROKE = 3;
              const MAX = 8;

              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {monthData.map((date, idx) => {
                    if (!date) {
                      return <View key={idx} style={{ width: cellSize, height: cellSize + 8 }} />;
                    }
                    const dayApts = getAppointmentsForDate(date);
                    const count = dayApts.length;
                    const pct = Math.min(count / MAX, 1);
                    const strokeDash = CIRCUMFERENCE * pct;
                    const today = isToday(date);
                    const selected = isSelected(date);
                    const ringColor = selected ? '#fff' : today ? colors.secondary : colors.primary;

                    return (
                      <Pressable
                        key={idx}
                        onPress={() => handleDateSelect(date)}
                        style={{ width: cellSize, height: cellSize + 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
                      >
                        <View style={{ width: svgSize, height: svgSize, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                          {/* SVG Ring */}
                          <Svg width={svgSize} height={svgSize} style={{ position: 'absolute' }}>
                            {/* Track */}
                            <Circle cx={CX} cy={CY} r={R} stroke="#E5E7EB" strokeWidth={STROKE} fill="transparent" />
                            {/* Progress arc */}
                            {count > 0 && (
                              <Circle
                                cx={CX} cy={CY} r={R}
                                stroke={ringColor}
                                strokeWidth={STROKE + 1}
                                fill="transparent"
                                strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${CX} ${CY})`}
                              />
                            )}
                          </Svg>
                          {/* Center circle with day number */}
                          <View style={{
                            width: svgSize - 12,
                            height: svgSize - 12,
                            borderRadius: (svgSize - 12) / 2,
                            backgroundColor: selected
                              ? colors.primary
                              : today
                              ? colors.secondary + '25'
                              : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Text style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: selected ? '#fff' : today ? colors.secondary : colors.textPrimary,
                            }}>
                              {date.getDate()}
                            </Text>
                          </View>
                          {/* Count badge */}
                          {count > 0 && (
                            <View style={{
                              position: 'absolute',
                              top: -2,
                              right: -2,
                              backgroundColor: selected ? colors.secondary : colors.primary,
                              borderRadius: 6,
                              minWidth: 13,
                              height: 13,
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 2,
                              borderWidth: 1,
                              borderColor: '#fff',
                            }}>
                              <Text style={{ color: '#fff', fontSize: 7, fontWeight: '800', lineHeight: 10 }}>
                                {count}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })()}

            {/* VISÃO LISTA */}
            {calendarView === 'list' && (
              <View>
                {/* Grid por semanas */}
                {Array.from({ length: Math.ceil(monthData.length / 7) }).map((_, weekIdx) => {
                  const weekDays = monthData.slice(weekIdx * 7, weekIdx * 7 + 7);
                  const maxItems = 3;
                  return (
                    <View key={weekIdx} className="flex-row" style={{ minHeight: 80, borderTopWidth: 1, borderTopColor: colors.border }}>
                      {weekDays.map((date, dayIdx) => {
                        if (!date) return <View key={dayIdx} style={{ flex: 1, borderLeftWidth: dayIdx > 0 ? 1 : 0, borderLeftColor: colors.border }} />;
                        const dayApts = getAppointmentsForDate(date);
                        const today = isToday(date);
                        const selected = isSelected(date);
                        const extra = dayApts.length - maxItems;

                        return (
                          <Pressable key={dayIdx} onPress={() => handleDateSelect(date)}
                            style={{
                              flex: 1, padding: 3, borderLeftWidth: dayIdx > 0 ? 1 : 0, borderLeftColor: colors.border,
                              backgroundColor: selected ? colors.primary + '10' : 'transparent',
                            }}>
                            {/* Day number */}
                            <Text style={{
                              fontSize: 11, fontWeight: '600', marginBottom: 3,
                              color: today ? colors.secondary : selected ? colors.primary : colors.textPrimary,
                            }}>{date.getDate()}</Text>
                            {/* Appointment pills */}
                            {dayApts.slice(0, maxItems).map((apt, i) => {
                              const client = clientsList.find(c => c.id === apt.clientId);
                              const service = servicesList.find(s => s.id === apt.serviceId);
                              const sc = (statusColors as Record<string,string>)[apt.status] ?? colors.primary;
                              const firstName = (client?.name ?? apt.clientName ?? '').split(' ')[0];
                              return (
                                <Pressable key={i} onPress={() => openAppointmentDetail(apt)} style={{
                                  backgroundColor: sc + '25',
                                  borderLeftWidth: 2, borderLeftColor: sc,
                                  borderRadius: 3, paddingHorizontal: 3, paddingVertical: 2,
                                  marginBottom: 1,
                                }}>
                                  <Text numberOfLines={1} style={{ fontSize: 9, color: sc, fontWeight: '700' }}>
                                    {firstName}
                                  </Text>
                                  <Text numberOfLines={1} style={{ fontSize: 8, color: colors.textMuted }}>
                                    {service?.name ?? ''}
                                  </Text>
                                </Pressable>
                              );
                            })}
                            {extra > 0 && (
                              <View style={{
                                backgroundColor: '#EF4444', borderRadius: 8,
                                alignSelf: 'flex-start', paddingHorizontal: 4, paddingVertical: 1, marginTop: 1,
                              }}>
                                <Text style={{ color: 'white', fontSize: 8, fontWeight: '700' }}>+{extra}</Text>
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Legenda */}
            {calendarView === 'counter' && (
              <View className="mt-3 px-1">
                <Text className="text-xs text-gray-400">
                  A borda do círculo representa a ocupação do dia. Quanto mais preenchida, mais agendamentos.
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Year View */}
        {viewMode === 'year' && (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="px-5 mb-4"
          >
            <View className="flex-row flex-wrap justify-between">
              {yearMonths.map((monthDate, idx) => {
                const appointments = getAppointmentsForMonth(monthDate);
                const isCurrent = isCurrentMonth(monthDate);
                const isSelectedMonth = selectedDate.getMonth() === monthDate.getMonth();

                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleMonthSelect(monthDate)}
                    className="mb-4 rounded-2xl overflow-hidden"
                    style={{
                      width: YEAR_MONTH_WIDTH - 8,
                      backgroundColor: isSelectedMonth ? colors.primary + '15' : colors.backgroundCard,
                      borderWidth: isCurrent ? 1 : 0,
                      borderColor: colors.secondary,
                    }}
                  >
                    <LinearGradient
                      colors={isSelectedMonth
                        ? [colors.primary + '20', 'transparent']
                        : ['transparent', 'transparent']
                      }
                      style={{ padding: 12 }}
                    >
                      <Text
                        className="text-base font-bold mb-1"
                        style={{
                          color: isCurrent ? colors.secondary : colors.textPrimary,
                        }}
                      >
                        {monthNames[idx]}
                      </Text>

                      {/* Mini calendar preview */}
                      <View className="flex-row flex-wrap">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                          <Text
                            key={i}
                            className="text-center font-medium"
                            style={{
                              fontSize: 8,
                              width: '14.28%',
                              color: colors.textMuted,
                              marginBottom: 2,
                            }}
                          >
                            {d}
                          </Text>
                        ))}
                        {(() => {
                          const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                          const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                          const startPadding = firstDay.getDay();
                          const totalDays = lastDay.getDate();

                          const miniDays: (number | null)[] = [];
                          for (let i = 0; i < startPadding; i++) miniDays.push(null);
                          for (let i = 1; i <= totalDays; i++) miniDays.push(i);

                          return miniDays.slice(0, 35).map((day, i) => {
                            const hasApt = day && appointments.some(a => {
                              const d = new Date(a.date);
                              return d.getDate() === day;
                            });

                            return (
                              <View
                                key={i}
                                style={{ width: '14.28%', height: 10, marginBottom: 1 }}
                                className="items-center justify-center"
                              >
                                {day && (
                                  <View
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: hasApt
                                        ? colors.secondary
                                        : colors.textMuted + '30',
                                    }}
                                  />
                                )}
                              </View>
                            );
                          });
                        })()}
                      </View>

                      {/* Appointments count */}
                      <View className="flex-row items-center mt-2">
                        <MagicStar size={10} color={colors.secondary}  variant="Outline" />
                        <Text
                          className="ml-1 text-xs font-medium"
                          style={{ color: colors.textMuted }}
                        >
                          {appointments.length} agend.
                        </Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Professional Filter */}
        <View className="mb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            style={{ flexGrow: 0 }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedProfessional(null);
              }}
              className="flex-row items-center px-4 py-2.5 rounded-xl mr-2"
              style={{
                backgroundColor: !selectedProfessional ? colors.secondary : colors.backgroundCard,
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: !selectedProfessional ? colors.background : colors.textSecondary }}
              >
                Todos
              </Text>
            </Pressable>
            {professionals.map((prof) => (
              <Pressable
                key={prof.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedProfessional(prof.id);
                }}
                className="flex-row items-center px-3 py-2 rounded-xl mr-2"
                style={{
                  backgroundColor: selectedProfessional === prof.id ? colors.secondary : colors.backgroundCard,
                }}
              >
                <Image
                  source={{ uri: prof.avatar }}
                  className="w-7 h-7 rounded-full mr-2"
                  style={{
                    borderWidth: selectedProfessional === prof.id ? 2 : 0,
                    borderColor: colors.background,
                  }}
                />
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: selectedProfessional === prof.id ? colors.background : colors.textSecondary,
                  }}
                >
                  {prof.name.split(' ')[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

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
                  openHour={getDayHours(selectedDate).openHour}
                  closeHour={getDayHours(selectedDate).closeHour}
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
            <View>
              {mergedItems.map((item, index) => {
                const itemDate = item.type === 'appointment' ? item.data.date : item.data.date;
                const prevItemDate = index > 0
                  ? (mergedItems[index - 1].type === 'appointment' ? mergedItems[index - 1].data.date : mergedItems[index - 1].data.date)
                  : null;
                const showDateHeader = index === 0 || itemDate !== prevItemDate;

                if (item.type === 'blocked') {
                  const slot = item.data;
                  const employee = slot.employeeId ? employeesList.find((e) => e.id === slot.employeeId) : null;
                  return (
                    <Animated.View
                      key={`block-${slot.id}`}
                      entering={FadeInDown.delay(index * 40).springify()}
                    >
                      {showDateHeader && (
                        <View className="flex-row items-center mt-4 mb-2">
                          <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
                          <Text className="text-xs font-semibold uppercase px-3" style={{ color: colors.textMuted }}>
                            {new Date(slot.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </Text>
                          <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
                        </View>
                      )}
                      <Pressable
                        className="rounded-2xl mb-3 overflow-hidden"
                        style={{ backgroundColor: colors.surface }}
                        onPress={() => handleDeleteBlock(slot)}
                      >
                        <View
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: colors.textMuted }}
                        />
                        <View className="flex-row items-center p-4 pl-5">
                          <View
                            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: colors.textMuted + '20' }}
                          >
                            <Slash size={20} color={colors.textMuted} variant="Outline" />
                          </View>
                          <View className="flex-1">
                            <Text className="font-bold text-base" style={{ color: colors.textSecondary }}>Bloqueado</Text>
                            <View className="flex-row items-center mt-1">
                              <Text style={{ color: colors.textMuted }} className="font-semibold text-sm">
                                {slot.startTime} - {slot.endTime}
                              </Text>
                            </View>
                            {(slot.reason || employee) && (
                              <View className="flex-row items-center mt-1">
                                {slot.reason ? (
                                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                                    {slot.reason}
                                  </Text>
                                ) : null}
                                {slot.reason && employee ? (
                                  <Text style={{ color: colors.textMuted }} className="mx-1">•</Text>
                                ) : null}
                                {employee ? (
                                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                                    {employee.name}
                                  </Text>
                                ) : null}
                              </View>
                            )}
                          </View>
                          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.textMuted + '20' }}>
                            <Text className="text-xs font-semibold" style={{ color: colors.textMuted }}>Bloqueado</Text>
                          </View>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                }

                // Regular appointment card
                const apt = item.data;
                const service = servicesList.find((s) => s.id === apt.serviceId);
                const professional = employeesList.find((e) => e.id === apt.professionalId);
                const client = clientsList.find((c) => c.id === apt.clientId);

                return (
                  <Animated.View
                    key={apt.id}
                    entering={FadeInDown.delay(index * 40).springify()}
                  >
                    {showDateHeader && (
                      <View className="flex-row items-center mt-4 mb-2">
                        <View
                          className="h-px flex-1"
                          style={{ backgroundColor: colors.border }}
                        />
                        <Text
                          className="text-xs font-semibold uppercase px-3"
                          style={{ color: colors.textMuted }}
                        >
                          {new Date(apt.date).toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                        <View
                          className="h-px flex-1"
                          style={{ backgroundColor: colors.border }}
                        />
                      </View>
                    )}
                    <Pressable
                      className="rounded-2xl mb-3 overflow-hidden"
                      style={{ backgroundColor: colors.backgroundCard }}
                      onPress={() => openAppointmentDetail(apt)}
                    >
                      <View
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: statusColors[apt.status] }}
                      />
                      <View className="flex-row items-center p-4 pl-5">
                        <View
                          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: statusColors[apt.status] + '20' }}
                        >
                          <Clock size={20} color={statusColors[apt.status]}  variant="Outline" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-bold text-base">{service?.name}</Text>
                          <View className="flex-row items-center mt-1">
                            <Text style={{ color: colors.secondary }} className="font-semibold text-sm">
                              {apt.time}
                            </Text>
                            <Text style={{ color: colors.textMuted }} className="mx-1">•</Text>
                            <Text style={{ color: colors.textMuted }} className="text-sm">
                              {service?.duration}min
                            </Text>
                          </View>
                          <View className="flex-row items-center mt-1">
                            <User size={12} color={colors.textMuted}  variant="Outline" />
                            <Text className="text-xs ml-1" style={{ color: colors.textMuted }}>
                              {client?.name ?? apt.clientName ?? 'Cliente'}{professional?.name ? ` • ${professional.name}` : ''}
                            </Text>
                          </View>
                        </View>
                        <StatusBadge status={apt.status} size="sm" />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (() => {
        const apt = selectedAppointment;
        const service = servicesList.find((s) => s.id === apt.serviceId);
        const professional = employeesList.find((e) => e.id === apt.professionalId);
        const client = clientsList.find((c) => c.id === apt.clientId);
        const statusColor = statusColors[apt.status];

        return (
          <Modal
            visible={showDetailModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowDetailModal(false)}
          >
            <View className="flex-1" style={{ backgroundColor: colors.background }}>
              {/* Header com gradiente de cor do status */}
              <LinearGradient
                colors={[statusColor + '22', colors.background]}
                style={{ paddingTop: 20, paddingBottom: 8 }}
              >
                <View className="flex-row items-center justify-between px-5 mb-4">
                  <Text className="text-gray-900 text-lg font-bold">Detalhes do Agendamento</Text>
                  <Pressable
                    onPress={() => setShowDetailModal(false)}
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
                  </Pressable>
                </View>

                {/* Status badge */}
                <View className="flex-row items-center px-5 mb-2">
                  <View
                    className="flex-row items-center px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: statusColor + '20' }}
                  >
                    {statusIcon[apt.status]}
                    <Text className="text-xs font-bold ml-1.5" style={{ color: statusColor }}>
                      {statusLabel[apt.status] ?? apt.status}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

                {/* Serviço */}
                <View
                  className="rounded-2xl p-4 mb-3"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <View className="flex-row items-center mb-3">
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: colors.primary + '15' }}
                    >
                      <Scissor size={20} color={colors.primary}  variant="Outline" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 text-xs mb-0.5">Serviço</Text>
                      <Text className="text-gray-900 font-bold text-base">{service?.name ?? '—'}</Text>
                    </View>
                  </View>
                  {service?.description ? (
                    <Text className="text-gray-500 text-sm">{service.description}</Text>
                  ) : null}
                  <View className="flex-row mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                    <View className="flex-1 flex-row items-center">
                      <Clock size={14} color={colors.textMuted}  variant="Outline" />
                      <Text className="text-gray-500 text-sm ml-1">{service?.duration ?? '—'} min</Text>
                    </View>
                    <View className="flex-1 flex-row items-center">
                      <DollarCircle size={14} color={colors.primary}  variant="Outline" />
                      <Text className="font-bold text-sm ml-1" style={{ color: colors.primary }}>
                        R$ {service?.price?.toFixed(2) ?? '—'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Data e Hora — tappable to edit */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (!editingDateTime) {
                      setEditDate(apt.date);
                      setEditTime(apt.time);
                    }
                    setEditingDateTime(!editingDateTime);
                  }}
                  className="rounded-2xl p-4 mb-3"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: editingDateTime ? colors.secondary + '15' : colors.primary + '15' }}
                    >
                      <CalendarIcon size={20} color={editingDateTime ? colors.secondary : colors.primary} variant="Outline" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 text-xs mb-0.5">Data e hora</Text>
                      {!editingDateTime ? (
                        <>
                          <Text className="text-gray-900 font-bold">
                            {localDateFromStr(apt.date).toLocaleDateString('pt-BR', {
                              weekday: 'long', day: 'numeric', month: 'long',
                            })}
                          </Text>
                          <Text className="text-gray-500 text-sm">{apt.time}</Text>
                        </>
                      ) : (
                        <Text className="text-xs font-semibold" style={{ color: colors.secondary }}>Editando data e hora</Text>
                      )}
                    </View>
                    <ArrowRight2 size={18} color={editingDateTime ? colors.secondary : colors.textMuted} variant="Outline" />
                  </View>

                  {/* Editable fields */}
                  {editingDateTime && (
                    <View className="mt-4 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                      {/* Date input */}
                      <View className="mb-3">
                        <Text className="text-xs font-semibold mb-1.5" style={{ color: colors.textMuted }}>Nova data</Text>
                        <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                          <View className="flex-row items-center px-4 h-12">
                            <CalendarIcon size={16} color={colors.secondary} variant="Outline" />
                            <TextInput
                              value={editDate}
                              onChangeText={setEditDate}
                              placeholder="AAAA-MM-DD"
                              placeholderTextColor={colors.textMuted}
                              style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                            />
                          </View>
                        </View>
                      </View>

                      {/* Time input */}
                      <View className="mb-3">
                        <Text className="text-xs font-semibold mb-1.5" style={{ color: colors.textMuted }}>Novo horário</Text>
                        <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                          <View className="flex-row items-center px-4 h-12">
                            <Clock size={16} color={colors.secondary} variant="Outline" />
                            <TextInput
                              value={editTime}
                              onChangeText={setEditTime}
                              placeholder="14:00"
                              placeholderTextColor={colors.textMuted}
                              style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                            />
                          </View>
                        </View>
                      </View>

                      {/* Reschedule button */}
                      <Pressable
                        onPress={() => {
                          if (!establishmentId || !editDate || !editTime) {
                            showToast('Preencha data e horário.', 'warning');
                            return;
                          }
                          if (editDate === apt.date && editTime === apt.time) {
                            showToast('Nenhuma alteração feita.', 'info');
                            setEditingDateTime(false);
                            return;
                          }
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          reschedule.mutate(
                            { id: apt.id, date: editDate, time: editTime, establishmentId },
                            {
                              onSuccess: () => {
                                setEditingDateTime(false);
                                setShowDetailModal(false);
                                showToast('Agendamento reagendado com sucesso!', 'success');
                              },
                              onError: () => {
                                showToast('Erro ao reagendar. Tente novamente.', 'error');
                              },
                            },
                          );
                        }}
                        className="py-3 rounded-xl items-center flex-row justify-center gap-2"
                        style={{
                          backgroundColor: reschedule.isPending ? colors.textMuted : colors.secondary,
                          opacity: reschedule.isPending ? 0.7 : 1,
                        }}
                      >
                        <CalendarTick size={16} color="white" />
                        <Text className="text-white font-bold text-sm">
                          {reschedule.isPending ? 'Reagendando...' : 'Reagendar'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>

                {/* Cliente */}
                <View
                  className="rounded-2xl p-4 mb-3 flex-row items-center"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary + '15' }}
                  >
                    <User size={20} color={colors.primary}  variant="Outline" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-xs mb-0.5">Cliente</Text>
                    <Text className="text-gray-900 font-bold">{client?.name ?? apt.clientName ?? '—'}</Text>
                    {client?.phone ? (
                      <Text className="text-gray-500 text-sm">{client.phone}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Profissional */}
                <View className="rounded-2xl p-4 mb-3 flex-row items-center" style={{ backgroundColor: colors.backgroundCard }}>
                  {professional?.avatar
                    ? <Image source={{ uri: professional.avatar }} className="w-11 h-11 rounded-xl mr-3" />
                    : <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '15' }}><User size={20} color={colors.primary}  variant="Outline" /></View>
                  }
                  <View className="flex-1">
                    <Text className="text-gray-400 text-xs mb-0.5">Profissional</Text>
                    <Text className="text-gray-900 font-bold">{professional?.name ?? '—'}</Text>
                    {professional?.role ? <Text className="text-gray-500 text-sm">{professional.role}</Text> : null}
                  </View>
                </View>

                {/* Status — clicável */}
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowStatusSheet(true); }}
                  className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <View className="flex-row items-center">
                    <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: ((statusColors as Record<string,string>)[aptStatus] ?? colors.primary) + '15' }}>
                      {(statusIcon as Record<string, React.ReactNode>)[aptStatus] ?? <InfoCircle size={20} color={colors.primary} />}
                    </View>
                    <View>
                      <Text className="text-gray-400 text-xs mb-0.5">Status / Situação</Text>
                      <Text className="text-gray-900 font-bold">
                        {({ confirmed:'Confirmado', pending:'A confirmar', completed:'Concluído', cancelled:'Cancelado', delayed:'Atrasou', no_show:'Não compareceu' } as Record<string,string>)[aptStatus] ?? aptStatus ?? 'Selecionar'}
                      </Text>
                    </View>
                  </View>
                  <ArrowRight2 size={18} color={colors.textMuted}  variant="Outline" />
                </Pressable>

                {/* Forma de pagamento — clicável */}
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPaymentSheet(true); }}
                  className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <View className="flex-row items-center">
                    <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.success + '15' }}>
                      <DollarCircle size={20} color={colors.success}  variant="Outline" />
                    </View>
                    <View>
                      <Text className="text-gray-400 text-xs mb-0.5">Forma de pagamento</Text>
                      <Text className="text-gray-900 font-bold">{aptPayment || 'Selecionar'}</Text>
                    </View>
                  </View>
                  <ArrowRight2 size={18} color={colors.textMuted}  variant="Outline" />
                </Pressable>

                {/* Botões Gerar Cobrança / Recibo */}
                <View className="flex-row gap-3 mb-8">
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); showToast('Cobrança gerada com sucesso!', 'success'); }}
                    className="flex-1 py-3.5 rounded-2xl items-center flex-row justify-center gap-2"
                    style={{ backgroundColor: colors.warning + '15', borderWidth: 1, borderColor: colors.warning + '40' }}
                  >
                    <DollarCircle size={16} color={colors.warning}  variant="Outline" />
                    <Text className="font-bold text-sm" style={{ color: colors.warning }}>Gerar Cobrança</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); showToast('Recibo gerado com sucesso!', 'success'); }}
                    className="flex-1 py-3.5 rounded-2xl items-center flex-row justify-center gap-2"
                    style={{ backgroundColor: colors.success + '15', borderWidth: 1, borderColor: colors.success + '40' }}
                  >
                    <TickCircle size={16} color={colors.success} />
                    <Text className="font-bold text-sm" style={{ color: colors.success }}>Gerar Recibo</Text>
                  </Pressable>
                </View>
              </ScrollView>

              {/* Ações */}
              <View className="px-5 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCancelConfirm(true); }}
                    className="flex-1 py-3.5 rounded-2xl items-center"
                    style={{ backgroundColor: colors.error + '15', borderWidth: 1, borderColor: colors.error + '40' }}
                  >
                    <Text className="font-bold text-sm" style={{ color: colors.error }}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setShowDetailModal(false); showToast('Agendamento marcado como concluído!', 'success'); }}
                    className="flex-2 flex-1 py-3.5 rounded-2xl items-center"
                    style={{ backgroundColor: colors.primary, flex: 2 }}
                  >
                    <Text className="text-white font-bold text-sm">Marcar como Concluído</Text>
                  </Pressable>
                </View>
              </View>

              {/* ── Sheet — Forma de Pagamento ── */}
              <Modal visible={showPaymentSheet} transparent animationType="none" onRequestClose={() => setShowPaymentSheet(false)}>
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}
                  style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' }}>
                  <Pressable style={{ flex:1 }} onPress={() => setShowPaymentSheet(false)} />
                  <Animated.View entering={SlideInDown.springify().damping(22).stiffness(260)}
                    style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius:24, borderTopRightRadius:24, paddingBottom:32 }}>
                    {/* Handle */}
                    <View style={{ alignItems:'center', paddingTop:12, paddingBottom:4 }}>
                      <View style={{ width:36, height:4, borderRadius:2, backgroundColor: colors.border }} />
                    </View>
                    {/* Header */}
                    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:10, paddingBottom:14, borderBottomWidth:1, borderBottomColor: colors.border }}>
                      <Text style={{ color: colors.textPrimary, fontSize:17, fontWeight:'800' }}>Forma de pagamento</Text>
                      <Pressable onPress={() => setShowPaymentSheet(false)}
                        style={{ width:30, height:30, borderRadius:15, backgroundColor: colors.surface, alignItems:'center', justifyContent:'center' }}>
                        <CloseCircle size={14} color={colors.textMuted}  variant="Outline" />
                      </Pressable>
                    </View>
                    {/* Grid 2x3 */}
                    <View style={{ flexDirection:'row', flexWrap:'wrap', padding:16, gap:10 }}>
                      {([
                        { label:'PIX',              sub:'Transferência instantânea', iconActive:<Mobile size={20} color="#fff" />, iconInactive:<Mobile size={20} color="#00C4B4" />, grad:['#00C4B4','#0097A7'] as [string,string], color:'#00C4B4' },
                        { label:'Cartão de crédito',sub:'Crédito parcelado',         iconActive:<Card  size={20} color="#fff" />, iconInactive:<Card  size={20} color="#5333ed" />, grad:['#5333ed','#7B5FFF'] as [string,string], color:'#5333ed' },
                        { label:'Cartão de débito', sub:'Débito à vista',            iconActive:<Card  size={20} color="#fff" />, iconInactive:<Card  size={20} color="#3B82F6" />, grad:['#3B82F6','#2563EB'] as [string,string], color:'#3B82F6' },
                        { label:'Dinheiro',         sub:'Pagamento em espécie',      iconActive:<Money    size={20} color="#fff" />, iconInactive:<Money    size={20} color="#10B981" />, grad:['#10B981','#059669'] as [string,string], color:'#10B981' },
                        { label:'Cheque',           sub:'Cheque bancário',           iconActive:<DollarCircle  size={20} color="#fff"  variant="Outline" />, iconInactive:<DollarCircle  size={20} color="#FF9F0A"  variant="Outline" />, grad:['#FF9F0A','#CC7A00'] as [string,string], color:'#FF9F0A' },
                        { label:'Cortesia',         sub:'Sem cobrança',              iconActive:<MagicStar    size={20} color="#fff"  variant="Outline" />, iconInactive:<MagicStar    size={20} color="#8B5CF6"  variant="Outline" />, grad:['#8B5CF6','#6D28D9'] as [string,string], color:'#8B5CF6' },
                      ] as { label:string; sub:string; iconActive:React.ReactNode; iconInactive:React.ReactNode; grad:[string,string]; color:string }[]).map(m => {
                        const active = aptPayment === m.label;
                        return (
                          <Pressable key={m.label}
                            onPress={() => { setAptPayment(m.label); setShowPaymentSheet(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                            style={{ width:(SCREEN_WIDTH - 52)/2, borderRadius:16, overflow:'hidden', borderWidth:2, borderColor: active ? m.grad[0] : colors.border }}>
                            <LinearGradient
                              colors={active ? m.grad : [colors.background, colors.background]}
                              style={{ padding:14, minHeight:95 }}>
                              <View style={{ width:40, height:40, borderRadius:12, backgroundColor: active ? 'rgba(255,255,255,0.25)' : m.color + '18', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
                                {active ? m.iconActive : m.iconInactive}
                              </View>
                              <Text style={{ fontSize:13, fontWeight:'700', marginBottom:2, color: active ? '#fff' : colors.textPrimary }}>{m.label}</Text>
                              <Text style={{ fontSize:10, color: active ? 'rgba(255,255,255,0.75)' : colors.textMuted }}>{m.sub}</Text>
                              {active && (
                                <View style={{ position:'absolute', top:8, right:8, width:18, height:18, borderRadius:9, backgroundColor:'rgba(255,255,255,0.9)', alignItems:'center', justifyContent:'center' }}>
                                  <TickCircle size={12} color={m.grad[0]} />
                                </View>
                              )}
                            </LinearGradient>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Animated.View>
                </Animated.View>
              </Modal>

              {/* ── Sheet — Status / Situação ── */}
              <Modal visible={showStatusSheet} transparent animationType="none" onRequestClose={() => setShowStatusSheet(false)}>
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}
                  style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' }}>
                  <Pressable style={{ flex:1 }} onPress={() => setShowStatusSheet(false)} />
                  <Animated.View entering={SlideInDown.springify().damping(22).stiffness(260)}
                    style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius:24, borderTopRightRadius:24, paddingBottom:32 }}>
                    {/* Handle */}
                    <View style={{ alignItems:'center', paddingTop:12, paddingBottom:4 }}>
                      <View style={{ width:36, height:4, borderRadius:2, backgroundColor: colors.border }} />
                    </View>
                    {/* Header */}
                    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:10, paddingBottom:14, borderBottomWidth:1, borderBottomColor: colors.border }}>
                      <Text style={{ color: colors.textPrimary, fontSize:17, fontWeight:'800' }}>Status / Situação</Text>
                      <Pressable onPress={() => setShowStatusSheet(false)}
                        style={{ width:30, height:30, borderRadius:15, backgroundColor: colors.surface, alignItems:'center', justifyContent:'center' }}>
                        <CloseCircle size={14} color={colors.textMuted}  variant="Outline" />
                      </Pressable>
                    </View>
                    {/* Opções */}
                    <View style={{ paddingHorizontal:16, paddingTop:12, gap:8 }}>
                      {([
                        { key:'confirmed',  label:'Confirmado',     color:colors.success,  bg: colors.success  + '15', border: colors.success  + '40' },
                        { key:'pending',    label:'A confirmar',    color:colors.warning,  bg: colors.warning  + '15', border: colors.warning  + '40' },
                        { key:'completed',  label:'Concluído',      color:'#5333ED',       bg: '#5333ED15',             border: '#5333ED40'            },
                        { key:'delayed',    label:'Atrasou',        color:'#FF6B00',       bg: '#FF6B0015',             border: '#FF6B0040'            },
                        { key:'cancelled',  label:'Cancelado',      color:colors.error,    bg: colors.error    + '15', border: colors.error    + '40' },
                        { key:'no_show',    label:'Não compareceu', color:colors.textMuted, bg: colors.surface, border: colors.border },
                      ] as { key:string; label:string; color:string; bg:string; border:string }[]).map(opt => {
                        const active = aptStatus === opt.key;
                        return (
                          <Pressable key={opt.key}
                            onPress={() => { setAptStatus(opt.key); setShowStatusSheet(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            style={{ flexDirection:'row', alignItems:'center', paddingVertical:14, paddingHorizontal:16, borderRadius:14, borderWidth:1.5,
                              backgroundColor: active ? opt.bg : colors.background,
                              borderColor: active ? opt.border : colors.border }}>
                            {/* Bolinha colorida */}
                            <View style={{ width:10, height:10, borderRadius:5, backgroundColor: opt.color, marginRight:12 }} />
                            <Text style={{ flex:1, fontSize:15, fontWeight: active ? '700' : '400', color: active ? opt.color : colors.textPrimary }}>
                              {opt.label}
                            </Text>
                            {active && <TickCircle size={18} color={opt.color} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </Animated.View>
                </Animated.View>
              </Modal>

            </View>
          </Modal>
        );
      })()}

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
        statusLabel={statusLabel}
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
        openHour={getDayHours(weekOverviewStart).openHour}
        closeHour={getDayHours(weekOverviewStart).closeHour}
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
      <Modal visible={showBlockModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBlockModal(false)}>
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          {/* Header */}
          <View className="px-5 pt-5 pb-3 flex-row items-center justify-between border-b" style={{ borderBottomColor: colors.border }}>
            <Pressable onPress={() => setShowBlockModal(false)}>
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>Cancelar</Text>
            </Pressable>
            <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>Bloquear Horário</Text>
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.textMuted + '15' }}>
              <Slash size={18} color={colors.textMuted} variant="Outline" />
            </View>
          </View>

          <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
            {/* Date */}
            <View className="mb-4">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Data</Text>
              <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                <View className="flex-row items-center px-4 h-12">
                  <CalendarIcon size={16} color={colors.primary} variant="Outline" />
                  <TextInput
                    value={blockDate}
                    onChangeText={setBlockDate}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                  />
                </View>
              </View>
            </View>

            {/* Start / End Time */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Hora início</Text>
                <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  <View className="flex-row items-center px-4 h-12">
                    <Clock size={16} color={colors.primary} variant="Outline" />
                    <TextInput
                      value={blockStartTime}
                      onChangeText={setBlockStartTime}
                      placeholder="09:00"
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                    />
                  </View>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Hora fim</Text>
                <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  <View className="flex-row items-center px-4 h-12">
                    <Clock size={16} color={colors.primary} variant="Outline" />
                    <TextInput
                      value={blockEndTime}
                      onChangeText={setBlockEndTime}
                      placeholder="10:00"
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Professional Selector */}
            <View className="mb-4">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Profissional (opcional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBlockEmployeeId(null); }}
                  className="flex-row items-center px-4 py-2.5 rounded-xl mr-2"
                  style={{ backgroundColor: blockEmployeeId === null ? colors.primary : colors.backgroundCard, borderWidth: 1, borderColor: blockEmployeeId === null ? colors.primary : colors.border }}
                >
                  <Text className="text-sm font-semibold" style={{ color: blockEmployeeId === null ? 'white' : colors.textSecondary }}>
                    Todos
                  </Text>
                </Pressable>
                {professionals.map((prof) => (
                  <Pressable
                    key={prof.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBlockEmployeeId(prof.id); }}
                    className="flex-row items-center px-3 py-2 rounded-xl mr-2"
                    style={{ backgroundColor: blockEmployeeId === prof.id ? colors.primary : colors.backgroundCard, borderWidth: 1, borderColor: blockEmployeeId === prof.id ? colors.primary : colors.border }}
                  >
                    {prof.avatar ? (
                      <Image
                        source={{ uri: prof.avatar }}
                        className="w-6 h-6 rounded-full mr-2"
                        style={{ borderWidth: blockEmployeeId === prof.id ? 2 : 0, borderColor: 'white' }}
                      />
                    ) : null}
                    <Text className="text-sm font-semibold" style={{ color: blockEmployeeId === prof.id ? 'white' : colors.textSecondary }}>
                      {prof.name.split(' ')[0]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Reason */}
            <View className="mb-6">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>Motivo (opcional)</Text>
              <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                <View className="flex-row items-center px-4 h-12">
                  <InfoCircle size={16} color={colors.textMuted} variant="Outline" />
                  <TextInput
                    value={blockReason}
                    onChangeText={setBlockReason}
                    placeholder="Ex: Almoço, Reunião..."
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                  />
                </View>
              </View>
            </View>

            {/* Preview */}
            <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <View className="flex-row items-center mb-2">
                <Slash size={16} color={colors.textMuted} variant="Outline" />
                <Text className="ml-2 text-sm font-bold" style={{ color: colors.textSecondary }}>Pré-visualização</Text>
              </View>
              <Text className="text-xs" style={{ color: colors.textMuted }}>
                {blockDate || 'Data'} • {blockStartTime || '00:00'} - {blockEndTime || '00:00'}
              </Text>
              {blockReason ? <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>{blockReason}</Text> : null}
              <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>
                {blockEmployeeId ? professionals.find(p => p.id === blockEmployeeId)?.name ?? 'Profissional' : 'Todos os profissionais'}
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-5 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={handleCreateBlock}
              className="py-4 rounded-2xl items-center flex-row justify-center gap-2"
              style={{ backgroundColor: createBlock.isPending ? colors.textMuted : colors.primary, opacity: createBlock.isPending ? 0.7 : 1 }}
            >
              <Slash size={18} color="white" variant="Outline" />
              <Text className="text-white font-bold text-base">
                {createBlock.isPending ? 'Bloqueando...' : 'Bloquear Horário'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
