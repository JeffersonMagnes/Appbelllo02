import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft2, Add, DollarCircle, PercentageCircle, Star1, Calendar, ArrowRight2, TrendUp, Shield, Key, CloseCircle, User, Sms, Call, Briefcase, Camera, TickSquare, ProfileAdd, Trash } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useServices } from '@/lib/hooks/use-services';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/lib/hooks/use-employees';
import { useAuthStore, defaultEmployeePermissions } from '@/lib/state/auth-store';
import type { EmployeePermissions } from '@/lib/state/auth-store';
import { uploadFile } from '@/lib/upload';
import type { Transaction, Employee } from '@/lib/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type EmployeeRole = 'professional' | 'receptionist' | 'admin';
type CommissionType = 'percentage' | 'fixed';

interface NewEmployee {
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  specialty: string;
  commissionType: CommissionType;
  commissionValue: string;
  avatar: string;
  active: boolean;
}

function computeEmployeeCommission(
  employee: Employee,
  allTransactions: Transaction[],
): number {
  const employeeTransactions = allTransactions.filter(
    t => t.employeeId === employee.id && t.type === 'income' && t.status === 'paid'
  );
  const totalRevenue = employeeTransactions.reduce((sum, t) => sum + t.amount, 0);
  if (employee.commissionType === 'percentage') {
    return totalRevenue * (employee.commissionValue / 100);
  }
  return employee.commissionValue * employeeTransactions.length;
}

export default function EmployeesScreen() {
  const router = useRouter();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { getEmployeeAccess, updateEmployeePermissions } = useAuthStore();
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: employees = [], isLoading: loadingEmployees } = useEmployees(establishmentId ?? undefined);
  const { data: servicesData = [] } = useServices(establishmentId ?? undefined);
  const { data: transactions = [] } = useTransactions(establishmentId ?? undefined);

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    name: '',
    email: '',
    phone: '',
    role: 'professional',
    specialty: '',
    commissionType: 'percentage',
    commissionValue: '40',
    avatar: '',
    active: true,
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Edição de funcionário ──────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [uploadingEditAvatar, setUploadingEditAvatar] = useState(false);

  // ── Permissoes de funcionário ─────────────────────────────────────────────
  const [showPermModal, setShowPermModal] = useState(false);
  const [permEmployee, setPermEmployee] = useState<Employee | null>(null);
  const [permValues, setPermValues] = useState<EmployeePermissions>({...defaultEmployeePermissions});

  const openEditModal = (emp: Employee) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditEmployee({ ...emp });
    setShowEditModal(true);
  };

  const openPermModal = (emp: Employee) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPermEmployee(emp);
    const access = getEmployeeAccess(emp.id);
    setPermValues(access?.permissions ?? {...defaultEmployeePermissions});
    setShowPermModal(true);
  };

  const handleSavePermissions = () => {
    if (!permEmployee) return;
    const access = getEmployeeAccess(permEmployee.id);
    if (access) {
      updateEmployeePermissions(access.id, permValues);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPermModal(false);
  };

  const handlePickEditImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingEditAvatar(true);
      try {
        const uploaded = await uploadFile(asset.uri, asset.fileName ?? `avatar-${Date.now()}.jpg`, asset.mimeType ?? 'image/jpeg');
        setEditEmployee(prev => prev ? { ...prev, avatar: uploaded.url } : prev);
      } catch {
        Alert.alert('Erro', 'Não foi possível enviar a foto.');
      } finally {
        setUploadingEditAvatar(false);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editEmployee || !editEmployee.name.trim() || !establishmentId) return;
    setSaving(true);
    try {
      await updateEmployee.mutateAsync({
        id: editEmployee.id,
        establishment_id: establishmentId,
        name: editEmployee.name,
        email: editEmployee.email || null,
        phone: editEmployee.phone || null,
        role: editEmployee.role as EmployeeRole,
        specialty: editEmployee.specialty || null,
        commission_type: editEmployee.commissionType,
        commission_value: editEmployee.commissionValue,
        avatar_url: editEmployee.avatar || null,
        active: editEmployee.active,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (!establishmentId) return;
    Alert.alert(
      'Excluir funcionário',
      `Deseja excluir "${emp.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee.mutateAsync({ id: emp.id, establishmentId });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setShowEditModal(false);
            } catch (e: any) {
              Alert.alert('Erro', e.message ?? 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      receptionist: 'Recepcionista',
      professional: 'Profissional',
    };
    return labels[role] || role;
  };

  const totalCommissions = employees
    .filter(e => e.role === 'professional')
    .reduce((sum, e) => sum + computeEmployeeCommission(e, transactions), 0);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingAvatar(true);
      try {
        const uploaded = await uploadFile(
          asset.uri,
          asset.fileName ?? `avatar-${Date.now()}.jpg`,
          asset.mimeType ?? 'image/jpeg'
        );
        setNewEmployee({ ...newEmployee, avatar: uploaded.url });
      } catch {
        Alert.alert('Erro', 'Não foi possível enviar a foto. Tente novamente.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleCreateEmployee = async () => {
    if (!newEmployee.name.trim() || !establishmentId) return;
    setSaving(true);
    try {
      await createEmployee.mutateAsync({
        establishment_id: establishmentId,
        name: newEmployee.name,
        email: newEmployee.email || null,
        phone: newEmployee.phone || null,
        role: newEmployee.role,
        specialty: newEmployee.specialty || null,
        commission_type: newEmployee.commissionType,
        commission_value: parseFloat(newEmployee.commissionValue) || 0,
        avatar_url: newEmployee.avatar || null,
        active: newEmployee.active,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      resetForm();
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível criar funcionário.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewEmployee({
      name: '',
      email: '',
      phone: '',
      role: 'professional',
      specialty: '',
      commissionType: 'percentage',
      commissionValue: '40',
      avatar: '',
      active: true,
    });
  };

  const roles: { value: EmployeeRole; label: string }[] = [
    { value: 'professional', label: 'Profissional' },
    { value: 'receptionist', label: 'Recepcionista' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <FeatureGate featureKey="equipe">
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.backgroundCard }}
            >
              <ArrowLeft2 size={24} color="#1C1C1E" variant="Outline" />
            </Pressable>
            <Text className="text-gray-900 text-lg font-bold" numberOfLines={1}>Funcionários & Comissão</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
            className="w-10 h-10 rounded-full items-center justify-center ml-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Add size={22} color="white" variant="Outline" />
          </Pressable>
        </View>

        {loadingEmployees ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
        <>
        {/* Summary */}
        <Animated.View entering={FadeInDown.delay(100)} className="px-5 mb-4">
          <View className="flex-row">
            <View className="flex-1 mr-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-row items-center mb-2">
                <TrendUp size={16} color={colors.secondary} variant="Outline" />
                <Text className="text-gray-500 text-xs ml-2">Comissões</Text>
              </View>
              <Text style={{ color: colors.secondary }} className="text-xl font-bold">
                {formatCurrency(totalCommissions)}
              </Text>
            </View>
            <View className="flex-1 ml-2 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-row items-center mb-2">
                <Star1 size={16} color={colors.warning} variant="Outline" />
                <Text className="text-gray-500 text-xs ml-2">Equipe</Text>
              </View>
              <Text style={{ color: colors.warning }} className="text-xl font-bold">
                {employees.filter(e => e.active).length} ativos
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Employees List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {employees.length === 0 && (
            <View className="items-center py-16">
              <ProfileAdd size={48} color={colors.textMuted} variant="Outline" />
              <Text className="text-gray-500 mt-3 text-center">Nenhum funcionário ainda.\nAdicione o primeiro!</Text>
            </View>
          )}
          {employees.map((employee, index) => {
            const commission = computeEmployeeCommission(employee, transactions);
            const employeeServices = servicesData.filter(s => employee.services?.includes(s.id));
            const employeeAccessData = getEmployeeAccess(employee.id);
            const isExpanded = selectedEmployee === employee.id;

            return (
              <Animated.View key={employee.id} entering={FadeInDown.delay(150 + index * 50)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedEmployee(isExpanded ? null : employee.id);
                  }}
                  className="mb-3 rounded-xl overflow-hidden"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  <View className="p-4">
                    <View className="flex-row items-center">
                      {employee.avatar ? (
                        <Image source={{ uri: employee.avatar }} className="w-12 h-12 rounded-full mr-3" />
                      ) : (
                        <View className="w-12 h-12 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                          <User size={24} color={colors.primary} variant="Outline" />
                        </View>
                      )}
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-gray-900 font-semibold" numberOfLines={1}>{employee.name}</Text>
                          {!employee.active && (
                            <View className="ml-2 px-2 py-0.5 rounded" style={{ backgroundColor: colors.error + '20' }}>
                              <Text style={{ color: colors.error }} className="text-xs">Inativo</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-500 text-sm">{getRoleLabel(employee.role)}</Text>
                      </View>
                      <ArrowRight2
                        size={20}
                        color={colors.textMuted}
                        style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                        variant="Outline" />
                    </View>

                    {employee.role === 'professional' && (
                      <View className="flex-row mt-3 pt-3 border-t border-black/8">
                        <View className="flex-1 flex-row items-center">
                          <PercentageCircle size={14} color={colors.secondary} />
                          <Text className="text-gray-600 text-sm ml-1">{employee.commissionValue}%</Text>
                        </View>
                        <Text style={{ color: colors.success }} className="font-bold">
                          {formatCurrency(commission)}
                        </Text>
                      </View>
                    )}

                    {isExpanded && (
                      <View className="mt-4 pt-4 border-t border-black/8">
                        {employee.hireDate && (
                          <View className="flex-row items-center mb-3">
                            <Calendar size={14} color={colors.textMuted} variant="Outline" />
                            <Text className="text-gray-500 text-sm ml-2">
                              Desde {new Date(employee.hireDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                            </Text>
                          </View>
                        )}

                        <View className="p-3 rounded-xl mb-3" style={{ backgroundColor: colors.backgroundLight }}>
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <Key size={14} color={employeeAccessData?.isActive ? colors.success : colors.textMuted} />
                              <Text className="text-gray-700 text-sm ml-2">Acesso ao App</Text>
                            </View>
                            <View className="px-2 py-1 rounded-full" style={{ backgroundColor: employeeAccessData?.isActive ? colors.success + '20' : colors.error + '20' }}>
                              <Text style={{ color: employeeAccessData?.isActive ? colors.success : colors.error }} className="text-xs">
                                {employeeAccessData?.isActive ? 'Ativo' : 'Não config.'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View className="flex-row">
                          <Pressable
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              router.push(`/admin/employee-access?employeeId=${employee.id}`);
                            }}
                            className="flex-1 py-3 rounded-xl items-center flex-row justify-center mr-2"
                            style={{ backgroundColor: colors.secondary }}
                          >
                            <Shield size={16} color="white" variant="Outline" />
                            <Text className="text-white font-medium ml-2">Acesso</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => openPermModal(employee)}
                            className="flex-1 py-3 rounded-xl items-center flex-row justify-center mr-2"
                            style={{ backgroundColor: colors.primary + '20' }}
                          >
                            <Key size={16} color={colors.primary} variant="Outline" />
                            <Text style={{ color: colors.primary }} className="font-medium ml-2">Permissões</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => openEditModal(employee)}
                            className="py-3 px-4 rounded-xl items-center"
                            style={{ backgroundColor: colors.backgroundLight }}
                          >
                            <Text className="text-gray-600 font-medium">Editar</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
          <View className="h-8" />
        </ScrollView>
        </>
        )}
      </SafeAreaView>

      {/* Add Employee Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
            <View className="px-5 py-4 flex-row items-center justify-between border-b border-black/8">
              <View className="flex-row items-center">
                <ProfileAdd size={24} color={colors.primary} variant="Outline" />
                <Text className="text-gray-900 text-xl font-bold ml-3">Novo Funcionário</Text>
              </View>
              <Pressable
                onPress={() => { setShowAddModal(false); resetForm(); }}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <CloseCircle size={20} color={colors.textMuted} variant="Outline" />
              </Pressable>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
              <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Avatar */}
                <View className="items-center py-6">
                  <Pressable onPress={handlePickImage} disabled={uploadingAvatar}>
                    {uploadingAvatar ? (
                      <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: colors.backgroundCard }}>
                        <ActivityIndicator color={colors.primary} />
                      </View>
                    ) : newEmployee.avatar ? (
                      <Image source={{ uri: newEmployee.avatar }} className="w-20 h-20 rounded-full" />
                    ) : (
                      <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: colors.backgroundCard }}>
                        <User size={32} color={colors.textMuted} variant="Outline" />
                      </View>
                    )}
                    <View className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
                      <Camera size={14} color="white" />
                    </View>
                  </Pressable>
                </View>

                {/* Name */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">Nome completo *</Text>
                  <View className="flex-row items-center rounded-xl px-4 h-14" style={{ backgroundColor: colors.backgroundCard }}>
                    <User size={20} color={colors.textMuted} variant="Outline" />
                    <TextInput
                      value={newEmployee.name}
                      onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
                      placeholder="Nome do funcionário"
                      placeholderTextColor={colors.textMuted}
                      className="flex-1 text-gray-900 ml-3"
                    />
                  </View>
                </View>

                {/* Email & Phone */}
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-600 text-sm mb-2">Email</Text>
                    <View className="flex-row items-center rounded-xl px-3 h-14" style={{ backgroundColor: colors.backgroundCard }}>
                      <Sms size={18} color={colors.textMuted} variant="Outline" />
                      <TextInput
                        value={newEmployee.email}
                        onChangeText={(text) => setNewEmployee({ ...newEmployee, email: text })}
                        placeholder="email@ex.com"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="flex-1 text-gray-900 ml-2 text-sm"
                      />
                    </View>
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-600 text-sm mb-2">Telefone</Text>
                    <View className="flex-row items-center rounded-xl px-3 h-14" style={{ backgroundColor: colors.backgroundCard }}>
                      <Call size={18} color={colors.textMuted} />
                      <TextInput
                        value={newEmployee.phone}
                        onChangeText={(text) => setNewEmployee({ ...newEmployee, phone: text })}
                        placeholder="(11) 99999"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        className="flex-1 text-gray-900 ml-2 text-sm"
                      />
                    </View>
                  </View>
                </View>

                {/* Role */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">Cargo *</Text>
                  <View className="flex-row">
                    {roles.map((role) => (
                      <Pressable
                        key={role.value}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setNewEmployee({ ...newEmployee, role: role.value });
                        }}
                        className="flex-1 py-3 rounded-xl items-center mx-1"
                        style={{ backgroundColor: newEmployee.role === role.value ? colors.primary : colors.backgroundCard }}
                      >
                        <Text className="text-sm font-medium" style={{ color: newEmployee.role === role.value ? 'white' : colors.textMuted }}>
                          {role.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {newEmployee.role === 'professional' && (
                  <>
                    {/* Specialty */}
                    <View className="mb-4">
                      <Text className="text-gray-600 text-sm mb-2">Especialidade</Text>
                      <View className="flex-row items-center rounded-xl px-4 h-14" style={{ backgroundColor: colors.backgroundCard }}>
                        <Briefcase size={20} color={colors.textMuted} variant="Outline" />
                        <TextInput
                          value={newEmployee.specialty}
                          onChangeText={(text) => setNewEmployee({ ...newEmployee, specialty: text })}
                          placeholder="Ex: Barbeiro, Manicure"
                          placeholderTextColor={colors.textMuted}
                          className="flex-1 text-gray-900 ml-3"
                        />
                      </View>
                    </View>

                    {/* Commission */}
                    <View className="mb-4">
                      <Text className="text-gray-600 text-sm mb-2">Comissão</Text>
                      <View className="flex-row">
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setNewEmployee({ ...newEmployee, commissionType: 'percentage' });
                          }}
                          className="py-3 px-4 rounded-xl items-center flex-row mr-2"
                          style={{ backgroundColor: newEmployee.commissionType === 'percentage' ? colors.secondary : colors.backgroundCard }}
                        >
                          <PercentageCircle size={16} color={newEmployee.commissionType === 'percentage' ? 'white' : colors.textMuted} />
                          <Text className="text-sm ml-1" style={{ color: newEmployee.commissionType === 'percentage' ? 'white' : colors.textMuted }}>%</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setNewEmployee({ ...newEmployee, commissionType: 'fixed' });
                          }}
                          className="py-3 px-4 rounded-xl items-center flex-row mr-2"
                          style={{ backgroundColor: newEmployee.commissionType === 'fixed' ? colors.secondary : colors.backgroundCard }}
                        >
                          <DollarCircle size={16} color={newEmployee.commissionType === 'fixed' ? 'white' : colors.textMuted} variant="Outline" />
                          <Text className="text-sm ml-1" style={{ color: newEmployee.commissionType === 'fixed' ? 'white' : colors.textMuted }}>Fixo</Text>
                        </Pressable>
                        <View className="flex-1 flex-row items-center rounded-xl px-4 h-12" style={{ backgroundColor: colors.backgroundCard }}>
                          <TextInput
                            value={newEmployee.commissionValue}
                            onChangeText={(text) => setNewEmployee({ ...newEmployee, commissionValue: text.replace(/[^0-9.]/g, '') })}
                            placeholder="40"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="decimal-pad"
                            className="flex-1 text-gray-900 text-center"
                          />
                          <Text className="text-gray-500">{newEmployee.commissionType === 'percentage' ? '%' : 'R$'}</Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {/* Active Status */}
                <View className="mb-6 flex-row items-center justify-between p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                  <View>
                    <Text className="text-gray-900 font-medium">Funcionário Ativo</Text>
                    <Text className="text-gray-500 text-xs">Pode receber agendamentos</Text>
                  </View>
                  <Switch
                    value={newEmployee.active}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, active: value })}
                    trackColor={{ false: colors.error + '50', true: colors.success + '50' }}
                    thumbColor={newEmployee.active ? colors.success : colors.error}
                  />
                </View>

                <View className="h-4" />
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Create Button */}
            <View className="px-5 py-4 border-t border-black/8">
              <Pressable
                onPress={handleCreateEmployee}
                className="py-4 rounded-xl items-center flex-row justify-center"
                style={{ backgroundColor: newEmployee.name.trim() && !saving ? colors.primary : colors.backgroundCard }}
                disabled={!newEmployee.name.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <ProfileAdd size={20} color={newEmployee.name.trim() ? 'white' : colors.textMuted} variant="Outline" />
                    <Text className="font-bold text-lg ml-2" style={{ color: newEmployee.name.trim() ? 'white' : colors.textMuted }}>
                      Criar Funcionário
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Modal de Edição ──────────────────────────────────────────────── */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditModal(false)}>
        {editEmployee && (
          <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                {/* Header */}
                <View className="px-5 py-4 flex-row items-center justify-between border-b border-black/8">
                  <Text className="text-gray-900 text-lg font-bold">Editar Funcionário</Text>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => handleDeleteEmployee(editEmployee)}
                      className="w-9 h-9 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.error + '20' }}
                    >
                      <Trash size={18} color={colors.error} variant="Outline" />
                    </Pressable>
                    <Pressable onPress={() => setShowEditModal(false)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.backgroundCard }}>
                      <CloseCircle size={20} color={colors.textMuted} variant="Outline" />
                    </Pressable>
                  </View>
                </View>

                <ScrollView className="flex-1 px-5 pt-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  {/* Foto */}
                  <View className="items-center mb-6">
                    <View className="relative">
                      <Pressable onPress={handlePickEditImage} disabled={uploadingEditAvatar}>
                        {uploadingEditAvatar ? (
                          <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: colors.backgroundCard }}>
                            <ActivityIndicator color={colors.primary} />
                          </View>
                        ) : editEmployee.avatar ? (
                          <Image source={{ uri: editEmployee.avatar }} className="w-24 h-24 rounded-full" />
                        ) : (
                          <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: colors.backgroundCard }}>
                            <User size={40} color={colors.textMuted} variant="Outline" />
                          </View>
                        )}
                        <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
                          <Camera size={16} color="white" />
                        </View>
                      </Pressable>
                    </View>
                    <Text className="text-gray-500 text-xs mt-2">Toque na foto para alterar</Text>
                  </View>

                  {/* Nome */}
                  <View className="mb-4">
                    <Text className="text-gray-600 text-sm mb-2">Nome completo *</Text>
                    <View className="flex-row items-center rounded-xl px-4 h-14" style={{ backgroundColor: colors.backgroundCard }}>
                      <User size={20} color={colors.textMuted} variant="Outline" />
                      <TextInput
                        value={editEmployee.name}
                        onChangeText={t => setEditEmployee({ ...editEmployee, name: t })}
                        placeholder="Nome do funcionário"
                        placeholderTextColor={colors.textMuted}
                        className="flex-1 text-gray-900 ml-3"
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <View className="mb-4">
                    <Text className="text-gray-600 text-sm mb-2">E-mail</Text>
                    <View className="flex-row items-center rounded-xl px-4 h-14" style={{ backgroundColor: colors.backgroundCard }}>
                      <Sms size={20} color={colors.textMuted} variant="Outline" />
                      <TextInput
                        value={editEmployee.email ?? ''}
                        onChangeText={t => setEditEmployee({ ...editEmployee, email: t })}
                        placeholder="email@exemplo.com"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="flex-1 text-gray-900 ml-3"
                      />
                    </View>
                  </View>

                  {/* Telefone */}
                  <View className="mb-4">
                    <Text className="text-gray-600 text-sm mb-2">Telefone</Text>
                    <View className="flex-row items-center rounded-xl px-4 h-14" style={{ backgroundColor: colors.backgroundCard }}>
                      <Call size={20} color={colors.textMuted} />
                      <TextInput
                        value={editEmployee.phone ?? ''}
                        onChangeText={t => setEditEmployee({ ...editEmployee, phone: t })}
                        placeholder="(11) 99999-9999"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        className="flex-1 text-gray-900 ml-3"
                      />
                    </View>
                  </View>

                  {/* Especialidade */}
                  <View className="mb-4">
                    <Text className="text-gray-600 text-sm mb-2">Especialidade</Text>
                    <View className="flex-row items-center rounded-xl px-4 h-14" style={{ backgroundColor: colors.backgroundCard }}>
                      <Briefcase size={20} color={colors.textMuted} variant="Outline" />
                      <TextInput
                        value={editEmployee.specialty ?? ''}
                        onChangeText={t => setEditEmployee({ ...editEmployee, specialty: t })}
                        placeholder="Ex: Corte, Coloração..."
                        placeholderTextColor={colors.textMuted}
                        className="flex-1 text-gray-900 ml-3"
                      />
                    </View>
                  </View>

                  {/* Cargo */}
                  <View className="mb-6">
                    <Text className="text-gray-600 text-sm mb-2">Cargo</Text>
                    <View className="flex-row gap-2">
                      {(['professional', 'receptionist', 'admin'] as const).map(role => (
                        <Pressable key={role}
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditEmployee({ ...editEmployee, role }); }}
                          className="flex-1 py-3 rounded-xl items-center"
                          style={{ backgroundColor: editEmployee.role === role ? colors.primary : colors.backgroundCard }}>
                          <Text style={{ color: editEmployee.role === role ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                            {getRoleLabel(role)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Ativo */}
                  <View className="flex-row items-center justify-between mb-8 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
                    <Text className="text-gray-700 font-medium">Funcionário ativo</Text>
                    <Switch
                      value={editEmployee.active}
                      onValueChange={v => setEditEmployee({ ...editEmployee, active: v })}
                      trackColor={{ false: colors.border, true: colors.primary + '60' }}
                      thumbColor={editEmployee.active ? colors.primary : '#f4f3f4'}
                    />
                  </View>
                </ScrollView>

                {/* Botão Salvar */}
                <View className="px-5 pb-4 pt-2 border-t border-black/8">
                  <Pressable onPress={handleSaveEdit} disabled={saving}
                    className="py-4 rounded-2xl items-center flex-row justify-center"
                    style={{ backgroundColor: colors.primary }}>
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <TickSquare size={18} color="white" variant="Outline" />
                        <Text className="text-white font-bold text-base ml-2">Salvar alterações</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </View>
        )}
      </Modal>

      {/* Permissions Modal */}
      <Modal visible={showPermModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPermModal(false)}>
        {permEmployee && (
          <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
              <View className="px-5 py-4 flex-row items-center justify-between border-b border-black/8">
                <View className="flex-row items-center">
                  <Key size={24} color={colors.primary} variant="Outline" />
                  <Text className="text-gray-900 text-lg font-bold ml-3">Permissões</Text>
                </View>
                <Pressable onPress={() => setShowPermModal(false)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.backgroundCard }}>
                  <CloseCircle size={20} color={colors.textMuted} variant="Outline" />
                </Pressable>
              </View>

              <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                <View className="flex-row items-center mb-6">
                  {permEmployee.avatar ? (
                    <Image source={{ uri: permEmployee.avatar }} className="w-12 h-12 rounded-full mr-3" />
                  ) : (
                    <View className="w-12 h-12 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                      <User size={24} color={colors.primary} variant="Outline" />
                    </View>
                  )}
                  <View>
                    <Text className="text-gray-900 font-bold">{permEmployee.name}</Text>
                    <Text className="text-gray-500 text-sm">{getRoleLabel(permEmployee.role)}</Text>
                  </View>
                </View>

                {([
                  { key: 'viewAgenda' as const, label: 'Ver agenda', desc: 'Visualizar agendamentos' },
                  { key: 'editAgenda' as const, label: 'Editar agenda', desc: 'Criar e editar agendamentos' },
                  { key: 'viewClients' as const, label: 'Ver clientes', desc: 'Visualizar lista de clientes' },
                  { key: 'editClients' as const, label: 'Editar clientes', desc: 'Criar e editar clientes' },
                  { key: 'viewFinancial' as const, label: 'Ver financeiro', desc: 'Acessar dados financeiros' },
                  { key: 'viewReports' as const, label: 'Ver relatórios', desc: 'Acessar relatórios' },
                  { key: 'viewProducts' as const, label: 'Ver produtos', desc: 'Visualizar estoque' },
                  { key: 'viewComandas' as const, label: 'Ver comandas', desc: 'Acessar comandas' },
                ]).map(perm => (
                  <View key={perm.key} className="flex-row items-center justify-between p-4 rounded-xl mb-2" style={{ backgroundColor: colors.backgroundCard }}>
                    <View className="flex-1 mr-4">
                      <Text className="text-gray-900 font-medium">{perm.label}</Text>
                      <Text className="text-gray-500 text-xs mt-0.5">{perm.desc}</Text>
                    </View>
                    <Switch
                      value={permValues[perm.key]}
                      onValueChange={(v) => setPermValues({ ...permValues, [perm.key]: v })}
                      trackColor={{ false: colors.border, true: colors.primary + '60' }}
                      thumbColor={permValues[perm.key] ? colors.primary : '#f4f3f4'}
                    />
                  </View>
                ))}

                <View className="h-4" />
              </ScrollView>

              <View className="px-5 pb-4 pt-2 border-t border-black/8">
                <Pressable onPress={handleSavePermissions}
                  className="py-4 rounded-2xl items-center flex-row justify-center"
                  style={{ backgroundColor: colors.primary }}>
                  <TickSquare size={18} color="white" variant="Outline" />
                  <Text className="text-white font-bold text-base ml-2">Salvar permissões</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        )}
      </Modal>
    </View>
    </FeatureGate>
  );
}
