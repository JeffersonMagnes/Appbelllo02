import React from 'react';
import { View, Text, Modal, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Warning2, InfoCircle, TickCircle, CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme';

const { width: SW } = Dimensions.get('window');

type ConfirmVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANTS = {
  danger:  { icon: <CloseCircle      size={30} color="#FF453A"  variant="Outline" />, iconBg: '#FF453A15', gradColors: ['#FF453A','#CC2E23'] as [string,string], accent: '#FF453A' },
  warning: { icon: <Warning2 size={30} color="#FF9F0A"  variant="Outline" />, iconBg: '#FF9F0A15', gradColors: ['#FF9F0A','#CC7A00'] as [string,string], accent: '#FF9F0A' },
  success: { icon: <TickCircle  size={30} color="#30D158"  variant="Outline" />, iconBg: '#30D15815', gradColors: ['#30D158','#1FA843'] as [string,string], accent: '#30D158' },
  info:    { icon: <InfoCircle         size={30} color="#5333ed"  variant="Outline" />, iconBg: '#5333ed15', gradColors: ['#5333ed','#3D1FD9'] as [string,string], accent: '#5333ed' },
};

export function ConfirmModal({
  visible, title, message,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  variant = 'danger', onConfirm, onCancel,
}: ConfirmModalProps) {
  const v = VARIANTS[variant];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)}
        style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', alignItems:'center', justifyContent:'center', paddingHorizontal:28 }}>
        <Pressable style={{ position:'absolute', inset:0 }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCancel(); }} />

        <Animated.View entering={ZoomIn.springify().damping(18).stiffness(280)} exiting={ZoomOut.duration(160)}
          style={{ width: SW - 56, backgroundColor: colors.backgroundCard, borderRadius:20, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:8}, shadowOpacity:0.15, shadowRadius:20, elevation:10 }}>

          {/* Faixa colorida no topo */}
          <LinearGradient colors={v.gradColors} start={{x:0,y:0}} end={{x:1,y:0}} style={{ height:4 }} />

          <View style={{ padding:22 }}>
            {/* Ícone */}
            <View style={{ width:54, height:54, borderRadius:16, backgroundColor: v.iconBg, alignItems:'center', justifyContent:'center', marginBottom:14 }}>
              {v.icon}
            </View>

            {/* Título */}
            <Text style={{ color: colors.textPrimary, fontSize:18, fontWeight:'800', marginBottom: message ? 6 : 0, lineHeight:24 }}>
              {title}
            </Text>

            {/* Mensagem */}
            {message && (
              <Text style={{ color: colors.textMuted, fontSize:14, lineHeight:20 }}>
                {message}
              </Text>
            )}

            {/* Botões */}
            <View style={{ flexDirection:'row', gap:10, marginTop:22 }}>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCancel(); }}
                style={{ flex:1, height:46, borderRadius:12, backgroundColor: colors.surface, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: colors.border }}>
                <Text style={{ color: colors.textSecondary, fontWeight:'700', fontSize:15 }}>{cancelLabel}</Text>
              </Pressable>

              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onConfirm(); }}
                style={{ flex:1, height:46, borderRadius:12, overflow:'hidden' }}>
                <LinearGradient colors={v.gradColors} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color:'#fff', fontWeight:'800', fontSize:15 }}>{confirmLabel}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
