import React from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchNormal1, Calendar, DocumentText, ArrowRight2, User, ClipboardText, Box, Flash, Call, Sms } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { type ClientPackage } from '@/lib/state/client-packages-store';
import type { Client } from '@/lib/types';

export function ClientsTabClientes({
  searchQuery,
  setSearchQuery,
  clientsData,
  filledAnamnesisCount,
  filteredClients,
  hasAnamnesis,
  getClientPackages,
  getClientAppointmentsCount,
  onVincularPackage,
  onUseSession,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  clientsData: Client[];
  filledAnamnesisCount: number;
  filteredClients: Client[];
  hasAnamnesis: (clientId: string) => boolean;
  getClientPackages: (clientId: string) => ClientPackage[];
  getClientAppointmentsCount: (clientId: string) => number;
  onVincularPackage: (client: Client) => void;
  onUseSession: (pkg: ClientPackage) => void;
}) {
  const router = useRouter();

  const handleNewAnamnesis = (client: Client) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/admin/anamnesis-templates', params: { clientId: client.id, clientName: client.name } });
  };

  return (
    <>
      {/* Search */}
      <View className="px-5 mt-3 mb-3">
        <View className="flex-row items-center px-4 py-3 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
          <SearchNormal1 size={20} color={colors.textMuted} variant="Outline" />
          <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar por nome ou telefone..."
            placeholderTextColor={colors.textMuted} className="flex-1 ml-3 text-gray-900" />
        </View>
      </View>

      {/* Stats */}
      <View className="px-5 mb-3">
        <View className="flex-row">
          <View className="flex-1 mr-2 p-3 rounded-xl items-center" style={{ backgroundColor: colors.backgroundCard }}>
            <Text style={{ color: colors.secondary }} className="text-2xl font-bold">{clientsData.length}</Text>
            <Text className="text-gray-500 text-xs">Total</Text>
          </View>
          <View className="flex-1 mx-2 p-3 rounded-xl items-center" style={{ backgroundColor: colors.backgroundCard }}>
            <Text style={{ color: colors.success }} className="text-2xl font-bold">{filledAnamnesisCount}</Text>
            <Text className="text-gray-500 text-xs">Com Anamnese</Text>
          </View>
          <View className="flex-1 ml-2 p-3 rounded-xl items-center" style={{ backgroundColor: colors.backgroundCard }}>
            <Text style={{ color: colors.warning }} className="text-2xl font-bold">
              {clientsData.filter((c: Client) => {
                const d = new Date(c.createdAt); const n = new Date();
                return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
              }).length}
            </Text>
            <Text className="text-gray-500 text-xs">Novos (mês)</Text>
          </View>
        </View>
      </View>

      {/* Client list */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {filteredClients.map((client: Client) => {
          const clientPkgs = getClientPackages(client.id);
          const activePkgs = clientPkgs.filter(p => p.status === 'active');
          return (
            <Pressable key={client.id}
              onPress={() => router.push(`/admin/client-detail?id=${client.id}`)}
              className="mb-3 rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundCard }}>
              <View className="p-4">
                <View className="flex-row items-center">
                  {client.avatar
                    ? <Image source={{ uri: client.avatar }} className="w-14 h-14 rounded-full mr-3" />
                    : <View className="w-14 h-14 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: colors.primary + '30' }}>
                        <User size={24} color={colors.primary} variant="Outline" />
                      </View>
                  }
                  <View className="flex-1">
                    <View className="flex-row items-center flex-wrap gap-1.5">
                      <Text className="text-gray-900 font-semibold text-base">{client.name}</Text>
                      {hasAnamnesis(client.id) && (
                        <View className="px-2 py-0.5 rounded" style={{ backgroundColor: colors.success + '20' }}>
                          <Text style={{ color: colors.success }} className="text-xs">Anamnese</Text>
                        </View>
                      )}
                      {activePkgs.length > 0 && (
                        <View className="px-2 py-0.5 rounded flex-row items-center" style={{ backgroundColor: colors.primary + '15' }}>
                          <Box size={10} color={colors.primary} variant="Outline" />
                          <Text style={{ color: colors.primary }} className="text-xs ml-1">{activePkgs.length} pacote{activePkgs.length > 1 ? 's' : ''}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Call size={12} color={colors.textMuted} />
                      <Text className="text-gray-500 text-sm ml-1">{client.phone}</Text>
                    </View>
                    <View className="flex-row items-center mt-0.5">
                      <Sms size={12} color={colors.textMuted} variant="Outline" />
                      <Text className="text-gray-500 text-sm ml-1">{client.email}</Text>
                    </View>
                  </View>
                  <ArrowRight2 size={20} color={colors.textMuted} variant="Outline" />
                </View>

                {/* Active packages mini preview */}
                {activePkgs.length > 0 && (
                  <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                    {activePkgs.slice(0, 2).map(pkg => {
                      const remaining = pkg.totalSessions - pkg.usedSessions;
                      const progress = pkg.usedSessions / pkg.totalSessions;
                      return (
                        <View key={pkg.id} className="mb-2">
                          <View className="flex-row items-center justify-between mb-1">
                            <View className="flex-row items-center flex-1 mr-2">
                              <Box size={11} color={colors.primary} variant="Outline" />
                              <Text className="text-gray-700 text-xs font-medium ml-1" numberOfLines={1}>{pkg.packageName}</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                              <Text className="text-xs font-bold" style={{ color: remaining > 0 ? colors.primary : colors.error }}>
                                {remaining} sessão{remaining !== 1 ? 'ões' : ''} restante{remaining !== 1 ? 's' : ''}
                              </Text>
                              <Pressable
                                onPress={e => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onUseSession(pkg); }}
                                className="px-2 py-1 rounded-lg flex-row items-center"
                                style={{ backgroundColor: colors.primary }}>
                                <Flash size={10} color="white" />
                                <Text className="text-white text-xs font-bold ml-1">Usar</Text>
                              </Pressable>
                            </View>
                          </View>
                          <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
                            <View style={{ height: 6, borderRadius: 3, width: `${Math.min(progress * 100, 100)}%`, backgroundColor: progress >= 1 ? colors.error : colors.primary }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Quick actions */}
                <View className="flex-row mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                  <View className="flex-1 flex-row items-center">
                    <Calendar size={14} color={colors.secondary} variant="Outline" />
                    <Text className="text-gray-600 text-xs ml-1">{getClientAppointmentsCount(client.id)} atendimentos</Text>
                  </View>
                  {client.notes && (
                    <View className="flex-row items-center mr-3">
                      <DocumentText size={14} color={colors.warning} variant="Outline" />
                      <Text className="text-gray-600 text-xs ml-1">Obs.</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={e => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onVincularPackage(client); }}
                    className="flex-row items-center px-3 py-1.5 rounded-lg mr-2"
                    style={{ backgroundColor: colors.primary + '15' }}>
                    <Box size={13} color={colors.primary} variant="Outline" />
                    <Text className="text-xs ml-1.5 font-medium" style={{ color: colors.primary }}>Pacote</Text>
                  </Pressable>
                  <Pressable
                    onPress={e => { e.stopPropagation(); handleNewAnamnesis(client); }}
                    className="flex-row items-center px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: colors.primary + '20' }}>
                    <ClipboardText size={13} color={colors.primary} />
                    <Text className="text-xs ml-1.5 font-medium" style={{ color: colors.primary }}>Ficha</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        })}
        <View className="h-6" />
      </ScrollView>
    </>
  );
}
