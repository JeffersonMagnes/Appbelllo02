import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchNormal1, ArrowRight2, DocumentText } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { EmptyState } from '@/components/clients-empty-state';
import { MONTHS_PT, MONTHS_SHORT } from '@/lib/utils/month-names';
import { type FilledAnamnesis } from '@/lib/state/anamnesis-store';

export function ClientsTabAnamnesis({
  anamnesisYear,
  setAnamnesisYear,
  anamnesisMonth,
  setAnamnesisMonth,
  anamnesisClientSearch,
  setAnamnesisClientSearch,
  filteredAnamnesis,
  getClientName,
}: {
  anamnesisYear: number;
  setAnamnesisYear: (v: number) => void;
  anamnesisMonth: number;
  setAnamnesisMonth: (v: number) => void;
  anamnesisClientSearch: string;
  setAnamnesisClientSearch: (v: string) => void;
  filteredAnamnesis: FilledAnamnesis[];
  getClientName: (clientId: string) => string | undefined;
}) {
  const router = useRouter();
  const now = new Date();
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(now.getMonth());

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
          Filtrar por data
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Pressable
            onPress={() => { setPickerYear(anamnesisYear); setPickerMonth(anamnesisMonth); setShowMonthPicker(true); }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
              borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.backgroundCard }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
              {MONTHS_PT[anamnesisMonth]} de {anamnesisYear}
            </Text>
            <ArrowRight2 size={16} color={colors.primary} style={{ transform: [{ rotate: '90deg' }] }} variant="Outline" />
          </Pressable>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>ou</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Filtrar por cliente</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10,
              borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundCard,
              paddingHorizontal: 10, height: 40 }}>
              <TextInput value={anamnesisClientSearch} onChangeText={setAnamnesisClientSearch}
                placeholder="Selecione..." placeholderTextColor={colors.textMuted}
                style={{ flex: 1, color: colors.textPrimary, fontSize: 13 }} />
              <SearchNormal1 size={14} color={colors.textMuted} variant="Outline" />
            </View>
          </View>
        </View>
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            Fichas para {MONTHS_PT[anamnesisMonth]} de {anamnesisYear}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {filteredAnamnesis.length === 0
          ? <EmptyState icon={<DocumentText size={40} color={colors.textMuted} variant="Outline" />} text="Nenhum resultado encontrado." />
          : filteredAnamnesis.map(a => {
              const date = new Date(a.filledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
              return (
                <Pressable key={a.id}
                  onPress={() => router.push({ pathname: '/admin/anamnesis-form', params: { anamnesisId: a.id, clientId: a.clientId, templateId: a.templateId } })}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <DocumentText size={18} color={colors.primary} variant="Outline" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>{getClientName(a.clientId) ?? 'Cliente'}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{a.templateName} · {date}</Text>
                  </View>
                  <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" />
                </Pressable>
              );
            })
        }
        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
          <Pressable style={{ position: 'absolute', inset: 0 }} onPress={() => setShowMonthPicker(false)} />
          <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 20, overflow: 'hidden' }}>
            <View style={{ padding: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>Ano</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4, marginBottom: 20 }} style={{ flexGrow: 0 }}>
                {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                  <Pressable key={y} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPickerYear(y); }}
                    style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: pickerYear === y ? colors.primary : colors.border, backgroundColor: pickerYear === y ? colors.primary : colors.background }}>
                    <Text style={{ color: pickerYear === y ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{y}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>Mês</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {MONTHS_SHORT.map((m, idx) => (
                  <Pressable key={m} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPickerMonth(idx); }}
                    style={{ width: '30%', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: pickerMonth === idx ? colors.primary : colors.border, backgroundColor: pickerMonth === idx ? colors.primary : colors.background, alignItems: 'center' }}>
                    <Text style={{ color: pickerMonth === idx ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{m}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => { setAnamnesisYear(pickerYear); setAnamnesisMonth(pickerMonth); setShowMonthPicker(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
                style={{ height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
