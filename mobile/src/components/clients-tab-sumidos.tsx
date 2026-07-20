import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchNormal1, ArrowRight2, Calendar, User, Whatsapp, Profile2User } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { EmptyState } from '@/components/clients-empty-state';
import type { Client, Appointment } from '@/lib/types';

const DAYS_OPTIONS = [14, 30, 60, 90, 120];

export function ClientsTabSumidos({
  sumidosDays,
  setSumidosDays,
  sumidosMinApts,
  setSumidosMinApts,
  sumidosClientSearch,
  setSumidosClientSearch,
  sumidosClients,
  getLastAppointment,
  getClientAppointmentsCount,
  daysSince,
}: {
  sumidosDays: number;
  setSumidosDays: (v: number) => void;
  sumidosMinApts: number;
  setSumidosMinApts: (updater: (m: number) => number) => void;
  sumidosClientSearch: string;
  setSumidosClientSearch: (v: string) => void;
  sumidosClients: Client[];
  getLastAppointment: (clientId: string) => Appointment | undefined;
  getClientAppointmentsCount: (clientId: string) => number;
  daysSince: (dateStr: string) => number;
}) {
  const router = useRouter();

  const openWhatsApp = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tel = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${tel}`);
  };

  return (
    <>
      {/* Filtros */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
          {/* Chip de dias — cíclico */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
              Último atendimento a
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const idx = DAYS_OPTIONS.indexOf(sumidosDays);
                setSumidosDays(DAYS_OPTIONS[(idx + 1) % DAYS_OPTIONS.length]);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.backgroundCard }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
                {sumidosDays} dias ou mais
              </Text>
              <ArrowRight2 size={14} color={colors.primary} variant="Outline" />
            </Pressable>
          </View>

          {/* Stepper mínimo de atendimentos */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
              Pelo menos...
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: colors.backgroundCard, borderRadius: 10,
              borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8 }}>
              <Pressable onPress={() => setSumidosMinApts(m => Math.max(1, m - 1))}>
                <Text style={{ fontSize: 20, color: colors.primary, fontWeight: '700', lineHeight: 24 }}>−</Text>
              </Pressable>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, minWidth: 20, textAlign: 'center' }}>
                {sumidosMinApts}
              </Text>
              <Pressable onPress={() => setSumidosMinApts(m => m + 1)}>
                <Text style={{ fontSize: 20, color: colors.primary, fontWeight: '700', lineHeight: 24 }}>+</Text>
              </Pressable>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Atendimentos</Text>
          </View>
        </View>

        {/* Filtrar por cliente */}
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 }}>
          Filtrar por cliente
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard,
          borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 42, marginBottom: 4 }}>
          <SearchNormal1 size={15} color={colors.textMuted} variant="Outline" />
          <TextInput
            value={sumidosClientSearch}
            onChangeText={setSumidosClientSearch}
            placeholder="Buscar cliente..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, marginLeft: 8, color: colors.textPrimary, fontSize: 14 }}
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {sumidosClients.length === 0
          ? <EmptyState
              icon={<Profile2User size={40} color={colors.textMuted} variant="Outline" />}
              text="Nenhum cliente sumido com esses filtros." />
          : sumidosClients.map(c => {
              const last = getLastAppointment(c.id)!;
              const count = getClientAppointmentsCount(c.id);
              const days = daysSince(last.date);
              const dateFormatted = new Date(last.date + 'T12:00:00')
                .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' });
              return (
                <Pressable key={c.id}
                  onPress={() => router.push(`/admin/client-detail?id=${c.id}`)}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <User size={14} color={colors.primary} variant="Outline" />
                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                        <Calendar size={12} color={colors.textMuted} variant="Outline" />
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                          Último atendimento: {dateFormatted} · à {days} dias
                        </Text>
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                        Número de atendimentos: {count}
                      </Text>
                    </View>
                    {c.phone ? (
                      <Pressable
                        onPress={e => { e.stopPropagation(); openWhatsApp(c.phone); }}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
                          paddingVertical: 8, borderRadius: 10, backgroundColor: '#25D36620' }}>
                        <Whatsapp size={16} color="#25D366" variant="Bold" />
                        <Text style={{ color: '#25D366', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
                          WhatsApp
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
        }
      </ScrollView>
    </>
  );
}
