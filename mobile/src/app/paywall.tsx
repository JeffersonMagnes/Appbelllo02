import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Crown, TickSquare, Shield, Star1, ArrowRight2, Clock, Gift, Tag, CloseCircle, Profile2User } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useSubscriptionStore, PLANS, type PlanType } from '@/lib/state/subscription-store';
import { useReferralStore, REFERRAL_DISCOUNT_PERCENT } from '@/lib/state/referral-store';

interface PaywallProps {
  mode?: 'trial_expired' | 'upgrade';
}

export default function PaywallScreen({ mode = 'trial_expired' }: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [loading] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  const daysLeft = useSubscriptionStore(s => s.getTrialDaysLeft)();

  const appliedReferralCode = useReferralStore(s => s.appliedReferralCode);
  const applyReferralCode = useReferralStore(s => s.applyReferralCode);
  const clearAppliedCode = useReferralStore(s => s.clearAppliedCode);
  const getDiscountedPrice = useReferralStore(s => s.getDiscountedPrice);
  const initReferralCode = useReferralStore(s => s.initReferralCode);

  const glowAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const discountScale = useSharedValue(1);

  useEffect(() => {
    // Init referral code so user always has one
    initReferralCode();

    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (appliedReferralCode) {
      discountScale.value = withSpring(1.15, { damping: 6 }, () => {
        discountScale.value = withSpring(1, { damping: 8 });
      });
    }
  }, [appliedReferralCode]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.4, 0.9]),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const discountBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: discountScale.value }],
  }));

  const handleApplyCode = () => {
    Keyboard.dismiss();
    if (!referralInput.trim()) return;

    const result = applyReferralCode(referralInput);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setReferralInput('');
      setShowReferralInput(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    Alert.alert(
      result.success ? 'Desconto aplicado!' : 'Código inválido',
      result.message,
      [{ text: 'OK' }]
    );
  };

  const handleRemoveCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearAppliedCode();
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Pagamento em implantação',
      'Nenhuma assinatura foi ativada e nenhuma cobrança foi realizada. A contratação será liberada após a integração oficial do gateway.',
      [{ text: 'Entendi' }]
    );
  };

  const isExpired = mode === 'trial_expired';
  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);
  const originalPrice = selectedPlanData?.priceMonthly ?? 0;
  const finalPrice = appliedReferralCode ? getDiscountedPrice(originalPrice) : originalPrice;
  const savings = originalPrice - finalPrice;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: '#08051A' }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={{ alignItems: 'center', paddingTop: 32, paddingHorizontal: 24, paddingBottom: 8 }}>
              {/* Crown glow */}
              <Animated.View style={[{ marginBottom: 20 }, pulseStyle]}>
                <Animated.View style={[{
                  position: 'absolute',
                  inset: -20,
                  borderRadius: 999,
                  backgroundColor: '#FFB547',
                }, glowStyle]} />
                <LinearGradient
                  colors={['#FFB547', '#FF8C00']}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Crown size={40} color="#fff" />
                </LinearGradient>
              </Animated.View>

              {isExpired ? (
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                  <Text style={{
                    color: colors.warning,
                    fontSize: 13,
                    fontWeight: '700',
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}>
                    Período de teste encerrado
                  </Text>
                  <Text style={{
                    color: '#fff',
                    fontSize: 28,
                    fontWeight: '800',
                    textAlign: 'center',
                    lineHeight: 34,
                    marginBottom: 12,
                  }}>
                    Seu teste gratuito{'\n'}chegou ao fim
                  </Text>
                  <Text style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 15,
                    textAlign: 'center',
                    lineHeight: 22,
                    maxWidth: 300,
                  }}>
                    Assine agora e continue usando o Appbello sem interrupções. Cancele quando quiser.
                  </Text>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                  <Text style={{
                    color: colors.secondary,
                    fontSize: 13,
                    fontWeight: '700',
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}>
                    {daysLeft} dias restantes no teste
                  </Text>
                  <Text style={{
                    color: '#fff',
                    fontSize: 28,
                    fontWeight: '800',
                    textAlign: 'center',
                    lineHeight: 34,
                    marginBottom: 12,
                  }}>
                    Desbloqueie o{'\n'}Appbello completo
                  </Text>
                  <Text style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 15,
                    textAlign: 'center',
                    lineHeight: 22,
                    maxWidth: 300,
                  }}>
                    Escolha um plano e gerencie seu negócio sem limites.
                  </Text>
                </Animated.View>
              )}
            </View>

            {/* Trial expired warning banner */}
            {isExpired && (
              <Animated.View
                entering={FadeInDown.delay(200).duration(400)}
                style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 4 }}
              >
                <LinearGradient
                  colors={['rgba(255,181,71,0.15)', 'rgba(255,140,0,0.08)']}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255,181,71,0.3)',
                  }}
                >
                  <Clock size={20} color={colors.warning} style={{ marginRight: 12 }}  variant="Outline" />
                  <Text style={{ color: colors.warning, fontSize: 14, fontWeight: '600', flex: 1 }}>
                    Seus dados estão salvos e seguros. Assine para retomar o acesso.
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Referral Code Section */}
            <Animated.View
              entering={FadeInDown.delay(220).duration(400)}
              style={{ marginHorizontal: 20, marginTop: 20 }}
            >
              {appliedReferralCode ? (
                // Applied code badge
                <Animated.View style={discountBadgeStyle}>
                  <LinearGradient
                    colors={['rgba(44,212,217,0.2)', 'rgba(44,212,217,0.08)']}
                    style={{
                      borderRadius: 16,
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(44,212,217,0.4)',
                    }}
                  >
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(44,212,217,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Gift size={18} color={colors.secondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.secondary, fontSize: 13, fontWeight: '800' }}>
                        Código aplicado: {appliedReferralCode}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                        {REFERRAL_DISCOUNT_PERCENT}% de desconto no plano selecionado
                      </Text>
                    </View>
                    <Pressable
                      onPress={handleRemoveCode}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloseCircle size={14} color="rgba(255,255,255,0.5)"  variant="Outline" />
                    </Pressable>
                  </LinearGradient>
                </Animated.View>
              ) : showReferralInput ? (
                // Input field
                <Animated.View entering={FadeIn.duration(200)}>
                  <View style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(83,51,237,0.4)',
                    backgroundColor: 'rgba(83,51,237,0.08)',
                    padding: 14,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Tag size={16} color={colors.primary} style={{ marginRight: 8 }}  variant="Outline" />
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                        Código de indicação
                      </Text>
                      <Pressable
                        onPress={() => {
                          setShowReferralInput(false);
                          setReferralInput('');
                        }}
                        style={{ marginLeft: 'auto' }}
                      >
                        <CloseCircle size={16} color="rgba(255,255,255,0.4)"  variant="Outline" />
                      </Pressable>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        ref={codeInputRef}
                        value={referralInput}
                        onChangeText={(t) => setReferralInput(t.toUpperCase())}
                        placeholder="Ex: AMIGO2024"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        style={{
                          flex: 1,
                          height: 44,
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          color: '#fff',
                          fontSize: 15,
                          fontWeight: '700',
                          letterSpacing: 1.5,
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.1)',
                        }}
                        onSubmitEditing={handleApplyCode}
                      />
                      <Pressable
                        onPress={handleApplyCode}
                        style={{
                          height: 44,
                          paddingHorizontal: 18,
                          borderRadius: 12,
                          backgroundColor: colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                          Aplicar
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 11,
                      marginTop: 8,
                    }}>
                      Ganhe {REFERRAL_DISCOUNT_PERCENT}% de desconto no primeiro mês
                    </Text>
                  </View>
                </Animated.View>
              ) : (
                // Show button to add code
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowReferralInput(true);
                    setTimeout(() => codeInputRef.current?.focus(), 150);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderStyle: 'dashed',
                  }}
                >
                  <Tag size={15} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }}  variant="Outline" />
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' }}>
                    Tem um código de indicação?
                  </Text>
                  <ArrowRight2 size={14} color="rgba(255,255,255,0.3)" style={{ marginLeft: 4 }}  variant="Outline" />
                </Pressable>
              )}
            </Animated.View>

            {/* Plans */}
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <Text style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 14,
              }}>
                Escolha seu plano
              </Text>

              {PLANS.map((plan, index) => {
                const isSelected = selectedPlan === plan.id;
                const discountedPrice = appliedReferralCode
                  ? getDiscountedPrice(plan.priceMonthly)
                  : plan.priceMonthly;
                const hasDiscount = discountedPrice !== plan.priceMonthly;

                return (
                  <Animated.View
                    key={plan.id}
                    entering={FadeInDown.delay(300 + index * 80).duration(400)}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPlan(plan.id);
                      }}
                      style={{
                        marginBottom: 12,
                        borderRadius: 20,
                        overflow: 'hidden',
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected
                          ? (plan.highlighted ? colors.secondary : colors.primary)
                          : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      {plan.highlighted && (
                        <LinearGradient
                          colors={['#5333ed', '#2cd4d9']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            paddingVertical: 6,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: '800',
                            letterSpacing: 1.5,
                            textTransform: 'uppercase',
                          }}>
                            ⚡ Mais popular
                          </Text>
                        </LinearGradient>
                      )}

                      <LinearGradient
                        colors={
                          isSelected
                            ? plan.highlighted
                              ? ['rgba(83,51,237,0.25)', 'rgba(44,212,217,0.12)']
                              : ['rgba(83,51,237,0.2)', 'rgba(83,51,237,0.05)']
                            : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']
                        }
                        style={{ padding: 18 }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{
                                color: '#fff',
                                fontSize: 18,
                                fontWeight: '800',
                                marginRight: 8,
                              }}>
                                {plan.name}
                              </Text>
                              {plan.highlighted && (
                                <View style={{
                                  backgroundColor: 'rgba(44,212,217,0.15)',
                                  borderRadius: 6,
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                }}>
                                  <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>PRO</Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 12 }}>
                              {plan.description}
                            </Text>
                            {plan.features.map((feature) => (
                              <View key={feature} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                <TickSquare size={14} color={isSelected ? colors.secondary : 'rgba(255,255,255,0.4)'} style={{ marginRight: 8 }}  variant="Outline" />
                                <Text style={{
                                  color: isSelected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)',
                                  fontSize: 13,
                                }}>
                                  {feature}
                                </Text>
                              </View>
                            ))}
                          </View>

                          <View style={{ alignItems: 'flex-end', paddingLeft: 12 }}>
                            {hasDiscount && (
                              <Text style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: 13,
                                fontWeight: '600',
                                textDecorationLine: 'line-through',
                                lineHeight: 16,
                              }}>
                                R${plan.priceMonthly}
                              </Text>
                            )}
                            <Text style={{
                              color: hasDiscount ? colors.secondary : (isSelected ? '#fff' : 'rgba(255,255,255,0.6)'),
                              fontSize: 22,
                              fontWeight: '800',
                              lineHeight: 26,
                            }}>
                              R${discountedPrice}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>/mês</Text>

                            {hasDiscount && (
                              <View style={{
                                marginTop: 4,
                                backgroundColor: 'rgba(44,212,217,0.15)',
                                borderRadius: 6,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                              }}>
                                <Text style={{ color: colors.secondary, fontSize: 10, fontWeight: '800' }}>
                                  -{REFERRAL_DISCOUNT_PERCENT}%
                                </Text>
                              </View>
                            )}

                            <View style={{
                              marginTop: 10,
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: isSelected
                                ? (plan.highlighted ? colors.secondary : colors.primary)
                                : 'rgba(255,255,255,0.1)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {isSelected && <TickSquare size={14} color="#fff"  variant="Outline" />}
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Trust badges */}
            <Animated.View
              entering={FadeInDown.delay(600).duration(400)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingHorizontal: 20,
                marginTop: 8,
                marginBottom: 24,
              }}
            >
              {[
                { icon: <Shield size={16} color={colors.success}  variant="Outline" />, text: 'Dados seguros' },
                { icon: <Profile2User size={16} color={colors.primary}  variant="Outline" />, text: 'Indicação amigo' },
                { icon: <Star1 size={16} color={colors.secondary}  variant="Outline" />, text: 'Cancele grátis' },
              ].map((badge) => (
                <View key={badge.text} style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                  }}>
                    {badge.icon}
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center' }}>
                    {badge.text}
                  </Text>
                </View>
              ))}
            </Animated.View>
          </ScrollView>

          {/* Bottom CTA */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 8,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.06)',
              backgroundColor: '#08051A',
            }}
          >
            {/* Price summary if discount */}
            {appliedReferralCode && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                  Desconto de indicação ({REFERRAL_DISCOUNT_PERCENT}%)
                </Text>
                <Text style={{ color: colors.secondary, fontSize: 13, fontWeight: '800' }}>
                  -R${savings}/mês
                </Text>
              </Animated.View>
            )}

            <Pressable
              onPress={handleSubscribe}
              disabled={loading}
              style={{ marginBottom: 12 }}
            >
              <LinearGradient
                colors={['#5333ed', '#2cd4d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 56,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                    Processando...
                  </Text>
                ) : (
                  <>
                    <Crown size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                      Pagamento em implantação
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              textAlign: 'center',
              lineHeight: 16,
            }}>
              Renova mensalmente · Cancele a qualquer momento · Sem taxas ocultas
            </Text>
          </Animated.View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}
