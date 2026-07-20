import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Scissor, Box, Add, Printer, Card } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { Comanda, Client } from '@/lib/types';
import { formatCurrency, formatDate, getStatusConfig } from '@/lib/utils/comanda-format';

export function ComandaCard({
  comanda,
  client,
  onAddItem,
  onPrint,
  onPay,
}: {
  comanda: Comanda;
  client: Client | undefined;
  onAddItem: (comandaId: string) => void;
  onPrint: (comandaId: string, clientName: string, total: number) => void;
  onPay: (comandaId: string, clientName: string, total: number) => void;
}) {
  const sc = getStatusConfig(comanda.status);

  return (
    <View style={{ marginBottom: 12, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.backgroundCard }}>
      {/* Cabeçalho da comanda */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.backgroundLight }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {client?.avatar ? (
            <Image source={{ uri: client.avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
          ) : (
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <User size={16} color={colors.primary}  variant="Outline" />
            </View>
          )}
          <View>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{comanda.clientName}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>{formatDate(comanda.createdAt)}</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: sc.bg }}>
          <Text style={{ color: sc.color, fontSize: 12, fontWeight: '700' }}>{sc.label}</Text>
        </View>
      </View>

      {/* Itens */}
      <View style={{ padding: 16 }}>
        {comanda.items.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 8 }}>
            Nenhum item adicionado
          </Text>
        ) : (
          comanda.items.map((item, idx) => (
            <View
              key={item.id}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: 'rgba(0,0,0,0.06)' }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: item.type === 'service' ? colors.primary + '20' : colors.secondary + '20' }}>
                {item.type === 'service'
                  ? <Scissor size={13} color={colors.primary}  variant="Outline" />
                  : <Box size={13} color={colors.secondary}  variant="Outline" />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{item.type === 'service' ? 'Serviço' : 'Produto'} · ×{item.quantity}</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 14 }}>{formatCurrency(item.total)}</Text>
            </View>
          ))
        )}

        {/* Total */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' }}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Total</Text>
          <Text style={{ color: colors.secondary, fontSize: 22, fontWeight: '800' }}>{formatCurrency(comanda.total)}</Text>
        </View>

        {/* Ações — Comanda Aberta */}
        {comanda.status === 'open' && (
          <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
            <Pressable
              onPress={() => onAddItem(comanda.id)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 12, backgroundColor: colors.surface }}
            >
              <Add size={14} color={colors.textMuted}  variant="Outline" />
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Adicionar</Text>
            </Pressable>
            <Pressable
              onPress={() => onPrint(comanda.id, comanda.clientName, comanda.total)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 12, backgroundColor: colors.surface }}
            >
              <Printer size={14} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Recibo</Text>
            </Pressable>
            <Pressable
              onPress={() => onPay(comanda.id, comanda.clientName, comanda.total)}
              style={{ flex: 1.5, height: 40, borderRadius: 12, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={[colors.success, '#059669']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Card size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 5 }}>Pagar</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Ações — Comanda Paga/Fechada */}
        {(comanda.status === 'paid' || comanda.status === 'closed') && (
          <View style={{ marginTop: 14 }}>
            <Pressable
              onPress={() => onPrint(comanda.id, comanda.clientName, comanda.total)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' }}
            >
              <Printer size={15} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>
                Ver / Reenviar Recibo
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
