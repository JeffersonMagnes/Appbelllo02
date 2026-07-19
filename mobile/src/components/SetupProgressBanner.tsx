import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Buildings2, Location, Colorfilter, Clock, User, Scissor, TickSquare, ArrowRight2, CloseCircle, Flash, InfoCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useSetupStore, SETUP_STEPS, type SetupStep } from '@/lib/state/setup-store';

const STEP_ICONS: Record<string, React.ReactNode> = {
  building: <Buildings2 size={18} color={colors.primary}  variant="Outline" />,
  'map-pin': <Location size={18} color={colors.primary}  variant="Outline" />,
  palette: <Colorfilter size={18} color={colors.primary}  variant="Outline" />,
  clock: <Clock size={18} color={colors.primary}  variant="Outline" />,
  user: <User size={18} color={colors.primary}  variant="Outline" />,
  scissors: <Scissor size={18} color={colors.primary}  variant="Outline" />,
};

interface SetupBannerProps {
  /** If true, show the full expanded list. If false, show compact card */
  expanded?: boolean;
}

export function SetupProgressBanner({ expanded = false }: SetupBannerProps) {
  const router = useRouter();

  const completedSteps = useSetupStore(s => s.completedSteps);
  const dismissed = useSetupStore(s => s.dismissed);
  const dismiss = useSetupStore(s => s.dismiss);
  const isFullyComplete = useSetupStore(s => s.isFullyComplete)();
  const pendingSteps = useSetupStore(s => s.getPendingSteps)();
  const completionPercent = useSetupStore(s => s.getCompletionPercent)();
  const requiredPending = useSetupStore(s => s.getRequiredPendingSteps)();

  // Don't show if fully complete or dismissed
  if (isFullyComplete || dismissed) return null;

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (requiredPending.length > 0) {
      Alert.alert(
        'Ocultar por agora?',
        `Você ainda tem ${requiredPending.length} etapa${requiredPending.length > 1 ? 's' : ''} obrigatória${requiredPending.length > 1 ? 's' : ''} pendente${requiredPending.length > 1 ? 's' : ''}. O lembrete voltará a aparecer.`,
        [
          { text: 'Manter visível', style: 'cancel' },
          { text: 'Ocultar', onPress: () => dismiss() },
        ]
      );
    } else {
      dismiss();
    }
  };

  const handleStepPress = (step: SetupStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(step.route as any);
  };

  const completedCount = completedSteps.length;
  const totalCount = SETUP_STEPS.length;
  const isAlmostDone = completionPercent >= 60;
  const isJustStarted = completionPercent === 0;

  // Accent colors based on progress
  const accentColor = isAlmostDone
    ? '#22c55e'
    : isJustStarted
    ? '#f59e0b'
    : colors.primary;

  const accentColorLight = isAlmostDone
    ? '#22c55e22'
    : isJustStarted
    ? '#f59e0b22'
    : colors.primary + '22';

  const accentColorBg = isAlmostDone
    ? '#f0fdf4'
    : isJustStarted
    ? '#fffbeb'
    : '#f0effe';

  return (
    <Animated.View entering={FadeInDown.duration(500)}>
      <View
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 16,
          backgroundColor: accentColorBg,
          borderWidth: 1,
          borderColor: accentColor + '30',
        }}
      >
        {/* Header */}
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: accentColor + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            flexShrink: 0,
          }}>
            {isAlmostDone
              ? <Flash size={20} color={accentColor} />
              : <InfoCircle size={20} color={accentColor} />
            }
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 2 }}>
              {isAlmostDone
                ? 'Quase lá! Finalize o cadastro'
                : isJustStarted
                ? 'Complete seu cadastro para começar'
                : 'Continue configurando seu negócio'
              }
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17 }}>
              {completedCount} de {totalCount} etapas concluídas
              {requiredPending.length > 0 ? ` · ${requiredPending.length} obrigatória${requiredPending.length > 1 ? 's' : ''} pendente${requiredPending.length > 1 ? 's' : ''}` : ''}
            </Text>
          </View>

          <Pressable
            onPress={handleDismiss}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
          >
            <CloseCircle size={14} color={colors.textMuted}  variant="Outline" />
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
          <View style={{
            height: 6,
            backgroundColor: accentColor + '25',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                width: `${Math.max(completionPercent, 4)}%`,
                backgroundColor: accentColor,
              }}
            />
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 5 }}>
            {completionPercent}% completo
          </Text>
        </View>

        {/* Steps list */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}
        >
          {SETUP_STEPS.map((step) => {
            const isDone = completedSteps.includes(step.id);
            return (
              <Pressable
                key={step.id}
                onPress={() => !isDone && handleStepPress(step)}
                style={{
                  width: 140,
                  borderRadius: 14,
                  overflow: 'hidden',
                  opacity: isDone ? 0.6 : 1,
                }}
              >
                <View
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderRadius: 14,
                    backgroundColor: isDone
                      ? 'rgba(34,197,94,0.08)'
                      : colors.backgroundCard,
                    borderColor: isDone
                      ? 'rgba(34,197,94,0.3)'
                      : step.required
                      ? accentColor + '40'
                      : colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      backgroundColor: isDone
                        ? 'rgba(34,197,94,0.15)'
                        : accentColor + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                    }}>
                      {isDone
                        ? <TickSquare size={15} color="#22c55e"  variant="Outline" />
                        : STEP_ICONS[step.icon]
                      }
                    </View>
                    {step.required && !isDone && (
                      <View style={{
                        backgroundColor: '#f59e0b20',
                        borderRadius: 4,
                        paddingHorizontal: 5,
                        paddingVertical: 2,
                      }}>
                        <Text style={{ color: '#f59e0b', fontSize: 9, fontWeight: '800' }}>
                          OBRIGATÓRIO
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={{
                    color: isDone ? '#22c55e' : colors.textPrimary,
                    fontSize: 12,
                    fontWeight: '700',
                    marginBottom: 3,
                    lineHeight: 16,
                  }} numberOfLines={2}>
                    {step.title}
                  </Text>
                  <Text style={{
                    color: colors.textMuted,
                    fontSize: 10,
                    lineHeight: 13,
                  }} numberOfLines={2}>
                    {isDone ? 'Concluído ✓' : step.description}
                  </Text>

                  {!isDone && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 8,
                    }}>
                      <Text style={{
                        color: accentColor,
                        fontSize: 11,
                        fontWeight: '700',
                        marginRight: 2,
                      }}>
                        Configurar
                      </Text>
                      <ArrowRight2 size={11} color={accentColor}  variant="Outline" />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}
