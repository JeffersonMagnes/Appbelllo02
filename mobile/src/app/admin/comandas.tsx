import React, { useRef, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';
import { useComandas, useCreateComanda, useCloseComanda, useAddComandaItem } from '@/lib/hooks/use-comandas';
import { useClients } from '@/lib/hooks/use-clients';
import { useServices } from '@/lib/hooks/use-services';
import { useProducts } from '@/lib/hooks/use-products';
import { useAuthStore } from '@/lib/state/auth-store';
import { Client } from '@/lib/types';
import { type PaymentState, type PrintState, type NewComandaState, type AddItemState, type ReceiptData } from '@/lib/comanda-ui-types';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';

import { PaymentModal } from '@/components/comanda-payment-modal';
import { PrintModal } from '@/components/comanda-print-modal';
import { NewComandaModal } from '@/components/comanda-new-modal';
import { AddItemModal } from '@/components/comanda-add-item-modal';
import { ReceiptModal } from '@/components/comanda-receipt-modal';
import { ComandaHeader, type ComandaStatusFilter } from '@/components/comanda-header';
import { ComandaCard } from '@/components/comanda-card';
import { ComandaDateFilterSheet, type ComandaDateFilter } from '@/components/comanda-date-filter-sheet';

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

  const [filter, setFilter] = useState<ComandaStatusFilter>('all');

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

  const [dateFilter, setDateFilter] = useState<ComandaDateFilter>('all');
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

        <ComandaHeader
          onBack={() => router.back()}
          dateFilterActive={dateFilter !== 'all'}
          onOpenDateFilter={() => setShowDateSheet(true)}
          onNew={handleNovaComanda}
          openCount={openComandas.length}
          totalOpen={totalOpen}
          filter={filter}
          onSelectFilter={setFilter}
        />

        {/* Lista */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          {filteredComandas.map((comanda) => {
            const client = (clientsData ?? []).find(c => c.id === comanda.clientId);
            return (
              <ComandaCard
                key={comanda.id}
                comanda={comanda}
                client={client}
                onAddItem={handleAdicionarItem}
                onPrint={handleImprimir}
                onPay={handlePagar}
              />
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
      <ComandaDateFilterSheet
        visible={showDateSheet}
        onClose={() => setShowDateSheet(false)}
        dateFilter={dateFilter}
        onSelect={(key) => { setDateFilter(key); setShowDateSheet(false); }}
        onClear={() => { setDateFilter('all'); setShowDateSheet(false); }}
      />
    </View>
    </FeatureGate>
  );
}
