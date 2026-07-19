import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  Modal, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Add, Trash, CloseCircle, Card, Mobile, ArrowDown2, InfoCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import {
  usePaymentFeesStore,
  CardBrand, CardTaxEntry, ReceivesIn,
} from '@/lib/state/payment-fees-store';

type Tab = 'credit' | 'debit' | 'pix';

const BRANDS: { key: CardBrand; label: string }[] = [
  { key: 'any', label: 'Qualquer *' },
  { key: 'mastercard', label: 'MasterCard' },
  { key: 'visa', label: 'Visa' },
  { key: 'elo', label: 'Elo' },
  { key: 'hipercard', label: 'HiperCard' },
  { key: 'amex', label: 'Amex' },
];

const RECEIVES_OPTIONS: { key: ReceivesIn; label: string }[] = [
  { key: 'per_installment', label: 'Conforme parcelas' },
  { key: 'today', label: 'Hoje' },
  { key: 'tomorrow', label: 'Amanhã' },
  { key: 2, label: '2 dias' },
  { key: 3, label: '3 dias' },
  { key: 14, label: '14 dias' },
  { key: 30, label: '30 dias' },
  { key: 90, label: '90 dias' },
];

const INSTALLMENTS = Array.from({ length: 12 }, (_, i) => i + 1);

const receivesLabel = (r: ReceivesIn): string => {
  if (r === 'per_installment') return 'Conforme parcelas';
  if (r === 'today') return 'Hoje';
  if (r === 'tomorrow') return 'Amanhã';
  return `${r} dias`;
};

export default function PaymentFeesScreen() {
  const router = useRouter();
  const {
    creditTaxes, debitTaxes, pixFee,
    addCreditTax, removeCreditTax,
    addDebitTax, removeDebitTax,
    setPixFee,
  } = usePaymentFeesStore();

  const [tab, setTab] = useState<Tab>('credit');
  const [filterBrand, setFilterBrand] = useState<CardBrand>('any');
  const [showModal, setShowModal] = useState(false);

  // Modal form
  const [installments, setInstallments] = useState(1);
  const [brand, setBrand] = useState<CardBrand>('any');
  const [feePercent, setFeePercent] = useState('');
  const [receivesIn, setReceivesIn] = useState<ReceivesIn>('today');
  const [showInstallmentPicker, setShowInstallmentPicker] = useState(false);
  const [pixFeeInput, setPixFeeInput] = useState(String(pixFee.feePercent));
  const [debitFeeInput, setDebitFeeInput] = useState(
    debitTaxes[0] ? String(debitTaxes[0].feePercent) : ''
  );

  const openModal = (nextInstallment?: number) => {
    setInstallments(nextInstallment ?? 1);
    setBrand('any');
    setFeePercent('');
    setReceivesIn('today');
    setShowModal(true);
  };

  const handleSave = (andNext = false) => {
    const fee = parseFloat(feePercent.replace(',', '.'));
    if (isNaN(fee) || fee <= 0) {
      Alert.alert('Atenção', 'Informe uma taxa válida.');
      return;
    }
    if (tab === 'credit') {
      addCreditTax({ installments, brand, feePercent: fee, receivesIn });
    } else if (tab === 'debit') {
      addDebitTax({ brand, feePercent: fee, receivesIn });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (andNext && tab === 'credit') {
      setInstallments(installments + 1);
      setFeePercent('');
    } else {
      setShowModal(false);
    }
  };

  const handleSavePix = () => {
    const fee = parseFloat(pixFeeInput.replace(',', '.'));
    if (isNaN(fee) || fee < 0) {
      Alert.alert('Valor inválido', 'Informe um valor válido para a taxa PIX.');
      return;
    }
    setPixFee({ feePercent: fee, receivesIn: 'today' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Salvo!', `Taxa PIX configurada: ${fee}%`);
  };

  const handleSaveDebit = () => {
    const fee = parseFloat(debitFeeInput.replace(',', '.'));
    if (isNaN(fee)) return;
    if (debitTaxes.length > 0) removeDebitTax(0);
    addDebitTax({ brand: 'any', feePercent: fee, receivesIn: 'today' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const filteredCredit = filterBrand === 'any'
    ? creditTaxes
    : creditTaxes.filter(t => t.brand === filterBrand || t.brand === 'any');

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center bg-gray-100">
            <ArrowLeft size={20} color="#374151"  variant="Outline" />
          </Pressable>
          <Text className="text-gray-900 font-bold text-lg">Taxas de Pagamento</Text>
          <View className="w-10" />
        </View>

        {/* Tabs */}
        <View className="flex-row px-5 pt-4 pb-2" style={{ gap: 8 }}>
          {(['credit', 'debit', 'pix'] as Tab[]).map(t => (
            <Pressable key={t} onPress={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl items-center"
              style={{ backgroundColor: tab === t ? colors.primary : '#F3F4F6' }}>
              <Text className="text-sm font-semibold" style={{ color: tab === t ? '#fff' : '#6B7280' }}>
                {t === 'credit' ? 'Crédito' : t === 'debit' ? 'Débito' : 'PIX'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* CREDIT TAB */}
          {tab === 'credit' && (
            <View className="pt-2">
              {/* Brand filter */}
              <Text className="text-gray-500 text-xs mb-2">
                Bandeiras: <Text className="text-[#6666cc]">(Toque para filtrar)</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" style={{ flexGrow: 0 }}>
                <View className="flex-row" style={{ gap: 8 }}>
                  {BRANDS.map(b => (
                    <Pressable key={b.key} onPress={() => setFilterBrand(b.key)}
                      className="px-4 py-2 rounded-full border"
                      style={{
                        backgroundColor: filterBrand === b.key ? colors.primary : '#fff',
                        borderColor: filterBrand === b.key ? colors.primary : '#E5E7EB',
                      }}>
                      <Text className="text-sm font-medium" style={{ color: filterBrand === b.key ? '#fff' : '#374151' }}>
                        {b.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {filterBrand === 'any' && (
                <View className="flex-row items-start mb-4 px-1" style={{ gap: 6 }}>
                  <Text className="text-[#6666cc] text-xs font-bold">*</Text>
                  <Text className="text-gray-500 text-xs flex-1">
                    Serão utilizadas as taxas "Qualquer Bandeira" caso você não especifique a bandeira ao registrar o pagamento.
                  </Text>
                </View>
              )}

              {/* Add default */}
              <Pressable onPress={() => openModal(1)}
                className="flex-row items-center justify-center py-3 rounded-xl mb-4"
                style={{ borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed' }}>
                <Add size={18} color={colors.primary}  variant="Outline" />
                <Text className="ml-2 font-semibold" style={{ color: colors.primary }}>Adicionar taxa</Text>
              </Pressable>

              {/* TextalignLeft */}
              {filteredCredit.length === 0 ? (
                <Text className="text-gray-400 text-center py-6">Nenhuma taxa configurada</Text>
              ) : (
                filteredCredit
                  .sort((a, b) => a.installments - b.installments)
                  .map(entry => (
                    <View key={entry.id} className="mb-3 p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-gray-900 font-medium">
                            Parcelas: {entry.installments === 1 ? 'À Vista' : `${entry.installments}x`}
                            {' · '}Bandeira: {BRANDS.find(b => b.key === entry.brand)?.label ?? entry.brand}
                          </Text>
                          <Text className="text-gray-500 text-sm mt-0.5">
                            Taxa (%): <Text className="font-bold text-gray-900">{entry.feePercent}</Text>
                            {' · '}Recebe em: <Text className="font-medium">{receivesLabel(entry.receivesIn)}</Text>
                          </Text>
                        </View>
                        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); removeCreditTax(entry.id); }}
                          className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>
                          <Trash size={16} color="#EF4444"  variant="Outline" />
                        </Pressable>
                      </View>
                    </View>
                  ))
              )}
            </View>
          )}

          {/* DEBIT TAB */}
          {tab === 'debit' && (
            <View className="pt-4">
              <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text className="text-gray-700 font-medium mb-3 flex-row items-center">
                  <Card size={16} color={colors.primary} /> {'  '}Taxa do Débito (%)
                </Text>
                <View className="flex-row items-center rounded-xl px-4 border" style={{ borderColor: '#E5E7EB', backgroundColor: '#fff' }}>
                  <TextInput
                    value={debitFeeInput}
                    onChangeText={setDebitFeeInput}
                    keyboardType="decimal-pad"
                    placeholder="Ex: 1.99"
                    className="flex-1 py-3 text-gray-900"
                    style={{ fontSize: 16 }}
                  />
                  <Text className="text-gray-500 font-semibold">%</Text>
                </View>
                <Pressable onPress={handleSaveDebit}
                  className="mt-3 py-3 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white font-bold">Salvar</Text>
                </Pressable>
              </View>
              {debitTaxes.map((t, i) => (
                <View key={i} className="mb-3 p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-gray-900 font-medium">Débito · {BRANDS.find(b => b.key === t.brand)?.label}</Text>
                      <Text className="text-gray-500 text-sm mt-0.5">
                        Taxa: <Text className="font-bold text-gray-900">{t.feePercent}%</Text>
                        {' · '}Recebe: <Text className="font-medium">{receivesLabel(t.receivesIn)}</Text>
                      </Text>
                    </View>
                    <Pressable onPress={() => removeDebitTax(i)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>
                      <Trash size={16} color="#EF4444"  variant="Outline" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* PIX TAB */}
          {tab === 'pix' && (
            <View className="pt-4">
              <View className="flex-row items-center mb-4" style={{ gap: 8 }}>
                <Mobile size={20} color={colors.primary} />
                <Text className="text-gray-900 font-semibold">Taxa do PIX</Text>
              </View>
              <View className="p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text className="text-gray-500 text-sm mb-2">Taxa (%)</Text>
                <View className="flex-row items-center rounded-xl px-4 border mb-3" style={{ borderColor: '#E5E7EB', backgroundColor: '#fff' }}>
                  <TextInput
                    value={pixFeeInput}
                    onChangeText={setPixFeeInput}
                    keyboardType="decimal-pad"
                    placeholder="Ex: 0.99"
                    className="flex-1 py-3 text-gray-900"
                    style={{ fontSize: 16 }}
                  />
                  <Text className="text-gray-500 font-semibold">%</Text>
                </View>
                <Pressable onPress={handleSavePix}
                  className="py-3 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white font-bold">Salvar taxa PIX</Text>
                </Pressable>
              </View>
              <View className="mt-4 p-3 rounded-xl flex-row" style={{ backgroundColor: colors.primary + '10', gap: 8 }}>
                <InfoCircle size={16} color={colors.primary}  variant="Outline" />
                <Text className="text-xs flex-1" style={{ color: colors.primary }}>
                  A taxa PIX é descontada automaticamente no cálculo da receita líquida no financeiro.
                </Text>
              </View>
            </View>
          )}

          <View className="h-10" />
        </ScrollView>

        {tab === 'credit' && (
          <View className="px-5 pb-6 pt-3" style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <Pressable onPress={() => openModal(1)}
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: colors.primary }}>
              <Text className="text-white font-bold text-base">+ Adicionar configuração de taxa</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {/* Modal Criar Taxa */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="rounded-t-3xl bg-white" style={{ maxHeight: '90%' }}>
            <View className="flex-row items-center justify-between px-6 pt-5 pb-3">
              <Pressable onPress={() => setShowModal(false)}>
                <Text className="font-medium" style={{ color: colors.primary }}>Fechar</Text>
              </Pressable>
              <Text className="text-gray-900 font-bold text-base">Cria Configuração Taxa</Text>
              <View className="w-12" />
            </View>

            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
              <Text className="text-center font-semibold mb-5" style={{ color: colors.primary }}>
                Configurando taxa {tab === 'credit' ? 'de crédito' : 'de débito'}
              </Text>

              {/* Parcelas (só crédito) */}
              {tab === 'credit' && (
                <>
                  <Text className="text-gray-700 font-medium mb-2">Número de Parcelas</Text>
                  <Pressable onPress={() => setShowInstallmentPicker(!showInstallmentPicker)}
                    className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-4"
                    style={{ backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <Text className="text-gray-900 font-semibold text-base">
                      {installments === 1 ? 'À Vista (1x)' : `${installments}x`}
                    </Text>
                    <ArrowDown2 size={20} color="#6B7280" />
                  </Pressable>
                  {showInstallmentPicker && (
                    <View className="mb-4 rounded-xl overflow-hidden border" style={{ borderColor: '#E5E7EB' }}>
                      {INSTALLMENTS.map(n => (
                        <Pressable key={n} onPress={() => { setInstallments(n); setShowInstallmentPicker(false); }}
                          className="px-4 py-3" style={{ backgroundColor: installments === n ? colors.primary + '15' : '#fff', borderTopWidth: n > 1 ? 1 : 0, borderTopColor: '#F3F4F6' }}>
                          <Text style={{ color: installments === n ? colors.primary : '#374151', fontWeight: installments === n ? '700' : '400' }}>
                            {n === 1 ? 'À Vista (1x)' : `${n}x`}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* Você recebe em */}
              <Text className="text-gray-700 font-medium mb-2">Você recebe em:</Text>
              <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
                {RECEIVES_OPTIONS.map(opt => (
                  <Pressable key={String(opt.key)} onPress={() => setReceivesIn(opt.key)}
                    className="px-3 py-2 rounded-xl border"
                    style={{
                      backgroundColor: receivesIn === opt.key ? colors.primary : '#fff',
                      borderColor: receivesIn === opt.key ? colors.primary : '#E5E7EB',
                    }}>
                    <Text className="text-sm font-medium" style={{ color: receivesIn === opt.key ? '#fff' : '#374151' }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {receivesIn === 'per_installment' && (
                <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: colors.primary + '10' }}>
                  <Text className="text-xs" style={{ color: colors.primary }}>
                    Com esta opção, a primeira parcela cairá no financeiro em 30 dias, a segunda em 60 dias e assim por diante.
                  </Text>
                </View>
              )}

              {/* Taxa */}
              <Text className="text-gray-700 font-medium mb-2">Taxa (%)</Text>
              <View className="flex-row items-center rounded-xl px-4 border mb-6" style={{ borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' }}>
                <TextInput
                  value={feePercent}
                  onChangeText={setFeePercent}
                  keyboardType="decimal-pad"
                  placeholder="Informe a taxa em porcentagem aqui..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 py-3 text-gray-900"
                  style={{ fontSize: 15 }}
                />
                <Text className="text-gray-500 font-bold">%</Text>
              </View>

              {/* Buttons */}
              <Pressable onPress={() => handleSave(false)}
                className="py-4 rounded-2xl items-center mb-3"
                style={{ backgroundColor: colors.primary }}>
                <Text className="text-white font-bold text-base">Salvar</Text>
              </Pressable>

              {tab === 'credit' && (
                <Pressable onPress={() => handleSave(true)}
                  className="py-4 rounded-2xl items-center mb-2"
                  style={{ backgroundColor: colors.secondary }}>
                  <Text className="text-white font-bold text-base">Salvar & Próxima Parcela</Text>
                </Pressable>
              )}

              <Text className="text-gray-400 text-xs text-center mb-6">
                {tab === 'credit' ? "'Salvar & Próxima' permite configurar as demais parcelas mais rapidamente." : ''}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
