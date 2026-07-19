import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Box, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { seedDemoData } from '@/lib/demo-data';

const { width: SW } = Dimensions.get('window');

type ModalState = 'idle' | 'loading' | 'success';

interface DemoDataModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSeedComplete: () => void;
  establishmentId: string;
}

export function DemoDataModal({
  visible,
  onDismiss,
  onSeedComplete,
  establishmentId,
}: DemoDataModalProps) {
  const [state, setState] = useState<ModalState>('idle');
  const insets = useSafeAreaInsets();

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setState('idle');
    }
  }, [visible]);

  const handleSeed = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState('loading');

    try {
      await seedDemoData(supabase, establishmentId);
      setState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Auto-dismiss after 1.5 seconds
      setTimeout(() => {
        onSeedComplete();
      }, 1500);
    } catch (error) {
      console.error('Failed to seed demo data:', error);
      setState('idle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [establishmentId, onSeedComplete]);

  const handleDismiss = useCallback(() => {
    if (state === 'loading') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  }, [state, onDismiss]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        {/* Backdrop press */}
        <Pressable
          style={{ position: 'absolute', inset: 0 }}
          onPress={handleDismiss}
        />

        {/* Bottom sheet card */}
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(240)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: colors.backgroundCard,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          {/* Top gradient accent bar */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 4 }}
          />

          {/* Handle indicator */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
              }}
            />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24, paddingTop: 8 }}
          >
            {state === 'success' ? (
              /* Success state */
              <Animated.View
                entering={ZoomIn.springify().damping(14).stiffness(200)}
                style={{ alignItems: 'center', paddingVertical: 24 }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: colors.success + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <TickCircle size={40} color={colors.success} variant="Bold" />
                </View>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: '800',
                    textAlign: 'center',
                  }}
                >
                  Dados preenchidos!
                </Text>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 14,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  Tudo pronto para explorar
                </Text>
              </Animated.View>
            ) : (
              /* Idle / Loading state */
              <>
                {/* Icon */}
                <Animated.View entering={FadeInUp.delay(100).duration(300)}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      backgroundColor: colors.primary + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Box size={28} color={colors.primary} variant="Bold" />
                  </View>
                </Animated.View>

                {/* Title */}
                <Animated.View entering={FadeInUp.delay(150).duration(300)}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 20,
                      fontWeight: '800',
                      lineHeight: 26,
                      marginBottom: 8,
                    }}
                  >
                    Quer ver como o app funciona?
                  </Text>
                </Animated.View>

                {/* Description */}
                <Animated.View entering={FadeInUp.delay(200).duration(300)}>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 15,
                      lineHeight: 22,
                      marginBottom: 24,
                    }}
                  >
                    Preencha seu estabelecimento com dados de exemplo para explorar todas as
                    funcionalidades. Você pode limpar os dados depois nas configurações.
                  </Text>
                </Animated.View>

                {/* Buttons */}
                <Animated.View entering={FadeInUp.delay(250).duration(300)} style={{ gap: 10 }}>
                  {/* Primary: Preencher com exemplos */}
                  <Pressable
                    onPress={handleSeed}
                    disabled={state === 'loading'}
                    style={{
                      height: 52,
                      borderRadius: 14,
                      overflow: 'hidden',
                      opacity: state === 'loading' ? 0.7 : 1,
                    }}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      {state === 'loading' ? (
                        <>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                            Preparando dados...
                          </Text>
                        </>
                      ) : (
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                          Preencher com exemplos
                        </Text>
                      )}
                    </LinearGradient>
                  </Pressable>

                  {/* Secondary: Começar do zero */}
                  <Pressable
                    onPress={handleDismiss}
                    disabled={state === 'loading'}
                    style={{
                      height: 52,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: state === 'loading' ? 0.5 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontWeight: '700',
                        fontSize: 16,
                      }}
                    >
                      Começar do zero
                    </Text>
                  </Pressable>
                </Animated.View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
