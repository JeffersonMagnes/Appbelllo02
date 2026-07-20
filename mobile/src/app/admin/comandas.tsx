import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, Modal,
  FlatList, TextInput, Share, ActivityIndicator, Alert,
} from 'react-native';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeOut, SlideInDown, SlideOutDown,
  useSharedValue, useAnimatedStyle, withSpring, ZoomIn,
} from 'react-native-reanimated';
import { ArrowLeft2, Add, User, Clock, DollarCircle, Printer, Card, CloseCircle, TickSquare, Money, Mobile, SearchNormal1, Scissor, Box, ArrowRight2, Filter, Calendar } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useComandas, useCreateComanda, useCloseComanda, useAddComandaItem } from '@/lib/hooks/use-comandas';
import { useClients } from '@/lib/hooks/use-clients';
import { useServices } from '@/lib/hooks/use-services';
import { useProducts } from '@/lib/hooks/use-products';
import { useAuthStore } from '@/lib/state/auth-store';
import { Comanda, Client } from '@/lib/types';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Crypto from 'expo-crypto';

// ── Tipos ────────────────────────────────────────────────────────────────────
type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash' | 'cheque' | 'cortesia';

interface PaymentSlice {
  id: string;
  method: PaymentMethod;
  amount: number;
}

interface PaymentState {
  visible: boolean;
  comandaId: string;
  clientName: string;
  total: number;
}

interface ReceiptData {
  visible: boolean;
  clientName: string;
  items: Comanda['items'];
  originalTotal: number;
  discountAmt: number;
  discountLabel: string;
  finalTotal: number;
  slices: PaymentSlice[];
  paidAt: string;
  receiptNum: string;
}

interface PrintState {
  visible: boolean;
  clientName: string;
  total: number;
  comandaId: string;
  items: Comanda['items'];
}

interface NewComandaState {
  visible: boolean;
  search: string;
}

interface NewComandaModalProps {
  state: NewComandaState;
  onClose: () => void;
  onCreate: (client: Client) => void;
  clientsData: Client[];
  isLoadingClients: boolean;
}

interface AddItemState {
  visible: boolean;
  comandaId: string;
  tab: 'service' | 'product';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

const getStatusConfig = (status: Comanda['status']) => {
  switch (status) {
    case 'open':   return { label: 'Aberta',  color: colors.warning,  bg: colors.warning  + '20' };
    case 'closed': return { label: 'Fechada', color: colors.primary,  bg: colors.primary  + '20' };
    case 'paid':   return { label: 'Paga',    color: colors.success,  bg: colors.success  + '20' };
    default:       return { label: '',        color: colors.textMuted, bg: colors.backgroundCard };
  }
};


// ── Modal de Pagamento (desconto + múltiplas formas) ─────────────────────────
function PaymentModal({
  state, onClose, onConfirm,
}: {
  state: PaymentState;
  onClose: () => void;
  onConfirm: (receipt: Omit<ReceiptData, 'visible'>) => void;
}) {
  // Desconto
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [discountInput, setDiscountInput] = useState('');
  // Slices de pagamento
  const [slices, setSlices] = useState<PaymentSlice[]>([]);
  // Adição de nova slice
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);
  const [amountInput, setAmountInput] = useState('');
  // Sucesso
  const [success, setSuccess] = useState(false);
  const checkScale = useSharedValue(0);
  const insets = useSafeAreaInsets();

  // Reset ao abrir
  const resetAll = () => {
    setDiscountType('none');
    setDiscountInput('');
    setSlices([]);
    setPendingMethod(null);
    setAmountInput('');
    setSuccess(false);
    checkScale.value = 0;
  };

  // Calculados
  const discountAmt = (() => {
    const v = parseFloat(discountInput.replace(',', '.')) || 0;
    if (discountType === 'percent') return Math.min(state.total, state.total * v / 100);
    if (discountType === 'fixed')   return Math.min(state.total, v);
    return 0;
  })();
  const finalTotal  = Math.max(0, state.total - discountAmt);
  const totalPaid   = slices.reduce((s, sl) => s + sl.amount, 0);
  const remaining   = Math.max(0, finalTotal - totalPaid);
  const canConfirm  = slices.length > 0 && remaining === 0;

  const handleSelectMethod = (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingMethod(method);
    // preenche automaticamente com o restante
    setAmountInput(remaining > 0 ? remaining.toFixed(2).replace('.', ',') : '');
  };

  const handleAddSlice = () => {
    if (!pendingMethod) return;
    const amt = parseFloat(amountInput.replace(',', '.')) || 0;
    if (amt <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSlices(prev => [...prev, { id: Date.now().toString(), method: pendingMethod, amount: amt }]);
    setPendingMethod(null);
    setAmountInput('');
  };

  const handleRemoveSlice = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSlices(prev => prev.filter(s => s.id !== id));
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSuccess(true);
    checkScale.value = withSpring(1, { damping: 10 });
    const discountLabel = discountType === 'percent'
      ? `${discountInput}%`
      : discountType === 'fixed' ? `R$ ${discountInput}` : '';
    setTimeout(() => {
      onConfirm({
        clientName: state.clientName,
        items: [],
        originalTotal: state.total,
        discountAmt,
        discountLabel,
        finalTotal,
        slices: [...slices],
        paidAt: new Date().toISOString(),
        receiptNum: `#${Date.now().toString().slice(-6)}`,
      });
      resetAll();
    }, 1300);
  };

  const handleClose = () => { resetAll(); onClose(); };

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const LABEL: Record<PaymentMethod, string> = {
    pix: 'PIX', credit: 'Crédito', debit: 'Débito', cash: 'Dinheiro', cheque: 'Cheque', cortesia: 'Cortesia',
  };

  const METHOD_COMPACT: { id: PaymentMethod; iconActive: React.ReactNode; iconInactive: React.ReactNode; grad: [string, string]; color: string }[] = [
    { id: 'pix',      iconActive: <Mobile size={16} color="#fff" />, iconInactive: <Mobile size={16} color="#00C4B4" />, grad: ['#00C4B4','#0097A7'], color: '#00C4B4' },
    { id: 'credit',   iconActive: <Card  size={16} color="#fff" />, iconInactive: <Card  size={16} color="#5333ed" />, grad: ['#5333ed','#7B5FFF'], color: '#5333ed' },
    { id: 'debit',    iconActive: <Card  size={16} color="#fff" />, iconInactive: <Card  size={16} color="#3B82F6" />, grad: ['#3B82F6','#2563EB'], color: '#3B82F6' },
    { id: 'cash',     iconActive: <Money size={16} color="#fff" />, iconInactive: <Money size={16} color="#10B981" />, grad: ['#10B981','#059669'], color: '#10B981' },
    { id: 'cheque',   iconActive: <Card  size={16} color="#fff" />, iconInactive: <Card  size={16} color="#F59E0B" />, grad: ['#F59E0B','#D97706'], color: '#F59E0B' },
    { id: 'cortesia', iconActive: <TickSquare size={16} color="#fff" />, iconInactive: <TickSquare size={16} color="#EC4899" />, grad: ['#EC4899','#DB2777'], color: '#EC4899' },
  ];


  return (
    <Modal visible={state.visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />

        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(260)}
          exiting={SlideOutDown.duration(220)}
          style={{
            backgroundColor: colors.backgroundCard,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingBottom: insets.bottom + 12,
            maxHeight: '92%',
          }}
        >
          <LinearGradient
            colors={[colors.primary + '15', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />

          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Registrar pagamento
              </Text>
              <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '800', marginTop: 2 }}>{state.clientName}</Text>
            </View>
            <Pressable onPress={handleClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <CloseCircle size={16} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {success ? (
              /* ── Sucesso ── */
              <Animated.View style={[{ alignItems: 'center', paddingVertical: 48 }, checkStyle]}>
                <LinearGradient
                  colors={['#10B981','#059669']}
                  style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
                >
                  <TickSquare size={40} color="#fff" strokeWidth={3}  variant="Outline" />
                </LinearGradient>
                <Text style={{ color: '#111827', fontSize: 21, fontWeight: '800' }}>Pagamento registrado!</Text>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>
                  {slices.length} forma{slices.length > 1 ? 's' : ''} de pagamento
                </Text>
              </Animated.View>
            ) : (
              <View style={{ paddingHorizontal: 20 }}>

                {/* ── Seção desconto ── */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 10 }}>
                    Desconto
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: discountType !== 'none' ? 10 : 0 }}>
                    {(['none','percent','fixed'] as const).map(t => {
                      const labels = { none: 'Sem desconto', percent: '% Porcentagem', fixed: 'R$ Valor fixo' };
                      const active = discountType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDiscountType(t); setDiscountInput(''); }}
                          style={{
                            flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                            backgroundColor: active ? (t === 'none' ? colors.surface : colors.primary) : colors.background,
                            borderWidth: 1,
                            borderColor: active ? (t === 'none' ? colors.border : colors.primary) : colors.border,
                          }}
                        >
                          <Text style={{ color: active ? (t === 'none' ? colors.textSecondary : '#fff') : colors.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
                            {labels[t]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {discountType !== 'none' && (
                    <Animated.View entering={ZoomIn.duration(200)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, height: 48, borderWidth: 1.5, borderColor: colors.primary }}>
                        <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16, marginRight: 8 }}>
                          {discountType === 'percent' ? '%' : 'R$'}
                        </Text>
                        <TextInput
                          value={discountInput}
                          onChangeText={setDiscountInput}
                          keyboardType="decimal-pad"
                          placeholder={discountType === 'percent' ? '0' : '0,00'}
                          placeholderTextColor={colors.textMuted}
                          style={{ flex: 1, color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}
                        />
                        {discountAmt > 0 && (
                          <Text style={{ color: colors.success, fontSize: 13, fontWeight: '700' }}>
                            -{formatCurrency(discountAmt)}
                          </Text>
                        )}
                      </View>
                    </Animated.View>
                  )}
                </View>

                {/* ── Total após desconto ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginBottom: 18 }}>
                  <View>
                    {discountAmt > 0 && (
                      <Text style={{ color: '#9CA3AF', fontSize: 12, textDecorationLine: 'line-through', marginBottom: 2 }}>
                        {formatCurrency(state.total)}
                      </Text>
                    )}
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>Total a pagar</Text>
                  </View>
                  <Text style={{ color: colors.secondary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                    {formatCurrency(finalTotal)}
                  </Text>
                </View>

                {/* ── Formas adicionadas ── */}
                {slices.length > 0 && (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 8 }}>
                      Pagamentos ({slices.length})
                    </Text>
                    {slices.map(sl => {
                      const m = METHOD_COMPACT.find(x => x.id === sl.method)!;
                      return (
                        <Animated.View
                          key={sl.id}
                          entering={ZoomIn.duration(180)}
                          style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginBottom: 7 }}
                        >
                          <LinearGradient colors={m.grad} style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            {m.iconActive}
                          </LinearGradient>
                          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14, flex: 1 }}>{LABEL[sl.method]}</Text>
                          <Text style={{ color: colors.secondary, fontWeight: '800', fontSize: 16, marginRight: 12 }}>
                            {formatCurrency(sl.amount)}
                          </Text>
                          <Pressable onPress={() => handleRemoveSlice(sl.id)} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,69,58,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                            <CloseCircle size={13} color="#FF453A"  variant="Outline" />
                          </Pressable>
                        </Animated.View>
                      );
                    })}

                    {/* Barra de progresso */}
                    <View style={{ height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                      <View style={{
                        height: 5, borderRadius: 3,
                        width: `${Math.min(100, (totalPaid / finalTotal) * 100)}%`,
                        backgroundColor: remaining === 0 ? colors.success : colors.primary,
                      }} />
                    </View>
                  </View>
                )}

                {/* ── Adicionar novo pagamento ── */}
                {remaining > 0 && (
                  <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginBottom: 16 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 10 }}>
                      Adicionar pagamento
                    </Text>

                    {/* Picker de método */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: pendingMethod ? 10 : 0 }}>
                      {METHOD_COMPACT.map(m => {
                        const isActive = pendingMethod === m.id;
                        return (
                          <Pressable
                            key={m.id}
                            onPress={() => handleSelectMethod(m.id)}
                            style={{ flex: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: isActive ? m.grad[0] : '#E5E7EB' }}
                          >
                            <LinearGradient
                              colors={isActive ? m.grad : ['#F9FAFB','#F3F4F6']}
                              style={{ paddingVertical: 10, alignItems: 'center' }}
                            >
                              {isActive ? m.iconActive : m.iconInactive}
                              <Text style={{ color: isActive ? '#fff' : m.color, fontSize: 10, fontWeight: '700', marginTop: 4 }}>
                                {LABEL[m.id]}
                              </Text>
                            </LinearGradient>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Valor */}
                    {pendingMethod && (
                      <Animated.View entering={ZoomIn.duration(180)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, height: 48, borderWidth: 1.5, borderColor: colors.primary }}>
                            <Text style={{ color: colors.textMuted, fontWeight: '700', marginRight: 6 }}>R$</Text>
                            <TextInput
                              value={amountInput}
                              onChangeText={setAmountInput}
                              keyboardType="decimal-pad"
                              placeholder="0,00"
                              placeholderTextColor={colors.textMuted}
                              style={{ flex: 1, color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}
                              autoFocus
                            />
                            {remaining > 0 && (
                              <Pressable onPress={() => setAmountInput(remaining.toFixed(2).replace('.', ','))}>
                                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>MAX</Text>
                              </Pressable>
                            )}
                          </View>
                          <Pressable
                            onPress={handleAddSlice}
                            style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden' }}
                          >
                            <LinearGradient
                              colors={METHOD_COMPACT.find(x => x.id === pendingMethod)?.grad ?? ['#5333ed','#7B5FFF']}
                              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Add size={22} color="#fff" strokeWidth={2.5}  variant="Outline" />
                            </LinearGradient>
                          </Pressable>
                        </View>
                        <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 6 }}>
                          Restante: {formatCurrency(remaining)}
                        </Text>
                      </Animated.View>
                    )}
                  </View>
                )}

                {/* ── Resumo ── */}
                <View style={{ borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 16 }}>
                  {[
                    { label: 'Total original',  value: formatCurrency(state.total),  dim: true },
                    ...(discountAmt > 0 ? [{ label: `Desconto (${discountType === 'percent' ? discountInput+'%' : 'R$'+discountInput})`, value: '-'+formatCurrency(discountAmt), dim: false, green: true }] : []),
                    { label: 'Total a pagar',   value: formatCurrency(finalTotal),   dim: false },
                  ].map((row, i) => (
                    <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#E5E7EB' }}>
                      <Text style={{ color: row.dim ? '#9CA3AF' : '#6B7280', fontSize: 13 }}>{row.label}</Text>
                      <Text style={{ color: (row as any).green ? colors.success : (row.dim ? '#9CA3AF' : '#111827'), fontSize: 13, fontWeight: '700' }}>{row.value}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Pago</Text>
                    <Text style={{ color: colors.secondary, fontSize: 13, fontWeight: '700' }}>{formatCurrency(totalPaid)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 5 }}>
                    <Text style={{ color: remaining > 0 ? '#FF453A' : colors.success, fontSize: 14, fontWeight: '800' }}>
                      {remaining > 0 ? 'Restante' : '✓ Quitado'}
                    </Text>
                    <Text style={{ color: remaining > 0 ? '#FF453A' : colors.success, fontSize: 14, fontWeight: '800' }}>
                      {formatCurrency(remaining)}
                    </Text>
                  </View>
                </View>

                {/* Botão confirmar */}
                <Pressable
                  onPress={handleConfirm}
                  disabled={!canConfirm}
                  style={{ borderRadius: 16, overflow: 'hidden', opacity: canConfirm ? 1 : 0.35, marginBottom: 4 }}
                >
                  <LinearGradient
                    colors={['#10B981','#059669']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: 54, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                  >
                    <TickSquare size={18} color="#fff" strokeWidth={2.5}  variant="Outline" />
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 }}>
                      Confirmar pagamento
                    </Text>
                  </LinearGradient>
                </Pressable>

                {!canConfirm && slices.length === 0 && (
                  <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                    Adicione pelo menos uma forma de pagamento
                  </Text>
                )}
                {!canConfirm && slices.length > 0 && remaining > 0 && (
                  <Text style={{ color: '#FF453A', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                    Ainda faltam {formatCurrency(remaining)} para quitar
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Gera HTML do recibo ────────────────────────────────────────────────────────
function buildReceiptHTML(clientName: string, total: number, items: Comanda['items'], now: string): string {
  const itemsHTML = items.map(i => `
    <tr>
      <td style="padding:8px 0;color:#444;font-size:14px;">${i.name}</td>
      <td style="padding:8px 0;text-align:right;font-weight:700;color:#1C1C1E;font-size:14px;">${formatCurrency(i.total)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:32px;background:#fff;color:#1C1C1E;}
    .header{text-align:center;margin-bottom:28px;}
    .logo{font-size:24px;font-weight:900;color:#5333ed;letter-spacing:-1px;}
    .sub{font-size:13px;color:#8E8E93;margin-top:4px;}
    .divider{border:none;border-top:1px dashed #D1D1D6;margin:20px 0;}
    .client-row{display:flex;justify-content:space-between;align-items:center;background:#F5F5F7;padding:14px 16px;border-radius:12px;margin-bottom:16px;}
    .label{font-size:11px;color:#8E8E93;margin-bottom:2px;}
    .value{font-size:16px;font-weight:700;}
    .total-row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:2px solid #1C1C1E;margin-top:8px;}
    .total-label{font-size:16px;font-weight:800;}
    .total-value{font-size:22px;font-weight:900;color:#5333ed;}
    table{width:100%;border-collapse:collapse;}
    .footer{text-align:center;margin-top:32px;font-size:12px;color:#8E8E93;}
  </style></head><body>
  <div class="header">
    <div class="logo">Appbello</div>
    <div class="sub">Recibo de pagamento</div>
    <div class="sub">${now}</div>
  </div>
  <div class="client-row">
    <div><div class="label">Cliente</div><div class="value">${clientName}</div></div>
  </div>
  ${items.length > 0 ? `<table>${itemsHTML}</table>` : ''}
  <div class="total-row">
    <span class="total-label">TOTAL</span>
    <span class="total-value">${formatCurrency(total)}</span>
  </div>
  <div class="footer">Obrigado pela preferência!<br>Appbello · Sistema de Gestão</div>
</body></html>`;
}

// ── Modal de Impressão ────────────────────────────────────────────────────────
function PrintModal({
  state, onClose, onConfirm,
}: {
  state: PrintState;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const now = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const gerarPDF = async (): Promise<string | null> => {
    const html = buildReceiptHTML(state.clientName, state.total, state.items, now);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    return uri;
  };

  const handleGerar = async () => {
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await gerarPDF();
      if (!uri) return;
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Recibo' });
      }
      onConfirm();
    } catch (e) {
      console.log('Erro ao gerar PDF:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = await gerarPDF();
      if (!uri) return;
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Recibo' });
      } else {
        // fallback texto
        const text = [
          `RECIBO — ${state.clientName}`,
          `Data: ${now}`,
          ...state.items.map(i => `${i.name}: ${formatCurrency(i.total)}`),
          `TOTAL: ${formatCurrency(state.total)}`,
        ].join('\n');
        await Share.share({ message: text });
      }
    } catch (e) {
      console.log('Erro ao compartilhar:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={state.visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}
        style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' }}>
        <Pressable style={{ flex:1 }} onPress={onClose} />
        <Animated.View entering={SlideInDown.springify().damping(22).stiffness(260)}
          exiting={SlideOutDown.duration(220)}
          style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius:24, borderTopRightRadius:24, paddingBottom: insets.bottom + 16 }}>

          {/* Handle */}
          <View style={{ alignItems:'center', paddingTop:12 }}>
            <View style={{ width:36, height:4, borderRadius:2, backgroundColor: colors.border }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:14, paddingBottom:12, borderBottomWidth:1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
              <View style={{ width:40, height:40, borderRadius:12, backgroundColor: colors.primary+'15', alignItems:'center', justifyContent:'center' }}>
                <Printer size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize:16, fontWeight:'800' }}>Gerar Recibo</Text>
                <Text style={{ color: colors.textMuted, fontSize:12 }}>{now}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={{ width:30, height:30, borderRadius:15, backgroundColor: colors.surface, alignItems:'center', justifyContent:'center' }}>
              <CloseCircle size={14} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          {/* Corpo do recibo */}
          <View style={{ paddingHorizontal:20, paddingTop:14 }}>
            {/* Cliente + total */}
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12, padding:14, borderRadius:14, backgroundColor: colors.background }}>
              <View>
                <Text style={{ color: colors.textMuted, fontSize:11, marginBottom:2 }}>Cliente</Text>
                <Text style={{ color: colors.textPrimary, fontSize:15, fontWeight:'700' }}>{state.clientName}</Text>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={{ color: colors.textMuted, fontSize:11, marginBottom:2 }}>Total</Text>
                <Text style={{ color: colors.primary, fontSize:20, fontWeight:'800' }}>{formatCurrency(state.total)}</Text>
              </View>
            </View>

            {/* Itens */}
            {state.items.length > 0 && (
              <View style={{ backgroundColor: colors.background, borderRadius:14, marginBottom:16, overflow:'hidden' }}>
                {state.items.map((item, i) => (
                  <View key={item.id} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:14, paddingVertical:10, borderTopWidth: i>0?1:0, borderTopColor: colors.border }}>
                    <Text style={{ color: colors.textSecondary, fontSize:13, flex:1 }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ color: colors.textPrimary, fontSize:13, fontWeight:'700', marginLeft:8 }}>{formatCurrency(item.total)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Botões */}
            <View style={{ flexDirection:'row', gap:10, marginBottom:4 }}>
              <Pressable onPress={handleShare} disabled={loading}
                style={{ flex:1, height:50, borderRadius:14, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, backgroundColor: colors.surface, borderWidth:1, borderColor: colors.border, opacity: loading ? 0.5 : 1 }}>
                <Printer size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight:'700', fontSize:14 }}>Compartilhar</Text>
              </Pressable>
              <Pressable onPress={handleGerar} disabled={loading} style={{ flex:1.5, height:50, borderRadius:14, overflow:'hidden', opacity: loading ? 0.7 : 1 }}>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6 }}>
                  {loading
                    ? <><View style={{ width:16, height:16, borderRadius:8, borderWidth:2, borderColor:'rgba(255,255,255,0.4)', borderTopColor:'#fff' }} /><Text style={{ color:'#fff', fontWeight:'800', fontSize:14 }}>Gerando...</Text></>
                    : <><Printer size={16} color="#fff" /><Text style={{ color:'#fff', fontWeight:'800', fontSize:14 }}>Gerar Recibo</Text></>
                  }
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Modal Nova Comanda ────────────────────────────────────────────────────────
function NewComandaModal({
  state, onClose, onCreate, clientsData, isLoadingClients,
}: NewComandaModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = clientsData.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={state.visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(260)}
          exiting={SlideOutDown.duration(220)}
          style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 12, height: '75%' }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>Nova Comanda</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 2 }}>Selecione o cliente</Text>
            </View>
            <Pressable onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <CloseCircle size={16} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          {/* Search */}
          <View style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: colors.border }}>
              <SearchNormal1 size={15} color={colors.textMuted}  variant="Outline" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar cliente..."
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, color: colors.textPrimary, fontSize: 14, marginLeft: 10 }}
              />
            </View>
          </View>

          {/* Lista */}
          {isLoadingClients ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>Carregando clientes...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={c => c.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <User size={30} color={colors.primary} variant="Outline" />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                    {search.length > 0 ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                    {search.length > 0
                      ? `Nenhum cliente com "${search}"`
                      : 'Cadastre um cliente para criar uma comanda'}
                  </Text>
                  {search.length === 0 && (
                    <Pressable
                      onPress={() => { onClose(); router.push('/admin/clients'); }}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.primary, gap: 8 }}
                    >
                      <Add size={16} color="#fff" variant="Outline" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Cadastrar cliente</Text>
                    </Pressable>
                  )}
                </View>
              }
              renderItem={({ item: client }) => (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCreate(client); setSearch(''); }}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 12, paddingHorizontal: 14,
                    borderRadius: 14, marginBottom: 6,
                    backgroundColor: pressed ? colors.primary + '10' : colors.background,
                    borderWidth: 1, borderColor: pressed ? colors.primary + '40' : colors.border,
                  })}
                >
                  {client.avatar
                    ? <Image source={{ uri: client.avatar }} style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12 }} />
                    : <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <User size={20} color={colors.primary} variant="Outline" />
                      </View>
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{client.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>
                      {client.phone || 'Cliente'}
                    </Text>
                  </View>
                  <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" />
                </Pressable>
              )}
            />
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Modal Adicionar Item ──────────────────────────────────────────────────────
function AddItemModal({
  state, onClose, onAdd, servicesData, productsData,
}: {
  state: AddItemState;
  onClose: () => void;
  onAdd: (item: any, type: 'service' | 'product') => void;
  servicesData: any[];
  productsData: any[];
}) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'service' | 'product'>(state.tab);
  const [search, setSearch] = useState('');

  React.useEffect(() => { setTab(state.tab); }, [state.tab]);

  const data = (tab === 'service' ? servicesData : productsData).filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={state.visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(260)}
          exiting={SlideOutDown.duration(220)}
          style={{
            backgroundColor: colors.backgroundCard,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingBottom: insets.bottom + 12,
            height: '80%',
          }}
        >
          <LinearGradient
            colors={tab === 'service' ? [colors.primary + '15', 'transparent'] : [colors.secondary + '12', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          />

          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Adicionar item</Text>
            <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <CloseCircle size={16} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          {/* Tab selector */}
          <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: '#F3F4F6', borderRadius: 14, padding: 4 }}>
            {(['service', 'product'] as const).map((t) => {
              const active = tab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
                  style={{ flex: 1, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
                    backgroundColor: active ? (t === 'service' ? colors.primary : colors.secondary) : 'transparent',
                  }}
                >
                  {t === 'service'
                    ? <Scissor size={14} color={active ? '#fff' : '#9CA3AF'}  variant="Outline" />
                    : <Box size={14} color={active ? '#fff' : '#9CA3AF'}  variant="Outline" />
                  }
                  <Text style={{ color: active ? '#fff' : '#9CA3AF', fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
                    {t === 'service' ? 'Serviços' : 'Produtos'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Search */}
          <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, height: 42, borderWidth: 1.5, borderColor: colors.border }}>
              <SearchNormal1 size={14} color={colors.textMuted}  variant="Outline" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={`Buscar ${tab === 'service' ? 'serviço' : 'produto'}...`}
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, color: colors.textPrimary, fontSize: 14, marginLeft: 8 }}
              />
            </View>
          </View>

          <FlatList
            data={data}
            keyExtractor={i => i.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onAdd(item, tab);
                  setSearch('');
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 12, paddingHorizontal: 14,
                  borderRadius: 14, marginBottom: 6,
                  backgroundColor: pressed ? colors.primary + '10' : colors.backgroundCard,
                  borderWidth: 1, borderColor: colors.border,
                })}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 12, marginRight: 12,
                  backgroundColor: tab === 'service' ? colors.primary + '15' : colors.secondary + '15',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {tab === 'service'
                    ? <Scissor size={18} color={colors.primary}  variant="Outline" />
                    : <Box size={18} color={colors.secondary}  variant="Outline" />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{item.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: tab === 'service' ? colors.primary : colors.secondary, fontWeight: '800', fontSize: 15 }}>
                    {formatCurrency(item.price)}
                  </Text>
                  <View style={{ marginTop: 4, width: 28, height: 28, borderRadius: 8, backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
                    <Add size={14} color={colors.primary}  variant="Outline" />
                  </View>
                </View>
              </Pressable>
            )}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Modal Recibo ─────────────────────────────────────────────────────────────
const SLICE_ICON: Record<PaymentMethod, string> = {
  pix: '📱', credit: '💳', debit: '💳', cash: '💵', cheque: '🏦', cortesia: '🎁',
};
const SLICE_LABEL: Record<PaymentMethod, string> = {
  pix: 'PIX', credit: 'Crédito', debit: 'Débito', cash: 'Dinheiro', cheque: 'Cheque', cortesia: 'Cortesia',
};

function ReceiptModal({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
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

// ── Tela Principal ────────────────────────────────────────────────────────────
export default function ComandasScreen() {
  const closeKey = useRef<string | null>(null);
  const router = useRouter();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: comandasData, isLoading: loadingComandas } = useComandas(establishmentId ?? undefined);
  const { data: clientsData, isLoading: loadingClients } = useClients(establishmentId ?? undefined);
  const { data: servicesData, isLoading: loadingServices } = useServices(establishmentId ?? undefined);
  const { data: productsData, isLoading: loadingProducts } = useProducts(establishmentId ?? undefined);

  const createComanda = useCreateComanda();
  const closeComanda = useCloseComanda();
  const addComandaItem = useAddComandaItem();

  const isLoading = loadingComandas;

  const [filter, setFilter] = useState<'all' | 'open' | 'paid'>('all');

  // Use server data directly — mutations invalidate the query automatically
  const localComandas = comandasData ?? [];

  const [paymentModal, setPaymentModal] = useState<PaymentState>({
    visible: false, comandaId: '', clientName: '', total: 0,
  });
  const [printModal, setPrintModal] = useState<PrintState>({
    visible: false, clientName: '', total: 0, comandaId: '', items: [],
  });
  const [newComandaModal, setNewComandaModal] = useState<NewComandaState>({
    visible: false, search: '',
  });
  const [addItemModal, setAddItemModal] = useState<AddItemState>({
    visible: false, comandaId: '', tab: 'service',
  });
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    visible: false, clientName: '', items: [], originalTotal: 0,
    discountAmt: 0, discountLabel: '', finalTotal: 0,
    slices: [], paidAt: '', receiptNum: '',
  });

  const [dateFilter, setDateFilter] = useState<'all' | 'day' | 'month' | 'year'>('all');
  const [showDateSheet, setShowDateSheet] = useState(false);

  const filteredComandas = localComandas.filter(c => {
    // Filtro de status
    if (filter === 'open' && c.status !== 'open') return false;
    if (filter === 'paid' && c.status !== 'paid') return false;

    // Filtro de data
    if (dateFilter !== 'all') {
      const d = new Date(c.createdAt);
      const now = new Date();
      if (dateFilter === 'day') {
        if (d.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'month') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === 'year') {
        if (d.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const openComandas = localComandas.filter(c => c.status === 'open');
  const totalOpen = openComandas.reduce((sum, c) => sum + c.total, 0);

  const handleNovaComanda = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewComandaModal({ visible: true, search: '' });
  };

  const handleCriarComanda = async (client: Client) => {
    if (!establishmentId) return;
    try {
      await createComanda.mutateAsync({
        establishment_id: establishmentId,
        client_id: client.id,
        client_name: client.name,
        status: 'open',
        total: 0,
      });
      setNewComandaModal({ visible: false, search: '' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      console.log('[Comanda] Erro ao criar:', e);
      Alert.alert('Erro', e?.message || 'Não foi possível criar a comanda.');
    }
  };

  const handlePagar = (comandaId: string, clientName: string, total: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPaymentModal({ visible: true, comandaId, clientName, total });
  };

  const handleConfirmarPagamento = async (receipt: Omit<ReceiptData, 'visible'>) => {
    const comanda = localComandas.find(c => c.id === paymentModal.comandaId);
    setPaymentModal(p => ({ ...p, visible: false }));
    // Persist to Supabase
    if (establishmentId) {
      try {
        closeKey.current ||= Crypto.randomUUID();
        await closeComanda.mutateAsync({
          id: paymentModal.comandaId,
          establishmentId,
          discount: receipt.discountAmt,
          payments: receipt.slices.map(slice => ({ method: slice.method, amount: slice.amount })),
          idempotencyKey: closeKey.current,
        });
        closeKey.current = null;
      } catch (e) {
        console.log('[Comanda] Erro ao fechar pagamento:', e);
      }
    }
    setTimeout(() => {
      setReceiptData({
        ...receipt,
        items: comanda?.items ?? [],
        visible: true,
      });
    }, 400);
  };

  const handleImprimir = (comandaId: string, clientName: string, total: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const comanda = localComandas.find(c => c.id === comandaId);
    setPrintModal({ visible: true, clientName, total, comandaId, items: comanda?.items ?? [] });
  };

  const handleAdicionarItem = (comandaId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddItemModal({ visible: true, comandaId, tab: 'service' });
  };

  const handleAddItem = async (item: any, type: 'service' | 'product') => {
    if (!establishmentId) return;
    try {
      await addComandaItem.mutateAsync({
        comanda_id: addItemModal.comandaId,
        establishment_id: establishmentId,
        type,
        service_id: type === 'service' ? item.id : undefined,
        product_id: type === 'product' ? item.id : undefined,
        description: item.name,
        quantity: 1,
        unit_price: item.price,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddItemModal(p => ({ ...p, visible: false }));
    } catch (e) {
      console.log('[Comanda] Erro ao adicionar item:', e);
    }
  };

  return (
    <FeatureGate featureKey="comandas">
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.backgroundCard, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
            >
              <ArrowLeft2 size={24} color={colors.textPrimary}  variant="Outline" />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>Comandas</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDateSheet(true); }}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: dateFilter !== 'all' ? colors.primary + '20' : colors.backgroundCard,
                borderWidth: dateFilter !== 'all' ? 1 : 0,
                borderColor: colors.primary + '50',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Filter size={18} color={dateFilter !== 'all' ? colors.primary : colors.textMuted} />
              {dateFilter !== 'all' && (
                <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
              )}
            </Pressable>
            <Pressable
              onPress={handleNovaComanda}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Add size={20} color="#fff"  variant="Outline" />
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12 }}>
          <View style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: colors.backgroundCard }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Clock size={14} color={colors.warning}  variant="Outline" />
              <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 6 }}>Em aberto</Text>
            </View>
            <Text style={{ color: colors.warning, fontSize: 26, fontWeight: '800' }}>{openComandas.length}</Text>
          </View>
          <View style={{ flex: 2, padding: 16, borderRadius: 16, backgroundColor: colors.backgroundCard }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <DollarCircle size={14} color={colors.secondary}  variant="Outline" />
              <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 6 }}>Total em aberto</Text>
            </View>
            <Text style={{ color: colors.secondary, fontSize: 26, fontWeight: '800' }}>{formatCurrency(totalOpen)}</Text>
          </View>
        </View>

        {/* Filtro */}
        <View style={{ marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', backgroundColor: colors.backgroundCard, borderRadius: 14, padding: 4 }}>
          {(['all', 'open', 'paid'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: filter === f ? colors.primary : 'transparent' }}
            >
              <Text style={{ color: filter === f ? '#fff' : colors.textMuted, fontWeight: '600', fontSize: 13 }}>
                {f === 'all' ? 'Todas' : f === 'open' ? 'Abertas' : 'Pagas'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Lista */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          {filteredComandas.map((comanda) => {
            const sc = getStatusConfig(comanda.status);
            const client = (clientsData ?? []).find(c => c.id === comanda.clientId);

            return (
              <View
                key={comanda.id}
                style={{ marginBottom: 12, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.backgroundCard }}
              >
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
                        onPress={() => handleAdicionarItem(comanda.id)}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 12, backgroundColor: colors.surface }}
                      >
                        <Add size={14} color={colors.textMuted}  variant="Outline" />
                        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Adicionar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleImprimir(comanda.id, comanda.clientName, comanda.total)}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 12, backgroundColor: colors.surface }}
                      >
                        <Printer size={14} color={colors.textMuted} />
                        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Recibo</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handlePagar(comanda.id, comanda.clientName, comanda.total)}
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
                        onPress={() => handleImprimir(comanda.id, comanda.clientName, comanda.total)}
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
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
        )}
      </SafeAreaView>

      {/* Modais */}
      <PaymentModal
        state={paymentModal}
        onClose={() => setPaymentModal(p => ({ ...p, visible: false }))}
        onConfirm={handleConfirmarPagamento}
      />
      <PrintModal
        state={printModal}
        onClose={() => setPrintModal(p => ({ ...p, visible: false }))}
        onConfirm={() => setPrintModal(p => ({ ...p, visible: false }))}
      />
      <NewComandaModal
        state={newComandaModal}
        onClose={() => setNewComandaModal(p => ({ ...p, visible: false }))}
        onCreate={handleCriarComanda}
        clientsData={clientsData ?? []}
        isLoadingClients={loadingClients}
      />
      <AddItemModal
        state={addItemModal}
        onClose={() => setAddItemModal(p => ({ ...p, visible: false }))}
        onAdd={handleAddItem}
        servicesData={servicesData ?? []}
        productsData={productsData ?? []}
      />
      <ReceiptModal
        data={receiptData}
        onClose={() => setReceiptData(p => ({ ...p, visible: false }))}
      />

      {/* Modal — Filtro por Data */}
      <Modal visible={showDateSheet} transparent animationType="none" onRequestClose={() => setShowDateSheet(false)}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowDateSheet(false)} />
          <Animated.View entering={SlideInDown.springify().damping(22).stiffness(260)}
            exiting={SlideOutDown.duration(220)}
            style={{ backgroundColor: colors.backgroundCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>

            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} color={colors.primary}  variant="Outline" />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>Filtrar por período</Text>
              </View>
              <Pressable onPress={() => setShowDateSheet(false)}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <CloseCircle size={14} color={colors.textMuted}  variant="Outline" />
              </Pressable>
            </View>

            {/* Opções */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
              {([
                { key: 'all',   label: 'Todas as comandas', sub: 'Sem filtro de data'          },
                { key: 'day',   label: 'Hoje',              sub: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) },
                { key: 'month', label: 'Este mês',          sub: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) },
                { key: 'year',  label: 'Este ano',          sub: String(new Date().getFullYear()) },
              ] as { key: 'all'|'day'|'month'|'year'; label: string; sub: string }[]).map(opt => {
                const active = dateFilter === opt.key;
                return (
                  <Pressable key={opt.key}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDateFilter(opt.key); setShowDateSheet(false); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
                      borderRadius: 14, borderWidth: 1.5,
                      backgroundColor: active ? colors.primary + '10' : colors.background,
                      borderColor: active ? colors.primary + '40' : colors.border,
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: active ? '700' : '500', color: active ? colors.primary : colors.textPrimary }}>{opt.label}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{opt.sub}</Text>
                    </View>
                    {active && (
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <TickSquare size={13} color="#fff" strokeWidth={3}  variant="Outline" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Limpar filtro */}
            {dateFilter !== 'all' && (
              <Pressable onPress={() => { setDateFilter('all'); setShowDateSheet(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={{ marginHorizontal: 16, marginTop: 12, height: 44, borderRadius: 12, backgroundColor: colors.error + '12', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.error + '30' }}>
                <Text style={{ color: colors.error, fontWeight: '700', fontSize: 14 }}>Limpar filtro de data</Text>
              </Pressable>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
    </FeatureGate>
  );
}
