import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, ArrowRight2, SearchNormal1, Add, CloseCircle, DollarCircle, Scissor, Box, TickSquare, Tag, Trash, Camera } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { services as mockServices } from '@/lib/mockData';
import { useEmployees } from '@/lib/hooks/use-employees';
import { getServiceCategories } from '@/lib/business-presets';
import { useEstablishmentOrMock } from '@/lib/hooks/use-establishment';
// services variable is replaced by the hook below inside the component
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/lib/state/auth-store';
import { useServices, useCreateService, useDeleteService } from '@/lib/hooks/use-services';
import { useServicePackages, useCreateServicePackage, useDeleteServicePackage, type ServicePackage } from '@/lib/hooks/use-service-packages';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSetupStore } from '@/lib/state/setup-store';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '@/lib/upload';

// ─── Types ────────────────────────────────────────────────────────────────────
// ServicePackage type is imported from use-service-packages hook

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = 'services' | 'packages';

export default function ServicesScreen() {
  const router = useRouter();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const currentUser = useAuthStore(s => s.currentUser);
  const { data: establishmentData } = useEstablishmentOrMock(currentUser?.id ?? undefined);
  const businessType = ((establishmentData as any)?.business_type ?? '') as string;
  const serviceCategories = getServiceCategories(businessType as any);
  const { data: services = mockServices } = useServices(establishmentId ?? undefined);
  const { data: packages = [] } = useServicePackages(establishmentId ?? undefined);
  const { data: employees = [] } = useEmployees(establishmentId ?? undefined);
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const createPackage = useCreateServicePackage();
  const deletePackage = useDeleteServicePackage();
  const completeStep = useSetupStore(s => s.completeStep);

  // ── Tab state
  const [activeTab, setActiveTab] = useState<Tab>('services');

  // ── Services state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Packages state
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [showPackageDetail, setShowPackageDetail] = useState(false);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgOriginalPrice, setPkgOriginalPrice] = useState('');
  const [pkgValidity, setPkgValidity] = useState('');
  const [pkgSessions, setPkgSessions] = useState('');
  const [pkgSelectedServices, setPkgSelectedServices] = useState<string[]>([]);

  const filteredServices = selectedCategory
    ? services.filter(s => s.category === selectedCategory)
    : services;

  // ─────────────────────────────── Handlers ──────────────────────────────────

  const pickServiceImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para adicionar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  const handleAddService = async () => {
    if (!newName.trim()) { Alert.alert('Campo obrigatório', 'Informe o nome do serviço.'); return; }
    if (!newPrice.trim()) { Alert.alert('Campo obrigatório', 'Informe o preço.'); return; }
    if (!establishmentId || !isSupabaseConfigured()) {
      Alert.alert('Erro', 'Configure o Supabase para salvar serviços.');
      return;
    }
    try {
      let imageUrl: string | null = null;
      if (newImageUri) {
        setUploadingImage(true);
        const filename = `service-${Date.now()}.jpg`;
        const uploaded = await uploadFile(newImageUri, filename, 'image/jpeg');
        imageUrl = uploaded.url;
        setUploadingImage(false);
      }
      await (createService as any).mutateAsync({
        establishment_id: establishmentId,
        name: newName.trim(),
        description: newDescription.trim() || null,
        price: parseFloat(newPrice.replace(',', '.')) || 0,
        duration: parseInt(newDuration) || 30,
        category: newCategory || null,
        active: true,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
      completeStep('services');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Serviço criado!', `"${newName}" foi adicionado com sucesso.`);
      setNewName(''); setNewDescription(''); setNewPrice('');
      setNewDuration(''); setNewCategory(''); setNewImageUri(null);
      setShowAddServiceModal(false);
    } catch (e: any) {
      setUploadingImage(false);
      Alert.alert('Erro', e?.message || 'Não foi possível criar o serviço.');
    }
  };

  const handleAddPackage = async () => {
    if (!pkgName.trim()) { Alert.alert('Campo obrigatório', 'Informe o nome do pacote.'); return; }
    if (!pkgPrice.trim()) { Alert.alert('Campo obrigatório', 'Informe o preço do pacote.'); return; }
    if (pkgSelectedServices.length === 0) { Alert.alert('Campo obrigatório', 'Selecione ao menos um serviço.'); return; }
    if (!establishmentId || !isSupabaseConfigured()) {
      Alert.alert('Erro', 'Configure o Supabase para salvar pacotes.');
      return;
    }
    const price = parseFloat(pkgPrice.replace(',', '.')) || 0;
    const originalPrice = parseFloat((pkgOriginalPrice || pkgPrice).replace(',', '.')) || price;
    const discountPercent = originalPrice > price
      ? Math.round((1 - price / originalPrice) * 100)
      : 0;
    try {
      await createPackage.mutateAsync({
        establishment_id: establishmentId,
        name: pkgName.trim(),
        description: pkgDescription.trim() || null,
        price,
        sessions: parseInt(pkgSessions || '1'),
        validity_days: parseInt(pkgValidity || '30'),
        discount_percent: discountPercent,
        service_ids: pkgSelectedServices,
        active: true,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Pacote criado!', `"${pkgName}" foi adicionado com sucesso.`);
      setPkgName(''); setPkgDescription(''); setPkgPrice('');
      setPkgOriginalPrice(''); setPkgValidity(''); setPkgSessions('');
      setPkgSelectedServices([]);
      setShowAddPackageModal(false);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível criar o pacote.');
    }
  };

  const getDiscountPercent = (pkg: ServicePackage) => pkg.discountPercent ?? 0;

  const handleDeletePackage = async (pkg: ServicePackage) => {
    if (!establishmentId) return;
    Alert.alert('Excluir pacote', `Deseja excluir "${pkg.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePackage.mutateAsync({ id: pkg.id, establishmentId });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowPackageDetail(false);
            setSelectedPackage(null);
          } catch (e: any) {
            Alert.alert('Erro', e?.message || 'Não foi possível excluir o pacote.');
          }
        },
      },
    ]);
  };

  const handleDeleteService = async (svc: typeof services[0]) => {
    if (!establishmentId) return;
    Alert.alert('Excluir serviço', `Deseja excluir "${svc.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteService.mutateAsync({ id: svc.id, establishmentId });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowServiceDetail(false);
            setSelectedService(null);
          } catch (e: any) {
            Alert.alert('Erro', e?.message || 'Não foi possível excluir o serviço.');
          }
        },
      },
    ]);
  };

  // ─────────────────────────────── Render ────────────────────────────────────

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>

        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-gray-900 text-2xl font-bold">Serviços</Text>
            <Text className="text-gray-500 text-sm mt-0.5">Gerencie serviços e pacotes</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (activeTab === 'services') {
                setNewName(''); setNewDescription(''); setNewPrice('');
                setNewDuration(''); setNewCategory(''); setNewImageUri(null);
                setShowAddServiceModal(true);
              } else {
                setShowAddPackageModal(true);
              }
            }}
            className="w-11 h-11 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Add size={22} color="white"  variant="Outline" />
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View className="px-5 mb-4">
          <View
            className="flex-row rounded-2xl p-1"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            {([
              { key: 'services', label: 'Serviços', Icon: Scissor },
              { key: 'packages', label: 'Pacotes', Icon: Box },
            ] as { key: Tab; label: string; Icon: any }[]).map(({ key, label, Icon }) => (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(key);
                }}
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                style={{
                  backgroundColor: activeTab === key ? colors.primary : 'transparent',
                }}
              >
                <Icon size={15} color={activeTab === key ? 'white' : colors.textMuted} />
                <Text
                  className="ml-1.5 text-sm font-semibold"
                  style={{ color: activeTab === key ? 'white' : colors.textMuted }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── SERVICES TAB ─────────────────────────────────────────────── */}
        {activeTab === 'services' && (
          <>
            {/* Search */}
            <View className="px-5 mb-4">
              <Pressable
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                <SearchNormal1 size={20} color={colors.textMuted}  variant="Outline" />
                <Text className="text-gray-400 ml-3">Buscar serviço...</Text>
              </Pressable>
            </View>

            {/* Categories */}
            <View className="mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                <Pressable
                  onPress={() => setSelectedCategory(null)}
                  className="mr-2 px-4 py-2 rounded-full"
                  style={{ backgroundColor: selectedCategory === null ? colors.primary : colors.backgroundCard }}
                >
                  <Text className="text-sm font-medium" style={{ color: selectedCategory === null ? 'white' : colors.textMuted }}>
                    Todos
                  </Text>
                </Pressable>
                {serviceCategories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    className="mr-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: selectedCategory === cat.id ? colors.primary : colors.backgroundCard }}
                  >
                    <Text className="text-sm font-medium" style={{ color: selectedCategory === cat.id ? 'white' : colors.textMuted }}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Services list */}
            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
              {filteredServices.map((service) => {
                const svcProfs = employees.filter(p => p.services?.includes(service.id));
                const serviceImageUrl = (service as any).image_url as string | null;
                return (
                  <Pressable
                    key={service.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedService(service);
                      setShowServiceDetail(true);
                    }}
                    className="mb-3 rounded-xl overflow-hidden"
                    style={{ backgroundColor: colors.backgroundCard }}
                  >
                    <View className="p-4 flex-row">
                      {serviceImageUrl ? (
                        <Image
                          source={{ uri: serviceImageUrl }}
                          style={{ width: 56, height: 56, borderRadius: 12, marginRight: 12 }}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <Text className="text-gray-900 font-semibold text-base mb-1">{service.name}</Text>
                            <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{service.description}</Text>
                            <View className="flex-row items-center">
                              <Clock size={14} color={colors.textMuted}  variant="Outline" />
                              <Text className="text-gray-500 text-xs ml-1 mr-4">{service.duration >= 60 ? `${Math.floor(service.duration / 60)}h${service.duration % 60 > 0 ? service.duration % 60 + 'min' : ''}` : `${service.duration}min`}</Text>
                              <View className="flex-row">
                                {svcProfs.slice(0, 3).map((prof, idx) => (
                                  <Image
                                    key={prof.id}
                                    source={{ uri: prof.avatar }}
                                    className="w-6 h-6 rounded-full border-2"
                                    style={{ borderColor: colors.backgroundCard, marginLeft: idx > 0 ? -8 : 0 }}
                                  />
                                ))}
                              </View>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text style={{ color: colors.primary }} className="font-bold text-lg">
                              R$ {service.price.toFixed(2)}
                            </Text>
                            <View className="mt-3">
                              <ArrowRight2 size={20} color={colors.textMuted}  variant="Outline" />
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
              <View className="h-6" />
            </ScrollView>
          </>
        )}

        {/* ─── PACKAGES TAB ─────────────────────────────────────────────── */}
        {activeTab === 'packages' && (
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            <Text className="text-gray-500 text-sm mb-4">
              {packages.length} pacote{packages.length !== 1 ? 's' : ''} disponíve{packages.length !== 1 ? 'is' : 'l'}
            </Text>

            {packages.map((pkg) => {
              const discount = getDiscountPercent(pkg);
              const pkgServices = services.filter(s => pkg.serviceIds.includes(s.id));
              return (
                <Pressable
                  key={pkg.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPackage(pkg);
                    setShowPackageDetail(true);
                  }}
                  className="mb-4 rounded-2xl overflow-hidden"
                  style={{ backgroundColor: colors.backgroundCard }}
                >
                  {/* Top accent bar */}
                  <LinearGradient
                    colors={[colors.primary + 'CC', colors.primary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: 4 }}
                  />

                  <View className="p-4">
                    {/* Name + discount badge */}
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-gray-900 font-bold text-base flex-1 mr-2">{pkg.name}</Text>
                      {discount > 0 && (
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.success + '20' }}>
                          <Text className="text-xs font-bold" style={{ color: colors.success }}>-{discount}%</Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{pkg.description}</Text>

                    {/* Service chips */}
                    <View className="flex-row flex-wrap gap-1.5 mb-3">
                      {pkgServices.map(s => (
                        <View key={s.id} className="flex-row items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.primary + '12' }}>
                          <Scissor size={10} color={colors.primary}  variant="Outline" />
                          <Text className="text-xs ml-1 font-medium" style={{ color: colors.primary }}>{s.name}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Footer */}
                    <View className="flex-row items-center justify-between pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <Clock size={13} color={colors.textMuted}  variant="Outline" />
                          <Text className="text-gray-500 text-xs ml-1">{pkg.validityDays}d validade</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Tag size={13} color={colors.textMuted}  variant="Outline" />
                          <Text className="text-gray-500 text-xs ml-1">{pkg.sessions} sessões</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        {discount > 0 && (
                          <View className="px-1.5 py-0.5 rounded-full mb-0.5" style={{ backgroundColor: colors.success + '20' }}>
                            <Text className="text-xs font-bold" style={{ color: colors.success }}>-{discount}%</Text>
                          </View>
                        )}
                        <Text className="font-bold text-base" style={{ color: colors.primary }}>
                          R$ {pkg.price.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            <View className="h-6" />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ═══════════════════ MODALS ═══════════════════════════════════════ */}

      {/* Add Service Modal */}
      <Modal
        visible={showAddServiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddServiceModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text className="text-gray-900 text-lg font-bold">Novo Serviço</Text>
            <Pressable onPress={() => setShowAddServiceModal(false)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
              <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
            {/* Image Picker */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Foto do serviço</Text>
            <Pressable
              onPress={pickServiceImage}
              className="mb-4 rounded-xl overflow-hidden items-center justify-center"
              style={{
                height: 120,
                backgroundColor: colors.backgroundCard,
                borderWidth: 1.5,
                borderColor: newImageUri ? colors.primary : colors.border,
                borderStyle: newImageUri ? 'solid' : 'dashed',
              }}
            >
              {newImageUri ? (
                <View className="w-full h-full">
                  <Image source={{ uri: newImageUri }} className="w-full h-full" resizeMode="cover" />
                  <View className="absolute bottom-2 right-2 w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Camera size={13} color="white" variant="Outline" />
                  </View>
                </View>
              ) : (
                <View className="items-center">
                  <Camera size={24} color={colors.textMuted} variant="Outline" />
                  <Text className="text-xs mt-1.5" style={{ color: colors.textMuted }}>Adicionar foto</Text>
                </View>
              )}
            </Pressable>

            <Text className="text-gray-700 text-sm font-medium mb-2">Nome do serviço *</Text>
            <TextInput
              value={newName} onChangeText={setNewName}
              placeholder="Ex: Corte Masculino" placeholderTextColor={colors.textMuted}
              className="rounded-xl px-4 py-3 text-gray-900 mb-4"
              style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}
            />

            <Text className="text-gray-700 text-sm font-medium mb-2">Descrição</Text>
            <TextInput
              value={newDescription} onChangeText={setNewDescription}
              placeholder="Descreva brevemente..." placeholderTextColor={colors.textMuted}
              multiline numberOfLines={3}
              className="rounded-xl px-4 py-3 text-gray-900 mb-4"
              style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }}
            />

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Preço (R$) *</Text>
                <View className="flex-row items-center rounded-xl px-4 py-3" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  <DollarCircle size={16} color={colors.textMuted}  variant="Outline" />
                  <TextInput value={newPrice} onChangeText={setNewPrice} placeholder="0,00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" className="flex-1 ml-2 text-gray-900" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Duração</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { value: '15', label: '15min' },
                    { value: '30', label: '30min' },
                    { value: '45', label: '45min' },
                    { value: '60', label: '1h' },
                    { value: '90', label: '1h30' },
                    { value: '120', label: '2h' },
                    { value: '150', label: '2h30' },
                    { value: '180', label: '3h' },
                    { value: '240', label: '4h' },
                  ].map(d => (
                    <Pressable key={d.value} onPress={() => setNewDuration(d.value)}
                      className="px-3 py-2 rounded-lg"
                      style={{ backgroundColor: newDuration === d.value ? colors.primary : colors.backgroundCard, borderWidth: 1, borderColor: newDuration === d.value ? colors.primary : colors.border }}>
                      <Text style={{ color: newDuration === d.value ? '#fff' : colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
                        {d.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <Text className="text-gray-700 text-sm font-medium mb-2">Categoria</Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {serviceCategories.map(cat => (
                <Pressable key={cat.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewCategory(newCategory === cat.id ? '' : cat.id); }}
                  className="px-4 py-2 rounded-full"
                  style={{ backgroundColor: newCategory === cat.id ? colors.primary : colors.backgroundCard, borderWidth: 1, borderColor: newCategory === cat.id ? colors.primary : colors.border }}
                >
                  <Text className="text-sm font-medium" style={{ color: newCategory === cat.id ? 'white' : colors.textMuted }}>{cat.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View className="px-5 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable onPress={handleAddService} disabled={uploadingImage} className="py-4 rounded-2xl items-center flex-row justify-center" style={{ backgroundColor: uploadingImage ? colors.primary + '80' : colors.primary }}>
              {uploadingImage && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
              <Text className="text-white font-bold text-base">{uploadingImage ? 'Enviando...' : 'Criar Serviço'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Box Modal */}
      <Modal
        visible={showAddPackageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddPackageModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text className="text-gray-900 text-lg font-bold">Novo Pacote</Text>
            <Pressable onPress={() => setShowAddPackageModal(false)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
              <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">

            <Text className="text-gray-700 text-sm font-medium mb-2">Nome do pacote *</Text>
            <TextInput
              value={pkgName} onChangeText={setPkgName}
              placeholder="Ex: Pacote Premium" placeholderTextColor={colors.textMuted}
              className="rounded-xl px-4 py-3 text-gray-900 mb-4"
              style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}
            />

            <Text className="text-gray-700 text-sm font-medium mb-2">Descrição</Text>
            <TextInput
              value={pkgDescription} onChangeText={setPkgDescription}
              placeholder="Descreva o pacote..." placeholderTextColor={colors.textMuted}
              multiline numberOfLines={3}
              className="rounded-xl px-4 py-3 text-gray-900 mb-4"
              style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border, minHeight: 70, textAlignVertical: 'top' }}
            />

            {/* Serviços incluídos */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Serviços incluídos *</Text>
            <View className="rounded-xl mb-4 overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
              {services.map((svc, idx) => {
                const selected = pkgSelectedServices.includes(svc.id);
                return (
                  <Pressable
                    key={svc.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPkgSelectedServices(prev =>
                        selected ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                      );
                    }}
                    className="flex-row items-center px-4 py-3"
                    style={idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : {}}
                  >
                    <View
                      className="w-6 h-6 rounded-md items-center justify-center mr-3"
                      style={{ backgroundColor: selected ? colors.primary : colors.surface, borderWidth: selected ? 0 : 1, borderColor: colors.border }}
                    >
                      {selected && <TickSquare size={13} color="white"  variant="Outline" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-sm font-medium">{svc.name}</Text>
                      <Text className="text-gray-400 text-xs">{svc.duration} min · R$ {svc.price.toFixed(2)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Preço */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Preço do pacote *</Text>
                <View className="flex-row items-center rounded-xl px-4 py-3" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  <DollarCircle size={16} color={colors.primary}  variant="Outline" />
                  <TextInput value={pkgPrice} onChangeText={setPkgPrice} placeholder="0,00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" className="flex-1 ml-2 text-gray-900" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Preço original</Text>
                <View className="flex-row items-center rounded-xl px-4 py-3" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  <DollarCircle size={16} color={colors.textMuted}  variant="Outline" />
                  <TextInput value={pkgOriginalPrice} onChangeText={setPkgOriginalPrice} placeholder="0,00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" className="flex-1 ml-2 text-gray-900" />
                </View>
              </View>
            </View>

            {/* Validade e sessões */}
            <View className="flex-row gap-3 mb-8">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Validade (dias)</Text>
                <View className="flex-row items-center rounded-xl px-4 py-3" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  <Clock size={16} color={colors.textMuted}  variant="Outline" />
                  <TextInput value={pkgValidity} onChangeText={setPkgValidity} placeholder="30" placeholderTextColor={colors.textMuted} keyboardType="number-pad" className="flex-1 ml-2 text-gray-900" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Nº de sessões</Text>
                <View className="flex-row items-center rounded-xl px-4 py-3" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  <Tag size={16} color={colors.textMuted}  variant="Outline" />
                  <TextInput value={pkgSessions} onChangeText={setPkgSessions} placeholder="1" placeholderTextColor={colors.textMuted} keyboardType="number-pad" className="flex-1 ml-2 text-gray-900" />
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="px-5 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable onPress={handleAddPackage} className="py-4 rounded-2xl items-center" style={{ backgroundColor: colors.primary }}>
              <Text className="text-white font-bold text-base">Criar Pacote</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Service Detail Modal */}
      {selectedService && (() => {
        const svc = selectedService;
        const svcProfs = employees.filter(p => p.services?.includes(svc.id));
        const categoryName = serviceCategories.find(c => c.id === svc.category)?.name ?? svc.category;
        const detailImageUrl = (svc as any).image_url as string | null;
        return (
          <Modal visible={showServiceDetail} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowServiceDetail(false)}>
            <View className="flex-1" style={{ backgroundColor: colors.background }}>
              {detailImageUrl ? (
                <View>
                  <Image
                    source={{ uri: detailImageUrl }}
                    style={{ width: '100%', height: 180 }}
                    resizeMode="cover"
                  />
                  <View className="absolute top-5 right-5">
                    <Pressable onPress={() => setShowServiceDetail(false)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                      <CloseCircle size={18} color="white" variant="Outline" />
                    </Pressable>
                  </View>
                  <View className="absolute bottom-0 left-0 right-0 px-5 pb-3 pt-8" style={{ backgroundColor: 'transparent' }}>
                    <View className="flex-row items-center">
                      <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
                        <Scissor size={12} color={colors.primary} variant="Outline" />
                        <Text className="text-xs font-bold ml-1.5" style={{ color: colors.primary }}>{categoryName}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <LinearGradient colors={[colors.primary + '22', colors.background]} style={{ paddingTop: 20, paddingBottom: 8 }}>
                  <View className="flex-row items-center justify-between px-5 mb-4">
                    <Text className="text-gray-900 text-lg font-bold">Detalhes do Serviço</Text>
                    <Pressable onPress={() => setShowServiceDetail(false)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
                      <CloseCircle size={18} color={colors.textMuted} variant="Outline" />
                    </Pressable>
                  </View>
                  <View className="flex-row items-center px-5 mb-2">
                    <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
                      <Scissor size={12} color={colors.primary} variant="Outline" />
                      <Text className="text-xs font-bold ml-1.5" style={{ color: colors.primary }}>{categoryName}</Text>
                    </View>
                  </View>
                </LinearGradient>
              )}

              <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                <View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: colors.backgroundCard }}>
                  <View className="flex-row items-center mb-3">
                    <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '15' }}>
                      <Scissor size={20} color={colors.primary}  variant="Outline" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 text-xs mb-0.5">Serviço</Text>
                      <Text className="text-gray-900 font-bold text-base">{svc.name}</Text>
                    </View>
                  </View>
                  {svc.description ? <Text className="text-gray-500 text-sm leading-5">{svc.description}</Text> : null}
                  <View className="flex-row mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                    <View className="flex-1 flex-row items-center">
                      <Clock size={14} color={colors.textMuted}  variant="Outline" />
                      <Text className="text-gray-500 text-sm ml-1">{svc.duration >= 60 ? `${Math.floor(svc.duration / 60)}h${svc.duration % 60 > 0 ? svc.duration % 60 + 'min' : ''}` : `${svc.duration}min`}</Text>
                    </View>
                    <View className="flex-1 flex-row items-center">
                      <DollarCircle size={14} color={colors.primary}  variant="Outline" />
                      <Text className="font-bold text-sm ml-1" style={{ color: colors.primary }}>R$ {svc.price.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                {svcProfs.length > 0 && (
                  <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.backgroundCard }}>
                    {svcProfs.map((prof, idx) => (
                      <View key={prof.id} className="flex-row items-center" style={[{ paddingVertical: 10 }, idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : {}]}>
                        <Image source={{ uri: prof.avatar }} className="w-11 h-11 rounded-xl mr-3" />
                        <View className="flex-1">
                          <Text className="text-gray-400 text-xs mb-0.5">Profissional</Text>
                          <Text className="text-gray-900 font-bold">{prof.name}</Text>
                          {prof.specialty ? <Text className="text-gray-500 text-sm">{prof.specialty}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View className="px-5 pb-8 pt-3 flex-row gap-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={() => handleDeleteService(svc)}
                  className="py-4 px-5 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: '#fee2e2' }}
                >
                  <Trash size={20} color="#ef4444" variant="Outline" />
                </Pressable>
                <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setShowServiceDetail(false); router.push(`/booking?serviceId=${svc.id}`); }}
                  className="flex-1 py-4 rounded-2xl items-center" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white font-bold text-base">Agendar este Serviço</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* Box Detail Modal */}
      {selectedPackage && (() => {
        const pkg = selectedPackage;
        const pkgServices = services.filter(s => pkg.serviceIds.includes(s.id));
        const discount = getDiscountPercent(pkg);
        return (
          <Modal visible={showPackageDetail} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPackageDetail(false)}>
            <View className="flex-1" style={{ backgroundColor: colors.background }}>
              <LinearGradient colors={[colors.primary + '22', colors.background]} style={{ paddingTop: 20, paddingBottom: 8 }}>
                <View className="flex-row items-center justify-between px-5 mb-4">
                  <Text className="text-gray-900 text-lg font-bold">Detalhes do Pacote</Text>
                  <Pressable onPress={() => setShowPackageDetail(false)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
                    <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-2 px-5 mb-2">
                  <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
                    <Box size={12} color={colors.primary}  variant="Outline" />
                    <Text className="text-xs font-bold ml-1.5" style={{ color: colors.primary }}>Pacote</Text>
                  </View>
                  {discount > 0 && (
                    <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.success + '20' }}>
                      <Tag size={12} color={colors.success}  variant="Outline" />
                      <Text className="text-xs font-bold ml-1.5" style={{ color: colors.success }}>{discount}% OFF</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

              <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

                {/* Box info */}
                <View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: colors.backgroundCard }}>
                  <View className="flex-row items-center mb-3">
                    <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '15' }}>
                      <Box size={20} color={colors.primary}  variant="Outline" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 text-xs mb-0.5">Pacote</Text>
                      <Text className="text-gray-900 font-bold text-base">{pkg.name}</Text>
                    </View>
                  </View>
                  {pkg.description ? <Text className="text-gray-500 text-sm leading-5 mb-3">{pkg.description}</Text> : null}

                  <View className="flex-row pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                    <View className="flex-1 items-center">
                      <Text className="text-gray-400 text-xs mb-1">Sessoes</Text>
                      <Text className="text-gray-900 font-bold text-base">{pkg.sessions}</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: colors.border }} />
                    <View className="flex-1 items-center">
                      <Text className="text-gray-400 text-xs mb-1">Validade</Text>
                      <Text className="text-gray-900 font-bold text-base">{pkg.validityDays} dias</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: colors.border }} />
                    <View className="flex-1 items-center">
                      <Text className="text-gray-400 text-xs mb-1">Valor</Text>
                      <Text className="font-bold text-base" style={{ color: colors.primary }}>R$ {pkg.price.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                {/* Services included */}
                <Text className="text-gray-700 text-sm font-semibold mb-2 mt-1">Servicos incluidos</Text>
                <View className="rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: colors.backgroundCard }}>
                  {pkgServices.map((svc, idx) => (
                    <View key={svc.id} className="flex-row items-center p-4"
                      style={idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : {}}>
                      <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '12' }}>
                        <Scissor size={16} color={colors.primary}  variant="Outline" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold text-sm">{svc.name}</Text>
                        <Text className="text-gray-400 text-xs mt-0.5">{svc.duration} min</Text>
                      </View>
                      <Text className="font-semibold text-sm" style={{ color: colors.primary }}>
                        R$ {svc.price.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

              </ScrollView>

              <View className="px-5 pb-8 pt-3 flex-row gap-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={() => handleDeletePackage(pkg)}
                  className="py-4 px-5 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: '#fee2e2' }}
                >
                  <Trash size={20} color="#ef4444" variant="Outline" />
                </Pressable>
                <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setShowPackageDetail(false); }}
                  className="flex-1 py-4 rounded-2xl items-center" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white font-bold text-base">Contratar Pacote</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        );
      })()}
    </View>
  );
}
