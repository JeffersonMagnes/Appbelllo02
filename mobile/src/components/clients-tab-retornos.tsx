import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchNormal1, ArrowRight2, Calendar } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { EmptyState } from '@/components/clients-empty-state';
import type { Client, Appointment } from '@/lib/types';

const RETORNOS_DAYS = [7, 14, 30, 60, 90];

export function ClientsTabRetornos({
  retornosDays,
  setRetornosDays,
  retornosClientSearch,
  setRetornosClientSearch,
  retornosClients,
  getLastAppointment,
  getClientAppointmentsCount,
  daysSince,
}: {
  retornosDays: number;
  setRetornosDays: (v: number) => void;
  retornosClientSearch: string;
  setRetornosClientSearch: (v: string) => void;
  retornosClients: Client[];
  getLastAppointment: (clientId: string) => Appointment | undefined;
  getClientAppointmentsCount: (clientId: string) => number;
  daysSince: (dateStr: string) => number;
}) {
  const router = useRouter();

  return (
    <>
      {/* Filtros */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 10 }}>
          {/* Chip de dias — cíclico */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
              Últimos
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const idx = RETORNOS_DAYS.indexOf(retornosDays);
                setRetornosDays(RETORNOS_DAYS[(idx + 1) % RETORNOS_DAYS.length]);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.backgroundCard }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
                {retornosDays} dias
              </Text>
              <ArrowRight2 size={14} color={colors.primary} variant="Outline" />
            </Pressable>
          </View>
          {/* Resultado */}
          <View style={{ alignItems: 'center', paddingBottom: 2 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 22, lineHeight: 26 }}>
              {retornosClients.length}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>cliente{retornosClients.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Filtrar por cliente */}
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
          Filtrar por cliente
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard,
          borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 42 }}>
          <SearchNormal1 size={15} color={colors.textMuted} variant="Outline" />
          <TextInput
            value={retornosClientSearch}
            onChangeText={setRetornosClientSearch}
            placeholder="Buscar cliente..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, marginLeft: 8, color: colors.textPrimary, fontSize: 14 }}
          />
        </View>

        {/* Subtítulo */}
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginTop: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
            Clientes que retornaram nos últimos {retornosDays} dias
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {retornosClients.length === 0
          ? <EmptyState
              icon={<Calendar size={40} color={colors.textMuted} variant="Outline" />}
              text={`Nenhum cliente retornou nos últimos ${retornosDays} dias.`} />
          : retornosClients.map(c => {
              const last = getLastAppointment(c.id)!;
              const count = getClientAppointmentsCount(c.id);
              const days = daysSince(last.date);
              const dateFormatted = new Date(last.date + 'T12:00:00')
                .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' });
              return (
                <Pressable key={c.id}
                  onPress={() => router.push(`/admin/client-detail?id=${c.id}`)}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                  {c.phone ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>{c.phone}</Text> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <Calendar size={12} color={colors.primary} variant="Outline" />
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      Último: {dateFormatted} · há {days} dia{days !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                    Número de atendimentos: {count}
                  </Text>
                </Pressable>
              );
            })
        }
      </ScrollView>
    </>
  );
}
