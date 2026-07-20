import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CloseCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { type ServicePackage } from '@/lib/hooks/use-service-packages';
import type { Client, Service } from '@/lib/types';

export function ClientsVincularPackageModal({
  visible,
  onClose,
  vincularClient,
  availablePackages,
  services,
  onConfirmPackage,
}: {
  visible: boolean;
  onClose: () => void;
  vincularClient: Client | null;
  availablePackages: ServicePackage[];
  services: Service[];
  onConfirmPackage: (pkg: ServicePackage) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <LinearGradient colors={[colors.primary + '22', colors.background]} style={{ paddingTop: 20, paddingBottom: 8 }}>
          <View className="flex-row items-center justify-between px-5 mb-2">
            <View>
              <Text className="text-gray-900 text-lg font-bold">Vincular Pacote</Text>
              {vincularClient && <Text className="text-gray-500 text-sm mt-0.5">para {vincularClient.name}</Text>}
            </View>
            <Pressable onPress={onClose} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
              <CloseCircle size={18} color={colors.textMuted} variant="Outline" />
            </Pressable>
          </View>
        </LinearGradient>
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          <Text className="text-gray-500 text-sm mb-4">Selecione o pacote a vincular ao cliente. A validade começa a contar a partir de hoje.</Text>
          {availablePackages.map(pkg => {
            const discount = pkg.discountPercent ?? 0;
            const pkgServices = services.filter(s => pkg.serviceIds.includes(s.id));
            return (
              <Pressable key={pkg.id}
                onPress={() => Alert.alert(`Vincular "${pkg.name}"?`,
                  `${pkg.sessions} sessões · ${pkg.validityDays} dias de validade\nValor: R$ ${pkg.price.toFixed(2)}`,
                  [{ text: 'Cancelar', style: 'cancel' }, { text: 'Vincular', onPress: () => onConfirmPackage(pkg) }])}
                className="mb-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
                <LinearGradient colors={[colors.primary + 'CC', colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />
                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-900 font-bold text-base flex-1 mr-2">{pkg.name}</Text>
                    {discount > 0 && (
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.success + '20' }}>
                        <Text className="text-xs font-bold" style={{ color: colors.success }}>-{discount}%</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{pkg.description}</Text>
                  <View className="flex-row flex-wrap gap-1.5 mb-3">
                    {pkgServices.map(s => (
                      <View key={s.id} className="px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.primary + '12' }}>
                        <Text className="text-xs font-medium" style={{ color: colors.primary }}>{s.name}</Text>
                      </View>
                    ))}
                  </View>
                  <View className="flex-row items-center justify-between pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                    <View className="flex-row items-center gap-4">
                      <Text className="text-gray-500 text-xs">{pkg.sessions} sessões</Text>
                      <Text className="text-gray-500 text-xs">{pkg.validityDays}d validade</Text>
                    </View>
                    <View className="items-end">
                      {discount > 0 && <Text className="text-xs line-through" style={{ color: colors.textMuted }}>-{discount}%</Text>}
                      <Text className="font-bold" style={{ color: colors.primary }}>R$ {pkg.price.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
          <View className="h-6" />
        </ScrollView>
      </View>
    </Modal>
  );
}
