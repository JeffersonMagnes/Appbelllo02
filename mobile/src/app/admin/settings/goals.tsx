import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Chart2, TickCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { useGoalsStore } from '@/lib/state/goals-store';

const PRESETS = [3000, 5000, 10000, 20000, 30000, 50000];

export default function GoalsScreen() {
  const router = useRouter();
  const monthlyGoal = useGoalsStore(s => s.monthlyGoal);
  const setMonthlyGoal = useGoalsStore(s => s.setMonthlyGoal);

  const [input, setInput] = useState(String(monthlyGoal));
  const [saved, setSaved] = useState(false);

  const parsedValue = parseInt(input.replace(/\D/g, ''), 10);
  const isValid = !isNaN(parsedValue) && parsedValue > 0;

  const formatDisplay = (raw: string) => {
    const n = parseInt(raw.replace(/\D/g, ''), 10);
    if (isNaN(n)) return '';
    return n.toLocaleString('pt-BR');
  };

  const handleSave = () => {
    if (!isValid) return;
    setMonthlyGoal(parsedValue);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
              style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: colors.backgroundCard,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ArrowLeft size={20} color={colors.textPrimary} variant="Outline" />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>Meta Mensal</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 1 }}>Lucro alvo por mês</Text>
            </View>
            <View style={{ backgroundColor: colors.primary + '15', borderRadius: 13, padding: 10 }}>
              <Chart2 size={22} color={colors.primary} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Current goal display */}
            <View style={{
              backgroundColor: colors.backgroundCard,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              alignItems: 'center',
            }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                Meta atual
              </Text>
              <Text style={{ color: colors.primary, fontSize: 36, fontWeight: '900' }}>
                R$ {monthlyGoal.toLocaleString('pt-BR')}
              </Text>
            </View>

            {/* Input */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>
              Nova meta (R$)
            </Text>
            <View style={{
              backgroundColor: colors.backgroundCard,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: isValid ? colors.primary + '60' : colors.border,
              paddingHorizontal: 20,
              paddingVertical: 6,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{ color: colors.textMuted, fontSize: 22, fontWeight: '700', marginRight: 8 }}>R$</Text>
              <TextInput
                value={formatDisplay(input)}
                onChangeText={t => setInput(t.replace(/\D/g, ''))}
                keyboardType="numeric"
                style={{ flex: 1, fontSize: 28, fontWeight: '800', color: colors.textPrimary, paddingVertical: 12 }}
                selectTextOnFocus
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Presets */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>
              Valores rápidos
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {PRESETS.map(preset => {
                const selected = input === String(preset);
                return (
                  <Pressable
                    key={preset}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setInput(String(preset)); }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary + '15' : colors.backgroundCard,
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: selected ? colors.primary : colors.textSecondary,
                    }}>
                      R$ {preset.toLocaleString('pt-BR')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              style={{
                backgroundColor: saved ? colors.success : (isValid ? colors.primary : colors.border),
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {saved && <TickCircle size={20} color="#fff" variant="Bold" style={{ marginRight: 8 }} />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                {saved ? 'Meta salva!' : 'Salvar meta'}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
