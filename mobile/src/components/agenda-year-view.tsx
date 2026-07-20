import React, { useMemo } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MagicStar } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Appointment } from '@/lib/types';
import { getYearMonths, isCurrentMonth } from '@/lib/utils/agenda-calendar';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const YEAR_MONTH_WIDTH = (SCREEN_WIDTH - 64) / 3;
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MINI_DAY_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function AgendaYearView({
  selectedDate,
  appointments,
  onSelectMonth,
}: {
  selectedDate: Date;
  appointments: Appointment[];
  onSelectMonth: (date: Date) => void;
}) {
  const yearMonths = useMemo(() => getYearMonths(selectedDate), [selectedDate]);

  const getAppointmentsForMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return appointments.filter((a: Appointment) => {
      const d = new Date(a.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  };

  const handleMonthSelect = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectMonth(date);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="px-5 mb-4"
    >
      <View className="flex-row flex-wrap justify-between">
        {yearMonths.map((monthDate, idx) => {
          const monthAppointments = getAppointmentsForMonth(monthDate);
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
                  {MONTH_NAMES[idx]}
                </Text>

                {/* Mini calendar preview */}
                <View className="flex-row flex-wrap">
                  {MINI_DAY_NAMES.map((d, i) => (
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
                      const hasApt = day && monthAppointments.some(a => {
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
                    {monthAppointments.length} agend.
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
