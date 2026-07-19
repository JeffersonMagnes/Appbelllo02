import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft2, Add, SearchNormal1, Box, Warning2, TrendUp, Edit, Trash, CloseCircle, Camera, DollarCircle, Tag, ScanBarcode, AddCircle } from 'iconsax-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/state/auth-store';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/lib/hooks/use-products';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/upload';

const DEFAULT_CATEGORIES = ['Cabelo', 'Barba', 'Skincare', 'Coloração', 'Tratamento', 'Acessórios', 'Outros'];

export default function ProductsScreen() {
  const router = useRouter();
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: products = [], isLoading } = useProducts(establishmentId ?? undefined);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<typeof products[0] | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSalePrice, setEditSalePrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  // Form fields
  const [newName, setNewName] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newMinStock, setNewMinStock] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newImageMime, setNewImageMime] = useState<string>('image/jpeg');
  const [newSellOnline, setNewSellOnline] = useState(false);
  const [editSellOnline, setEditSellOnline] = useState(false);
  const [editImageMime, setEditImageMime] = useState<string>('image/jpeg');

  // Extra images
  const [newExtraImages, setNewExtraImages] = useState<{ uri: string; mime: string }[]>([]);
  const [editExtraImages, setEditExtraImages] = useState<{ uri: string; mime: string }[]>([]);
  const [existingExtraImages, setExistingExtraImages] = useState<{ id: string; image_url: string }[]>([]);
  const [removedExtraIds, setRemovedExtraIds] = useState<string[]>([]);

  // Custom categories
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');
  const CATEGORIES = useMemo(() => {
    const fromProducts = (products || [])
      .map(p => p.category)
      .filter((c): c is string =>
        typeof c === 'string' && c.length > 0 && !DEFAULT_CATEGORIES.includes(c)
      );
    return [...DEFAULT_CATEGORIES, ...Array.from(new Set(fromProducts))];
  }, [products]);

  const saleNum = parseFloat(newSalePrice.replace(',', '.')) || 0;
  const costNum = parseFloat(newCostPrice.replace(',', '.')) || 0;
  const margin = saleNum > 0 ? (((saleNum - costNum) / saleNum) * 100).toFixed(0) : '0';

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const resetForm = () => {
    setNewName(''); setNewBarcode(''); setNewDescription('');
    setNewSalePrice(''); setNewCostPrice('');
    setNewStock(''); setNewMinStock('');
    setNewCategory(''); setNewImage(null); setNewImageMime('image/jpeg'); setNewSellOnline(false);
    setNewExtraImages([]); setShowNewCategoryInput(false); setNewCategoryText('');
  };

  const loadExtraImages = async (productId: string) => {
    const { data } = await (supabase as any).from('product_images').select('id,image_url').eq('product_id', productId).order('sort_order');
    setExistingExtraImages(data || []);
  };

  const uploadExtraImages = async (extras: { uri: string; mime: string }[], productId: string, startOrder: number) => {
    for (let i = 0; i < extras.length; i++) {
      const { uri, mime } = extras[i];
      const ext = mime.split('/')[1] ?? 'jpg';
      const filename = `product-extra-${Date.now()}-${i}.${ext}`;
      const uploaded = await uploadFile(uri, filename, mime);
      await (supabase as any).from('product_images').insert({ product_id: productId, image_url: uploaded.url, sort_order: startOrder + i });
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera para escanear códigos de barras.');
        return;
      }
    }
    setScanned(false);
    setShowScanner(true);
  };

  const handleBarcodeScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewBarcode(data);
    setShowScanner(false);
  };

  const pickImage = async (setImage: (uri: string) => void, setMime: (mime: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setMime(result.assets[0].mimeType ?? 'image/jpeg');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddProduct = async () => {
    if (!newName.trim()) { Alert.alert('Campo obrigatório', 'Informe o nome do produto.'); return; }
    if (!newSalePrice.trim()) { Alert.alert('Campo obrigatório', 'Informe o preço de venda.'); return; }
    if (!establishmentId || !isSupabaseConfigured()) {
      Alert.alert('Erro', 'Configure o Supabase para salvar produtos.');
      return;
    }
    // Passo 1: upload da imagem
    let imageUrl: string | null = null;
    if (newImage) {
      try {
        const ext = newImageMime.split('/')[1] ?? 'jpg';
        const filename = `product-${Date.now()}.${ext}`;
        const uploaded = await uploadFile(newImage, filename, newImageMime);
        imageUrl = uploaded.url;
      } catch (uploadErr: any) {
        Alert.alert('Erro no upload da imagem', uploadErr?.message ?? String(uploadErr));
        return;
      }
    }

    // Passo 2: salvar no banco
    try {
      const created = await createProduct.mutateAsync({
        establishment_id: establishmentId,
        name: newName.trim(),
        description: newDescription.trim() || null,
        price: saleNum,
        cost_price: costNum,
        stock: parseInt(newStock) || 0,
        min_stock: parseInt(newMinStock) || 5,
        category: newCategory || null,
        active: true,
        sell_online: newSellOnline,
        image_url: imageUrl,
      });
      if (newExtraImages.length > 0 && created?.id) {
        await uploadExtraImages(newExtraImages, created.id, 0);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Produto cadastrado!', `"${newName}" foi adicionado com sucesso.`);
      resetForm();
      setShowAddModal(false);
    } catch (dbErr: any) {
      Alert.alert('Erro ao salvar produto', dbErr?.message ?? String(dbErr));
    }
  };

  const openEdit = (product: typeof products[0]) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description ?? '');
    setEditSalePrice(String(product.price));
    setEditCostPrice(String(product.cost_price));
    setEditStock(String(product.stock));
    setEditMinStock(String(product.min_stock));
    setEditCategory(product.category ?? '');
    setEditSellOnline(product.sell_online ?? false);
    setEditImage(product.image_url ?? null);
    setEditExtraImages([]);
    setRemovedExtraIds([]);
    loadExtraImages(product.id);
    setShowEditModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || !establishmentId) return;
    try {
      let imageUrl: string | null = editImage;
      if (editImage && editImage !== editingProduct.image_url) {
        const ext = editImageMime.split('/')[1] ?? 'jpg';
        const filename = `product-${Date.now()}.${ext}`;
        const uploaded = await uploadFile(editImage, filename, editImageMime);
        imageUrl = uploaded.url;
      }
      await updateProduct.mutateAsync({
        id: editingProduct.id,
        establishmentId,
        name: editName.trim(),
        description: editDescription.trim() || null,
        price: parseFloat(editSalePrice.replace(',', '.')) || 0,
        cost_price: parseFloat(editCostPrice.replace(',', '.')) || 0,
        stock: parseInt(editStock) || 0,
        min_stock: parseInt(editMinStock) || 5,
        category: editCategory || null,
        sell_online: editSellOnline,
        image_url: imageUrl,
      });
      if (removedExtraIds.length > 0) {
        await (supabase as any).from('product_images').delete().in('id', removedExtraIds);
      }
      if (editExtraImages.length > 0) {
        await uploadExtraImages(editExtraImages, editingProduct.id, existingExtraImages.length);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
      setEditingProduct(null);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível salvar.');
    }
  };

  const handleDelete = (product: typeof products[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Excluir produto',
      `Deseja excluir "${product.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct.mutateAsync({ id: product.id, establishmentId: establishmentId! });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e: any) {
              Alert.alert('Erro', e?.message || 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  };

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock && p.active);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = showLowStock ? p.stock <= p.min_stock : true;
    return matchesSearch && matchesStock && p.active;
  });

  const groupedByCategory = CATEGORIES.reduce<Record<string, typeof filteredProducts>>((acc, cat) => {
    const items = filteredProducts.filter(p => p.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});
  const uncategorized = filteredProducts.filter(p => !p.category || !CATEGORIES.includes(p.category));
  if (uncategorized.length > 0) groupedByCategory['Sem categoria'] = uncategorized;

  return (
    <FeatureGate featureKey="estoque">
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.backgroundCard }}>
              <ArrowLeft2 size={24} color="#1C1C1E"  variant="Outline" />
            </Pressable>
            <Text className="text-gray-900 text-xl font-bold">Produtos & Estoque</Text>
          </View>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddModal(true); }}
            className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
            <Add size={22} color="white"  variant="Outline" />
          </Pressable>
        </View>

        {/* Search */}
        <View className="px-5 mb-4">
          <View className="flex-row items-center px-4 py-3 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
            <SearchNormal1 size={20} color={colors.textMuted}  variant="Outline" />
            <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar produto..."
              placeholderTextColor={colors.textMuted} className="flex-1 ml-3 text-gray-900" />
          </View>
        </View>

        {/* Stats */}
        <View className="px-5 mb-4">
          <View className="flex-row">
            <View className="flex-1 mr-2 p-3 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-row items-center mb-1"><Box size={14} color={colors.primary}  variant="Outline" /><Text className="text-gray-500 text-xs ml-1">Produtos</Text></View>
              <Text style={{ color: colors.primary }} className="text-lg font-bold">{products.filter(p => p.active).length}</Text>
            </View>
            <View className="flex-1 mx-2 p-3 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-row items-center mb-1"><TrendUp size={14} color={colors.success}  variant="Outline" /><Text className="text-gray-500 text-xs ml-1">Valor estoque</Text></View>
              <Text style={{ color: colors.success }} className="text-lg font-bold">{formatCurrency(totalValue)}</Text>
            </View>
            <View className="flex-1 ml-2 p-3 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
              <View className="flex-row items-center mb-1"><Warning2 size={14} color={colors.warning}  variant="Outline" /><Text className="text-gray-500 text-xs ml-1">Estoque baixo</Text></View>
              <Text style={{ color: colors.warning }} className="text-lg font-bold">{lowStockProducts.length}</Text>
            </View>
          </View>
        </View>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <View className="px-5 mb-4">
            <Pressable onPress={() => setShowLowStock(!showLowStock)}
              className="flex-row items-center p-3 rounded-xl"
              style={{ backgroundColor: showLowStock ? colors.warning + '30' : colors.warning + '15', borderWidth: showLowStock ? 1 : 0, borderColor: colors.warning }}>
              <Warning2 size={18} color={colors.warning}  variant="Outline" />
              <Text className="text-gray-700 text-sm ml-2 flex-1">
                {showLowStock ? 'Mostrando produtos com estoque baixo' : `${lowStockProducts.length} produto(s) com estoque baixo`}
              </Text>
              <Text style={{ color: colors.warning }} className="text-sm font-medium">{showLowStock ? 'Ver todos' : 'Filtrar'}</Text>
            </Pressable>
          </View>
        )}

        {/* Products TextalignLeft */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="items-center py-12"><ActivityIndicator color={colors.primary} /></View>
          ) : filteredProducts.length === 0 ? (
            <View className="items-center py-12">
              <Box size={40} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-400 mt-3">Nenhum produto cadastrado</Text>
            </View>
          ) : (
            Object.entries(groupedByCategory).map(([category, items]) => (
              <View key={category} className="mb-6">
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">{category}</Text>
                {items.map(product => {
                  const isLow = product.stock <= product.min_stock;
                  const profitMargin = product.price > 0 ? (((product.price - product.cost_price) / product.price) * 100).toFixed(0) : '0';
                  return (
                    <View key={product.id} className="mb-2 rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
                      <View className="p-4">
                        <View className="flex-row items-start justify-between">
                          {product.image_url && (
                            <Image source={{ uri: product.image_url }} style={{ width: 52, height: 52, borderRadius: 10, marginRight: 12 }} resizeMode="cover" />
                          )}
                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text className="text-gray-900 font-semibold">{product.name}</Text>
                              {isLow && (
                                <View className="ml-2 px-2 py-0.5 rounded" style={{ backgroundColor: colors.warning + '20' }}>
                                  <Text style={{ color: colors.warning }} className="text-xs">Baixo</Text>
                                </View>
                              )}
                            </View>
                            {product.description && <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>{product.description}</Text>}
                          </View>
                          <View className="flex-row ml-2">
                            <Pressable onPress={() => openEdit(product)} className="w-8 h-8 rounded-lg items-center justify-center mr-1" style={{ backgroundColor: colors.primary + '15' }}>
                              <Edit size={16} color={colors.primary} />
                            </Pressable>
                            <Pressable onPress={() => handleDelete(product)} className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: colors.error + '20' }}>
                              <Trash size={16} color={colors.error}  variant="Outline" />
                            </Pressable>
                          </View>
                        </View>
                        <View className="flex-row items-center mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                          <View className="flex-1"><Text className="text-gray-400 text-xs">Estoque</Text><Text className="font-bold" style={{ color: isLow ? colors.warning : '#1C1C1E' }}>{product.stock} un</Text></View>
                          <View className="flex-1"><Text className="text-gray-400 text-xs">Custo</Text><Text className="text-gray-700">{formatCurrency(product.cost_price)}</Text></View>
                          <View className="flex-1"><Text className="text-gray-400 text-xs">Venda</Text><Text style={{ color: colors.primary }} className="font-bold">{formatCurrency(product.price)}</Text></View>
                          <View className="items-end"><Text className="text-gray-400 text-xs">Margem</Text><Text style={{ color: colors.success }} className="font-bold">{profitMargin}%</Text></View>
                        </View>
                        {/* Vender Online toggle */}
                        <View className="flex-row items-center justify-between mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                          <Text className="text-gray-500 text-xs">Vender online</Text>
                          <Pressable
                            onPress={async () => {
                              const newVal = !product.sell_online;
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              await updateProduct.mutateAsync({ id: product.id, establishmentId: establishmentId!, sell_online: newVal } as any);
                            }}
                            style={{ width: 40, height: 22, borderRadius: 11, padding: 2, backgroundColor: product.sell_online ? colors.primary : colors.border, justifyContent: 'center' }}
                          >
                            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'white', alignSelf: product.sell_online ? 'flex-end' : 'flex-start' }} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>

      {/* Barcode Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" onRequestClose={() => setShowScanner(false)}>
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="text-white text-lg font-bold">Escanear código de barras</Text>
              <Pressable onPress={() => setShowScanner(false)} className="w-9 h-9 rounded-full items-center justify-center bg-white/20">
                <CloseCircle size={18} color="white"  variant="Outline" />
              </Pressable>
            </View>
            <View className="flex-1 items-center justify-center">
              <CameraView
                style={{ width: '100%', height: '100%' }}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'] }}
              />
              {/* Viewfinder overlay */}
              <View style={{ position: 'absolute', width: 260, height: 160, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, backgroundColor: 'transparent' }} />
              <Text style={{ position: 'absolute', bottom: 80, color: 'white', fontSize: 14, textAlign: 'center' }}>
                Aponte para o código de barras do produto
              </Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Add Product Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text className="text-gray-900 text-lg font-bold">Novo Produto</Text>
            <Pressable onPress={() => { setShowAddModal(false); resetForm(); }} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
              <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Foto */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Foto do produto</Text>
            <Pressable onPress={() => pickImage(setNewImage, setNewImageMime)} className="mb-5 rounded-2xl overflow-hidden items-center justify-center"
              style={{ height: 120, backgroundColor: colors.backgroundCard, borderWidth: 1.5, borderColor: newImage ? colors.primary : colors.border, borderStyle: 'dashed' }}>
              {newImage ? (
                <View className="w-full h-full">
                  <Image source={{ uri: newImage }} className="w-full h-full" resizeMode="cover" />
                  <View className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full flex-row items-center" style={{ backgroundColor: colors.primary }}>
                    <Camera size={13} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Alterar</Text>
                  </View>
                </View>
              ) : (
                <View className="items-center">
                  <Camera size={24} color={colors.textMuted} />
                  <Text className="text-gray-500 text-sm mt-2">Adicionar foto</Text>
                </View>
              )}
            </Pressable>

            {/* Código de barras */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Código de barras</Text>
            <View className="flex-row gap-2 mb-4">
              <TextInput value={newBarcode} onChangeText={setNewBarcode} placeholder="Ex: 7891234567890"
                placeholderTextColor={colors.textMuted} keyboardType="number-pad"
                className="flex-1 rounded-xl px-4 py-3 text-gray-900"
                style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }} />
              <Pressable onPress={openScanner} className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary }}>
                <ScanBarcode size={22} color="white" />
              </Pressable>
            </View>

            {/* Nome */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Nome do produto *</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="Ex: Shampoo Anti-Caspa"
              placeholderTextColor={colors.textMuted}
              className="rounded-xl px-4 py-3 text-gray-900 mb-4"
              style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }} />

            {/* Descrição */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Descrição</Text>
            <TextInput value={newDescription} onChangeText={setNewDescription} placeholder="Descreva o produto..."
              placeholderTextColor={colors.textMuted} multiline numberOfLines={3}
              className="rounded-xl px-4 py-3 text-gray-900 mb-4"
              style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }} />

            {/* Preços */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Preço de venda *</Text>
                <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  <DollarCircle size={15} color={colors.primary}  variant="Outline" />
                  <TextInput value={newSalePrice} onChangeText={setNewSalePrice} placeholder="0,00"
                    placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" className="flex-1 ml-1 text-gray-900" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Preço de custo</Text>
                <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  <DollarCircle size={15} color={colors.textMuted}  variant="Outline" />
                  <TextInput value={newCostPrice} onChangeText={setNewCostPrice} placeholder="0,00"
                    placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" className="flex-1 ml-1 text-gray-900" />
                </View>
              </View>
            </View>

            {saleNum > 0 && (
              <View className="flex-row items-center px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: colors.success + '12' }}>
                <TrendUp size={16} color={colors.success}  variant="Outline" />
                <Text className="text-sm ml-2" style={{ color: colors.success }}>
                  Margem: <Text className="font-bold">{margin}%</Text>
                  {costNum > 0 && <Text> · Lucro: {formatCurrency(saleNum - costNum)}</Text>}
                </Text>
              </View>
            )}

            {/* Estoque */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Estoque inicial</Text>
                <TextInput value={newStock} onChangeText={setNewStock} placeholder="0"
                  placeholderTextColor={colors.textMuted} keyboardType="number-pad"
                  className="rounded-xl px-4 py-3 text-gray-900"
                  style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Estoque mínimo</Text>
                <TextInput value={newMinStock} onChangeText={setNewMinStock} placeholder="5"
                  placeholderTextColor={colors.textMuted} keyboardType="number-pad"
                  className="rounded-xl px-4 py-3 text-gray-900"
                  style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }} />
              </View>
            </View>

            {/* Fotos adicionais */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Fotos adicionais</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {newExtraImages.map((img, i) => (
                <View key={i} style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden' }}>
                  <Image source={{ uri: img.uri }} style={{ width: 64, height: 64 }} resizeMode="cover" />
                  <Pressable onPress={() => setNewExtraImages(p => p.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
                if (!result.canceled) {
                  const imgs = result.assets.map(a => ({ uri: a.uri, mime: a.mimeType ?? 'image/jpeg' }));
                  setNewExtraImages(p => [...p, ...imgs]);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
                style={{ width: 64, height: 64, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundCard }}>
                <AddCircle size={22} color={colors.textMuted} variant="Outline" />
              </Pressable>
            </View>

            {/* Categoria */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Categoria</Text>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {CATEGORIES.map(cat => (
                <Pressable key={cat} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewCategory(newCategory === cat ? '' : cat); }}
                  className="px-4 py-2 rounded-full flex-row items-center"
                  style={{ backgroundColor: newCategory === cat ? colors.primary : colors.backgroundCard, borderWidth: 1, borderColor: newCategory === cat ? colors.primary : colors.border }}>
                  <Tag size={12} color={newCategory === cat ? 'white' : colors.textMuted} style={{ marginRight: 4 }} variant="Outline" />
                  <Text className="text-sm font-medium" style={{ color: newCategory === cat ? 'white' : colors.textMuted }}>{cat}</Text>
                </Pressable>
              ))}
              {showNewCategoryInput ? (
                <View className="flex-row items-center gap-1">
                  <TextInput value={newCategoryText} onChangeText={setNewCategoryText} placeholder="Nova categoria..."
                    autoFocus placeholderTextColor={colors.textMuted}
                    style={{ borderWidth: 1, borderColor: colors.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, minWidth: 120, color: '#1C1C1E' }}
                    onSubmitEditing={() => { if (newCategoryText.trim()) { setNewCategory(newCategoryText.trim()); } setShowNewCategoryInput(false); setNewCategoryText(''); }} />
                  <Pressable onPress={() => { if (newCategoryText.trim()) { setNewCategory(newCategoryText.trim()); } setShowNewCategoryInput(false); setNewCategoryText(''); }}
                    style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.primary }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>OK</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setShowNewCategoryInput(true)}
                  className="px-4 py-2 rounded-full flex-row items-center"
                  style={{ borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.backgroundCard }}>
                  <Text className="text-sm font-medium" style={{ color: colors.textMuted }}>+ Nova</Text>
                </Pressable>
              )}
            </View>
            <View className="mb-8" />
          </ScrollView>

          {/* Vender online toggle no modal de criação */}
          <View className="px-5 py-3 flex-row items-center justify-between" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <View>
              <Text className="text-gray-700 text-sm font-medium">Vender online</Text>
              <Text className="text-gray-400 text-xs">Exibir no catálogo público</Text>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewSellOnline(!newSellOnline); }}
              style={{ width: 44, height: 24, borderRadius: 12, padding: 2, backgroundColor: newSellOnline ? colors.primary : colors.border }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', alignSelf: newSellOnline ? 'flex-end' : 'flex-start' }} />
            </Pressable>
          </View>

          <View className="px-5 pb-8 pt-3">
            <Pressable onPress={handleAddProduct} disabled={createProduct.isPending}
              className="py-4 rounded-2xl items-center flex-row justify-center gap-2"
              style={{ backgroundColor: colors.primary, opacity: createProduct.isPending ? 0.7 : 1 }}>
              {createProduct.isPending
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold text-base">Cadastrar Produto</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Product Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text className="text-gray-900 text-lg font-bold">Editar Produto</Text>
            <Pressable onPress={() => setShowEditModal(false)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
              <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Foto */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Foto do produto</Text>
            <Pressable onPress={() => pickImage(setEditImage, setEditImageMime)} className="mb-5 rounded-2xl overflow-hidden items-center justify-center"
              style={{ height: 120, backgroundColor: colors.backgroundCard, borderWidth: 1.5, borderColor: editImage ? colors.primary : colors.border, borderStyle: 'dashed' }}>
              {editImage ? (
                <View className="w-full h-full">
                  <Image source={{ uri: editImage }} className="w-full h-full" resizeMode="cover" />
                  <View className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full flex-row items-center" style={{ backgroundColor: colors.primary }}>
                    <Camera size={13} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Alterar</Text>
                  </View>
                </View>
              ) : (
                <View className="items-center">
                  <Camera size={24} color={colors.textMuted} />
                  <Text className="text-gray-500 text-sm mt-2">Adicionar foto</Text>
                </View>
              )}
            </Pressable>

            <Text className="text-gray-700 text-sm font-medium mb-2">Nome *</Text>
            <TextInput value={editName} onChangeText={setEditName}
              placeholder="Nome do produto" placeholderTextColor={colors.textMuted}
              className="rounded-xl px-4 py-3 text-gray-900 mb-4"
              style={{ backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: colors.border }} />

            <Text className="text-gray-700 text-sm font-medium mb-2">Descrição</Text>
            <TextInput value={editDescription} onChangeText={setEditDescription}
              placeholder="Descrição..." placeholderTextColor={colors.textMuted}
              multiline numberOfLines={3}
              className="rounded-xl px-4 py-3 text-gray-900 mb-4"
              style={{ backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }} />

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Preço de venda *</Text>
                <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: colors.border }}>
                  <DollarCircle size={15} color={colors.primary}  variant="Outline" />
                  <TextInput value={editSalePrice} onChangeText={setEditSalePrice}
                    placeholder="0,00" placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad" className="flex-1 ml-1 text-gray-900" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Preço de custo</Text>
                <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: colors.border }}>
                  <DollarCircle size={15} color={colors.textMuted}  variant="Outline" />
                  <TextInput value={editCostPrice} onChangeText={setEditCostPrice}
                    placeholder="0,00" placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad" className="flex-1 ml-1 text-gray-900" />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Estoque</Text>
                <TextInput value={editStock} onChangeText={setEditStock}
                  placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="number-pad"
                  className="rounded-xl px-4 py-3 text-gray-900"
                  style={{ backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: colors.border }} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">Estoque mínimo</Text>
                <TextInput value={editMinStock} onChangeText={setEditMinStock}
                  placeholder="5" placeholderTextColor={colors.textMuted} keyboardType="number-pad"
                  className="rounded-xl px-4 py-3 text-gray-900"
                  style={{ backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: colors.border }} />
              </View>
            </View>

            {/* Fotos adicionais no edit */}
            <Text className="text-gray-700 text-sm font-medium mb-2">Fotos adicionais</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {existingExtraImages.filter(e => !removedExtraIds.includes(e.id)).map(img => (
                <View key={img.id} style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden' }}>
                  <Image source={{ uri: img.image_url }} style={{ width: 64, height: 64 }} resizeMode="cover" />
                  <Pressable onPress={() => setRemovedExtraIds(p => [...p, img.id])}
                    style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>×</Text>
                  </Pressable>
                </View>
              ))}
              {editExtraImages.map((img, i) => (
                <View key={`new-${i}`} style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden' }}>
                  <Image source={{ uri: img.uri }} style={{ width: 64, height: 64 }} resizeMode="cover" />
                  <Pressable onPress={() => setEditExtraImages(p => p.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
                if (!result.canceled) {
                  const imgs = result.assets.map(a => ({ uri: a.uri, mime: a.mimeType ?? 'image/jpeg' }));
                  setEditExtraImages(p => [...p, ...imgs]);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
                style={{ width: 64, height: 64, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
                <AddCircle size={22} color={colors.textMuted} variant="Outline" />
              </Pressable>
            </View>

            <Text className="text-gray-700 text-sm font-medium mb-2">Categoria</Text>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {CATEGORIES.map(cat => (
                <Pressable key={cat} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditCategory(editCategory === cat ? '' : cat); }}
                  className="px-4 py-2 rounded-full flex-row items-center"
                  style={{ backgroundColor: editCategory === cat ? colors.primary : '#F3F4F6', borderWidth: 1, borderColor: editCategory === cat ? colors.primary : colors.border }}>
                  <Tag size={12} color={editCategory === cat ? 'white' : colors.textMuted} style={{ marginRight: 4 }} variant="Outline" />
                  <Text className="text-sm font-medium" style={{ color: editCategory === cat ? 'white' : colors.textMuted }}>{cat}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setShowNewCategoryInput(true)}
                className="px-4 py-2 rounded-full"
                style={{ borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: '#F3F4F6' }}>
                <Text className="text-sm font-medium" style={{ color: colors.textMuted }}>+ Nova</Text>
              </Pressable>
            </View>
            <View className="mb-8" />
          </ScrollView>

          {/* Vender online toggle no modal de edição */}
          <View className="px-5 py-3 flex-row items-center justify-between" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <View>
              <Text className="text-gray-700 text-sm font-medium">Vender online</Text>
              <Text className="text-gray-400 text-xs">Exibir no catálogo público</Text>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditSellOnline(!editSellOnline); }}
              style={{ width: 44, height: 24, borderRadius: 12, padding: 2, backgroundColor: editSellOnline ? colors.primary : colors.border }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', alignSelf: editSellOnline ? 'flex-end' : 'flex-start' }} />
            </Pressable>
          </View>

          <View className="px-5 pb-8 pt-3">
            <Pressable onPress={handleSaveEdit} disabled={updateProduct.isPending}
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: colors.primary, opacity: updateProduct.isPending ? 0.7 : 1 }}>
              {updateProduct.isPending
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold text-base">Salvar alterações</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
    </FeatureGate>
  );
}
