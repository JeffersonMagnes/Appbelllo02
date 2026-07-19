import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Calendar, Cup, CloseCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';

// Mapeamento curto → chave completa usada no banco e na página pública
const SHORT_TO_FULL: Record<string, string> = {
  dom: 'domingo', seg: 'segunda', ter: 'terca',
  qua: 'quarta', qui: 'quinta', sex: 'sexta', sab: 'sabado',
};

const weekDays = [
  { key: 'dom', label: 'Dom' },
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
];

const timeOptions = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

const durationOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 horas' },
];

const cancellationOptions = [
  { value: 1, label: '1h' },
  { value: 2, label: '2h' },
  { value: 6, label: '6h' },
  { value: 12, label: '12h' },
  { value: 24, label: '24h' },
  { value: 48, label: '48h' },
];

export default function EditHoursScreen() {
  const router = useRouter();
  const userId = useAuthStore(s => s.currentUser?.id);
  const [loading, setLoading] = useState(false);
  const [estId, setEstId] = useState('');
  const [form, setForm] = useState({
    openingTime: '08:00',
    closingTime: '20:00',
    workingDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
    breakStart: '12:00',
    breakEnd: '13:00',
    cancellationPolicy: 24,
    defaultServiceDuration: 30,
  });

  const [showOpeningPicker, setShowOpeningPicker] = useState(false);
  const [showClosingPicker, setShowClosingPicker] = useState(false);
  const [showBreakStartPicker, setShowBreakStartPicker] = useState(false);
  const [showBreakEndPicker, setShowBreakEndPicker] = useState(false);

  // Carregar horários existentes do banco
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('establishments')
        .select('id,hours_json')
        .eq('owner_id', userId)
        .maybeSingle();
      if (!data) return;
      setEstId(data.id);
      const hj = data.hours_json as Record<string, { open: string; close: string; active: boolean }> | null;
      if (!hj) return;
      // Detectar dias ativos e horário mais comum
      const activeDays = weekDays
        .filter(d => hj[SHORT_TO_FULL[d.key]]?.active)
        .map(d => d.key);
      const firstActive = weekDays.find(d => hj[SHORT_TO_FULL[d.key]]?.active);
      if (firstActive) {
        const key = SHORT_TO_FULL[firstActive.key];
        setForm(f => ({
          ...f,
          workingDays: activeDays,
          openingTime: hj[key]?.open || f.openingTime,
          closingTime: hj[key]?.close || f.closingTime,
        }));
      }
    })();
  }, [userId]);

  const toggleWorkingDay = (day: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDays = form.workingDays.includes(day)
      ? form.workingDays.filter((d) => d !== day)
      : [...form.workingDays, day];
    setForm({ ...form, workingDays: newDays });
  };

  const handleSave = async () => {
    if (!estId) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Converter para o formato esperado pela página pública
    const hours_json = Object.fromEntries(
      weekDays.map(d => [
        SHORT_TO_FULL[d.key],
        {
          open: form.openingTime,
          close: form.closingTime,
          active: form.workingDays.includes(d.key),
        },
      ])
    );

    await supabase.from('establishments').update({ hours_json }).eq('id', estId);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
    router.back();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            <ArrowLeft size={20} color={colors.textPrimary}  variant="Outline" />
          </Pressable>
          <Text className="text-gray-900 font-bold text-lg">Horários</Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-4">
            {/* Working Hours */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Clock size={18} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-900/80 text-sm font-medium ml-2">
                  Horário de funcionamento
                </Text>
              </View>

              <View className="flex-row gap-3">
                <TimeSelector
                  label="Abre às"
                  value={form.openingTime}
                  isOpen={showOpeningPicker}
                  onToggle={() => {
                    setShowOpeningPicker(!showOpeningPicker);
                    setShowClosingPicker(false);
                    setShowBreakStartPicker(false);
                    setShowBreakEndPicker(false);
                  }}
                  onSelect={(time) => {
                    setForm({ ...form, openingTime: time });
                    setShowOpeningPicker(false);
                  }}
                />
                <TimeSelector
                  label="Fecha às"
                  value={form.closingTime}
                  isOpen={showClosingPicker}
                  onToggle={() => {
                    setShowClosingPicker(!showClosingPicker);
                    setShowOpeningPicker(false);
                    setShowBreakStartPicker(false);
                    setShowBreakEndPicker(false);
                  }}
                  onSelect={(time) => {
                    setForm({ ...form, closingTime: time });
                    setShowClosingPicker(false);
                  }}
                />
              </View>
            </View>

            {/* Working Days */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Calendar size={18} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-900/80 text-sm font-medium ml-2">
                  Dias de atendimento
                </Text>
              </View>

              <View className="flex-row justify-between">
                {weekDays.map((day) => {
                  const isSelected = form.workingDays.includes(day.key);
                  return (
                    <Pressable
                      key={day.key}
                      onPress={() => toggleWorkingDay(day.key)}
                      className="w-11 h-11 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.backgroundCard,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: isSelected ? '#fff' : colors.textMuted,
                        }}
                      >
                        {day.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Break Time */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Cup size={18} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-900/80 text-sm font-medium ml-2">
                  Intervalo / Pausa
                </Text>
              </View>

              <View className="flex-row gap-3">
                <TimeSelector
                  label="Início"
                  value={form.breakStart}
                  isOpen={showBreakStartPicker}
                  onToggle={() => {
                    setShowBreakStartPicker(!showBreakStartPicker);
                    setShowBreakEndPicker(false);
                    setShowOpeningPicker(false);
                    setShowClosingPicker(false);
                  }}
                  onSelect={(time) => {
                    setForm({ ...form, breakStart: time });
                    setShowBreakStartPicker(false);
                  }}
                />
                <TimeSelector
                  label="Fim"
                  value={form.breakEnd}
                  isOpen={showBreakEndPicker}
                  onToggle={() => {
                    setShowBreakEndPicker(!showBreakEndPicker);
                    setShowBreakStartPicker(false);
                    setShowOpeningPicker(false);
                    setShowClosingPicker(false);
                  }}
                  onSelect={(time) => {
                    setForm({ ...form, breakEnd: time });
                    setShowBreakEndPicker(false);
                  }}
                />
              </View>
            </View>

            {/* Cancellation Policy */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-900/80 text-sm font-medium ml-2">
                  Política de cancelamento
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {cancellationOptions.map((option) => {
                  const isSelected = form.cancellationPolicy === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setForm({ ...form, cancellationPolicy: option.value });
                      }}
                      className="rounded-xl px-4 py-2"
                      style={{
                        backgroundColor: isSelected
                          ? colors.primary + '20'
                          : colors.backgroundCard,
                        borderWidth: isSelected ? 1.5 : 0,
                        borderColor: colors.primary,
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color: isSelected ? colors.primary : colors.textSecondary,
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Default Service Duration */}
            <View className="mb-8">
              <View className="flex-row items-center mb-3">
                <Clock size={18} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-900/80 text-sm font-medium ml-2">
                  Duração padrão dos serviços
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {durationOptions.map((option) => {
                  const isSelected = form.defaultServiceDuration === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setForm({ ...form, defaultServiceDuration: option.value });
                      }}
                      className="rounded-xl px-4 py-2"
                      style={{
                        backgroundColor: isSelected
                          ? colors.primary + '20'
                          : colors.backgroundCard,
                        borderWidth: isSelected ? 1.5 : 0,
                        borderColor: colors.primary,
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color: isSelected ? colors.primary : colors.textSecondary,
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View
          className="px-5 py-4"
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Button
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="lg"
          >
            Salvar alterações
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

interface TimeSelectorProps {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (time: string) => void;
}

function TimeSelector({ label, value, isOpen, onToggle, onSelect }: TimeSelectorProps) {
  return (
    <View className="flex-1">
      <Text className="text-gray-900/50 text-xs mb-2">{label}</Text>
      <Pressable
        onPress={onToggle}
        className="rounded-xl px-4 py-3"
        style={{ backgroundColor: colors.backgroundCard }}
      >
        <Text className="text-gray-900 font-medium text-center">{value}</Text>
      </Pressable>

      {isOpen && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="absolute top-full left-0 right-0 z-10 mt-2 rounded-xl overflow-hidden"
          style={{
            backgroundColor: colors.backgroundCard,
            maxHeight: 200,
          }}
        >
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {timeOptions.map((time) => (
              <Pressable
                key={time}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(time);
                }}
                className="px-4 py-3"
                style={{
                  backgroundColor: time === value ? colors.primary + '20' : 'transparent',
                }}
              >
                <Text
                  className="text-center font-medium"
                  style={{
                    color: time === value ? colors.primary : colors.textSecondary,
                  }}
                >
                  {time}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
