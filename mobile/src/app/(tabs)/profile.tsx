import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Linking, ActivityIndicator, Modal, TextInput, Switch } from 'react-native';
import { ConfirmModal, useToast } from '@/components/ui';
import { useNotificationSettings } from '@/lib/state/notification-settings-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { User, Notification, InfoCircle, Logout, ArrowRight2, Star1, Calendar, Settings, Heart, Buildings2, Crown, Gift, Camera, CloseCircle, Add, Trash, Lock, Call, Eye, EyeSlash, DocumentText, Shield } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useSubscriptionStore, PLANS } from '@/lib/state/subscription-store';
import { useReferralStore } from '@/lib/state/referral-store';
import { useAuthStore } from '@/lib/state/auth-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { uploadFile } from '@/lib/upload';
import { useTutorialStore } from '@/lib/state/tutorial-store';
import { seedDemoData, clearDemoData, checkHasDemoData } from '@/lib/demo-data';
import { Box } from 'iconsax-react-native';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

const MenuItem = ({ icon, label, value, onPress, danger }: MenuItemProps) => (
  <Pressable onPress={onPress} className="flex-row items-center py-4 px-4">
    <View
      className="w-10 h-10 rounded-full items-center justify-center mr-3"
      style={{ backgroundColor: danger ? colors.error + '15' : colors.backgroundLight }}
    >
      {icon}
    </View>
    <View className="flex-1">
      <Text className="font-medium" style={{ color: danger ? colors.error : colors.textPrimary }}>
        {label}
      </Text>
    </View>
    {value && <Text className="text-gray-500 text-sm mr-2">{value}</Text>}
    <ArrowRight2 size={18} color={danger ? colors.error : colors.textMuted}  variant="Outline" />
  </Pressable>
);

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{initials}</Text>
    </LinearGradient>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const [isPersonalDataModalVisible, setPersonalDataModalVisible] = useState(false);
  const [isNotificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const { show: showToast, ToastComponent } = useToast();

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const reminderEnabled = useNotificationSettings(s => s.reminderEnabled);
  const reminderMinutes = useNotificationSettings(s => s.reminderMinutes);
  const setReminderEnabled = useNotificationSettings(s => s.setReminderEnabled);
  const setReminderMinutes = useNotificationSettings(s => s.setReminderMinutes);


  const currentUser = useAuthStore(s => s.currentUser);
  const setCurrentUser = useAuthStore(s => s.setCurrentUser);
  const logoutFn = useAuthStore(s => s.logout);

  const subscriptionStatus = useSubscriptionStore(s => s.subscriptionStatus);
  const activePlan = useSubscriptionStore(s => s.activePlan);
  const getTrialDaysLeft = useSubscriptionStore(s => s.getTrialDaysLeft);
  const getTrialProgress = useSubscriptionStore(s => s.getTrialProgress);
  const daysLeft = getTrialDaysLeft();
  const trialProgress = getTrialProgress();
  const currentPlan = PLANS.find(p => p.id === activePlan);

  const referralUses = useReferralStore(s => s.referralUses);
  const myReferralCode = useReferralStore(s => s.myReferralCode);
  const initReferralCode = useReferralStore(s => s.initReferralCode);

  const resetTutorial = useTutorialStore(s => s.resetTutorial);
  const startTutorial = useTutorialStore(s => s.startTutorial);
  const establishmentId = useAuthStore(s => s.establishmentId);
  const [hasDemoData, setHasDemoData] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);

  React.useEffect(() => {
    initReferralCode();
  }, []);

  React.useEffect(() => {
    if (establishmentId) {
      checkHasDemoData(supabase, establishmentId).then(setHasDemoData);
    }
  }, [establishmentId]);

  const handleDemoData = async () => {
    if (!establishmentId) return;
    setDemoLoading(true);
    try {
      if (hasDemoData) {
        await clearDemoData(supabase, establishmentId);
        setHasDemoData(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Dados de exemplo removidos!', 'success');
      } else {
        await seedDemoData(supabase, establishmentId);
        setHasDemoData(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Dados de exemplo preenchidos!', 'success');
      }
    } catch {
      showToast('Erro ao processar. Tente novamente.', 'error');
    } finally {
      setDemoLoading(false);
      setShowDemoConfirm(false);
    }
  };

  const handlePickAvatar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Precisamos de acesso à sua galeria para trocar a foto.', 'warning');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploading(true);
      const filename = `avatar-${currentUser?.id ?? 'user'}-${Date.now()}.jpg`;
      const uploaded = await uploadFile(asset.uri, filename, asset.mimeType ?? 'image/jpeg');
      if (isSupabaseConfigured()) {
        await supabase.auth.updateUser({ data: { avatar: uploaded.url } });
      }
      if (currentUser) {
        setCurrentUser({ ...currentUser, avatar: uploaded.url });
      }
      showToast('Foto atualizada!', 'success');
    } catch {
      showToast('Não foi possível atualizar a foto. Tente novamente.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDadosPessoais = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditName(currentUser?.name ?? '');
    setEditEmail(currentUser?.email ?? '');
    setEditPhone((currentUser as any)?.phone ?? '');
    setShowPasswordSection(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPersonalDataModalVisible(true);
  };

  const savePersonalData = async () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, name: editName, email: editEmail });
      if (isSupabaseConfigured()) {
        await supabase.auth.updateUser({ data: { name: editName, phone: editPhone } });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Dados atualizados com sucesso!', 'success');
      setPersonalDataModalVisible(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('Preencha todos os campos de senha.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('As senhas não coincidem.', 'warning');
      return;
    }
    setSavingPassword(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Senha alterada com sucesso!', 'success');
      setShowPasswordSection(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      showToast(e.message || 'Erro ao alterar senha.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogoutConfirm(true);
  };

  const doLogout = async () => {
    setShowLogoutConfirm(false);
    await logoutFn();
    router.replace('/login');
  };

  const userName = currentUser?.name ?? 'Usuário';
  const userEmail = currentUser?.email ?? '';
  const userAvatar = currentUser?.avatar;

  // Colors for trial card depending on urgency
  const trialAccent = daysLeft <= 7 ? colors.warning : colors.primary;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Gradient Header */}
          <LinearGradient
            colors={[colors.primary + '18', colors.background]}
            style={{ paddingBottom: 8 }}
          >
            <View className="px-5 pt-4 pb-2">
              <Text className="text-gray-900 text-2xl font-bold mb-5">Meu Perfil</Text>

              {/* Profile Card */}
              <View
                className="rounded-3xl p-5"
                style={{
                  backgroundColor: colors.backgroundCard,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 16,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center">
                  <Pressable onPress={handlePickAvatar} disabled={uploading} style={{ marginRight: 16 }}>
                    <View style={{ width: 82, height: 82 }}>
                      {userAvatar ? (
                        <Image source={{ uri: userAvatar }} style={{ width: 82, height: 82, borderRadius: 41 }} />
                      ) : (
                        <AvatarInitials name={userName} />
                      )}
                      <View style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 28, height: 28, borderRadius: 14,
                        backgroundColor: colors.primary,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 2, borderColor: colors.backgroundCard,
                      }}>
                        {uploading
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Camera size={13} color="#fff" />}
                      </View>
                    </View>
                  </Pressable>

                  <View className="flex-1">
                    <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 18, lineHeight: 22 }}>{userName}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 3 }}>{userEmail}</Text>
                    <View
                      className="flex-row items-center mt-3 self-start px-3 py-1 rounded-full"
                      style={{ backgroundColor: colors.primary + '15' }}
                    >
                      <Star1 size={12} color={colors.primary} fill={colors.primary}  variant="Outline" />
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginLeft: 5 }}>
                        {currentUser?.role === 'owner' ? 'Proprietário' : 'Funcionário'}
                      </Text>
                    </View>
                  </View>
                </View>

              </View>
            </View>
          </LinearGradient>

          {/* Subscription Card */}
          <View className="px-5 mb-5 mt-2">
            <Pressable onPress={() => router.push('/paywall')}>
              {subscriptionStatus === 'active' ? (
                <LinearGradient
                  colors={['#5333ed', '#2cd4d9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 20, padding: 18 }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View style={{
                        width: 40, height: 40, borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        alignItems: 'center', justifyContent: 'center', marginRight: 12,
                      }}>
                        <Crown size={22} color="#fff" />
                      </View>
                      <View>
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                          Plano {currentPlan?.name ?? 'Pro'}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                          Assinatura ativa
                        </Text>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Ativo</Text>
                    </View>
                  </View>
                </LinearGradient>

              ) : subscriptionStatus === 'trial' ? (
                <LinearGradient
                  colors={
                    daysLeft <= 7
                      ? ['rgba(255,181,71,0.15)', 'rgba(255,140,0,0.08)']
                      : ['rgba(83,51,237,0.12)', 'rgba(44,212,217,0.08)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 20, padding: 18,
                    borderWidth: 1.5,
                    borderColor: daysLeft <= 7 ? 'rgba(255,181,71,0.5)' : 'rgba(83,51,237,0.35)',
                  }}
                >
                  {/* Header row */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: trialAccent + '20',
                        alignItems: 'center', justifyContent: 'center', marginRight: 10,
                      }}>
                        <Crown size={18} color={trialAccent} />
                      </View>
                      <View>
                        <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 15 }}>
                          Teste Gratuito
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                          30 dias incluídos
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <Text style={{ color: trialAccent, fontSize: 12, fontWeight: '700', marginRight: 4 }}>Assinar</Text>
                      <ArrowRight2 size={14} color={trialAccent}  variant="Outline" />
                    </View>
                  </View>

                  {/* Days count */}
                  <View className="flex-row items-end mb-3">
                    <Text style={{ color: trialAccent, fontSize: 36, fontWeight: '900', lineHeight: 40 }}>
                      {daysLeft}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600', marginLeft: 6, marginBottom: 4 }}>
                      dias restantes
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View style={{ height: 7, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{
                      height: 7, borderRadius: 4,
                      width: `${Math.min(trialProgress * 100, 100)}%`,
                      backgroundColor: trialAccent,
                    }} />
                  </View>

                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 8, fontWeight: '500' }}>
                    Toque para assinar e continuar usando todos os recursos
                  </Text>
                </LinearGradient>

              ) : (
                <LinearGradient
                  colors={['rgba(83,51,237,0.12)', 'rgba(44,212,217,0.06)']}
                  style={{
                    borderRadius: 20, padding: 18,
                    borderWidth: 1, borderColor: 'rgba(83,51,237,0.35)',
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <View className="flex-row items-center">
                    <Crown size={20} color={colors.secondary} style={{ marginRight: 10 }} />
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>
                      Assinar um plano
                    </Text>
                  </View>
                  <ArrowRight2 size={18} color={colors.secondary}  variant="Outline" />
                </LinearGradient>
              )}
            </Pressable>
          </View>

          {/* Menu Sections */}
          <View className="px-5">
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
              Conta
            </Text>
            <View className="rounded-2xl overflow-hidden mb-5" style={{ backgroundColor: colors.backgroundCard, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <MenuItem icon={<User size={20} color={colors.secondary}  variant="Outline" />} label="Dados Pessoais" onPress={handleDadosPessoais} />
              <View className="h-px mx-4" style={{ backgroundColor: colors.border }} />
              <MenuItem icon={<Notification size={20} color={colors.secondary} />} label="Notificações" value="Ativas" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNotificationsModalVisible(true); }} />
              <View className="h-px mx-4" style={{ backgroundColor: colors.border }} />
              <View className="h-px mx-4" style={{ backgroundColor: colors.border }} />
              <MenuItem
                icon={<Gift size={20} color="#FFB547" />}
                label="Indicar Amigos"
                value={referralUses.length > 0 ? `${referralUses.length} indicações` : myReferralCode ?? undefined}
                onPress={() => router.push('/referral')}
              />
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
              Administração
            </Text>
            <View className="rounded-2xl overflow-hidden mb-5" style={{ backgroundColor: colors.backgroundCard, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <MenuItem icon={<Buildings2 size={20} color={colors.secondary}  variant="Outline" />} label="Configurações do Estabelecimento" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/admin/settings'); }} />
              <View className="h-px mx-4" style={{ backgroundColor: colors.border }} />
              <MenuItem icon={<Settings size={20} color={colors.secondary} />} label="Configurações do App" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); showToast('Versão 1.0.0 · Ambiente: Produção', 'info'); }} />
              <View className="h-px mx-4" style={{ backgroundColor: colors.border }} />
              <MenuItem icon={<InfoCircle size={20} color={colors.secondary} />} label="Central de Ajuda" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowHelpModal(true); }} />
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
              Dados de Exemplo
            </Text>
            <View className="rounded-2xl overflow-hidden mb-5" style={{ backgroundColor: colors.backgroundCard, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <MenuItem
                icon={<Box size={20} color={hasDemoData ? colors.error : colors.secondary} variant="Outline" />}
                label={hasDemoData ? 'Limpar dados de exemplo' : 'Preencher com dados de exemplo'}
                value={demoLoading ? 'Processando...' : undefined}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (hasDemoData) {
                    setShowDemoConfirm(true);
                  } else {
                    handleDemoData();
                  }
                }}
                danger={hasDemoData}
              />
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
              Legal
            </Text>
            <View className="rounded-2xl overflow-hidden mb-5" style={{ backgroundColor: colors.backgroundCard, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <MenuItem icon={<DocumentText size={20} color={colors.secondary} variant="Outline" />} label="Termos de Uso" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL('https://appbello-portal.netlify.app/termos'); }} />
              <View className="h-px mx-4" style={{ backgroundColor: colors.border }} />
              <MenuItem icon={<Shield size={20} color={colors.secondary} variant="Outline" />} label="Política de Privacidade" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL('https://appbello-portal.netlify.app/privacidade'); }} />
            </View>

            <View className="rounded-2xl overflow-hidden mb-5" style={{ backgroundColor: colors.backgroundCard, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <MenuItem icon={<Trash size={20} color={colors.error} variant="Outline" />} label="Excluir Conta" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowDeleteAccountConfirm(true); }} danger />
            </View>

            <View className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: colors.backgroundCard, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <MenuItem icon={<Logout size={20} color={colors.error} />} label="Sair da Conta" onPress={handleLogout} danger />
            </View>
          </View>

          <View className="items-center pt-2">
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Appbello v1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Dados Pessoais Modal */}
      <Modal visible={isPersonalDataModalVisible} animationType="slide" transparent={true} onRequestClose={() => setPersonalDataModalVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <ScrollView style={{ maxHeight: '85%' }} bounces={false}>
          <View className="pt-5 pb-8 px-5 rounded-t-3xl" style={{ backgroundColor: colors.background }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-900 text-xl font-bold">Dados Pessoais</Text>
              <Pressable onPress={() => setPersonalDataModalVisible(false)} className="p-2 rounded-full" style={{ backgroundColor: colors.backgroundCard }}>
                <CloseCircle size={20} color={colors.textMuted} variant="Outline" />
              </Pressable>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Nome Completo</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                className="p-4 rounded-xl border"
                style={{ backgroundColor: colors.backgroundCard, borderColor: colors.border, color: colors.textPrimary }}
                placeholder="Seu nome"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">E-mail</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="p-4 rounded-xl border"
                style={{ backgroundColor: colors.backgroundCard, borderColor: colors.border, color: colors.textPrimary }}
                placeholder="Seu e-mail"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Telefone</Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                className="p-4 rounded-xl border"
                style={{ backgroundColor: colors.backgroundCard, borderColor: colors.border, color: colors.textPrimary }}
                placeholder="(11) 99999-9999"
              />
            </View>

            <Pressable
              onPress={savePersonalData}
              className="py-4 rounded-xl items-center justify-center mb-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-bold text-lg">Salvar Alterações</Text>
            </Pressable>

            {/* Seção Trocar Senha */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPasswordSection(!showPasswordSection); }}
              className="flex-row items-center justify-between p-4 rounded-xl mb-2"
              style={{ backgroundColor: colors.backgroundCard }}
            >
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Lock size={20} color={colors.primary} variant="Outline" />
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Alterar Senha</Text>
              </View>
              <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" style={{ transform: [{ rotate: showPasswordSection ? '90deg' : '0deg' }] }} />
            </Pressable>

            {showPasswordSection && (
              <View className="p-4 rounded-xl mb-2" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="mb-3">
                  <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Nova Senha</Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View className="mb-4">
                  <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Confirmar Nova Senha</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }}
                    placeholder="Repita a nova senha"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <Pressable
                  onPress={handleChangePassword}
                  disabled={savingPassword}
                  className="py-3 rounded-xl items-center justify-center"
                  style={{ backgroundColor: colors.primary, opacity: savingPassword ? 0.6 : 1 }}
                >
                  <Text className="text-white font-bold">{savingPassword ? 'Salvando...' : 'Alterar Senha'}</Text>
                </Pressable>
              </View>
            )}
          </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Notificações Modal */}
      <Modal visible={isNotificationsModalVisible} animationType="slide" transparent={true} onRequestClose={() => setNotificationsModalVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="pt-5 pb-8 px-5 rounded-t-3xl" style={{ backgroundColor: colors.background }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-900 text-xl font-bold">Notificações</Text>
              <Pressable onPress={() => setNotificationsModalVisible(false)} className="p-2 rounded-full" style={{ backgroundColor: colors.backgroundCard }}>
                <CloseCircle size={20} color={colors.textMuted}  variant="Outline" />
              </Pressable>
            </View>

            <View className="mb-4 p-4 rounded-2xl flex-row items-center justify-between" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-1 mr-4">
                <Text className="text-gray-900 font-bold mb-1">Notificações Push</Text>
                <Text className="text-gray-500 text-xs">Receba avisos de agendamentos no celular</Text>
              </View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={pushEnabled ? '#fff' : '#f4f3f4'} />
            </View>

            <View className="mb-4 p-4 rounded-2xl flex-row items-center justify-between" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-1 mr-4">
                <Text className="text-gray-900 font-bold mb-1">E-mail</Text>
                <Text className="text-gray-500 text-xs">Receba relatórios e avisos importantes</Text>
              </View>
              <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={emailEnabled ? '#fff' : '#f4f3f4'} />
            </View>

            <View className="mb-4 p-4 rounded-2xl flex-row items-center justify-between" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-1 mr-4">
                <Text className="text-gray-900 font-bold mb-1">SMS</Text>
                <Text className="text-gray-500 text-xs">Receba lembretes via SMS</Text>
              </View>
              <Switch value={smsEnabled} onValueChange={setSmsEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={smsEnabled ? '#fff' : '#f4f3f4'} />
            </View>

            <View style={{ marginBottom: 8, padding: 16, borderRadius: 16, backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '25' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: reminderEnabled ? 12 : 0 }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', marginBottom: 2 }}>⏰ Lembrete de atendimento</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {reminderEnabled ? `Avisa ${reminderMinutes} min antes de cada atendimento` : 'Desativado'}
                  </Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReminderEnabled(v); }}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={reminderEnabled ? colors.primary : '#f4f3f4'}
                />
              </View>
              {reminderEnabled && (
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Quanto tempo antes?
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[15, 30, 60].map(min => (
                      <Pressable
                        key={min}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReminderMinutes(min); }}
                        style={{
                          flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                          backgroundColor: reminderMinutes === min ? colors.primary : colors.backgroundCard,
                          borderWidth: 1,
                          borderColor: reminderMinutes === min ? colors.primary : colors.border,
                        }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: reminderMinutes === min ? '#fff' : colors.textPrimary }}>
                          {min}min
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmar logout */}
      <ConfirmModal
        visible={showLogoutConfirm}
        title="Sair da Conta"
        message="Tem certeza que deseja sair? Você precisará fazer login novamente."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={doLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Modal de ajuda */}
      <Modal visible={showHelpModal} transparent animationType="none" onRequestClose={() => setShowHelpModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
          <Pressable style={{ position: 'absolute', inset: 0 }} onPress={() => setShowHelpModal(false)} />
          <View style={{ width: '100%', backgroundColor: colors.backgroundCard, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 10 }}>
            <LinearGradient colors={[colors.secondary, colors.primary] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 4 }} />
            <View style={{ padding: 22 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 4 }}>Central de Ajuda</Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 16 }}>Como podemos te ajudar?</Text>
              {[
                { label: 'Rever Tutorial do App', sub: 'Veja o tour passo a passo novamente', onPress: async () => { setShowHelpModal(false); const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default; await AsyncStorage.removeItem('walkthrough_done'); router.push('/(tabs)'); } },
                { label: 'Tutoriais Passo a Passo', sub: 'Guias completos de cada funcionalidade', onPress: () => { setShowHelpModal(false); router.push('/help-tutorials'); } },
                { label: 'WhatsApp Suporte', sub: 'Resposta em minutos', onPress: () => { setShowHelpModal(false); Linking.openURL('whatsapp://send?phone=5511999999999'); } },
                { label: 'Email Suporte', sub: 'suporte@appbello.com.br', onPress: () => { setShowHelpModal(false); Linking.openURL('mailto:suporte@appbello.com.br'); } },
              ].map(item => (
                <Pressable key={item.label} onPress={item.onPress}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <View>
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{item.label}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{item.sub}</Text>
                  </View>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>›</Text>
                  </View>
                </Pressable>
              ))}
              <Pressable onPress={() => setShowHelpModal(false)}
                style={{ marginTop: 14, height: 44, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={showDemoConfirm}
        title="Limpar Dados de Exemplo"
        message="Tem certeza? Os dados fictícios serão removidos permanentemente. Seus dados reais serão mantidos."
        confirmLabel="Limpar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDemoData}
        onCancel={() => setShowDemoConfirm(false)}
      />

      <ConfirmModal
        visible={showDeleteAccountConfirm}
        title="Excluir Conta"
        message="Tem certeza que deseja excluir sua conta? Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir minha conta"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={async () => {
          setShowDeleteAccountConfirm(false);
          showToast('Sua solicitação de exclusão foi enviada. Seus dados serão removidos em até 30 dias conforme a LGPD.', 'success');
          setTimeout(async () => {
            await logoutFn();
            router.replace('/login');
          }, 3000);
        }}
        onCancel={() => setShowDeleteAccountConfirm(false)}
      />

      <ToastComponent />
    </View>
  );
}
