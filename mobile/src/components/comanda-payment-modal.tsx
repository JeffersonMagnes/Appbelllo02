import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeOut, SlideInDown, SlideOutDown,
  useSharedValue, useAnimatedStyle, withSpring, ZoomIn,
} from 'react-native-reanimated';
import { Add, CloseCircle, TickSquare, Money, Mobile, Card } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils/comanda-format';
import { type PaymentMethod, type PaymentSlice, type PaymentState, type ReceiptData } from '@/lib/comanda-ui-types';
import * as Haptics from 'expo-haptics';

// ── Modal de Pagamento (desconto + múltiplas formas) ─────────────────────────
export function PaymentModal({
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
