import React from 'react';
import { View, Text, Pressable, Dimensions, Modal } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  SlideInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Chart2,
  Element4,
  MagicStar,
  Briefcase,
  Notification,
  Setting2,
  Scissor,
  Calendar,
  User,
  Flash,
  ArrowRight2,
  ArrowLeft2,
  CloseCircle,
  TickCircle,
} from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useTutorialStore, TUTORIAL_STEPS } from '@/lib/state/tutorial-store';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ICON_MAP: Record<string, (color: string) => React.ReactNode> = {
  rocket: (c) => <Flash size={28} color={c} />,
  chart: (c) => <Chart2 size={28} color={c} />,
  grid: (c) => <Element4 size={28} color={c} />,
  magic: (c) => <MagicStar size={28} color={c} variant="Outline" />,
  briefcase: (c) => <Briefcase size={28} color={c} />,
  bell: (c) => <Notification size={28} color={c} />,
  settings: (c) => <Setting2 size={28} color={c} variant="Outline" />,
  scissors: (c) => <Scissor size={28} color={c} variant="Outline" />,
  calendar: (c) => <Calendar size={28} color={c} variant="Outline" />,
  user: (c) => <User size={28} color={c} variant="Outline" />,
};

const STEP_COLORS: string[] = [
  '#7C3AED',
  colors.primary,
  colors.secondary,
  '#7C3AED',
  colors.primary,
  '#EF4444',
  '#6B7280',
  colors.secondary,
  colors.primary,
  '#7C3AED',
];

export function TutorialOverlay() {
  const showTutorial = useTutorialStore(s => s.showTutorial);
  const currentStep = useTutorialStore(s => s.currentStep);
  const nextStep = useTutorialStore(s => s.nextStep);
  const prevStep = useTutorialStore(s => s.prevStep);
  const skipTutorial = useTutorialStore(s => s.skipTutorial);
  const completeTutorial = useTutorialStore(s => s.completeTutorial);

  if (!showTutorial) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = (currentStep + 1) / TUTORIAL_STEPS.length;
  const stepColor = STEP_COLORS[currentStep % STEP_COLORS.length];
  const iconRenderer = ICON_MAP[step.icon];

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      completeTutorial();
    } else {
      nextStep();
    }
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    prevStep();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    skipTutorial();
  };

  return (
    <Modal visible={showTutorial} transparent animationType="none" statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
      >
        {/* Skip button */}
        <Animated.View
          entering={FadeIn.delay(400)}
          style={{ position: 'absolute', top: 60, right: 20, zIndex: 10 }}
        >
          <Pressable
            onPress={handleSkip}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginRight: 4 }}>
              Pular
            </Text>
            <CloseCircle size={14} color="rgba(255,255,255,0.5)" variant="Outline" />
          </Pressable>
        </Animated.View>

        {/* Step counter */}
        <Animated.View
          entering={FadeIn.delay(200)}
          style={{ position: 'absolute', top: 64, left: 20 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' }}>
            {currentStep + 1} de {TUTORIAL_STEPS.length}
          </Text>
        </Animated.View>

        {/* Main card */}
        <Animated.View
          key={`step-${currentStep}`}
          entering={FadeInDown.duration(400).springify()}
          style={{
            width: SCREEN_WIDTH - 40,
            borderRadius: 28,
            overflow: 'hidden',
            shadowColor: stepColor,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          {/* Gradient header */}
          <LinearGradient
            colors={[stepColor, stepColor + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: 36,
              paddingBottom: 28,
              alignItems: 'center',
            }}
          >
            {/* Icon circle */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {iconRenderer ? iconRenderer('#fff') : null}
              </View>
            </View>

            <Text
              style={{
                color: '#fff',
                fontSize: 22,
                fontWeight: '800',
                textAlign: 'center',
                paddingHorizontal: 20,
              }}
            >
              {step.title}
            </Text>
          </LinearGradient>

          {/* Content */}
          <View style={{ backgroundColor: colors.backgroundCard, padding: 24 }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 15,
                lineHeight: 24,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              {step.description}
            </Text>

            {/* Progress bar */}
            <View
              style={{
                height: 4,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 2,
                marginBottom: 20,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  height: 4,
                  borderRadius: 2,
                  width: `${progress * 100}%`,
                  backgroundColor: stepColor,
                }}
              />
            </View>

            {/* Step dots */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginBottom: 20,
                gap: 6,
              }}
            >
              {TUTORIAL_STEPS.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === currentStep ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor:
                      i === currentStep
                        ? stepColor
                        : i < currentStep
                          ? stepColor + '60'
                          : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </View>

            {/* Navigation buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {!isFirst && (
                <Pressable
                  onPress={handlePrev}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <ArrowLeft2 size={18} color={colors.textMuted} variant="Outline" />
                  <Text style={{ color: colors.textMuted, fontSize: 15, fontWeight: '600', marginLeft: 6 }}>
                    Voltar
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleNext}
                style={{
                  flex: isFirst ? 1 : 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: stepColor,
                  shadowColor: stepColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                {isLast ? (
                  <>
                    <TickCircle size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 6 }}>
                      Começar a usar!
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginRight: 6 }}>
                      {isFirst ? 'Começar Tour' : 'Próximo'}
                    </Text>
                    <ArrowRight2 size={18} color="#fff" variant="Outline" />
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Bottom hint */}
        <Animated.View entering={FadeIn.delay(600)} style={{ marginTop: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' }}>
            Você pode rever o tutorial depois em Perfil &gt; Central de Ajuda
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
