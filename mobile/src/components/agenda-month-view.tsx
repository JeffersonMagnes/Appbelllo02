import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, statusColors } from '@/lib/theme';
import { Appointment, Client, Service } from '@/lib/types';
import { toLocalDateStr } from '@/lib/utils/date';
import { getMonthGridDays, isSameDay, isToday } from '@/lib/utils/agenda-calendar';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function AgendaMonthView({
  selectedDate,
  appointments,
  clientsList,
  servicesList,
  onSelectDate,
  onSelectAppointment,
}: {
  selectedDate: Date;
  appointments: Appointment[];
  clientsList: Client[];
  servicesList: Service[];
  onSelectDate: (date: Date) => void;
  onSelectAppointment: (apt: Appointment) => void;
}) {
  const [calendarView, setCalendarView] = useState<'counter' | 'list'>('counter');

  const monthData = useMemo(() => getMonthGridDays(selectedDate), [selectedDate]);

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = toLocalDateStr(date);
    return appointments.filter((a: Appointment) => a.date === dateStr);
  };

  const handleDateSelect = (date: Date | null) => {
    if (!date) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDate(date);
  };

  return (
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
        {DAY_NAMES.map((day, idx) => (
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
              const selected = isSameDay(date, selectedDate);
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
                  const selected = isSameDay(date, selectedDate);
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
                          <Pressable key={i} onPress={() => onSelectAppointment(apt)} style={{
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
  );
}
