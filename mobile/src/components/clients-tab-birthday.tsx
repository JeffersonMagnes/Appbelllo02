import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchNormal1, ArrowRight2 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { EmptyState } from '@/components/clients-empty-state';
import { MONTHS_PT, MONTHS_SHORT } from '@/lib/utils/month-names';
import type { Client } from '@/lib/types';

export function ClientsTabBirthday({
  searchQuery,
  setSearchQuery,
  birthdayMonth,
  setBirthdayMonth,
  birthdayClients,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  birthdayMonth: number;
  setBirthdayMonth: (v: number) => void;
  birthdayClients: Client[];
}) {
  const router = useRouter();
  const [showBirthdayMonthPicker, setShowBirthdayMonthPicker] = useState(false);
  const [bdPickerMonth, setBdPickerMonth] = useState(new Date().getMonth());

  return (
    <>
      {/* Filtro de mês */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: colors.border }}>
          <SearchNormal1 size={15} color={colors.textMuted} variant="Outline" />
          <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, marginLeft: 8, color: colors.textPrimary, fontSize: 14 }} />
        </View>
        <Pressable
          onPress={() => { setBdPickerMonth(birthdayMonth); setShowBirthdayMonthPicker(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10,
            borderRadius: 10, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.backgroundCard }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
            {MONTHS_SHORT[birthdayMonth]}
          </Text>
          <ArrowRight2 size={14} color={colors.primary} style={{ transform: [{ rotate: '90deg' }] }} variant="Outline" />
        </Pressable>
      </View>

      {/* Subtítulo */}
      <View style={{ backgroundColor: colors.surface, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginBottom: 8 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
          Aniversariantes do mês de {MONTHS_PT[birthdayMonth]}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {birthdayClients.length === 0
          ? <EmptyState icon={<Text style={{ fontSize: 40 }}>🎂</Text>} text="Nenhum dado encontrado." />
          : birthdayClients
              .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(c => {
                const bd = new Date(c.birthDate! + 'T12:00:00');
                const age = new Date().getFullYear() - bd.getFullYear();
                return (
                  <Pressable key={c.id}
                    onPress={() => router.push(`/admin/client-detail?id=${c.id}`)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                        Dia {bd.getDate()} de {MONTHS_PT[bd.getMonth()]} · {age} anos
                      </Text>
                      {c.phone ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>{c.phone}</Text> : null}
                    </View>
                    <Text style={{ fontSize: 26 }}>🎂</Text>
                  </Pressable>
                );
              })
        }
      </ScrollView>

      {/* Birthday month picker modal */}
      <Modal visible={showBirthdayMonthPicker} transparent animationType="fade" onRequestClose={() => setShowBirthdayMonthPicker(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
          <Pressable style={{ position: 'absolute', inset: 0 }} onPress={() => setShowBirthdayMonthPicker(false)} />
          <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 20, overflow: 'hidden' }}>
            <View style={{ padding: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>Selecione o mês</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {MONTHS_SHORT.map((m, idx) => (
                  <Pressable key={m} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBdPickerMonth(idx); }}
                    style={{ width: '30%', paddingVertical: 10, borderRadius: 10, borderWidth: 1,
                      borderColor: bdPickerMonth === idx ? colors.primary : colors.border,
                      backgroundColor: bdPickerMonth === idx ? colors.primary : colors.background, alignItems: 'center' }}>
                    <Text style={{ color: bdPickerMonth === idx ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{m}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => { setBirthdayMonth(bdPickerMonth); setShowBirthdayMonthPicker(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
                style={{ height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
