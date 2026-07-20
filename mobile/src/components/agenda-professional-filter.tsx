import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { colors } from '@/lib/theme';
import { Employee } from '@/lib/types';
import * as Haptics from 'expo-haptics';

export function ProfessionalFilterBar({
  professionals,
  selectedProfessional,
  onSelect,
}: {
  professionals: Employee[];
  selectedProfessional: string | null;
  onSelect: (professionalId: string | null) => void;
}) {
  return (
    <View className="mb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        style={{ flexGrow: 0 }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(null);
          }}
          className="flex-row items-center px-4 py-2.5 rounded-xl mr-2"
          style={{
            backgroundColor: !selectedProfessional ? colors.secondary : colors.backgroundCard,
          }}
        >
          <Text
            className="text-sm font-semibold"
            style={{ color: !selectedProfessional ? colors.background : colors.textSecondary }}
          >
            Todos
          </Text>
        </Pressable>
        {professionals.map((prof) => (
          <Pressable
            key={prof.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(prof.id);
            }}
            className="flex-row items-center px-3 py-2 rounded-xl mr-2"
            style={{
              backgroundColor: selectedProfessional === prof.id ? colors.secondary : colors.backgroundCard,
            }}
          >
            <Image
              source={{ uri: prof.avatar }}
              className="w-7 h-7 rounded-full mr-2"
              style={{
                borderWidth: selectedProfessional === prof.id ? 2 : 0,
                borderColor: colors.background,
              }}
            />
            <Text
              className="text-sm font-semibold"
              style={{
                color: selectedProfessional === prof.id ? colors.background : colors.textSecondary,
              }}
            >
              {prof.name.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
