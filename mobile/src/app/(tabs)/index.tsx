import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, Pressable, Image, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Calendar, DollarCircle, ClipboardText, Profile2User, Scissor, Box, TrendDown, ProfileCircle, Link2, Chart, Chart2, Award, Notification, Setting2, ArrowRight2, TrendUp, Warning2, Clock, Add, ExportSquare, ImportSquare, Crown, Flash, CloseCircle, MagicStar, ShoppingBag, Note, Wallet, UserTick, Gift } from 'iconsax-react-native';
import { usePendingOrdersCount } from '@/lib/hooks/use-online-orders';
import { colors } from '@/lib/theme';
import { StatCard, SectionHeader, StatusBadge, ProgressBar } from '@/components/ui';
import { PartnerAdsCarousel } from '@/components/PartnerAdsCarousel';
import { SetupProgressBanner } from '@/components/SetupProgressBanner';
import { useProducts } from '@/lib/hooks/use-products';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useSubscriptionStore } from '@/lib/state/subscription-store';
import { useSetupStore } from '@/lib/state/setup-store';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/state/auth-store';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useClients } from '@/lib/hooks/use-clients';
import { useProfessionals } from '@/lib/hooks/use-professionals';
import { useServices } from '@/lib/hooks/use-services';
import { useEstablishmentOrMock } from '@/lib/hooks/use-establishment';
import { toLocalDateStr } from '@/lib/utils/date';
import { useGoalsStore } from '@/lib/state/goals-store';
import { Walkthrough } from '@/components/ui/Walkthrough';
import { DemoDataModal } from '@/components/DemoDataModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
  badge?: number;
}

const GRID_ITEM_SIZE = Math.floor((SCREEN_WIDTH - 40 - 12) / 4);

const QuickAction = ({ icon, label, onPress, color = colors.primary, badge }: QuickActionProps) => (
  <Pressable
    onPress={onPress}
    style={{ width: GRID_ITEM_SIZE, marginBottom: 10 }}
    className="items-center px-1"
  >
    <View style={{ position: 'relative' }}>
      <View
        style={{
          width: GRID_ITEM_SIZE - 8,
          height: GRID_ITEM_SIZE - 8,
          backgroundColor: color,
          borderRadius: 16,
          shadowColor: color,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 5,
        }}
        className="items-center justify-center mb-2"
      >
        {icon}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={{
          position: 'absolute',
          top: -4,
          right: -4,
          backgroundColor: '#EF4444',
          borderRadius: 10,
          minWidth: 18,
          height: 18,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{badge}</Text>
        </View>
      )}
    </View>
    <Text className="text-gray-700 text-xs text-center font-semibold" numberOfLines={2}>
      {label}
    </Text>
  </Pressable>
);

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onPress: () => void;
  highlight?: boolean;
}

const MenuItem = ({ icon, label, badge, onPress, highlight }: MenuItemProps) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center py-3 px-4 rounded-xl mb-2 active:opacity-80"
    style={{ backgroundColor: highlight ? colors.primary + '15' : colors.backgroundCard }}
  >
    <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.backgroundLight }}>
      {icon}
    </View>
    <Text className="flex-1 text-gray-900 font-medium">{label}</Text>
    {badge !== undefined && badge > 0 && (
      <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center mr-2">
        <Text className="text-gray-900 text-xs font-bold">{badge}</Text>
      </View>
    )}
    <ArrowRight2 size={18} color={colors.textMuted}  variant="Outline" />
  </Pressable>
);

// Simple bar chart component
const MiniBarChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  return (
    <View className="flex-row items-end h-12 mt-2">
      {data.map((value, index) => (
        <View key={index} className="flex-1 mx-0.5">
          <View
            className="rounded-sm"
            style={{
              height: (value / max) * 48,
              backgroundColor: index === data.length - 1 ? colors.primary : colors.primary + '40',
            }}
          />
        </View>
      ))}
    </View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const monthlyGoal = useGoalsStore(s => s.monthlyGoal);

  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('walkthrough_done').then(val => {
      if (!val) setTimeout(() => setShowWalkthrough(true), 800);
    });
  }, []);


  const handleWalkthroughFinish = () => {
    setShowWalkthrough(false);
    AsyncStorage.setItem('walkthrough_done', 'true');
  };

  const notifications: { id: string; title: string; body: string; time: string; unread: boolean; route: '/(tabs)/appointments' | '/admin/products' | '/admin/financial' }[] = [];

  const subscriptionStatus = useSubscriptionStore(s => s.subscriptionStatus);
  const getTrialDaysLeft = useSubscriptionStore(s => s.getTrialDaysLeft);
  const getTrialProgress = useSubscriptionStore(s => s.getTrialProgress);
  const isTrialExpired = useSubscriptionStore(s => s.isTrialExpired);
  const startTrial = useSubscriptionStore(s => s.startTrial);

  const setupDismissed = useSetupStore(s => s.dismissed);
  const setupFullyComplete = useSetupStore(s => s.isFullyComplete)();
  const resetSetupDismiss = useSetupStore(s => s.resetDismiss);

  const daysLeft = getTrialDaysLeft();
  const trialProgress = getTrialProgress();
  const trialExpired = isTrialExpired();

  // Auto-start trial on first visit
  React.useEffect(() => {
    if (subscriptionStatus === 'none') {
      startTrial();
    }
    // Redirect to paywall if expired
    if (trialExpired) {
      router.replace('/paywall');
    }
  }, [subscriptionStatus, trialExpired]);

  // Re-show setup banner every 24h if not complete
  React.useEffect(() => {
    if (!setupFullyComplete && setupDismissed) {
      resetSetupDismiss();
    }
  }, []);

  const currentUser = useAuthStore(s => s.currentUser);
  const establishmentId = useAuthStore(s => s.establishmentId);
  const today = toLocalDateStr();
  const { data: establishmentData } = useEstablishmentOrMock(currentUser?.id ?? undefined);

  const businessType = ((): 'barbershop' | 'salon' | 'clinic' => {
    const raw = (establishmentData as { business_type?: string } | null)?.business_type ?? '';
    if (raw === 'barbershop' || raw === 'barbearia') return 'barbershop';
    if (raw === 'clinic' || raw === 'clinica' || raw === 'estetica') return 'clinic';
    return 'salon';
  })();
  const { data: todayAppointments = [] } = useAppointments(establishmentId ?? undefined, today);
  const { data: allClients = [] } = useClients(establishmentId ?? undefined);
  const { data: professionals = [] } = useProfessionals(establishmentId ?? undefined);
  const { data: allServices = [] } = useServices(establishmentId ?? undefined);
  const pendingOrders = usePendingOrdersCount(establishmentId ?? undefined);

  useEffect(() => {
    if (!establishmentId) return;
    const key = `demo_modal_shown_${establishmentId}`;
    AsyncStorage.getItem(key).then(val => {
      if (!val) {
        setTimeout(() => setShowDemoModal(true), 1200);
        AsyncStorage.setItem(key, 'true');
      }
    });
  }, [establishmentId]);

  const { data: allProducts = [] } = useProducts(establishmentId ?? undefined);
  const { data: allTransactions = [] } = useTransactions(establishmentId ?? undefined);

  const todayDate = new Date();
  const birthdayClients = allClients.filter(c => {
    if (!(c as any).birthDate) return false;
    const bd = new Date((c as any).birthDate + 'T12:00:00');
    return bd.getDate() === todayDate.getDate() && bd.getMonth() === todayDate.getMonth();
  });
  const upcomingBirthdays = allClients.filter(c => {
    if (!(c as any).birthDate) return false;
    const bd = new Date((c as any).birthDate + 'T12:00:00');
    const thisYear = new Date(todayDate.getFullYear(), bd.getMonth(), bd.getDate());
    const diff = Math.ceil((thisYear.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 && diff <= 7;
  });
  const lowStockProducts = allProducts.filter(p => p.stock != null && (p as any).min_stock != null && p.stock <= (p as any).min_stock && p.active);

  const todayStr = toLocalDateStr(new Date());
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = toLocalDateStr(monthStart);

  const dailyRevenue = allTransactions.filter(t => t.type === 'income' && t.date === todayStr).reduce((s, t) => s + t.amount, 0);
  const monthlyRevenue = allTransactions.filter(t => t.type === 'income' && t.date >= monthStartStr).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = allTransactions.filter(t => t.type === 'expense' && t.date >= monthStartStr).reduce((s, t) => s + t.amount, 0);
  const netProfit = monthlyRevenue - monthlyExpenses;

  const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = toLocalDateStr(d);
    return allTransactions.filter(t => t.type === 'income' && t.date === ds).reduce((s, t) => s + t.amount, 0);
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const yesterdayRevenue = weeklyRevenue.length > 1 ? weeklyRevenue[weeklyRevenue.length - 2] : 0;
  const revenueGrowth = yesterdayRevenue > 0 ? Math.round(((dailyRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 * 10) / 10 : 0;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="px-3 pt-2 pb-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              {(establishmentData as any)?.logo_url ? (
                <Image
                  source={{ uri: (establishmentData as any).logo_url }}
                  style={{ width: 52, height: 52, borderRadius: 14, marginRight: 6 }}
                />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 14, marginRight: 6, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '800' }}>
                    {(establishmentData?.name ?? 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={{ width: 130, height: 34, marginLeft: -20 }}
                  resizeMode="contain"
                />
                <Text className="text-gray-900 text-base font-bold leading-tight">{establishmentData?.name ?? 'Meu Estabelecimento'}</Text>
                <Text className="text-gray-400 text-xs">Bem-vindo de volta</Text>
              </View>
            </View>
            <View className="flex-row">
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNotifications(true); }}
                className="w-10 h-10 rounded-xl items-center justify-center mr-2"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <Notification size={20} color={colors.textMuted} />
                <View className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              </Pressable>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/settings'); }}
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <Setting2 size={20} color={colors.textMuted} variant="Outline" />
              </Pressable>
            </View>
          </Animated.View>

          {/* Trial Banner */}
          {subscriptionStatus === 'trial' && !trialExpired && (() => {
            const trialAccent = daysLeft <= 7 ? colors.warning : colors.primary;
            return (
            <Animated.View entering={FadeInDown.duration(400).delay(50)} className="mx-5 mb-4">
              <Pressable onPress={() => router.push('/paywall')}>
                <LinearGradient
                  colors={
                    daysLeft <= 7
                      ? ['rgba(255,181,71,0.15)', 'rgba(255,140,0,0.08)']
                      : ['rgba(83,51,237,0.12)', 'rgba(44,212,217,0.08)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: daysLeft <= 7 ? 'rgba(255,181,71,0.5)' : 'rgba(83,51,237,0.35)',
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Crown size={16} color={trialAccent} />
                      <Text
                        className="font-bold text-sm ml-2"
                        style={{ color: colors.textPrimary }}
                      >
                        {daysLeft <= 7
                          ? `⚠️ Apenas ${daysLeft} dias restantes`
                          : `Teste gratuito · ${daysLeft} dias restantes`}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-xs font-semibold mr-1" style={{ color: trialAccent }}>Assinar</Text>
                      <ArrowRight2 size={14} color={trialAccent}  variant="Outline" />
                    </View>
                  </View>
                  <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{
                      height: 4,
                      borderRadius: 2,
                      width: `${Math.min(trialProgress * 100, 100)}%`,
                      backgroundColor: trialAccent,
                    }} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
            );
          })()}

          {/* Setup Progress Banner */}
          <Animated.View entering={FadeInDown.duration(400).delay(75)} className="mx-5">
            <SetupProgressBanner />
          </Animated.View>

          {/* KPI Cards */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} className="px-5 mb-6">
            <View className="flex-row mb-3">
              {/* Today Revenue Card */}
              <View className="flex-1 mr-2 p-4 rounded-2xl" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center">
                    <TrendUp size={16} color={colors.primary}  variant="Outline" />
                    <Text className="text-gray-500 text-xs ml-1">Hoje</Text>
                  </View>
                  <View className="flex-row items-center">
                    <ExportSquare size={12} color={colors.primary} />
                    <Text className="text-xs ml-0.5" style={{ color: colors.primary }}>
                      {revenueGrowth}%
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.primary }} className="text-xl font-bold" numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(dailyRevenue)}
                </Text>
                <MiniBarChart data={weeklyRevenue} />
              </View>

              {/* Monthly Profit Card */}
              <View className="flex-1 ml-2 p-4 rounded-2xl" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center">
                    <Chart2 size={16} color={colors.primary} />
                    <Text className="text-gray-500 text-xs ml-1">Lucro Mês</Text>
                  </View>
                </View>
                <Text
                  className="text-xl font-bold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ color: netProfit >= 0 ? colors.success : colors.error }}
                >
                  {formatCurrency(netProfit)}
                </Text>
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>
                      Meta: {formatCurrency(monthlyGoal)}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {Math.max(0, ((netProfit / monthlyGoal) * 100)).toFixed(0)}%
                    </Text>
                  </View>
                  <ProgressBar progress={(netProfit / monthlyGoal) * 100} color={colors.primary} />
                </View>
              </View>
            </View>

            {/* Secondary Stats */}
            <View className="flex-row">
              {([
                { icon: <Note size={18} color={colors.primary} variant="Outline" />, value: todayAppointments.length, label: 'Agendamentos', iconColor: colors.primary, textColor: '#374151' },
                { icon: <Profile2User size={18} color={colors.primary} variant="Outline" />, value: allClients.length, label: 'Clientes', iconColor: colors.primary, textColor: '#374151' },
                { icon: <ProfileCircle size={18} color={colors.primary} variant="Outline" />, value: professionals.length, label: 'Profissionais', iconColor: colors.primary, textColor: '#374151' },
              ] as const).map((stat, i) => (
                <View
                  key={i}
                  className="flex-1 items-center py-3 rounded-2xl"
                  style={{
                    backgroundColor: colors.backgroundCard,
                    marginLeft: i > 0 ? 8 : 0,
                  }}
                >
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center mb-2"
                    style={{ backgroundColor: stat.iconColor + '15' }}
                  >
                    {stat.icon}
                  </View>
                  <Text style={{ color: stat.textColor, fontSize: 22, fontWeight: '800', lineHeight: 26 }}>
                    {stat.value}
                  </Text>
                  <Text
                    style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center', paddingHorizontal: 4 }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>


          {/* Today's Appointments Preview */}
          {todayAppointments.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(300)} className="px-5 mb-6">
              <SectionHeader
                title="Próximos Agendamentos"
                action={{ label: 'Ver todos', onPress: () => router.push('/(tabs)/appointments') }}
              />
              {todayAppointments.slice(0, 2).map((apt, index) => {
                const service = allServices.find(s => s.id === apt.serviceId);
                const professional = professionals.find(p => p.id === apt.professionalId);
                return (
                  <Pressable
                    key={apt.id}
                    className="flex-row items-center p-3 rounded-xl mb-2"
                    style={{ backgroundColor: colors.backgroundCard }}
                  >
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: colors.primary + '15' }}
                    >
                      <Clock size={20} color={colors.primary}  variant="Outline" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium">{service?.name}</Text>
                      <Text className="text-gray-500 text-sm">
                        {apt.time} • {professional?.name}
                      </Text>
                    </View>
                    <StatusBadge status={apt.status} size="sm" />
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {/* Alerts */}
          {lowStockProducts.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(350)} className="px-5 mb-4">
              <Pressable
                onPress={() => router.push('/admin/products')}
                className="flex-row items-center p-4 rounded-xl"
                style={{ backgroundColor: colors.warning + '15', borderWidth: 1, borderColor: colors.warning + '30' }}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.warning + '20' }}>
                  <Warning2 size={20} color={colors.warning}  variant="Outline" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Estoque Baixo</Text>
                  <Text className="text-gray-600 text-sm">
                    {lowStockProducts.length} produto(s) precisam de reposição
                  </Text>
                </View>
                <ArrowRight2 size={18} color={colors.warning}  variant="Outline" />
              </Pressable>
            </Animated.View>
          )}

          {/* Birthday Alerts */}
          {birthdayClients.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(360)} className="px-5 mb-4">
              <Pressable
                onPress={() => router.push('/admin/clients')}
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#F0ABFC' + '20', borderWidth: 1, borderColor: '#F0ABFC' + '40' }}
              >
                <View className="flex-row items-center mb-2">
                  <Text style={{ fontSize: 20, marginRight: 8 }}>🎂</Text>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>
                    Aniversariante{birthdayClients.length > 1 ? 's' : ''} de hoje!
                  </Text>
                </View>
                {birthdayClients.map((c, i) => (
                  <Text key={i} style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 28 }}>
                    {c.name}
                  </Text>
                ))}
              </Pressable>
            </Animated.View>
          )}

          {upcomingBirthdays.length > 0 && birthdayClients.length === 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(360)} className="px-5 mb-4">
              <Pressable
                onPress={() => router.push('/admin/clients')}
                className="flex-row items-center p-4 rounded-xl"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <Text style={{ fontSize: 18, marginRight: 10 }}>🎂</Text>
                <View className="flex-1">
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                    {upcomingBirthdays.length} aniversário{upcomingBirthdays.length > 1 ? 's' : ''} nos próximos 7 dias
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {upcomingBirthdays.map(c => c.name).join(', ')}
                  </Text>
                </View>
                <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" />
              </Pressable>
            </Animated.View>
          )}

          {/* Partner Ads Carousel */}
          <Animated.View entering={FadeInDown.duration(400).delay(375)}>
            <PartnerAdsCarousel businessType={businessType} />
          </Animated.View>

          {/* Menu Principal — Gestão */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)} className="px-5">
            <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3 ml-1">
              Gestão
            </Text>
            <View className="flex-row flex-wrap">
              <QuickAction
                icon={<Note size={22} color="white" variant="Outline" />}
                label="Agenda"
                badge={todayAppointments.length}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/appointments'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<DollarCircle size={22} color="white" variant="Outline" />}
                label="Financeiro"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/financial'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<ClipboardText size={22} color="white" variant="Outline" />}
                label="Comandas"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/comandas'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<Wallet size={22} color="white" variant="Outline" />}
                label="Caixa"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/cash-register'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<Profile2User size={22} color="white" variant="Outline" />}
                label="Clientes"
                badge={allClients.length}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/clients'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<Box size={22} color="white" variant="Outline" />}
                label="Estoque"
                badge={lowStockProducts.length > 0 ? lowStockProducts.length : undefined}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/products'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<UserTick size={22} color="white" variant="Outline" />}
                label="Equipe"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/employees'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<Link2 size={22} color="white" variant="Outline" />}
                label="Link"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/booking-link'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<Crown size={22} color="white" variant="Outline" />}
                label="Planos"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/paywall'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<Gift size={22} color="white" variant="Outline" />}
                label="Indique"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/referral'); }}
                color={colors.secondary}
              />
              <QuickAction
                icon={<ShoppingBag size={22} color="white" variant="Outline" />}
                label="Catálogo Online"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/pedidos'); }}
                color={colors.primary}
              />
            </View>
          </Animated.View>

          {/* Menu Relatórios */}
          <Animated.View entering={FadeInDown.duration(400).delay(500)} className="px-5 mt-4 mb-8">
            <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3 ml-1">
              Relatórios
            </Text>
            <View className="flex-row flex-wrap">
              <QuickAction
                icon={<Chart size={22} color="white" />}
                label="Performance"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/reports'); }}
                color={colors.primary}
              />
              <QuickAction
                icon={<Award size={22} color="white" />}
                label="Top Clientes"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/top-clients'); }}
                color={colors.primary}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View 
            className="pt-5 pb-8 rounded-t-3xl"
            style={{ backgroundColor: colors.background, maxHeight: '90%' }}
          >
            <View
              className="flex-row items-center justify-between px-5 pb-4"
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}
            >
              <Text className="text-gray-900 text-lg font-bold">Notificações</Text>
              <Pressable
                onPress={() => setShowNotifications(false)}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
              </Pressable>
            </View>

            <ScrollView className="px-5 pt-2" showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View className="items-center py-12">
                  <Notification size={40} color={colors.textMuted} variant="Outline" />
                  <Text className="text-gray-400 font-medium mt-3">Nenhuma notificação</Text>
                  <Text className="text-gray-400 text-sm text-center mt-1">Você está em dia!</Text>
                </View>
              ) : (
                notifications.map((notif, idx) => (
                  <Pressable
                    key={notif.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNotifications(false); router.push(notif.route); }}
                    className="flex-row items-start py-4"
                    style={{
                      backgroundColor: notif.unread ? colors.primary + '05' : 'transparent',
                      borderBottomWidth: idx === notifications.length - 1 ? 0 : 1,
                      borderBottomColor: 'rgba(0,0,0,0.05)',
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3 mt-0.5"
                      style={{ backgroundColor: colors.primary + '15' }}
                    >
                      <Notification size={18} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-0.5">
                        <Text className="text-gray-900 font-semibold text-sm">{notif.title}</Text>
                        <Text className="text-gray-400 text-xs ml-2">{notif.time}</Text>
                      </View>
                      <Text className="text-gray-500 text-sm leading-5">{notif.body}</Text>
                    </View>
                    {notif.unread && (
                      <View className="w-2 h-2 rounded-full ml-2 mt-2" style={{ backgroundColor: colors.primary }} />
                    )}
                  </Pressable>
                ))
              )}
              <View className="h-6" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Walkthrough visible={showWalkthrough} onFinish={handleWalkthroughFinish} />

      <DemoDataModal
        visible={showDemoModal}
        onDismiss={() => setShowDemoModal(false)}
        onSeedComplete={() => setShowDemoModal(false)}
        establishmentId={establishmentId ?? ''}
      />
    </View>
  );
}
