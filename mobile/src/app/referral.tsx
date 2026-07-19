import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, Gift, Profile2User, Copy, Share as ShareIcon, TickCircle, ArrowRight2, Flash, Clock, Tag } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useReferralStore, REFERRAL_DISCOUNT_PERCENT } from '@/lib/state/referral-store';

export default function ReferralScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const myReferralCode = useReferralStore(s => s.myReferralCode);
  const referralUses = useReferralStore(s => s.referralUses);
  const initReferralCode = useReferralStore(s => s.initReferralCode);

  const shimmerAnim = useSharedValue(0);
  const copyScale = useSharedValue(1);

  useEffect(() => {
    initReferralCode();
    shimmerAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + shimmerAnim.value * 0.5,
  }));

  const copyScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copyScale.value }],
  }));

  const handleCopy = async () => {
    if (!myReferralCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(myReferralCode);
    copyScale.value = withSpring(1.2, { damping: 6 }, () => {
      copyScale.value = withSpring(1, { damping: 8 });
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!myReferralCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Olá! Eu uso o Appbello para gerenciar meu salão e recomendo muito. Use meu código de indicação **${myReferralCode}** e ganhe ${REFERRAL_DISCOUNT_PERCENT}% de desconto na assinatura! 💈`,
        title: 'Convite Appbello',
      });
    } catch {
      // User cancelled
    }
  };

  const totalIndicados = referralUses.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.backgroundCard,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <ArrowLeft size={20} color={colors.textPrimary}  variant="Outline" />
          </Pressable>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
            Programa de Indicação
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Animated.View
            entering={FadeInDown.delay(50).duration(500)}
            style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 4, alignItems: 'center' }}
          >
            <Animated.View style={[{
              width: 80,
              height: 80,
              borderRadius: 24,
              marginBottom: 20,
              overflow: 'hidden',
            }, shimmerStyle]}>
              <LinearGradient
                colors={['#5333ed', '#2cd4d9']}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Gift size={38} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <Text style={{
              color: colors.textPrimary,
              fontSize: 24,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 8,
              lineHeight: 30,
            }}>
              Indique e ganhe!
            </Text>
            <Text style={{
              color: colors.textMuted,
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 20,
              maxWidth: 280,
            }}>
              Compartilhe seu código com outros donos de salão. Quem usar o seu código ganha {REFERRAL_DISCOUNT_PERCENT}% de desconto.
            </Text>
          </Animated.View>

          {/* Stats */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 24 }}
          >
            <LinearGradient
              colors={['rgba(83,51,237,0.25)', 'rgba(83,51,237,0.08)']}
              style={{
                flex: 1,
                borderRadius: 18,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(83,51,237,0.3)',
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800' }}>
                {totalIndicados}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Indicações feitas
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={['rgba(44,212,217,0.2)', 'rgba(44,212,217,0.06)']}
              style={{
                flex: 1,
                borderRadius: 18,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(44,212,217,0.3)',
              }}
            >
              <Text style={{ color: colors.secondary, fontSize: 28, fontWeight: '800' }}>
                {REFERRAL_DISCOUNT_PERCENT}%
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Desconto p/ indicado
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* My Code Card */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(500)}
            style={{ marginHorizontal: 20, marginTop: 24 }}
          >
            <Text style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Seu código de indicação
            </Text>

            <View
              style={{
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundCard,
              }}
            >
              {/* Code display */}
              <Animated.View
                style={copyScaleStyle}
              >
                <Pressable
                  onPress={handleCopy}
                  style={{
                    backgroundColor: colors.backgroundLight ?? colors.background,
                    borderRadius: 14,
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: copied ? colors.secondary : colors.border,
                    borderStyle: 'dashed',
                  }}
                >
                  <Text style={{
                    color: copied ? colors.secondary : colors.textPrimary,
                    fontSize: 28,
                    fontWeight: '900',
                    letterSpacing: 6,
                  }}>
                    {myReferralCode ?? '...'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    {copied ? (
                      <>
                        <TickCircle size={13} color={colors.secondary} style={{ marginRight: 5 }}  variant="Outline" />
                        <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: '600' }}>
                          Copiado!
                        </Text>
                      </>
                    ) : (
                      <>
                        <Copy size={13} color={colors.textMuted} style={{ marginRight: 5 }}  variant="Outline" />
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                          Toque para copiar
                        </Text>
                      </>
                    )}
                  </View>
                </Pressable>
              </Animated.View>

              {/* Action buttons */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={handleCopy}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: colors.background,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Copy size={16} color={colors.textMuted}  variant="Outline" />
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                    Copiar
                  </Text>
                </Pressable>

                <Pressable onPress={handleShare} style={{ flex: 1 }}>
                  <LinearGradient
                    colors={['#5333ed', '#2cd4d9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 46,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                    }}
                  >
                    <ShareIcon size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>
                      Compartilhar
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* How it works */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{ marginHorizontal: 20, marginTop: 28 }}
          >
            <Text style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              Como funciona
            </Text>

            {[
              {
                icon: <ShareIcon size={18} color={colors.primary} />,
                color: 'rgba(83,51,237,0.1)',
                border: colors.border,
                title: 'Compartilhe seu código',
                desc: 'Envie seu código único para amigos donos de salão ou clientes.',
              },
              {
                icon: <Tag size={18} color={colors.secondary}  variant="Outline" />,
                color: 'rgba(44,212,217,0.1)',
                border: colors.border,
                title: 'Eles usam ao assinar',
                desc: `Na tela de assinatura, inserem seu código e ganham ${REFERRAL_DISCOUNT_PERCENT}% off no 1º mês.`,
              },
              {
                icon: <Flash size={18} color='#FFB547' />,
                color: 'rgba(255,181,71,0.1)',
                border: colors.border,
                title: 'Você acumula indicações',
                desc: 'Acompanhe quantas pessoas você indicou. Benefícios em breve!',
              },
            ].map((step, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 14,
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: step.color,
                  borderWidth: 1,
                  borderColor: step.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  flexShrink: 0,
                }}>
                  {step.icon}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 3 }}>
                    {step.title}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
                    {step.desc}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Referral history */}
          {referralUses.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(250).duration(500)}
              style={{ marginHorizontal: 20, marginTop: 10, marginBottom: 8 }}
            >
              <Text style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>
                Histórico de indicações
              </Text>
              {referralUses.map((use, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.backgroundCard,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(44,212,217,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Profile2User size={16} color={colors.secondary}  variant="Outline" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                      Plano {use.planId.charAt(0).toUpperCase() + use.planId.slice(1)} assinado
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                      {new Date(use.usedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: 'rgba(44,212,217,0.15)',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}>
                    <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '800' }}>
                      -{use.discountPercent}%
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
