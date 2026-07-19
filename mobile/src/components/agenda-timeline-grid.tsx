import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { User, Scissor, Slash } from 'iconsax-react-native';
import { colors, statusColors } from '@/lib/theme';
import { Appointment } from '@/lib/types';
import { BlockedSlot } from '@/lib/hooks/use-blocked-slots';

const MIN_CARD_HEIGHT = 46;

const HOUR_HEIGHT = 64;
const TIME_COL_WIDTH = 46;

type TimelineEntry =
  | { type: 'appointment'; data: Appointment }
  | { type: 'blocked'; data: BlockedSlot };

type MinimalService = { id: string; name: string; duration: number };
type MinimalClient = { id: string; name: string };

interface DayTimelineGridProps {
  date: Date;
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
  servicesList: MinimalService[];
  clientsList: MinimalClient[];
  openHour?: number;
  closeHour?: number;
  onAppointmentPress: (apt: Appointment) => void;
  onBlockedPress: (slot: BlockedSlot) => void;
  onSlotPress: (time: string) => void;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function DayTimelineGrid({
  date,
  appointments,
  blockedSlots,
  servicesList,
  clientsList,
  openHour = 7,
  closeHour = 21,
  onAppointmentPress,
  onBlockedPress,
  onSlotPress,
}: DayTimelineGridProps) {
  const positioned = useMemo(() => {
    const entries: TimelineEntry[] = [
      ...appointments.map((a) => ({ type: 'appointment' as const, data: a })),
      ...blockedSlots.map((s) => ({ type: 'blocked' as const, data: s })),
    ];

    const withRange = entries.map((e) => {
      const start = e.type === 'appointment' ? timeToMinutes(e.data.time) : timeToMinutes(e.data.startTime);
      let end: number;
      if (e.type === 'appointment') {
        const svc = servicesList.find((s) => s.id === e.data.serviceId);
        end = start + (svc?.duration ?? 30);
      } else {
        end = timeToMinutes(e.data.endTime);
      }
      return { entry: e, start, end: Math.max(end, start + 15) };
    });

    withRange.sort((a, b) => a.start - b.start || a.end - b.end);

    // Group into clusters of transitively-overlapping entries, then assign
    // each entry a column within its cluster so overlaps sit side-by-side.
    const result: Array<(typeof withRange)[number] & { col: number; cols: number }> = [];
    let cluster: typeof withRange = [];
    let clusterMaxEnd = -1;

    const flushCluster = () => {
      if (cluster.length === 0) return;
      const colEnds: number[] = [];
      const withCol = cluster.map((item) => {
        let col = colEnds.findIndex((end) => end <= item.start);
        if (col === -1) {
          col = colEnds.length;
          colEnds.push(item.end);
        } else {
          colEnds[col] = item.end;
        }
        return { ...item, col };
      });
      const cols = colEnds.length;
      withCol.forEach((item) => result.push({ ...item, cols }));
      cluster = [];
      clusterMaxEnd = -1;
    };

    for (const item of withRange) {
      if (cluster.length === 0 || item.start < clusterMaxEnd) {
        cluster.push(item);
        clusterMaxEnd = Math.max(clusterMaxEnd, item.end);
      } else {
        flushCluster();
        cluster.push(item);
        clusterMaxEnd = item.end;
      }
    }
    flushCluster();

    return result;
  }, [appointments, blockedSlots, servicesList]);

  const hourCount = closeHour - openHour;
  const gridHeight = hourCount * HOUR_HEIGHT;
  const hourMarks = Array.from({ length: hourCount + 1 }, (_, i) => openHour + i);

  const isToday = date.toDateString() === new Date().toDateString();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = isToday && nowMinutes >= openHour * 60 && nowMinutes <= closeHour * 60;
  const nowTop = ((nowMinutes - openHour * 60) / 60) * HOUR_HEIGHT;

  const handleSlotPress = (hour: number, half: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const time = `${String(hour).padStart(2, '0')}:${half === 0 ? '00' : '30'}`;
    onSlotPress(time);
  };

  return (
    <View style={{ flexDirection: 'row', paddingTop: 10 }}>
      {/* Time labels */}
      <View style={{ width: TIME_COL_WIDTH, height: gridHeight, position: 'relative' }}>
        {hourMarks.map((h, idx) => (
          <Text
            key={h}
            style={{
              position: 'absolute',
              top: idx === 0 ? 2 : idx * HOUR_HEIGHT - 7,
              right: 6,
              fontSize: 11,
              color: colors.textMuted,
            }}
          >
            {String(h).padStart(2, '0')}:00
          </Text>
        ))}
      </View>

      {/* Grid + entries */}
      <View style={{ flex: 1, height: gridHeight, position: 'relative' }}>
        {hourMarks.map((h, idx) => (
          <View
            key={h}
            style={{
              position: 'absolute',
              top: idx * HOUR_HEIGHT,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: colors.border,
            }}
          />
        ))}

        {Array.from({ length: hourCount }, (_, idx) => openHour + idx).map((h) => (
          <React.Fragment key={`slot-${h}`}>
            <Pressable
              onPress={() => handleSlotPress(h, 0)}
              style={{ position: 'absolute', top: (h - openHour) * HOUR_HEIGHT, left: 0, right: 0, height: HOUR_HEIGHT / 2 }}
            />
            <Pressable
              onPress={() => handleSlotPress(h, 1)}
              style={{ position: 'absolute', top: (h - openHour) * HOUR_HEIGHT + HOUR_HEIGHT / 2, left: 0, right: 0, height: HOUR_HEIGHT / 2 }}
            />
          </React.Fragment>
        ))}

        {showNowLine && (
          <View style={{ position: 'absolute', top: nowTop, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#EF4444', marginLeft: -3.5 }} />
            <View style={{ flex: 1, height: 1.5, backgroundColor: '#EF4444' }} />
          </View>
        )}

        {positioned.map((item) => {
          const top = ((item.start - openHour * 60) / 60) * HOUR_HEIGHT;
          const height = Math.max(((item.end - item.start) / 60) * HOUR_HEIGHT - 2, MIN_CARD_HEIGHT);
          const widthPct = 100 / item.cols;
          const leftPct = item.col * widthPct;
          const cardStyle = {
            position: 'absolute' as const,
            top,
            height,
            left: `${leftPct}%` as const,
            width: `${widthPct}%` as const,
            paddingHorizontal: 2,
            paddingBottom: 2,
          };

          if (item.entry.type === 'blocked') {
            const slot = item.entry.data;
            return (
              <Pressable key={`block-${slot.id}`} onPress={() => onBlockedPress(slot)} style={cardStyle}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    padding: 8,
                    overflow: 'hidden',
                    backgroundColor: colors.textMuted,
                    borderWidth: 1.5,
                    borderColor: colors.textMuted,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Slash size={12} color="#fff" variant="Outline" />
                    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                      {slot.startTime} - {slot.endTime}
                    </Text>
                  </View>
                  {height > 42 && (
                    <Text numberOfLines={1} style={{ fontSize: 10, color: '#fff', opacity: 0.85, marginTop: 2 }}>
                      Bloqueado{slot.reason ? ` · ${slot.reason}` : ''}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }

          const apt = item.entry.data;
          const sc = (statusColors as Record<string, string>)[apt.status] ?? colors.primary;
          const client = clientsList.find((c) => c.id === apt.clientId);
          const service = servicesList.find((s) => s.id === apt.serviceId);
          const endLabel = minutesToTime(item.end);

          return (
            <Pressable key={apt.id} onPress={() => onAppointmentPress(apt)} style={cardStyle}>
              <View
                style={{
                  flex: 1,
                  borderRadius: 10,
                  padding: 8,
                  overflow: 'hidden',
                  backgroundColor: sc,
                  borderWidth: 1.5,
                  borderColor: sc,
                }}
              >
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                  {apt.time} - {endLabel}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <User size={11} color="#fff" variant="Outline" />
                  <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '600', color: '#fff', flexShrink: 1 }}>
                    {client?.name ?? apt.clientName ?? 'Cliente'}
                  </Text>
                </View>
                {height > 58 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                    <Scissor size={10} color="#fff" variant="Outline" />
                    <Text numberOfLines={1} style={{ fontSize: 10, color: '#fff', opacity: 0.85, flexShrink: 1 }}>
                      {service?.name ?? ''}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
