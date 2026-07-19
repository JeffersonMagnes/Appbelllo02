import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Crown, TickSquare, Card, Calendar, ArrowRight2, Flash, InfoCircle, TickCircle, Clock, Refresh } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useSubscriptionStore, PLANS, type PlanType } from '@/lib/state/subscription-store';

type PaymentRecord = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  method: string;
};

function generatePaymentHistory(
  _subscriptionEndDate: string | null,
  _activePlan: PlanType | null,
  _status: string
): PaymentRecord[] {
  // Payment history must come from the canonical backend/gateway.
  return [];
}

const statusColor = {
  paid: colors.success,
  pending: colors.warning,
  failed: colors.error,
} as const;

const statusLabel = {
  paid: 'Pago',
  pending: 'Aguardando',
  failed: 'Falhou',
} as const;

const statusIcon = {
  paid: TickCircle,
  pending: Clock,
  failed: InfoCircle,
} as const;

export default function BillingScreen() {
  const router = useRouter();
  const [changingPlan, setChangingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  const subscriptionStatus = useSubscriptionStore(s => s.subscriptionStatus);
  const activePlan = useSubscriptionStore(s => s.activePlan);
  const subscriptionEndDate = useSubscriptionStore(s => s.subscriptionEndDate);
  const getTrialDaysLeft = useSubscriptionStore(s => s.getTrialDaysLeft);

  const currentPlan = PLANS.find(p => p.id === activePlan);
  const daysLeft = getTrialDaysLeft();
  const paymentHistory = generatePaymentHistory(subscriptionEndDate, activePlan, subscriptionStatus);

  const renewalDate = subscriptionEndDate
    ? new Date(subscriptionEndDate).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  const handleChangePlan = (plan: PlanType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(plan);
  };

  const handleConfirmChange = () => {
    if (!selectedPlan) return;
    Alert.alert('Alteração indisponível', 'Nenhum plano foi alterado. Upgrade e downgrade serão liberados após a integração oficial do gateway.', [{ text: 'Entendi' }]);
  };

  const handleCancelSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Cancelar assinatura',
      'O cancelamento online ainda não está integrado ao backend.',
      [
        { text: 'Manter assinatura', style: 'cancel' },
        { text: 'Entendi' },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, paddingVertical: 16,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: colors.backgroundCard,
              alignItems: 'center', justifyContent: 'center', marginRight: 12,
            }}
          >
            <ArrowLeft size={20} color={colors.textPrimary}  variant="Outline" />
          </Pressable>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', flex: 1 }}>
            Assinatura & Pagamentos
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Current Plan Status Card */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={{ margin: 20, marginBottom: 8 }}>
            {subscriptionStatus === 'active' && currentPlan ? (
              <LinearGradient
                colors={['#5333ed', '#2cd4d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 20 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    <Crown size={24} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
                      Plano {currentPlan.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <View style={{
                        width: 8, height: 8, borderRadius: 4,
                        backgroundColor: '#4ADE80', marginRight: 6,
                      }} />
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>Assinatura ativa</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>
                    R${currentPlan.priceMonthly}
                    <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>/mês</Text>
                  </Text>
                </View>

                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12,
                }}>
                  <Calendar size={15} color="rgba(255,255,255,0.8)"  variant="Outline" />
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginLeft: 8 }}>
                    Próxima renovação: {renewalDate ?? '—'}
                  </Text>
                </View>
              </LinearGradient>
            ) : subscriptionStatus === 'trial' ? (
              <LinearGradient
                colors={['rgba(83,51,237,0.15)', 'rgba(44,212,217,0.08)']}
                style={{
                  borderRadius: 24, padding: 20,
                  borderWidth: 1, borderColor: 'rgba(83,51,237,0.3)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 16,
                    backgroundColor: colors.primary + '20',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    <Flash size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                      Período de Teste
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>Todos os recursos liberados</Text>
                  </View>
                </View>
                <View style={{
                  backgroundColor: colors.primary + '15', borderRadius: 12, padding: 12,
                  flexDirection: 'row', alignItems: 'center',
                }}>
                  <Clock size={15} color={colors.primary}  variant="Outline" />
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
                    {daysLeft} dias restantes no teste gratuito
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/paywall')}
                  style={{
                    marginTop: 12, backgroundColor: colors.primary,
                    borderRadius: 14, padding: 14, alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                    Assinar agora e garantir desconto
                  </Text>
                </Pressable>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={['rgba(229,57,53,0.12)', 'rgba(229,57,53,0.06)']}
                style={{
                  borderRadius: 24, padding: 20,
                  borderWidth: 1, borderColor: 'rgba(229,57,53,0.25)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <InfoCircle size={24} color={colors.error} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>Sem assinatura ativa</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>Assine para usar o app</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push('/paywall')}
                  style={{
                    backgroundColor: colors.primary, borderRadius: 14,
                    padding: 14, alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Ver planos</Text>
                </Pressable>
              </LinearGradient>
            )}
          </Animated.View>

          {/* Change Plan */}
          {subscriptionStatus === 'active' && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginHorizontal: 20, marginBottom: 8 }}>
              <View style={{
                backgroundColor: colors.backgroundCard, borderRadius: 20,
                overflow: 'hidden',
              }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setChangingPlan(!changingPlan);
                    setSelectedPlan(activePlan);
                  }}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    padding: 18,
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: colors.primary + '15',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    <Refresh size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>
                      Mudar de plano
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                      Faça upgrade ou downgrade a qualquer momento
                    </Text>
                  </View>
                  <ArrowRight2
                    size={18}
                    color={colors.textMuted}
                    style={{ transform: [{ rotate: changingPlan ? '90deg' : '0deg' }] }}
                   variant="Outline" />
                </Pressable>

                {changingPlan && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />
                    {PLANS.map((plan) => {
                      const isActive = activePlan === plan.id;
                      const isSelected = selectedPlan === plan.id;
                      return (
                        <Pressable
                          key={plan.id}
                          onPress={() => handleChangePlan(plan.id)}
                          style={{
                            flexDirection: 'row', alignItems: 'center',
                            padding: 14, borderRadius: 14, marginBottom: 8,
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary + '08' : colors.background,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>
                                {plan.name}
                              </Text>
                              {isActive && (
                                <View style={{
                                  marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2,
                                  backgroundColor: colors.success + '20', borderRadius: 6,
                                }}>
                                  <Text style={{ color: colors.success, fontSize: 11, fontWeight: '700' }}>
                                    Atual
                                  </Text>
                                </View>
                              )}
                              {plan.highlighted && !isActive && (
                                <View style={{
                                  marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2,
                                  backgroundColor: colors.secondary + '20', borderRadius: 6,
                                }}>
                                  <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>
                                    Popular
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                              {plan.description}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 17 }}>
                              R${plan.priceMonthly}
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 11 }}>/mês</Text>
                          </View>
                          <View style={{
                            width: 22, height: 22, borderRadius: 11, marginLeft: 10,
                            backgroundColor: isSelected ? colors.primary : colors.backgroundLight,
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            {isSelected && <TickSquare size={13} color="#fff"  variant="Outline" />}
                          </View>
                        </Pressable>
                      );
                    })}

                    <Pressable
                      onPress={handleConfirmChange}
                      disabled={selectedPlan === activePlan}
                      style={{
                        backgroundColor: selectedPlan === activePlan ? colors.backgroundLight : colors.primary,
                        borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4,
                      }}
                    >
                      <Text style={{
                        color: selectedPlan === activePlan ? colors.textMuted : '#fff',
                        fontWeight: '800', fontSize: 15,
                      }}>
                        {selectedPlan === activePlan ? 'Selecione outro plano' : 'Confirmar mudança'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Payment Method */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ marginHorizontal: 20, marginBottom: 8 }}>
            <Text style={{
              color: colors.textMuted, fontSize: 12, fontWeight: '700',
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4,
            }}>
              Forma de pagamento
            </Text>
            <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Card size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 15 }}>
                    Cartão de crédito
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                    •••• •••• •••• 4242
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Em breve', 'A gestão de formas de pagamento estará disponível em breve.', [{ text: 'OK' }]);
                  }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7,
                    borderRadius: 10, backgroundColor: colors.backgroundLight,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                    Alterar
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* Payment History */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginHorizontal: 20, marginBottom: 8 }}>
            <Text style={{
              color: colors.textMuted, fontSize: 12, fontWeight: '700',
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4,
            }}>
              Histórico de pagamentos
            </Text>

            {paymentHistory.length === 0 ? (
              <View style={{
                backgroundColor: colors.backgroundCard, borderRadius: 16,
                padding: 32, alignItems: 'center',
              }}>
                <Card size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
                  {subscriptionStatus === 'trial'
                    ? 'Nenhum pagamento ainda.\nO histórico aparecerá após assinar.'
                    : 'Nenhum histórico disponível.'}
                </Text>
              </View>
            ) : (
              <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 16, overflow: 'hidden' }}>
                {paymentHistory.map((payment, index) => {
                  const Icon = statusIcon[payment.status];
                  return (
                    <View key={payment.id}>
                      {index > 0 && (
                        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                        <View style={{
                          width: 42, height: 42, borderRadius: 12,
                          backgroundColor: statusColor[payment.status] + '18',
                          alignItems: 'center', justifyContent: 'center', marginRight: 12,
                        }}>
                          <Icon size={20} color={statusColor[payment.status]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
                            {payment.description}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                            {payment.date} · {payment.method}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>
                            R$ {payment.amount}
                          </Text>
                          <View style={{
                            marginTop: 4, paddingHorizontal: 8, paddingVertical: 2,
                            borderRadius: 6, backgroundColor: statusColor[payment.status] + '18',
                          }}>
                            <Text style={{ color: statusColor[payment.status], fontSize: 11, fontWeight: '700' }}>
                              {statusLabel[payment.status]}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* Cancel Subscription */}
          {subscriptionStatus === 'active' && (
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ marginHorizontal: 20, marginTop: 8 }}>
              <Pressable
                onPress={handleCancelSubscription}
                style={{
                  backgroundColor: colors.backgroundCard, borderRadius: 16,
                  padding: 16, alignItems: 'center',
                  borderWidth: 1, borderColor: colors.error + '30',
                }}
              >
                <Text style={{ color: colors.error, fontWeight: '600', fontSize: 14 }}>
                  Cancelar assinatura
                </Text>
              </Pressable>
              <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                Você continuará com acesso até o fim do período pago.
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
