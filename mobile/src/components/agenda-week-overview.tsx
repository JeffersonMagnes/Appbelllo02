import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2, ArrowRight2 } from 'iconsax-react-native';
import { colors, statusColors } from '@/lib/theme';
import { Appointment } from '@/lib/types';
import { BlockedSlot } from '@/lib/hooks/use-blocked-slots';
import { toLocalDateStr } from '@/lib/utils/date';

const HOUR_HEIGHT = 52;
const TIME_COL_WIDTH = 28;
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type MinimalService = { id: string; name: string; duration: number };
type MinimalClient = { id: string; name: string };

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

type DayItem =
  | { kind: 'apt'; data: Appointment; start: number; end: number }
  | { kind: 'blocked'; data: BlockedSlot; start: number; end: number };

// Groups a day's appointments + blocks into transitively-overlapping clusters.
// Each cluster renders as one card (earliest item) with a "+N" badge for the rest —
// there isn't enough horizontal room per day column to lay overlaps out side-by-side.
function clusterDay(apts: Appointment[], blocks: BlockedSlot[], servicesList: MinimalService[]) {
  const items: DayItem[] = [
    ...apts.map((a) => {
      const svc = servicesList.find((s) => s.id === a.serviceId);
      const start = timeToMinutes(a.time);
      return { kind: 'apt' as const, data: a, start, end: start + (svc?.duration ?? 30) };
    }),
    ...blocks.map((b) => ({ kind: 'blocked' as const, data: b, start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) })),
  ];
  items.sort((a, b) => a.start - b.start || a.end - b.end);

  const clusters: { start: number; end: number; items: DayItem[] }[] = [];
  let current: DayItem[] = [];
  let currentEnd = -1;
  const flush = () => {
    if (current.length === 0) return;
    clusters.push({
      start: Math.min(...current.map((i) => i.start)),
      end: Math.max(...current.map((i) => i.end)),
      items: current,
    });
    current = [];
    currentEnd = -1;
  };
  for (const item of items) {
    if (current.length === 0 || item.start < currentEnd) {
      current.push(item);
      currentEnd = Math.max(currentEnd, item.end);
    } else {
      flush();
      current.push(item);
      currentEnd = item.end;
    }
  }
  flush();
  return clusters;
}

interface WeekOverviewModalProps {
  visible: boolean;
  onClose: () => void;
  weekStart: Date;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
  servicesList: MinimalService[];
  clientsList: MinimalClient[];
  openHour?: number;
  closeHour?: number;
  onSelectAppointment: (apt: Appointment) => void;
  professionalLabel?: string;
  onOpenMonth?: () => void;
}

export function WeekOverviewModal({
  visible,
  onClose,
  weekStart,
  onNavigateWeek,
  appointments,
  blockedSlots,
  servicesList,
  clientsList,
  openHour = 7,
  closeHour = 21,
  onSelectAppointment,
  professionalLabel,
  onOpenMonth,
}: WeekOverviewModalProps) {
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart]
  );

  const hourCount = closeHour - openHour;
  const gridHeight = hourCount * HOUR_HEIGHT;
  const hourMarks = Array.from({ length: hourCount + 1 }, (_, i) => openHour + i);
  const rangeLabel = `Semana do dia ${String(weekStart.getDate()).padStart(2, '0')} de ${weekStart.toLocaleDateString('pt-BR', { month: 'long' })}`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 }}>
          <Pressable onPress={onClose}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Fechar</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', backgroundColor: colors.backgroundCard, borderRadius: 12, padding: 2 }}>
            <View style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Semanal</Text>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenMonth?.(); }}
              style={{ paddingHorizontal: 12, paddingVertical: 6, justifyContent: 'center' }}
            >
              <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 12 }}>Mensal</Text>
            </Pressable>
          </View>
          <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 12 }} numberOfLines={1}>
            {professionalLabel ?? 'Todos'}
          </Text>
        </View>

        {/* Week nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateWeek('prev'); }}>
            <ArrowLeft2 size={18} color={colors.textSecondary} variant="Outline" />
          </Pressable>
          <Text style={{ fontWeight: '700', color: colors.textPrimary, fontSize: 13 }}>{rangeLabel}</Text>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateWeek('next'); }}>
            <ArrowRight2 size={18} color={colors.textSecondary} variant="Outline" />
          </Pressable>
        </View>

        {/* Day headers */}
        <View style={{ flexDirection: 'row', paddingLeft: TIME_COL_WIDTH }}>
          {weekDates.map((d, i) => {
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>{DAY_LABELS[i]}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isToday ? colors.primary : colors.textPrimary }}>{d.getDate()}</Text>
              </View>
            );
          })}
        </View>

        {/* Grid */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: TIME_COL_WIDTH, height: gridHeight, position: 'relative' }}>
              {hourMarks.map((h, idx) => (
                <Text key={h} style={{ position: 'absolute', top: idx * HOUR_HEIGHT - 6, fontSize: 8, color: colors.textMuted }}>
                  {h}
                </Text>
              ))}
            </View>

            {weekDates.map((date, di) => {
              const dateStr = toLocalDateStr(date);
              const dayApts = appointments.filter((a) => a.date === dateStr);
              const dayBlocks = blockedSlots.filter((s) => s.date === dateStr);
              const clusters = clusterDay(dayApts, dayBlocks, servicesList);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <View
                  key={di}
                  style={{
                    flex: 1,
                    height: gridHeight,
                    position: 'relative',
                    borderLeftWidth: 1,
                    borderLeftColor: colors.border,
                    backgroundColor: isToday ? colors.primary + '08' : 'transparent',
                  }}
                >
                  {hourMarks.map((h, idx) => (
                    <View key={h} style={{ position: 'absolute', top: idx * HOUR_HEIGHT, left: 0, right: 0, height: 1, backgroundColor: colors.border }} />
                  ))}

                  {clusters.map((cluster) => {
                    const top = ((cluster.start - openHour * 60) / 60) * HOUR_HEIGHT;
                    const height = Math.max(((cluster.end - cluster.start) / 60) * HOUR_HEIGHT - 1, 28);
                    const first = cluster.items[0];
                    const extra = cluster.items.length - 1;

                    if (first.kind === 'blocked') {
                      return (
                        <View key={`b-${first.data.id}`} style={{ position: 'absolute', top, height, left: 1, right: 1 }}>
                          <View style={{ flex: 1, backgroundColor: colors.textMuted, borderRadius: 4, padding: 2, overflow: 'hidden' }}>
                            <Text numberOfLines={2} style={{ fontSize: 7, color: '#fff', fontWeight: '700' }}>Bloqueado</Text>
                          </View>
                        </View>
                      );
                    }

                    const apt = first.data as Appointment;
                    const sc = (statusColors as Record<string, string>)[apt.status] ?? colors.primary;
                    const client = clientsList.find((c) => c.id === apt.clientId);
                    const service = servicesList.find((s) => s.id === apt.serviceId);

                    return (
                      <Pressable
                        key={apt.id}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectAppointment(apt); }}
                        style={{ position: 'absolute', top, height, left: 1, right: 1 }}
                      >
                        <View style={{ flex: 1, backgroundColor: sc, borderRadius: 4, padding: 3, overflow: 'hidden' }}>
                          <Text numberOfLines={1} style={{ fontSize: 8, color: '#fff', fontWeight: '700' }}>
                            {(client?.name ?? apt.clientName ?? '?').split(' ')[0]}
                          </Text>
                          {height > 34 && (
                            <Text numberOfLines={1} style={{ fontSize: 7, color: '#fff', opacity: 0.85 }}>
                              {service?.name ?? ''}
                            </Text>
                          )}
                          {extra > 0 && (
                            <View
                              style={{
                                position: 'absolute', top: 1, right: 1,
                                backgroundColor: '#EF4444', borderRadius: 6, minWidth: 12, height: 12,
                                alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
                              }}
                            >
                              <Text style={{ color: '#fff', fontSize: 7, fontWeight: '800' }}>+{extra}</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
