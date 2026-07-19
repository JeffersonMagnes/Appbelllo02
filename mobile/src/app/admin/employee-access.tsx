import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft2, ProfileAdd, Shield, Key, Sms, Eye, EyeSlash,
  Calendar, Profile2User, DollarCircle, Chart, Box, Receipt,
  Trash, Flash, Copy, CloseCircle, Refresh, TickCircle, Briefcase,
} from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useEmployees } from '@/lib/hooks/use-employees';
import {
  useAuthStore,
  EmployeePermissions,
  defaultEmployeePermissions,
} from '@/lib/state/auth-store';
import { useRolesStore } from '@/lib/state/roles-store';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import * as Clipboard from 'expo-clipboard';

type PermissionKey = keyof EmployeePermissions;

const permissionLabel: Record<PermissionKey, string> = {
  viewAgenda: 'Ver Agenda',
  editAgenda: 'Editar Agenda',
  viewClients: 'Ver Clientes',
  editClients: 'Editar Clientes',
  viewFinancial: 'Ver Financeiro',
  viewReports: 'Ver Relatórios',
  viewProducts: 'Ver Produtos',
  viewComandas: 'Ver Comandas',
};

const permissionGroups = [
  { label: 'Agenda', color: colors.secondary, keys: ['viewAgenda', 'editAgenda'] as PermissionKey[], Icon: Calendar },
  { label: 'Clientes', color: colors.primary, keys: ['viewClients', 'editClients'] as PermissionKey[], Icon: Profile2User },
  { label: 'Financeiro', color: colors.success, keys: ['viewFinancial'] as PermissionKey[], Icon: DollarCircle },
  { label: 'Relatórios', color: colors.warning, keys: ['viewReports'] as PermissionKey[], Icon: Chart },
  { label: 'Produtos', color: colors.error, keys: ['viewProducts'] as PermissionKey[], Icon: Box },
  { label: 'Comandas', color: colors.info, keys: ['viewComandas'] as PermissionKey[], Icon: Receipt },
];

function getMatchingRoleId(perms: EmployeePermissions, roles: { id: string; permissions: EmployeePermissions }[]): string | null {
  for (const role of roles) {
    const allMatch = (Object.keys(role.permissions) as PermissionKey[]).every((k) => role.permissions[k] === perms[k]);
    if (allMatch) return role.id;
  }
  return null;
}

export default function EmployeeAccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ employeeId: string }>();
  const {
    createEmployeeAccess,
    updateEmployeeAccess,
    deleteEmployeeAccess,
    toggleEmployeeAccessActive,
    updateEmployeePermissions,
    getEmployeeAccess,
  } = useAuthStore();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: employees = [] } = useEmployees(establishmentId ?? undefined);
  const roles = useRolesStore((s) => s.roles);
  const rolesSeeded = useRolesStore((s) => s.seeded);
  const seedRolesForType = useRolesStore((s) => s.seedRolesForType);

  const employee = employees.find((e) => e.id === params.employeeId);
  const currentAccess = getEmployeeAccess(params.employeeId ?? '');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [email, setEmail] = useState(currentAccess?.email ?? employee?.email ?? '');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [permissions, setPermissions] = useState<EmployeePermissions>(
    currentAccess?.permissions ?? defaultEmployeePermissions
  );

  const businessType = useOnboardingStore((s) => s.business.businessType);

  useEffect(() => {
    if (!rolesSeeded) seedRolesForType(businessType);
    if (!currentAccess) {
      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      setPin(newPin);
      setShowCreateModal(true);
    }
  }, []);

  const generatePin = () => {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(newPin);
    return newPin;
  };

  const handleRoleChange = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newPerms = role.permissions;
    setPermissions(newPerms);
    if (currentAccess) {
      updateEmployeePermissions(currentAccess.id, newPerms);
    }
  };

  const handleCreateAccess = () => {
    if (!email.includes('@')) {
      setEmailError('Digite um email válido');
      return;
    }
    setEmailError('');
    if (pin.length !== 4) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createEmployeeAccess(params.employeeId ?? '', email, pin, permissions);
    setShowCreateModal(false);
  };

  const handleUpdatePermissions = (key: PermissionKey, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPermissions = { ...permissions, [key]: value };
    setPermissions(newPermissions);
    if (currentAccess) {
      updateEmployeePermissions(currentAccess.id, newPermissions);
    }
  };

  const handleToggleActive = () => {
    if (currentAccess) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleEmployeeAccessActive(currentAccess.id);
    }
  };

  const handleDeleteAccess = () => {
    if (currentAccess) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      deleteEmployeeAccess(currentAccess.id);
      router.back();
    }
  };

  const handleCopyPin = async () => {
    if (currentAccess) {
      await Clipboard.setStringAsync(currentAccess.pin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleResetPin = () => {
    const newPin = generatePin();
    if (currentAccess) {
      updateEmployeeAccess(currentAccess.id, { pin: newPin });
    }
    setShowPin(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const activeCount = Object.values(permissions).filter(Boolean).length;
  const matchingRoleId = getMatchingRoleId(permissions, roles);
  const isCustom = matchingRoleId === null;

  if (!employee) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary }}>Funcionário não encontrado</Text>
      </View>
    );
  }

  const initials = employee.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const activeRole = roles.find((r) => r.id === matchingRoleId);
  const roleLabel = activeRole?.name ?? (isCustom ? 'Personalizado' : 'Sem cargo');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Floating back button */}
        <Pressable
          onPress={() => router.back()}
          style={{
            position: 'absolute', top: 56, left: 20, zIndex: 10,
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.3)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft2 size={22} color="#fff" variant="Outline" />
        </Pressable>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          {/* GRADIENT HEADER */}
          <LinearGradient
            colors={['#5333ed', '#8B21CF', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 72, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <View style={{
              width: 90, height: 90, borderRadius: 45,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 14, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
            }}>
              {employee.avatar ? (
                <Image source={{ uri: employee.avatar }} style={{ width: 84, height: 84, borderRadius: 42 }} />
              ) : (
                <Text style={{ color: '#fff', fontSize: 30, fontWeight: 'bold' }}>{initials}</Text>
              )}
            </View>

            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{employee.name}</Text>

            <View style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 10,
            }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{roleLabel}</Text>
            </View>

            {currentAccess && (
              <View style={{
                paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
                backgroundColor: currentAccess.isActive ? `${colors.success}40` : `${colors.error}40`,
              }}>
                <Text style={{ color: currentAccess.isActive ? colors.success : colors.error, fontSize: 12, fontWeight: '700' }}>
                  {currentAccess.isActive ? '● Ativo' : '● Inativo'}
                </Text>
              </View>
            )}
          </LinearGradient>

          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            {currentAccess ? (
              <>
                {/* ACCESS CARD */}
                <Animated.View entering={FadeInDown.delay(100)}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' }}>Acesso</Text>
                  <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 16, marginBottom: 24, overflow: 'hidden' }}>
                    {/* Email */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.secondary}25`, alignItems: 'center', justifyContent: 'center' }}>
                        <Sms size={18} color={colors.secondary} variant="Outline" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>Email</Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 14 }} numberOfLines={1}>{currentAccess.email}</Text>
                      </View>
                    </View>

                    {/* PIN */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.warning}25`, alignItems: 'center', justifyContent: 'center' }}>
                        <Key size={18} color={colors.warning} variant="Bold" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>PIN</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: colors.textPrimary, fontSize: 22, letterSpacing: 8, fontWeight: '700' }}>
                            {showPin ? currentAccess.pin : '••••'}
                          </Text>
                          <Pressable onPress={() => { Haptics.selectionAsync(); setShowPin((v) => !v); }} style={{ marginLeft: 10 }}>
                            {showPin
                              ? <EyeSlash size={16} color={colors.textMuted} variant="Outline" />
                              : <Eye size={16} color={colors.textMuted} variant="Outline" />
                            }
                          </Pressable>
                          <Pressable onPress={handleCopyPin} style={{ marginLeft: 8 }}>
                            <Copy size={16} color={colors.secondary} variant="Outline" />
                          </Pressable>
                        </View>
                      </View>
                      <Pressable onPress={handleResetPin} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.warning}25`, alignItems: 'center', justifyContent: 'center' }}>
                        <Refresh size={18} color={colors.warning} variant="Bold" />
                      </Pressable>
                    </View>

                    {/* Active toggle */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${currentAccess.isActive ? colors.success : colors.error}25`, alignItems: 'center', justifyContent: 'center' }}>
                        <Flash size={18} color={currentAccess.isActive ? colors.success : colors.error} variant="Bold" />
                      </View>
                      <Text style={{ color: colors.textPrimary, flex: 1, marginLeft: 12 }}>Acesso Ativo</Text>
                      <Switch
                        value={currentAccess.isActive}
                        onValueChange={handleToggleActive}
                        trackColor={{ false: `${colors.error}40`, true: `${colors.success}40` }}
                        thumbColor={currentAccess.isActive ? colors.success : colors.error}
                      />
                    </View>
                  </View>
                </Animated.View>

                {/* ROLE SECTION */}
                <Animated.View entering={FadeInDown.delay(200)}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' }}>Cargo / Função</Text>
                  <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
                    {roles.map((role, idx) => {
                      const selected = matchingRoleId === role.id;
                      return (
                        <Pressable
                          key={role.id}
                          onPress={() => handleRoleChange(role.id)}
                          style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingHorizontal: 16, paddingVertical: 14,
                            borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border,
                            backgroundColor: selected ? `${colors.primary}08` : 'transparent',
                          }}
                        >
                          <View style={{
                            width: 20, height: 20, borderRadius: 10,
                            borderWidth: 2, borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primary : 'transparent',
                            alignItems: 'center', justifyContent: 'center', marginRight: 12,
                          }}>
                            {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                          </View>
                          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: selected ? '700' : '400', flex: 1 }}>{role.name}</Text>
                          {role.isDefault && (
                            <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}>Padrão</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>

                {/* PERMISSIONS SECTION */}
                <Animated.View entering={FadeInDown.delay(300)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', flex: 1 }}>Permissões</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{activeCount}/8 ativas</Text>
                  </View>

                  {/* Permission list */}
                  <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                    {permissionGroups.flatMap(({ keys }) => keys).map((key, idx, arr) => (
                      <Pressable
                        key={key}
                        onPress={() => handleUpdatePermissions(key, !permissions[key])}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingHorizontal: 16, paddingVertical: 14,
                          borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border,
                        }}
                      >
                        <Text style={{ color: colors.textPrimary, flex: 1, fontSize: 15 }}>{permissionLabel[key]}</Text>
                        <View style={{
                          width: 44, height: 26, borderRadius: 13, padding: 3,
                          backgroundColor: permissions[key] ? colors.primary : colors.surface,
                        }}>
                          <View style={{
                            width: 20, height: 20, borderRadius: 10,
                            backgroundColor: '#fff',
                            alignSelf: permissions[key] ? 'flex-end' : 'flex-start',
                          }} />
                        </View>
                      </Pressable>
                    ))}
                  </View>

                  {/* Danger zone */}
                  <Pressable
                    onPress={() => setShowDeleteModal(true)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      paddingVertical: 16, borderRadius: 16,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Trash size={18} color={colors.error} variant="Outline" />
                    <Text style={{ color: colors.error, fontWeight: '600', marginLeft: 8 }}>Remover Acesso</Text>
                  </Pressable>
                </Animated.View>
              </>
            ) : (
              <Animated.View entering={FadeInDown.delay(100)}>
                <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 20, padding: 28, alignItems: 'center' }}>
                  <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: `${colors.primary}25`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <ProfileAdd size={36} color={colors.primary} variant="Outline" />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Sem Acesso Configurado</Text>
                  <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>Este funcionário ainda não possui acesso ao app.</Text>
                  <Pressable
                    onPress={() => { generatePin(); setShowCreateModal(true); }}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Criar Acesso</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* CREATE MODAL */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => { setShowCreateModal(false); if (!currentAccess) router.back(); }}
        >
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>Criar Acesso</Text>
                <Pressable
                  onPress={() => { setShowCreateModal(false); if (!currentAccess) router.back(); }}
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.backgroundCard, alignItems: 'center', justifyContent: 'center' }}
                >
                  <CloseCircle size={20} color={colors.textMuted} variant="Outline" />
                </Pressable>
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }} keyboardShouldPersistTaps="handled">
                  {/* Email */}
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>Email</Text>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
                    paddingHorizontal: 14, height: 52, backgroundColor: colors.backgroundCard,
                    marginBottom: 4, borderWidth: emailError ? 1 : 0, borderColor: colors.error,
                  }}>
                    <Sms size={20} color={colors.textMuted} variant="Outline" />
                    <TextInput
                      value={email}
                      onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                      placeholder="email@exemplo.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{ flex: 1, color: colors.textPrimary, marginLeft: 10, fontSize: 15 }}
                    />
                  </View>
                  {emailError
                    ? <Text style={{ color: colors.error, fontSize: 12, marginBottom: 16 }}>{emailError}</Text>
                    : <View style={{ marginBottom: 16 }} />
                  }

                  {/* PIN */}
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }}>PIN de Acesso (4 dígitos)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: colors.backgroundCard, marginBottom: 24 }}>
                    <Key size={20} color={colors.textMuted} variant="Bold" />
                    <TextInput
                      value={pin}
                      onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                      placeholder="0000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      maxLength={4}
                      style={{ flex: 1, color: colors.textPrimary, fontSize: 22, letterSpacing: 10, marginLeft: 10 }}
                    />
                    <Pressable
                      onPress={generatePin}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: `${colors.secondary}20` }}
                    >
                      <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: '600' }}>Gerar</Text>
                    </Pressable>
                  </View>

                  {/* Info */}
                  <View style={{ borderRadius: 12, padding: 14, backgroundColor: colors.backgroundCard, flexDirection: 'row', alignItems: 'center' }}>
                    <Calendar size={18} color={colors.secondary} variant="Outline" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13 }}>Permissão inicial: Apenas Agenda</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Ajuste as permissões depois.</Text>
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>

              <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={handleCreateAccess}
                  style={{ backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Criar Acesso</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        {/* DELETE MODAL */}
        <Modal visible={showDeleteModal} animationType="fade" transparent onRequestClose={() => setShowDeleteModal(false)}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ borderRadius: 20, padding: 24, width: '100%', backgroundColor: colors.backgroundCard }}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: `${colors.error}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Trash size={28} color={colors.error} variant="Outline" />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>Remover Acesso?</Text>
                <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 14 }}>O funcionário não poderá mais acessar o app.</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => setShowDeleteModal(false)}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.backgroundLight }}
                >
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setShowDeleteModal(false); handleDeleteAccess(); }}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.error }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Remover</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
