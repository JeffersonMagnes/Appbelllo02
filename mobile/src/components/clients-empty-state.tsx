import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/lib/theme';

export function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 56 }}>
      {icon}
      <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}
