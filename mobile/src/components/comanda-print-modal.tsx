import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Printer, CloseCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils/comanda-format';
import { buildReceiptHTML } from '@/lib/comanda-receipt-html';
import { type PrintState } from '@/lib/comanda-ui-types';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// ── Modal de Impressão ────────────────────────────────────────────────────────
export function PrintModal({
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
