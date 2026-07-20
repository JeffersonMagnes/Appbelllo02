import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Slash, Clock, User } from 'iconsax-react-native';
import { colors, statusColors } from '@/lib/theme';
import { StatusBadge } from '@/components/ui';
import { Appointment, Client, Employee, Service } from '@/lib/types';
import { type BlockedSlot } from '@/lib/hooks/use-blocked-slots';
import { type AgendaItem } from '@/lib/hooks/use-agenda-filters';

/** Merged, date-grouped list of appointments + blocked slots (used for week/month/year list views). */
export function AgendaItemsList({
  mergedItems,
  servicesList,
  clientsList,
  employeesList,
  onSelectAppointment,
  onSelectBlocked,
}: {
  mergedItems: AgendaItem[];
  servicesList: Service[];
  clientsList: Client[];
  employeesList: Employee[];
  onSelectAppointment: (apt: Appointment) => void;
  onSelectBlocked: (slot: BlockedSlot) => void;
}) {
  return (
    <View>
      {mergedItems.map((item, index) => {
        const itemDate = item.data.date;
        const prevItemDate = index > 0 ? mergedItems[index - 1].data.date : null;
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
                onPress={() => onSelectBlocked(slot)}
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
              onPress={() => onSelectAppointment(apt)}
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
  );
}
