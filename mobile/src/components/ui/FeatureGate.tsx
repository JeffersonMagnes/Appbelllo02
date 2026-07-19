import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/state/auth-store';
import { useFeatureGate } from '@/lib/hooks/use-plan-features';
import { Crown } from 'iconsax-react-native';
import { colors } from '@/lib/theme';

interface FeatureGateProps {
  featureKey: string;
  children: React.ReactNode;
}

export function FeatureGate({ featureKey, children }: FeatureGateProps) {
  const router = useRouter();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { allowed, loading } = useFeatureGate(featureKey, establishmentId ?? undefined);

  if (loading) return <>{children}</>;
  if (allowed) return <>{children}</>;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background }}>
      <Crown size={48} color={colors.warning} variant="Outline" />
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 16 }}>Recurso Premium</Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
        {'Este recurso não está disponível no seu plano atual. Faça upgrade para acessar.'}
      </Text>
      <Pressable
        onPress={() => router.push('/paywall')}
        style={{ marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Ver Planos</Text>
      </Pressable>
    </View>
  );
}
