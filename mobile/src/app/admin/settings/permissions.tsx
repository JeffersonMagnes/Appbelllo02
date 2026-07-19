import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft, Add, Edit2, Trash, TickCircle, CloseCircle,
  Shield, Briefcase,
} from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useRolesStore, EmployeeRole, BusinessType } from '@/lib/state/roles-store';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { EmployeePermissions } from '@/lib/state/auth-store';

type PermissionKey = keyof EmployeePermissions;

const PERMISSION_LABEL: Record<PermissionKey, string> = {
  viewAgenda: 'Ver Agenda',
  editAgenda: 'Editar Agenda',
  viewClients: 'Ver Clientes',
  editClients: 'Editar Clientes',
  viewFinancial: 'Ver Financeiro',
  viewReports: 'Ver Relatórios',
  viewProducts: 'Ver Produtos',
  viewComandas: 'Ver Comandas',
};

const ALL_KEYS: PermissionKey[] = [
  'viewAgenda', 'editAgenda', 'viewClients', 'editClients',
  'viewFinancial', 'viewReports', 'viewProducts', 'viewComandas',
];

const EMPTY_PERMISSIONS: EmployeePermissions = {
  viewAgenda: false, editAgenda: false,
  viewClients: false, editClients: false,
  viewFinancial: false, viewReports: false,
  viewProducts: false, viewComandas: false,
};

function countActive(perms: EmployeePermissions) {
  return Object.values(perms).filter(Boolean).length;
}

export default function PermissionsScreen() {
  const router = useRouter();
  const roles = useRolesStore((s) => s.roles);
  const seeded = useRolesStore((s) => s.seeded);
  const seedRolesForType = useRolesStore((s) => s.seedRolesForType);
  const addRole = useRolesStore((s) => s.addRole);
  const updateRole = useRolesStore((s) => s.updateRole);
  const removeRole = useRolesStore((s) => s.removeRole);
  const businessType = useOnboardingStore((s) => s.business.businessType) as BusinessType;

  useEffect(() => {
    if (!seeded) seedRolesForType(businessType);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRole, setEditingRole] = useState<EmployeeRole | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<EmployeePermissions>(EMPTY_PERMISSIONS);
  const [nameError, setNameError] = useState('');

  const openCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setFormPermissions(EMPTY_PERMISSIONS);
    setNameError('');
    setShowModal(true);
  };

  const openEdit = (role: EmployeeRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description);
    setFormPermissions({ ...role.permissions });
    setNameError('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      setNameError('Nome é obrigatório');
      return;
    }
    setNameError('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingRole) {
      updateRole(editingRole.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        color: editingRole.color,
        permissions: formPermissions,
      });
    } else {
      addRole({
        name: formName.trim(),
        description: formDescription.trim(),
        color: colors.primary,
        permissions: formPermissions,
      });
    }
    setShowModal(false);
  };

  const confirmDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (deletingId) {
      removeRole(deletingId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  const togglePermission = (key: PermissionKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.backgroundCard, alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} variant="Outline" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: colors.textPrimary }}>Cargos e Permissões</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>Defina o que cada cargo pode acessar</Text>
          </View>
          <Pressable
            onPress={openCreate}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Add size={22} color="#fff" variant="Outline" />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {roles.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Shield size={48} color={colors.textMuted} variant="Outline" />
              <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12 }}>Nenhum cargo cadastrado.</Text>
              <Pressable onPress={openCreate} style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Criar primeiro cargo</Text>
              </Pressable>
            </View>
          )}

          {roles.map((role, index) => {
            const count = countActive(role.permissions);
            const RoleIcon = role.isDefault ? Shield : Briefcase;
            const activeLabels = ALL_KEYS.filter(k => role.permissions[k]).map(k => PERMISSION_LABEL[k]);
            return (
              <Animated.View key={role.id} entering={FadeInDown.delay(index * 60)}>
                <View style={{
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 16,
                  marginBottom: 12,
                  padding: 16,
                }}>
                  {/* Header row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{
                      width: 42, height: 42, borderRadius: 12,
                      backgroundColor: `${colors.primary}12`,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <RoleIcon size={20} color={colors.primary} variant="Outline" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>{role.name}</Text>
                        {role.isDefault && (
                          <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}>Padrão</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{role.description}</Text>
                    </View>
                    <View style={{ backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 12 }}>{count}/8</Text>
                    </View>
                  </View>

                  {/* Permission summary */}
                  {activeLabels.length > 0 && (
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 14, lineHeight: 18 }}>
                      {activeLabels.join(' · ')}
                    </Text>
                  )}

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
                    <Pressable
                      onPress={() => openEdit(role)}
                      style={{
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface,
                      }}
                    >
                      <Edit2 size={15} color={colors.textSecondary} variant="Outline" />
                      <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13, marginLeft: 6 }}>Editar</Text>
                    </Pressable>
                    {!role.isDefault && (
                      <Pressable
                        onPress={() => confirmDelete(role.id)}
                        style={{
                          flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                          paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface,
                        }}
                      >
                        <Trash size={15} color={colors.error} variant="Outline" />
                        <Text style={{ color: colors.error, fontWeight: '600', fontSize: 13, marginLeft: 6 }}>Excluir</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </Animated.View>
            );
          })}

          {/* New role CTA */}
          <Pressable
            onPress={openCreate}
            style={{
              borderRadius: 16, padding: 18, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
              flexDirection: 'row', gap: 8,
            }}
          >
            <Add size={18} color={colors.textMuted} variant="Outline" />
            <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Novo Cargo</Text>
          </Pressable>
        </ScrollView>

        {/* CREATE / EDIT MODAL */}
        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
                  {editingRole ? 'Editar Cargo' : 'Novo Cargo'}
                </Text>
                <Pressable onPress={() => setShowModal(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.backgroundCard, alignItems: 'center', justifyContent: 'center' }}>
                  <CloseCircle size={20} color={colors.textMuted} variant="Outline" />
                </Pressable>
              </View>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  {/* Nome */}
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Nome do cargo</Text>
                  <View style={{
                    borderRadius: 14, paddingHorizontal: 14, height: 50,
                    backgroundColor: colors.backgroundCard,
                    borderWidth: nameError ? 1.5 : 0, borderColor: colors.error,
                    marginBottom: nameError ? 4 : 16,
                  }}>
                    <TextInput
                      value={formName}
                      onChangeText={(t) => { setFormName(t); setNameError(''); }}
                      placeholder="Ex: Cabeleireiro, Barbeiro..."
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, color: colors.textPrimary, fontSize: 15, height: 50 }}
                    />
                  </View>
                  {nameError && <Text style={{ color: colors.error, fontSize: 12, marginBottom: 16 }}>{nameError}</Text>}

                  {/* Descrição */}
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Descrição (opcional)</Text>
                  <View style={{ borderRadius: 14, paddingHorizontal: 14, height: 50, backgroundColor: colors.backgroundCard, marginBottom: 24 }}>
                    <TextInput
                      value={formDescription}
                      onChangeText={setFormDescription}
                      placeholder="Ex: Atendimento de cabelo e coloração"
                      placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, color: colors.textPrimary, fontSize: 15, height: 50 }}
                    />
                  </View>

                  {/* Permissões */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>Permissões</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{countActive(formPermissions)}/8 ativas</Text>
                  </View>

                  <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 16, overflow: 'hidden' }}>
                    {ALL_KEYS.map((key, idx) => (
                      <Pressable
                        key={key}
                        onPress={() => togglePermission(key)}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          paddingHorizontal: 16, paddingVertical: 15,
                          borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border,
                        }}
                      >
                        <Text style={{ color: colors.textPrimary, flex: 1, fontSize: 15 }}>{PERMISSION_LABEL[key]}</Text>
                        <View style={{
                          width: 44, height: 26, borderRadius: 13, padding: 3,
                          backgroundColor: formPermissions[key] ? colors.primary : colors.surface,
                        }}>
                          <View style={{
                            width: 20, height: 20, borderRadius: 10,
                            backgroundColor: '#fff',
                            alignSelf: formPermissions[key] ? 'flex-end' : 'flex-start',
                          }} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>

              <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={handleSave}
                  style={{ backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {editingRole ? 'Salvar Alterações' : 'Criar Cargo'}
                  </Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        {/* DELETE MODAL */}
        <Modal visible={showDeleteModal} animationType="fade" transparent onRequestClose={() => setShowDeleteModal(false)}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View style={{ borderRadius: 20, padding: 28, width: '100%', backgroundColor: colors.backgroundCard }}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Trash size={26} color={colors.error} variant="Outline" />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>Excluir Cargo?</Text>
                <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 14 }}>
                  Funcionários com este cargo não perderão os acessos já configurados.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={() => setShowDeleteModal(false)}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.surface }}
                >
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.error }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Excluir</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
