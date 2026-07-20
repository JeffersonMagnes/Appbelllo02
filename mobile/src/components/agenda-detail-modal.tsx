import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal, TextInput, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight2, Clock, Calendar as CalendarIcon, CalendarTick, User, MagicStar, CloseCircle,
  Scissor, DollarCircle, TickCircle, InfoCircle, Money, Mobile, Card,
} from 'iconsax-react-native';
import { colors, statusColors } from '@/lib/theme';
import { APPOINTMENT_STATUS_LABEL } from '@/lib/appointment-status';
import { Appointment, Client, Employee, Service } from '@/lib/types';
import { localDateFromStr } from '@/lib/utils/date';
import { useRescheduleAppointment } from '@/lib/hooks/use-appointments';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_ICON: Record<string, React.ReactNode> = {
  confirmed: <TickCircle size={16} color={statusColors.confirmed} />,
  pending: <InfoCircle size={16} color={statusColors.pending} />,
  completed: <TickCircle size={16} color={statusColors.completed} />,
  cancelled: <CloseCircle size={16} color={statusColors.cancelled}  variant="Outline" />,
};

const STATUS_SHEET_OPTIONS: { key: string; label: string; color: string; bg: string; border: string }[] = [
  { key: 'confirmed',  label: 'Confirmado',     color: colors.success,  bg: colors.success  + '15', border: colors.success  + '40' },
  { key: 'pending',    label: 'A confirmar',    color: colors.warning,  bg: colors.warning  + '15', border: colors.warning  + '40' },
  { key: 'completed',  label: 'Concluído',      color: '#5333ED',       bg: '#5333ED15',             border: '#5333ED40'            },
  { key: 'delayed',    label: 'Atrasou',        color: '#FF6B00',       bg: '#FF6B0015',             border: '#FF6B0040'            },
  { key: 'cancelled',  label: 'Cancelado',      color: colors.error,    bg: colors.error    + '15', border: colors.error    + '40' },
  { key: 'no_show',    label: 'Não compareceu', color: colors.textMuted, bg: colors.surface, border: colors.border },
];

const STATUS_PICKER_LABEL: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'A confirmar', completed: 'Concluído',
  cancelled: 'Cancelado', delayed: 'Atrasou', no_show: 'Não compareceu',
};

const PAYMENT_METHODS: { label: string; sub: string; iconActive: React.ReactNode; iconInactive: React.ReactNode; grad: [string, string]; color: string }[] = [
  { label: 'PIX',               sub: 'Transferência instantânea', iconActive: <Mobile size={20} color="#fff" />, iconInactive: <Mobile size={20} color="#00C4B4" />, grad: ['#00C4B4', '#0097A7'], color: '#00C4B4' },
  { label: 'Cartão de crédito', sub: 'Crédito parcelado',         iconActive: <Card  size={20} color="#fff" />, iconInactive: <Card  size={20} color="#5333ed" />, grad: ['#5333ed', '#7B5FFF'], color: '#5333ed' },
  { label: 'Cartão de débito',  sub: 'Débito à vista',            iconActive: <Card  size={20} color="#fff" />, iconInactive: <Card  size={20} color="#3B82F6" />, grad: ['#3B82F6', '#2563EB'], color: '#3B82F6' },
  { label: 'Dinheiro',          sub: 'Pagamento em espécie',      iconActive: <Money size={20} color="#fff" />, iconInactive: <Money size={20} color="#10B981" />, grad: ['#10B981', '#059669'], color: '#10B981' },
  { label: 'Cheque',            sub: 'Cheque bancário',           iconActive: <DollarCircle size={20} color="#fff"  variant="Outline" />, iconInactive: <DollarCircle size={20} color="#FF9F0A"  variant="Outline" />, grad: ['#FF9F0A', '#CC7A00'], color: '#FF9F0A' },
  { label: 'Cortesia',          sub: 'Sem cobrança',              iconActive: <MagicStar size={20} color="#fff"  variant="Outline" />, iconInactive: <MagicStar size={20} color="#8B5CF6"  variant="Outline" />, grad: ['#8B5CF6', '#6D28D9'], color: '#8B5CF6' },
];

export function AppointmentDetailModal({
  appointment,
  visible,
  onClose,
  servicesList,
  clientsList,
  employeesList,
  establishmentId,
  aptStatus,
  setAptStatus,
  aptPayment,
  setAptPayment,
  editingDateTime,
  setEditingDateTime,
  editDate,
  setEditDate,
  editTime,
  setEditTime,
  showPaymentSheet,
  setShowPaymentSheet,
  showStatusSheet,
  setShowStatusSheet,
  reschedule,
  showToast,
  onRequestCancel,
  onMarkCompleted,
}: {
  appointment: Appointment;
  visible: boolean;
  onClose: () => void;
  servicesList: Service[];
  clientsList: Client[];
  employeesList: Employee[];
  establishmentId: string | undefined;
  aptStatus: string;
  setAptStatus: (status: string) => void;
  aptPayment: string;
  setAptPayment: (payment: string) => void;
  editingDateTime: boolean;
  setEditingDateTime: (v: boolean) => void;
  editDate: string;
  setEditDate: (v: string) => void;
  editTime: string;
  setEditTime: (v: string) => void;
  showPaymentSheet: boolean;
  setShowPaymentSheet: (v: boolean) => void;
  showStatusSheet: boolean;
  setShowStatusSheet: (v: boolean) => void;
  reschedule: ReturnType<typeof useRescheduleAppointment>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onRequestCancel: () => void;
  onMarkCompleted: () => void;
}) {
  const apt = appointment;
  const service = servicesList.find((s) => s.id === apt.serviceId);
  const professional = employeesList.find((e) => e.id === apt.professionalId);
  const client = clientsList.find((c) => c.id === apt.clientId);
  const statusColor = statusColors[apt.status];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
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
              onPress={onClose}
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
              {STATUS_ICON[apt.status]}
              <Text className="text-xs font-bold ml-1.5" style={{ color: statusColor }}>
                {APPOINTMENT_STATUS_LABEL[apt.status] ?? apt.status}
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
                          onClose();
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
                {(STATUS_ICON as Record<string, React.ReactNode>)[aptStatus] ?? <InfoCircle size={20} color={colors.primary} />}
              </View>
              <View>
                <Text className="text-gray-400 text-xs mb-0.5">Status / Situação</Text>
                <Text className="text-gray-900 font-bold">
                  {STATUS_PICKER_LABEL[aptStatus] ?? aptStatus ?? 'Selecionar'}
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
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onRequestCancel(); }}
              className="flex-1 py-3.5 rounded-2xl items-center"
              style={{ backgroundColor: colors.error + '15', borderWidth: 1, borderColor: colors.error + '40' }}
            >
              <Text className="font-bold text-sm" style={{ color: colors.error }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onMarkCompleted(); }}
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
                {PAYMENT_METHODS.map(m => {
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
                {STATUS_SHEET_OPTIONS.map(opt => {
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
}
