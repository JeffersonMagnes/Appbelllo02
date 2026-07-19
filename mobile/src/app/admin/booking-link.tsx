import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Link2, Copy, Share as ShareIcon, Eye, Edit,
  TickSquare, Global, MessageCircle, ExportSquare, Colorfilter,
  Clock, Calendar, Profile2User, ImportCircle, Camera,
  Trash, ArrowUp2, ArrowDown2, Add, TickCircle, Instagram, Whatsapp, Location,
} from 'iconsax-react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';
import { ensureEstablishment } from '@/lib/hooks/use-establishment';
import { uploadFile } from '@/lib/upload';

interface CustomLink { title: string; url: string; active: boolean; icon?: string; }

export default function BookingLinkScreen() {
  const router = useRouter();
  const currentUser = useAuthStore(s => s.currentUser);

  // Link state
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [estName, setEstName] = useState('');
  const [estId, setEstId] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [tempSlug, setTempSlug] = useState('');
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  // Profile state
  const [bio, setBio] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#5333ED');
  const [secondaryColor, setSecondaryColor] = useState('#0BBDB6');
  const [links, setLinks] = useState<CustomLink[]>([]);

  const COLOR_OPTIONS = ['#5333ED','#0BBDB6','#FF6B6B','#FF9F43','#26de81','#45aaf2','#fd9644','#a55eea'];

  // UI state
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchEstablishment() {
      if (!currentUser?.id) { setLoading(false); return; }

      const id = await ensureEstablishment(currentUser.id, currentUser.name ?? 'Meu Estabelecimento');
      if (!id) { setLoading(false); return; }

      const { data } = await supabase
        .from('establishments')
        .select('id, name, slug, active, bio, logo_url, banner_url, primary_color, secondary_color, custom_links')
        .eq('id', id)
        .single();

      if (data) {
        const d = data as any;
        setEstId(d.id);
        setEstName(d.name ?? '');
        const slug = d.slug ?? '';
        setCustomSlug(slug);
        setTempSlug(slug);
        setBookingEnabled(d.active ?? true);
        setBio(d.bio ?? '');
        setBannerUrl(d.banner_url ?? '');
        setLogoUrl(d.logo_url ?? '');
        if (d.primary_color) setPrimaryColor(d.primary_color);
        if (d.secondary_color) setSecondaryColor(d.secondary_color);
        setLinks(Array.isArray(d.custom_links) ? d.custom_links : []);
      }
      setLoading(false);
    }
    fetchEstablishment();
  }, [currentUser?.id]);

  const baseUrl = 'appbello-portal.netlify.app/agendar';
  const fullUrl = customSlug ? `${baseUrl}/${customSlug}` : '';
  const fullUrlWithProtocol = customSlug ? `https://${baseUrl}/${customSlug}` : '';

  const handleBack = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(fullUrlWithProtocol);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: `Agende seu horário na ${estName}!\n\n${fullUrlWithProtocol}`, title: `Agendar - ${estName}` });
    } catch {}
  };

  const handleShareWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = encodeURIComponent(`Agende seu horário na ${estName}!\n\n${fullUrlWithProtocol}`);
    Alert.alert('WhatsApp', `Mensagem preparada:\n\n${decodeURIComponent(message)}`);
  };

  const handleShareInstagram = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Compartilhar no Instagram', 'Copie o link e adicione à sua bio ou stories!', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Copiar link', onPress: handleCopyLink },
    ]);
  };

  const handleSaveSlug = async () => {
    const sanitized = tempSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    if (sanitized.length < 3) { Alert.alert('Erro', 'O link deve ter pelo menos 3 caracteres'); return; }
    setSavingSlug(true);
    const { error } = await supabase
      .from('establishments')
      .update({ slug: sanitized } as any)
      .eq('id', estId);
    setSavingSlug(false);
    if (error) { Alert.alert('Erro', 'Não foi possível salvar o link. Tente novamente.'); return; }
    setCustomSlug(sanitized);
    setIsEditingSlug(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleBooking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newVal = !bookingEnabled;
    setBookingEnabled(newVal);
    if (estId) {
      await supabase.from('establishments').update({ booking_enabled: newVal } as any).eq('id', estId);
    }
  };

  // Profile handlers
  const pickImage = async (onPick: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPick(result.assets[0].uri);
    }
  };

  const addLink = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLinks(l => [...l, { title: '', url: '', active: true, icon: 'link' }]);
  };
  const removeLink = (i: number) => setLinks(l => l.filter((_, j) => j !== i));
  const updateLink = (i: number, field: keyof CustomLink, val: string | boolean) =>
    setLinks(l => l.map((x, j) => j === i ? { ...x, [field]: val } : x));
  const moveLink = (i: number, dir: -1 | 1) => {
    setLinks(l => {
      if (i + dir < 0 || i + dir >= l.length) return l;
      const n = [...l]; [n[i], n[i + dir]] = [n[i + dir], n[i]]; return n;
    });
  };

  const handleSaveProfile = async () => {
    if (!estId || !isSupabaseConfigured()) return;
    setSavingProfile(true);
    try {
      let finalBanner = bannerUrl;
      let finalLogo = logoUrl;

      if (bannerUri) {
        const ext = bannerUri.split('.').pop() ?? 'jpg';
        const up = await uploadFile(bannerUri, `banner-${Date.now()}.${ext}`, 'image/jpeg');
        finalBanner = up.url;
      }
      if (logoUri) {
        const ext = logoUri.split('.').pop() ?? 'jpg';
        const up = await uploadFile(logoUri, `logo-${Date.now()}.${ext}`, 'image/jpeg');
        finalLogo = up.url;
      }

      const { error } = await (supabase as any).from('establishments').update({
        bio: bio.trim() || null,
        logo_url: finalLogo || null,
        banner_url: finalBanner || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        custom_links: links,
      }).eq('id', estId);

      if (error) throw error;
      setBannerUrl(finalBanner); setBannerUri(null);
      setLogoUrl(finalLogo); setLogoUri(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message || 'Tente novamente.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const previewBanner = bannerUri || bannerUrl;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary + '18', colors.background]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} variant="Outline" />
          </Pressable>
          <Text className="text-gray-900 font-bold text-lg">Link & Perfil</Text>
          <View className="w-10" />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

            {/* Aviso se slug não configurado */}
            {!customSlug && (
              <View className="mx-5 mb-4 p-4 rounded-2xl" style={{ backgroundColor: colors.warning + '20' }}>
                <Text className="font-semibold text-sm" style={{ color: colors.warning }}>Link não configurado</Text>
                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  Defina um link personalizado abaixo para que seus clientes possam agendar.
                </Text>
              </View>
            )}

            {/* ── LINK CARD ─────────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.duration(400)} className="px-5 mb-5">
              <View className="rounded-2xl p-5" style={{ backgroundColor: colors.backgroundCard }}>
                {/* Status Toggle */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: bookingEnabled ? colors.success : colors.error }} />
                    <Text className="text-gray-900 font-medium">
                      {bookingEnabled ? 'Agendamento ativo' : 'Agendamento desativado'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={toggleBooking}
                    className="w-12 h-7 rounded-full justify-center px-1"
                    style={{ backgroundColor: bookingEnabled ? colors.success : colors.surface }}
                  >
                    <Animated.View
                      className="w-5 h-5 rounded-full bg-white"
                      style={{ alignSelf: bookingEnabled ? 'flex-end' : 'flex-start' }}
                    />
                  </Pressable>
                </View>

                {/* URL Display */}
                <View className="mb-4">
                  <Text className="text-gray-500 text-xs mb-1">Seu link personalizado</Text>
                  <Text className="text-gray-400 text-xs mb-2" numberOfLines={1}>{baseUrl}/</Text>
                  {isEditingSlug ? (
                    <View>
                      <View className="flex-row items-center rounded-xl px-4 py-3 mb-2" style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary }}>
                        <Link2 size={16} color={colors.primary} variant="Outline" />
                        <TextInput
                          value={tempSlug}
                          onChangeText={setTempSlug}
                          style={{ flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginLeft: 8 }}
                          autoFocus
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholder="meu-salao"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                      <View className="flex-row gap-2">
                        <Pressable onPress={() => { setTempSlug(customSlug); setIsEditingSlug(false); }} className="flex-1 h-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.surface }}>
                          <Text className="font-medium text-sm" style={{ color: colors.textSecondary }}>Cancelar</Text>
                        </Pressable>
                        <Pressable onPress={handleSaveSlug} disabled={savingSlug} className="flex-1 h-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.success, opacity: savingSlug ? 0.6 : 1 }}>
                          {savingSlug ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold text-sm">Salvar</Text>}
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsEditingSlug(true); }}
                      className="flex-row items-center justify-between rounded-xl px-4 py-3"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <View className="flex-row items-center flex-1">
                        <Link2 size={18} color={colors.primary} variant="Outline" />
                        <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 16, marginLeft: 8 }} numberOfLines={1}>
                          {customSlug || 'Defina seu link'}
                        </Text>
                      </View>
                      <Edit size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <Pressable onPress={handleCopyLink} className="flex-1 flex-row items-center justify-center py-3 rounded-xl" style={{ backgroundColor: copied ? colors.success : colors.primary }}>
                    {copied ? <><TickSquare size={18} color="#fff" variant="Outline" /><Text className="text-white font-semibold ml-2">Copiado!</Text></> : <><Copy size={18} color="#fff" variant="Outline" /><Text className="text-white font-semibold ml-2">Copiar</Text></>}
                  </Pressable>
                  <Pressable onPress={handleShare} className="flex-1 flex-row items-center justify-center py-3 rounded-xl" style={{ backgroundColor: colors.secondary }}>
                    <ShareIcon size={18} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Compartilhar</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>

            {/* ── PERFIL PÚBLICO ─────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)} className="px-5 mb-5">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3 ml-1">Perfil público</Text>

              {/* Banner */}
              <View className="rounded-2xl overflow-hidden mb-3" style={{ backgroundColor: colors.backgroundCard }}>
                <Pressable onPress={() => pickImage(uri => setBannerUri(uri))}
                  className="overflow-hidden"
                  style={{ height: 120, backgroundColor: colors.surface }}>
                  {previewBanner
                    ? <Image source={{ uri: previewBanner }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    : <View className="flex-1 items-center justify-center">
                        <Camera size={28} color={colors.textMuted} variant="Outline" />
                        <Text className="text-gray-400 text-sm mt-1">Toque para adicionar banner</Text>
                        <Text className="text-gray-300 text-xs">Recomendado: 1200×400px</Text>
                      </View>
                  }
                </Pressable>

                {/* Logo + Nome */}
                <View className="flex-row items-center p-4">
                  <Pressable onPress={() => pickImage(uri => setLogoUri(uri))}
                    className="w-16 h-16 rounded-2xl items-center justify-center overflow-hidden mr-4" style={{ backgroundColor: colors.primary + '20' }}>
                    {(logoUri || logoUrl)
                      ? <Image source={{ uri: logoUri || logoUrl }} style={{ width: 64, height: 64 }} resizeMode="cover" />
                      : <Camera size={24} color={colors.primary} variant="Outline" />
                    }
                  </Pressable>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold">{estName}</Text>
                    {customSlug ? <Text className="text-gray-400 text-xs">/p/{customSlug}</Text> : null}
                    {(logoUri || logoUrl) && <Text style={{ color: colors.success }} className="text-xs mt-1">✓ Logo configurada</Text>}
                  </View>
                </View>
              </View>

              {/* Bio */}
              <View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: colors.backgroundCard }}>
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={t => setBio(t.slice(0, 160))}
                  placeholder="Descreva seu estabelecimento em poucas palavras..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  maxLength={160}
                  className="text-gray-700 text-sm"
                  style={{ textAlignVertical: 'top', minHeight: 72 }}
                />
                <Text className="text-right text-gray-400 text-xs mt-2">{bio.length}/160</Text>
              </View>

              {/* Cores */}
              <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.backgroundCard }}>
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">Cor principal</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {COLOR_OPTIONS.map(c => (
                    <Pressable
                      key={`p-${c}`}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPrimaryColor(c); }}
                      style={{
                        width: 36, height: 36, borderRadius: 12, backgroundColor: c,
                        borderWidth: primaryColor === c ? 3 : 0,
                        borderColor: '#fff',
                        shadowColor: primaryColor === c ? c : 'transparent',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: primaryColor === c ? 0.5 : 0,
                        shadowRadius: 4,
                      }}
                    />
                  ))}
                </View>
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mt-4 mb-3">Cor secundária</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {COLOR_OPTIONS.map(c => (
                    <Pressable
                      key={`s-${c}`}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSecondaryColor(c); }}
                      style={{
                        width: 36, height: 36, borderRadius: 12, backgroundColor: c,
                        borderWidth: secondaryColor === c ? 3 : 0,
                        borderColor: '#fff',
                        shadowColor: secondaryColor === c ? c : 'transparent',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: secondaryColor === c ? 0.5 : 0,
                        shadowRadius: 4,
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* Links personalizados */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Links personalizados</Text>
                  <Pressable onPress={addLink} className="flex-row items-center px-3 py-1.5 rounded-xl" style={{ backgroundColor: colors.primary }}>
                    <Add size={14} color="white" variant="Outline" />
                    <Text className="text-white text-xs font-bold ml-1">Adicionar</Text>
                  </Pressable>
                </View>

                {links.length === 0 ? (
                  <View className="p-6 items-center" style={{ borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: 16 }}>
                    <Link2 size={28} color={colors.textMuted} variant="Outline" />
                    <Text className="text-gray-400 text-sm mt-2">Nenhum link ainda</Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {links.map((lk, i) => {
                      const ICON_OPTIONS = [
                        { key: 'link',      Icon: Link2,      label: 'Link',      color: '#6b7280' },
                        { key: 'instagram', Icon: Instagram,  label: 'Instagram', color: '#E1306C' },
                        { key: 'whatsapp',  Icon: Whatsapp,   label: 'WhatsApp',  color: '#25D366' },
                        { key: 'location',  Icon: Location,   label: 'Local',     color: '#3B82F6' },
                      ] as const;
                      const urlPlaceholder =
                        lk.icon === 'instagram' ? '@usuario ou https://instagram.com/...' :
                        lk.icon === 'whatsapp'  ? 'Número com DDD (ex: 5521999999999)' :
                        lk.icon === 'location'  ? 'Link do Google Maps ou Waze' : 'https://...';
                      return (
                        <View key={i} className="rounded-2xl p-3" style={{ backgroundColor: colors.surface }}>
                          <View className="flex-row gap-2 mb-3">
                            {ICON_OPTIONS.map(({ key, Icon, label, color }) => {
                              const active = (lk.icon || 'link') === key;
                              return (
                                <Pressable key={key} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateLink(i, 'icon', key); }}
                                  style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 2,
                                    borderColor: active ? color : '#e5e7eb',
                                    backgroundColor: active ? color + '15' : 'white' }}>
                                  <Icon size={16} color={active ? color : '#9ca3af'} variant="Outline" />
                                  <Text style={{ fontSize: 10, fontWeight: '600', color: active ? color : '#9ca3af', marginTop: 2 }}>{label}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          <View className="flex-row items-start gap-2">
                            <View className="items-center gap-1 mt-1">
                              <Pressable onPress={() => moveLink(i, -1)} disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }}>
                                <ArrowUp2 size={16} color={colors.textMuted} variant="Outline" />
                              </Pressable>
                              <Pressable onPress={() => moveLink(i, 1)} disabled={i === links.length - 1} style={{ opacity: i === links.length - 1 ? 0.3 : 1 }}>
                                <ArrowDown2 size={16} color={colors.textMuted} variant="Outline" />
                              </Pressable>
                            </View>
                            <View className="flex-1">
                              <TextInput
                                value={lk.title}
                                onChangeText={v => updateLink(i, 'title', v)}
                                placeholder="Título (ex: Siga-nos no Instagram)"
                                placeholderTextColor={colors.textMuted}
                                className="text-gray-900 text-sm mb-2 px-3 py-2 rounded-xl"
                                style={{ backgroundColor: 'white', fontSize: 14 }}
                              />
                              <TextInput
                                value={lk.url}
                                onChangeText={v => updateLink(i, 'url', v)}
                                placeholder={urlPlaceholder}
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="none"
                                keyboardType={lk.icon === 'whatsapp' ? 'phone-pad' : 'url'}
                                className="text-gray-900 text-sm px-3 py-2 rounded-xl"
                                style={{ backgroundColor: 'white', fontSize: 14 }}
                              />
                            </View>
                            <View className="items-center gap-2 mt-1">
                              <Pressable
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateLink(i, 'active', !lk.active); }}
                                style={{ width: 38, height: 22, borderRadius: 11, padding: 2, backgroundColor: lk.active ? colors.primary : colors.border }}
                              >
                                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'white', alignSelf: lk.active ? 'flex-end' : 'flex-start' }} />
                              </Pressable>
                              <Pressable onPress={() => removeLink(i)}>
                                <Trash size={16} color={colors.error} variant="Outline" />
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </Animated.View>

            {/* ── QR CODE ─────────────────────────────────────────── */}
            {!!customSlug && (
            <Animated.View entering={FadeInDown.duration(400).delay(150)} className="px-5 mb-5">
              <View className="rounded-2xl p-5 items-center" style={{ backgroundColor: colors.backgroundCard }}>
                <View className="rounded-2xl items-center justify-center mb-4 p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border }}>
                  <QRCode
                    value={fullUrlWithProtocol}
                    size={160}
                    color={colors.primary}
                    backgroundColor="#ffffff"
                  />
                </View>
                <Text className="text-gray-900 font-semibold mb-1">QR Code do seu link</Text>
                <Text className="text-gray-500 text-sm text-center">Imprima e coloque no seu estabelecimento</Text>
                <Pressable
                  onPress={handleCopyLink}
                  className="mt-4 flex-row items-center px-4 py-2 rounded-full"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <ImportCircle size={14} color={colors.primary} />
                  <Text className="text-sm font-medium ml-1.5" style={{ color: colors.primary }}>Copiar link</Text>
                </Pressable>
              </View>
            </Animated.View>
            )}

            {/* ── COMPARTILHAR VIA ──────────────────────────────────── */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)} className="px-5 mb-5">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3 ml-1">Compartilhar via</Text>
              <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
                <ShareOption icon={<Whatsapp size={20} color="#25D366" variant="Outline" />} label="WhatsApp" description="Envie para seus clientes" onPress={handleShareWhatsApp} />
                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
                <ShareOption icon={<Instagram size={20} color="#E4405F" variant="Outline" />} label="Instagram" description="Adicione à sua bio" onPress={handleShareInstagram} />
                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
                <ShareOption icon={<Global size={20} color={colors.info} />} label="Outros" description="Mais opções de compartilhamento" onPress={handleShare} />
              </View>
            </Animated.View>

            {/* ── PREVIEW ─────────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.duration(400).delay(250)} className="px-5 mb-5">
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/booking-public'); }}
                className="flex-row items-center justify-center py-4 rounded-2xl"
                style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed' }}
              >
                <Eye size={20} color={colors.primary} variant="Outline" />
                <Text className="font-semibold ml-2" style={{ color: colors.primary }}>Visualizar página de agendamento</Text>
              </Pressable>
            </Animated.View>

            {/* ── CONFIGURAÇÕES ──────────────────────────────────── */}
            <Animated.View entering={FadeInDown.duration(400).delay(300)} className="px-5 mb-5">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3 ml-1">Configurações do agendamento</Text>
              <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
                <SettingItem icon={<Calendar size={20} color={colors.secondary} variant="Outline" />} label="Antecedência máxima" value="30 dias" />
                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
                <SettingItem icon={<Clock size={20} color={colors.warning} variant="Outline" />} label="Antecedência mínima" value="2 horas" />
                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
                <SettingItem icon={<Profile2User size={20} color={colors.info} variant="Outline" />} label="Exigir telefone" value="Sim" />
                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
                <SettingItem icon={<Colorfilter size={20} color={colors.primary} variant="Outline" />} label="Personalizar cores" value="" showArrow onPress={() => router.push('/admin/settings/branding')} />
              </View>
            </Animated.View>

            {/* ── ESTATÍSTICAS ───────────────────────────────────── */}
            <Animated.View entering={FadeInDown.duration(400).delay(350)} className="px-5 mb-8">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3 ml-1">Estatísticas do link</Text>
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl p-4 items-center" style={{ backgroundColor: colors.backgroundCard }}>
                  <Text className="text-3xl font-bold" style={{ color: colors.secondary }}>248</Text>
                  <Text className="text-gray-500 text-xs mt-1">Visitas este mês</Text>
                </View>
                <View className="flex-1 rounded-2xl p-4 items-center" style={{ backgroundColor: colors.backgroundCard }}>
                  <Text className="text-3xl font-bold" style={{ color: colors.success }}>67</Text>
                  <Text className="text-gray-500 text-xs mt-1">Agendamentos</Text>
                </View>
                <View className="flex-1 rounded-2xl p-4 items-center" style={{ backgroundColor: colors.backgroundCard }}>
                  <Text className="text-3xl font-bold" style={{ color: colors.primary }}>27%</Text>
                  <Text className="text-gray-500 text-xs mt-1">Conversão</Text>
                </View>
              </View>
            </Animated.View>

            <View className="h-6" />
          </ScrollView>

          {/* ── SALVAR PERFIL (sticky bottom) ──────────────────── */}
          <View className="px-5 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }}>
            {saved && (
              <View className="flex-row items-center justify-center mb-3 gap-2">
                <TickCircle size={16} color={colors.success} variant="Outline" />
                <Text style={{ color: colors.success }} className="text-sm font-semibold">Perfil salvo com sucesso!</Text>
              </View>
            )}
            <Pressable onPress={handleSaveProfile} disabled={savingProfile}
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: colors.primary, opacity: savingProfile ? 0.7 : 1 }}>
              {savingProfile
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold text-base">Salvar perfil</Text>
              }
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

interface ShareOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
}

function ShareOption({ icon, label, description, onPress }: ShareOptionProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-4 px-4">
      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.surface }}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-medium">{label}</Text>
        <Text className="text-gray-500 text-xs">{description}</Text>
      </View>
      <ExportSquare size={16} color={colors.textMuted} variant="Outline" />
    </Pressable>
  );
}

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  showArrow?: boolean;
  onPress?: () => void;
}

function SettingItem({ icon, label, value, showArrow, onPress }: SettingItemProps) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="flex-row items-center py-4 px-4">
      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.surface }}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-medium">{label}</Text>
      </View>
      {value ? <Text className="text-gray-500 text-sm mr-2">{value}</Text> : null}
      {showArrow && <ExportSquare size={16} color={colors.textMuted} variant="Outline" />}
    </Pressable>
  );
}
