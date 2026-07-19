import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft2, Wallet, Add, Minus, ExportSquare, ArrowLeft, Clock, TickCircle, InfoCircle, DollarCircle, Card, Money, Scan, CloseCircle, Calendar, TrendUp, TrendDown } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useTransactions, useCreateTransaction } from '@/lib/hooks/use-transactions';
import { useAuthStore } from '@/lib/state/auth-store';

type CashMovement = {
  id: string;
  type: 'opening' | 'closing' | 'withdraw' | 'deposit' | 'sale' | 'expense';
  amount: number;
  description: string;
  paymentMethod?: 'cash' | 'pix' | 'credit' | 'debit';
  time: string;
  operatorName: string;
};

type CashRegisterStatus = 'closed' | 'open';

export default function CashRegisterScreen() {
  const router = useRouter();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: todayTransactions = [], isLoading } = useTransactions(establishmentId ?? undefined, { period: 'today' });

  const createTransaction = useCreateTransaction();

  const [registerStatus, setRegisterStatus] = useState<CashRegisterStatus>('open');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'withdraw' | 'deposit'>('deposit');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');

  // Map Supabase transactions to CashMovement format
  const mapCategoryToType = (category: string, type: string): CashMovement['type'] => {
    switch (category) {
      case 'abertura': return 'opening';
      case 'fechamento': return 'closing';
      case 'sangria': return 'withdraw';
      case 'reforco': return 'deposit';
      default: return type === 'income' ? 'sale' : 'expense';
    }
  };

  const movements: CashMovement[] = todayTransactions.map((t) => {
    const dateObj = new Date(t.date);
    const time = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
    return {
      id: t.id,
      type: mapCategoryToType(t.category, t.type),
      amount: t.amount,
      description: t.description,
      paymentMethod: t.paymentMethod === 'transfer' ? undefined : (t.paymentMethod as CashMovement['paymentMethod']),
      time,
      operatorName: '',
    };
  });

  // Detect register status from today's transactions
  const hasOpening = movements.some(m => m.type === 'opening');
  const hasClosing = movements.some(m => m.type === 'closing');
  React.useEffect(() => {
    if (hasClosing) {
      setRegisterStatus('closed');
    } else if (hasOpening) {
      setRegisterStatus('open');
    } else {
      setRegisterStatus('closed');
    }
    // Set opening balance from abertura transactions
    const openingTotal = todayTransactions
      .filter(t => t.category === 'abertura')
      .reduce((sum, t) => sum + t.amount, 0);
    if (openingTotal > 0) setOpeningBalance(openingTotal);
  }, [hasOpening, hasClosing, todayTransactions]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatTime = (time: string) => time;

  // Calculate totals
  const cashSales = movements
    .filter(m => m.type === 'sale' && m.paymentMethod === 'cash')
    .reduce((sum, m) => sum + m.amount, 0);

  const pixSales = movements
    .filter(m => m.type === 'sale' && m.paymentMethod === 'pix')
    .reduce((sum, m) => sum + m.amount, 0);

  const cardSales = movements
    .filter(m => m.type === 'sale' && (m.paymentMethod === 'credit' || m.paymentMethod === 'debit'))
    .reduce((sum, m) => sum + m.amount, 0);

  const totalSales = cashSales + pixSales + cardSales;

  const withdrawals = movements
    .filter(m => m.type === 'withdraw')
    .reduce((sum, m) => sum + m.amount, 0);

  const deposits = movements
    .filter(m => m.type === 'deposit')
    .reduce((sum, m) => sum + m.amount, 0);

  const currentCashBalance = openingBalance + cashSales - withdrawals + deposits;

  const getMovementIcon = (movement: CashMovement) => {
    switch (movement.type) {
      case 'opening':
        return <Wallet size={18} color={colors.primary} />;
      case 'closing':
        return <TickCircle size={18} color={colors.success}  variant="Outline" />;
      case 'sale':
        return <ExportSquare size={18} color={colors.success} />;
      case 'withdraw':
        return <ArrowLeft size={18} color={colors.error} />;
      case 'deposit':
        return <Add size={18} color={colors.secondary}  variant="Outline" />;
      case 'expense':
        return <Minus size={18} color={colors.warning}  variant="Outline" />;
      default:
        return <DollarCircle size={18} color={colors.textPrimary}  variant="Outline" />;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'cash':
        return <Money size={14} color={colors.success} />;
      case 'pix':
        return <Scan size={14} color={colors.secondary} />;
      case 'credit':
      case 'debit':
        return <Card size={14} color={colors.warning} />;
      default:
        return null;
    }
  };

  const handleOpenRegister = () => {
    const amount = parseFloat(openingAmount.replace(',', '.')) || 0;
    if (establishmentId) {
      createTransaction.mutate({
        establishment_id: establishmentId,
        type: 'income',
        category: 'abertura',
        description: 'Abertura de caixa',
        amount,
        payment_method: 'cash',
        date: new Date().toISOString(),
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRegisterStatus('open');
    setOpeningBalance(amount);
    setShowOpenModal(false);
    setOpeningAmount('');
  };

  const handleCloseRegister = () => {
    if (establishmentId) {
      createTransaction.mutate({
        establishment_id: establishmentId,
        type: 'expense',
        category: 'fechamento',
        description: 'Fechamento de caixa',
        amount: currentCashBalance,
        payment_method: 'cash',
        date: new Date().toISOString(),
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRegisterStatus('closed');
    setShowCloseModal(false);
  };

  const handleAddMovement = () => {
    const amount = parseFloat(movementAmount.replace(',', '.')) || 0;
    if (establishmentId && amount > 0) {
      createTransaction.mutate({
        establishment_id: establishmentId,
        type: movementType === 'deposit' ? 'income' : 'expense',
        category: movementType === 'deposit' ? 'reforco' : 'sangria',
        description: movementDescription || (movementType === 'deposit' ? 'Reforço de caixa' : 'Sangria'),
        amount,
        payment_method: 'cash',
        date: new Date().toISOString(),
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMovementModal(false);
    setMovementAmount('');
    setMovementDescription('');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220, backgroundColor: colors.background }} />
      <SafeAreaView className="flex-1" edges={['top']}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
              >
                <ArrowLeft2 size={24} color={colors.textPrimary}  variant="Outline" />
              </Pressable>
              <View>
                <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">Controle de Caixa</Text>
                <Text style={{ color: colors.textMuted }} className="text-sm">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </View>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: registerStatus === 'open' ? colors.success + '30' : colors.error + '30' }}
            >
              <Text style={{ color: registerStatus === 'open' ? colors.success : colors.error }} className="text-xs font-medium">
                {registerStatus === 'open' ? 'Aberto' : 'Fechado'}
              </Text>
            </View>
          </View>

          {/* Cash Balance Card */}
          <Animated.View entering={FadeInDown.delay(100)} className="px-5 mb-4">
            <View className="rounded-2xl p-5" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-500 text-sm">Saldo em Caixa (Dinheiro)</Text>
                <Wallet size={24} color={colors.success} />
              </View>
              <Text style={{ color: colors.textPrimary }} className="text-4xl font-bold">
                {formatCurrency(currentCashBalance)}
              </Text>
              <View className="flex-row items-center mt-2">
                <Clock size={14} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-500 text-xs ml-1">
                  Abertura: {formatCurrency(openingBalance)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View entering={FadeInDown.delay(200)} className="px-5 mb-4">
            <View className="flex-row">
              <View className="flex-1 mr-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center mb-2">
                  <Money size={16} color={colors.success} />
                  <Text className="text-gray-500 text-xs ml-2">Dinheiro</Text>
                </View>
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                  {formatCurrency(cashSales)}
                </Text>
              </View>
              <View className="flex-1 mx-1 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center mb-2">
                  <Scan size={16} color={colors.primary} />
                  <Text style={{ color: colors.textMuted }} className="text-xs ml-2">PIX</Text>
                </View>
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                  {formatCurrency(pixSales)}
                </Text>
              </View>
              <View className="flex-1 ml-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center mb-2">
                  <Card size={16} color={colors.primary} />
                  <Text style={{ color: colors.textMuted }} className="text-xs ml-2">Cartão</Text>
                </View>
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                  {formatCurrency(cardSales)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Total Sales */}
          <Animated.View entering={FadeInDown.delay(300)} className="px-5 mb-4">
            <View className="flex-row">
              <View className="flex-1 mr-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-500 text-xs mb-1">Total Vendas</Text>
                    <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
                      {formatCurrency(totalSales)}
                    </Text>
                  </View>
                  <TrendUp size={24} color={colors.primary}  variant="Outline" />
                </View>
              </View>
              <View className="flex-1 ml-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text style={{ color: colors.textMuted }} className="text-xs mb-1">Sangrias/Reforços</Text>
                    <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
                      {formatCurrency(deposits - withdrawals)}
                    </Text>
                  </View>
                  {deposits > withdrawals ? (
                    <TrendUp size={24} color={colors.primary}  variant="Outline" />
                  ) : (
                    <TrendDown size={24} color={colors.textMuted}  variant="Outline" />
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          {registerStatus === 'open' && (
            <Animated.View entering={FadeInDown.delay(400)} className="px-5 mb-6">
              <View className="flex-row">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMovementType('deposit');
                    setShowMovementModal(true);
                  }}
                  className="flex-1 mr-2 py-3 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}
                >
                  <Add size={18} color={colors.success}  variant="Outline" />
                  <Text style={{ color: colors.textPrimary }} className="font-semibold ml-2">Reforço</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMovementType('withdraw');
                    setShowMovementModal(true);
                  }}
                  className="flex-1 ml-2 py-3 rounded-xl flex-row items-center justify-center"
                  style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}
                >
                  <Minus size={18} color={colors.error}  variant="Outline" />
                  <Text style={{ color: colors.textPrimary }} className="font-semibold ml-2">Sangria</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Movements TextalignLeft */}
          <Animated.View entering={FadeInDown.delay(500)} className="px-5 mb-4">
            <Text className="text-gray-900 font-semibold text-lg mb-4">Movimentações de Hoje</Text>
            <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
              {movements.length === 0 ? (
                <View className="p-6 items-center">
                  <Wallet size={32} color={colors.textMuted} />
                  <Text className="text-gray-500 text-sm mt-2">Nenhuma movimentação hoje</Text>
                </View>
              ) : (
                movements.map((movement, index) => (
                  <Animated.View
                    key={movement.id}
                    entering={SlideInRight.delay(index * 50)}
                    className="flex-row items-center p-4"
                    style={{
                      borderTopWidth: index > 0 ? 1 : 0,
                      borderTopColor: colors.border,
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor:
                          movement.type === 'sale' || movement.type === 'deposit'
                            ? colors.success + '20'
                            : movement.type === 'withdraw'
                            ? colors.error + '20'
                            : colors.primary + '20',
                      }}
                    >
                      {getMovementIcon(movement)}
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium text-sm">{movement.description}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-gray-500 text-xs">{movement.time}</Text>
                        {movement.paymentMethod && (
                          <View className="flex-row items-center ml-2">
                            {getPaymentMethodIcon(movement.paymentMethod)}
                            <Text className="text-gray-500 text-xs ml-1 capitalize">
                              {movement.paymentMethod === 'cash' ? 'Dinheiro' :
                               movement.paymentMethod === 'pix' ? 'PIX' :
                               movement.paymentMethod === 'credit' ? 'Crédito' : 'Débito'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text
                      className="font-bold"
                      style={{
                        color:
                          movement.type === 'sale' || movement.type === 'deposit' || movement.type === 'opening'
                            ? colors.success
                            : colors.error,
                      }}
                    >
                      {movement.type === 'withdraw' ? '-' : '+'}
                      {formatCurrency(movement.amount)}
                    </Text>
                  </Animated.View>
                ))
              )}
            </View>
          </Animated.View>

          {/* Open/Close Register Button */}
          <View className="px-5 mb-8">
            {registerStatus === 'closed' ? (
              <Pressable
                onPress={() => setShowOpenModal(true)}
                className="py-4 rounded-xl items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-bold text-lg">Abrir Caixa</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setShowCloseModal(true)}
                className="py-4 rounded-xl items-center"
                style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.error }}
              >
                <Text style={{ color: colors.error }} className="font-bold text-lg">Fechar Caixa</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
        )}

        {/* Movement Modal */}
        <Modal
          visible={showMovementModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowMovementModal(false)}
        >
          <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
              <View className="px-5 py-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text className="text-gray-900 text-xl font-bold">
                  {movementType === 'deposit' ? 'Reforço de Caixa' : 'Sangria'}
                </Text>
                <Pressable
                  onPress={() => setShowMovementModal(false)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <CloseCircle size={20} color={colors.textMuted}  variant="Outline" />
                </Pressable>
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
                  <View className="py-6">
                    <View className="mb-4">
                      <Text className="text-gray-700 text-sm mb-2">Valor</Text>
                      <View
                        className="flex-row items-center rounded-xl px-4 h-16"
                        style={{ backgroundColor: colors.backgroundCard }}
                      >
                        <Text className="text-gray-500 text-lg">R$</Text>
                        <TextInput
                          value={movementAmount}
                          onChangeText={setMovementAmount}
                          placeholder="0,00"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="decimal-pad"
                          className="flex-1 text-gray-900 text-2xl font-bold ml-2"
                        />
                      </View>
                    </View>

                    <View className="mb-6">
                      <Text className="text-gray-700 text-sm mb-2">Descrição</Text>
                      <TextInput
                        value={movementDescription}
                        onChangeText={setMovementDescription}
                        placeholder={movementType === 'deposit' ? 'Ex: Reforço para troco' : 'Ex: Pagamento fornecedor'}
                        placeholderTextColor={colors.textMuted}
                        className="rounded-xl px-4 py-4 text-gray-900"
                        style={{ backgroundColor: colors.backgroundCard }}
                      />
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>

              <View className="px-5 py-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={handleAddMovement}
                  className="py-4 rounded-xl items-center"
                  style={{ backgroundColor: movementType === 'deposit' ? colors.secondary : colors.error }}
                >
                  <Text className="text-white font-bold text-lg">
                    Confirmar {movementType === 'deposit' ? 'Reforço' : 'Sangria'}
                  </Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        {/* Open Register Modal */}
        <Modal
          visible={showOpenModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowOpenModal(false)}
        >
          <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
              <View className="px-5 py-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text className="text-gray-900 text-xl font-bold">Abrir Caixa</Text>
                <Pressable
                  onPress={() => setShowOpenModal(false)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <CloseCircle size={20} color={colors.textMuted}  variant="Outline" />
                </Pressable>
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
                  <View className="py-6">
                    <View className="mb-6">
                      <Text className="text-gray-700 text-sm mb-2">Valor de Abertura (Troco Inicial)</Text>
                      <View
                        className="flex-row items-center rounded-xl px-4 h-16"
                        style={{ backgroundColor: colors.backgroundCard }}
                      >
                        <Text className="text-gray-500 text-lg">R$</Text>
                        <TextInput
                          value={openingAmount}
                          onChangeText={setOpeningAmount}
                          placeholder="0,00"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="decimal-pad"
                          className="flex-1 text-gray-900 text-2xl font-bold ml-2"
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>

              <View className="px-5 py-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={handleOpenRegister}
                  className="py-4 rounded-xl items-center"
                  style={{ backgroundColor: colors.success }}
                >
                  <Text className="text-white font-bold text-lg">Confirmar Abertura</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        {/* Close Register Modal */}
        <Modal
          visible={showCloseModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCloseModal(false)}
        >
          <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
              <View className="px-5 py-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text className="text-gray-900 text-xl font-bold">Fechar Caixa</Text>
                <Pressable
                  onPress={() => setShowCloseModal(false)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <CloseCircle size={20} color={colors.textMuted}  variant="Outline" />
                </Pressable>
              </View>

              <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                <View className="py-6">
                  <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.backgroundCard }}>
                    <Text className="text-gray-500 text-sm mb-3">Resumo do Dia</Text>

                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-700">Abertura</Text>
                      <Text className="text-gray-900 font-medium">{formatCurrency(openingBalance)}</Text>
                    </View>

                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-700">Vendas em Dinheiro</Text>
                      <Text style={{ color: colors.success }} className="font-medium">+{formatCurrency(cashSales)}</Text>
                    </View>

                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-700">Reforços</Text>
                      <Text style={{ color: colors.secondary }} className="font-medium">+{formatCurrency(deposits)}</Text>
                    </View>

                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-700">Sangrias</Text>
                      <Text style={{ color: colors.error }} className="font-medium">-{formatCurrency(withdrawals)}</Text>
                    </View>

                    <View className="h-px my-3" style={{ backgroundColor: colors.border }} />

                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-900 font-semibold">Saldo Final</Text>
                      <Text style={{ color: colors.success }} className="text-xl font-bold">{formatCurrency(currentCashBalance)}</Text>
                    </View>
                  </View>

                  <View className="rounded-xl p-4 mb-6" style={{ backgroundColor: colors.backgroundCard }}>
                    <Text className="text-gray-500 text-sm mb-3">Total de Vendas (Todos os Meios)</Text>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-700">Dinheiro</Text>
                      <Text className="text-gray-900 font-medium">{formatCurrency(cashSales)}</Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-700">PIX</Text>
                      <Text className="text-gray-900 font-medium">{formatCurrency(pixSales)}</Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-700">Cartão</Text>
                      <Text className="text-gray-900 font-medium">{formatCurrency(cardSales)}</Text>
                    </View>
                    <View className="h-px my-3" style={{ backgroundColor: colors.border }} />
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-900 font-semibold">Total</Text>
                      <Text style={{ color: colors.secondary }} className="text-xl font-bold">{formatCurrency(totalSales)}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View className="px-5 py-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={handleCloseRegister}
                  className="py-4 rounded-xl items-center"
                  style={{ backgroundColor: colors.error }}
                >
                  <Text className="text-white font-bold text-lg">Confirmar Fechamento</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
