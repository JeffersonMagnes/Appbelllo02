import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Dimensions, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowRight2, TickCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';

const { width: SW, height: SH } = Dimensions.get('window');

export interface WalkthroughStep {
  title: string;
  description: string;
  position: 'top' | 'center' | 'bottom';
}

const STEPS: WalkthroughStep[] = [
  {
    title: 'Bem-vindo ao Appbello! 👋',
    description: 'Vamos fazer um tour rápido para você conhecer as principais funcionalidades do seu painel.',
    position: 'center',
  },
  {
    title: 'Resumo do Dia 📊',
    description: 'Aqui você vê o faturamento de hoje, lucro do mês e a meta. Tudo atualizado em tempo real.',
    position: 'top',
  },
  {
    title: 'Estatísticas Rápidas 📈',
    description: 'Agendamentos do dia, total de clientes e profissionais — tudo de relance.',
    position: 'top',
  },
  {
    title: 'Ações Rápidas ⚡',
    description: 'Agende um horário, veja clientes, comandas, financeiro, relatórios e muito mais com um toque.',
    position: 'center',
  },
  {
    title: 'Próximos Agendamentos 📅',
    description: 'Veja os atendimentos de hoje e acompanhe o status de cada um.',
    position: 'center',
  },
  {
    title: 'Gestão Completa 🏢',
    description: 'Agenda, financeiro, equipe, produtos, link de agendamento e assistente IA — tudo organizado.',
    position: 'bottom',
  },
  {
    title: 'Tudo pronto! 🎉',
    description: 'Você está pronto para usar o Appbello. Explore cada seção e gerencie seu negócio com facilidade!',
    position: 'center',
  },
];

interface WalkthroughProps {
  visible: boolean;
  onFinish: () => void;
}

export function Walkthrough({ visible, onFinish }: WalkthroughProps) {
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      onFinish();
      setStep(0);
    } else {
      setStep(s => s + 1);
    }
  }, [isLast, onFinish]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFinish();
    setStep(0);
  }, [onFinish]);

  if (!visible) return null;

  const tooltipTop = currentStep.position === 'top' ? SH * 0.42
    : currentStep.position === 'bottom' ? SH * 0.15
    : SH * 0.3;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.75)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={handleNext} />

        <Animated.View
          key={step}
          entering={SlideInDown.duration(350).springify()}
          style={{
            position: 'absolute',
            top: tooltipTop,
            left: 20,
            right: 20,
            backgroundColor: '#fff',
            borderRadius: 24,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          {/* Progress dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16, gap: 6 }}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === step ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>

          <Text style={{
            fontSize: 20,
            fontWeight: '800',
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {currentStep.title}
          </Text>

          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 21,
            marginBottom: 24,
          }}>
            {currentStep.description}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {!isLast && (
              <Pressable
                onPress={handleSkip}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 15 }}>Pular</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleNext}
              style={{
                flex: isLast ? 1 : 1.5,
                height: 48,
                borderRadius: 14,
                backgroundColor: colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {isLast ? (
                <>
                  <TickCircle size={18} color="#fff" variant="Outline" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Começar!</Text>
                </>
              ) : (
                <>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {isFirst ? 'Iniciar Tour' : 'Próximo'}
                  </Text>
                  <ArrowRight2 size={16} color="#fff" variant="Outline" />
                </>
              )}
            </Pressable>
          </View>

          {/* Step counter */}
          <Text style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 12,
            color: colors.textMuted,
            fontWeight: '600',
          }}>
            {step + 1} de {STEPS.length}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
