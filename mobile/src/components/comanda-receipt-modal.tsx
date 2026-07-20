import React from 'react';
import { View, Text, ScrollView, Pressable, Modal, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Printer, TickSquare, User } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils/comanda-format';
import { type PaymentMethod, type ReceiptData } from '@/lib/comanda-ui-types';
import * as Haptics from 'expo-haptics';

// ── Modal Recibo ─────────────────────────────────────────────────────────────
const SLICE_ICON: Record<PaymentMethod, string> = {
  pix: '📱', credit: '💳', debit: '💳', cash: '💵', cheque: '🏦', cortesia: '🎁',
};
const SLICE_LABEL: Record<PaymentMethod, string> = {
  pix: 'PIX', credit: 'Crédito', debit: 'Débito', cash: 'Dinheiro', cheque: 'Cheque', cortesia: 'Cortesia',
};

export function ReceiptModal({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  const paidAtDate = data.paidAt
    ? new Date(data.paidAt).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lines = [
      `🧾 RECIBO ${data.receiptNum}`,
      `📅 ${paidAtDate}`,
      `👤 ${data.clientName}`,
      `─────────────────`,
      ...data.items.map(i => `${i.name}  ${formatCurrency(i.total)}`),
      `─────────────────`,
      data.discountAmt > 0 ? `Desconto (${data.discountLabel})  -${formatCurrency(data.discountAmt)}` : null,
      `TOTAL  ${formatCurrency(data.finalTotal)}`,
      `─────────────────`,
      ...data.slices.map(s => `${SLICE_LABEL[s.method]}  ${formatCurrency(s.amount)}`),
      `─────────────────`,
      `Obrigado pela preferência! 🙏`,
    ].filter(Boolean).join('\n');
    Share.share({ message: lines });
  };

  return (
    <Modal visible={data.visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}
      >
        <Pressable style={{ position: 'absolute', inset: 0 }} onPress={onClose} />

        <Animated.View
          entering={ZoomIn.springify().damping(18).stiffness(260)}
          style={{ width: '100%', maxHeight: '88%' }}
        >
          {/* Cabeçalho do recibo — parte escura */}
          <LinearGradient
            colors={[colors.primary, '#2c1280']}
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, alignItems: 'center' }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
              Recibo de Pagamento
            </Text>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 }}>
              {data.receiptNum}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>{paidAtDate}</Text>

            {/* Badge pago */}
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(48,209,88,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(48,209,88,0.4)' }}>
              <TickSquare size={12} color="#30D158" strokeWidth={3}  variant="Outline" />
              <Text style={{ color: '#30D158', fontSize: 12, fontWeight: '800', marginLeft: 5 }}>PAGO</Text>
            </View>
          </LinearGradient>

          {/* Borda serrilhada simulada */}
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0)' }}>
            {Array.from({ length: 22 }).map((_, i) => (
              <View key={i} style={{ flex: 1, height: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: i % 2 === 0 ? '#F7F5FF' : 'transparent' }} />
            ))}
          </View>

          {/* Corpo do recibo — papel claro */}
          <ScrollView
            style={{ backgroundColor: '#F7F5FF' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>

              {/* Cliente */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <User size={18} color={colors.primary}  variant="Outline" />
                </View>
                <View>
                  <Text style={{ color: '#888', fontSize: 11, fontWeight: '600' }}>CLIENTE</Text>
                  <Text style={{ color: '#1C1C1E', fontSize: 15, fontWeight: '700' }}>{data.clientName}</Text>
                </View>
              </View>

              {/* Itens */}
              {data.items.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Itens</Text>
                  {data.items.map((item, idx) => (
                    <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: 'rgba(0,0,0,0.06)' }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ color: '#1C1C1E', fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
                        <Text style={{ color: '#999', fontSize: 11 }}>
                          {item.type === 'service' ? 'Serviço' : 'Produto'} × {item.quantity}
                        </Text>
                      </View>
                      <Text style={{ color: '#1C1C1E', fontSize: 13, fontWeight: '700' }}>{formatCurrency(item.total)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Divisor pontilhado */}
              <View style={{ borderTopWidth: 1, borderTopColor: '#D0C8E8', borderStyle: 'dashed', marginVertical: 12 }} />

              {/* Totais */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ color: '#888', fontSize: 13 }}>Subtotal</Text>
                  <Text style={{ color: '#555', fontSize: 13 }}>{formatCurrency(data.originalTotal)}</Text>
                </View>
                {data.discountAmt > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ color: '#10B981', fontSize: 13 }}>Desconto ({data.discountLabel})</Text>
                    <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700' }}>-{formatCurrency(data.discountAmt)}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' }}>
                  <Text style={{ color: '#1C1C1E', fontSize: 16, fontWeight: '800' }}>TOTAL</Text>
                  <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '800' }}>{formatCurrency(data.finalTotal)}</Text>
                </View>
              </View>

              {/* Divisor pontilhado */}
              <View style={{ borderTopWidth: 1, borderTopColor: '#D0C8E8', borderStyle: 'dashed', marginVertical: 12 }} />

              {/* Formas de pagamento */}
              <Text style={{ color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
                Formas de Pagamento
              </Text>
              {data.slices.map((slice, idx) => (
                <View key={slice.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: 'rgba(0,0,0,0.05)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{SLICE_ICON[slice.method]}</Text>
                    <Text style={{ color: '#444', fontSize: 13, fontWeight: '600' }}>{SLICE_LABEL[slice.method]}</Text>
                  </View>
                  <Text style={{ color: '#1C1C1E', fontSize: 14, fontWeight: '700' }}>{formatCurrency(slice.amount)}</Text>
                </View>
              ))}

              {/* Divisor pontilhado */}
              <View style={{ borderTopWidth: 1, borderTopColor: '#D0C8E8', borderStyle: 'dashed', marginVertical: 16 }} />

              {/* Rodapé */}
              <View style={{ alignItems: 'center', paddingBottom: 8 }}>
                <Text style={{ fontSize: 20 }}>🙏</Text>
                <Text style={{ color: '#1C1C1E', fontSize: 14, fontWeight: '700', marginTop: 4 }}>Obrigado pela preferência!</Text>
                <Text style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>Appbello · Sistema de Gestão</Text>
              </View>
            </View>
          </ScrollView>

          {/* Borda serrilhada inferior */}
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0)' }}>
            {Array.from({ length: 22 }).map((_, i) => (
              <View key={i} style={{ flex: 1, height: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: i % 2 === 0 ? '#F7F5FF' : 'transparent' }} />
            ))}
          </View>

          {/* Botões */}
          <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: colors.backgroundCard, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={handleShare}
              style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Printer size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Compartilhar</Text>
            </Pressable>
            <Pressable onPress={onClose} style={{ flex: 1, height: 50, borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Fechar</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
