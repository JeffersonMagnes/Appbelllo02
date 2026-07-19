import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, TextInput,
  Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft2, Location, Call, Calendar, User, Scissor, Clock,
  MessageSquare, CloseCircle, TickSquare, ArrowDown2, ArrowUp2, InfoCircle,
} from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { toLocalDateStr } from '@/lib/utils/date';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';
import { useEstablishmentById } from '@/lib/hooks/use-establishment';
import { useServices } from '@/lib/hooks/use-services';
import { useEmployees } from '@/lib/hooks/use-employees';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
const BG = '#F5F5F7';

// ── Day/hour helpers ──────────────────────────────────────────────────────────

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const DAY_PT: Record<string, string> = {
  sunday: 'Domingo', monday: 'Segunda-feira', tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira', thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado',
};
type HoursEntry = { open: string; close: string; active: boolean };
type HoursJson = Record<string, HoursEntry>;

function validHours(h: unknown): h is HoursJson {
  return !!h && typeof h === 'object' && !Array.isArray(h);
}

function dayEntry(hoursJson: unknown, date: Date): HoursEntry | null {
  if (!validHours(hoursJson)) return null;
  const e = (hoursJson as HoursJson)[DAY_KEYS[date.getDay()]];
  return e && typeof e === 'object' ? e : null;
}

function getOpenStatus(hoursJson: unknown): { isOpen: boolean; label: string; dot: string } {
  if (!validHours(hoursJson)) return { isOpen: true, label: 'Aberto', dot: '#10B981' };
  const now = new Date();
  const e = dayEntry(hoursJson, now);
  if (!e || e.active === false) return { isOpen: false, label: 'Fechado hoje', dot: '#EF4444' };
  const [oh, om] = e.open.split(':').map(Number);
  const [ch, cm] = e.close.split(':').map(Number);
  const nowM = now.getHours() * 60 + now.getMinutes();
  const openM = oh * 60 + (om || 0);
  const closeM = ch * 60 + (cm || 0);
  if (nowM >= openM && nowM < closeM) return { isOpen: true, label: `Aberto · Fecha às ${e.close}`, dot: '#10B981' };
  if (nowM < openM) return { isOpen: false, label: `Fechado · Abre às ${e.open}`, dot: '#EF4444' };
  return { isOpen: false, label: 'Fechado hoje', dot: '#EF4444' };
}

function isDayClosed(date: Date, hoursJson: unknown): boolean {
  if (!validHours(hoursJson)) return false;
  const e = dayEntry(hoursJson, date);
  if (!e) return false;
  return e.active === false;
}

function getSlots(date: Date, hoursJson: unknown) {
  const period = (h: number) => h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  const fallback = () => Array.from({ length: 22 }, (_, i) => {
    const h = 9 + Math.floor(i / 2); const m = i % 2 === 0 ? 0 : 30;
    if (h >= 19 && m > 0) return null;
    return { time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, period: period(h) as 'morning' | 'afternoon' | 'evening' };
  }).filter(Boolean) as { time: string; period: 'morning' | 'afternoon' | 'evening' }[];

  if (!validHours(hoursJson)) return fallback();
  const e = dayEntry(hoursJson, date);
  if (!e) return fallback();
  if (e.active === false) return [];
  const [oh, om] = (e.open || '09:00').split(':').map(Number);
  const [ch, cm] = (e.close || '18:00').split(':').map(Number);
  const openM = oh * 60 + (om || 0);
  const closeM = ch * 60 + (cm || 0);
  if (closeM <= openM) return fallback();
  const slots = [];
  for (let m = openM; m < closeM; m += 30) {
    const h = Math.floor(m / 60); const min = m % 60;
    slots.push({ time: `${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`, period: period(h) as 'morning' | 'afternoon' | 'evening' });
  }
  return slots;
}

function makeDates(hoursJson: unknown) {
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i);
    return { date: toLocalDateStr(d), day: d.getDate(), wd: days[d.getDay()], mo: months[d.getMonth()], isToday: i === 0, closed: isDayClosed(d, hoursJson), obj: d };
  });
}

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPhone = (v: string) => {
  const n = v.replace(/\D/g, '');
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`;
  if (n.length <= 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}`;
};

// ── Types ─────────────────────────────────────────────────────────────────────

type BookStep = 'service' | 'professional' | 'datetime' | 'confirm';

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PublicBookingScreen() {
  const bookingKey = useRef<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: paramId } = useLocalSearchParams<{ id?: string }>();
  const authEstId = useAuthStore(s => s.establishmentId);
  const establishmentId = (paramId as string | undefined) || authEstId || '';

  const { data: est, isLoading: loadingEst } = useEstablishmentById(establishmentId);
  const { data: rawServices = [] } = useServices(establishmentId);
  const { data: rawEmployees = [] } = useEmployees(establishmentId);

  const e = est as any;
  const primary = e?.primary_color || colors.primary;
  const secondary = e?.secondary_color || colors.secondary;
  const hoursJson = e?.hours_json;
  const activeServices = rawServices.filter(s => (s as any).active !== false);
  const professionals = useMemo(() => {
    const real = rawEmployees
      .filter(emp => emp.role === 'professional' && emp.active)
      .map(emp => ({ id: emp.id, name: emp.name, avatar: emp.avatar || '', spec: emp.specialty || 'Profissional', any: false }));
    return [{ id: 'any', name: 'Qualquer profissional', avatar: '', spec: 'Primeiro disponível', any: true }, ...real];
  }, [rawEmployees]);

  const dates = useMemo(() => makeDates(hoursJson), [hoursJson]);
  const status = useMemo(() => getOpenStatus(hoursJson), [hoursJson]);

  // Profile UI
  const [hoursExpanded, setHoursExpanded] = useState(false);

  // Booking sheet
  const [sheetVisible, setSheetVisible] = useState(false);
  const [step, setStep] = useState<BookStep>('service');
  const [selSvc, setSelSvc] = useState<string | null>(null);
  const [selPro, setSelPro] = useState<string | null>(null);
  const [selDate, setSelDate] = useState<string | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [obs, setObs] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const svcData = activeServices.find(s => s.id === selSvc);
  const proData = professionals.find(p => p.id === selPro);
  const dateData = dates.find(d => d.date === selDate);
  const slots = useMemo(() => selDate ? getSlots(dateData?.obj ?? new Date(selDate), hoursJson) : [], [selDate, dateData, hoursJson]);
  const visibleSlots = slots.filter(s => s.period === period);

  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const openSheet = useCallback((preselect?: string) => {
    if (preselect) setSelSvc(preselect);
    setStep('service'); setDone(false);
    setSheetVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => { setStep('service'); setSelSvc(null); setSelPro(null); setSelDate(null); setSelTime(null); setName(''); setPhone(''); setObs(''); setDone(false); }, 300);
  };

  const canNext = () => {
    if (step === 'service') return !!selSvc;
    if (step === 'professional') return !!selPro;
    if (step === 'datetime') return !!selDate && !!selTime;
    return name.trim().length > 1 && phone.replace(/\D/g,'').length >= 10;
  };

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'service' && selSvc) setStep('professional');
    else if (step === 'professional' && selPro) setStep('datetime');
    else if (step === 'datetime' && selDate && selTime) setStep('confirm');
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'professional') setStep('service');
    else if (step === 'datetime') setStep('professional');
    else if (step === 'confirm') setStep('datetime');
    else closeSheet();
  };

  const confirm = async () => {
    if (!canNext()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setSubmitting(true);
    setBookingError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isSupabaseConfigured() && establishmentId && selSvc && selDate && selTime) {
      try {
        bookingKey.current ||= Crypto.randomUUID();
        const { error } = await (supabase as any).rpc('create_public_booking', {
          p_establishment_id: establishmentId,
          p_service_id: selSvc,
          p_employee_id: selPro === 'any' ? null : selPro,
          p_date: selDate,
          p_time: selTime,
          p_client_name: name,
          p_client_phone: phone,
          p_notes: obs || null,
          p_idempotency_key: bookingKey.current,
        });
        if (error) throw error;
        bookingKey.current = null;
      } catch (error) {
        console.error('booking-public confirm failed:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setSubmitting(false);
        setBookingError('Não foi possível enviar seu agendamento. Tente novamente.');
        return;
      }
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(false);
    setDone(true);
  };

  const stepNum = { service: 1, professional: 2, datetime: 3, confirm: 4 }[step];
  const stepLabel = { service: 'Escolha o serviço', professional: 'Escolha o profissional', datetime: 'Data e horário', confirm: 'Seus dados' }[step];

  if (loadingEst) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}>

        {/* ─── HERO BANNER ─── */}
        <View style={{ height: 160, position: 'relative' }}>
          {e?.banner_url
            ? <Image source={{ uri: e.banner_url }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
            : <LinearGradient colors={[primary, secondary] as [string,string]} style={{ flex: 1 }} />
          }
          <LinearGradient colors={['rgba(0,0,0,0.38)','transparent']} style={{ position: 'absolute', inset: 0, height: 90 }} />
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ margin: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.32)', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft2 size={20} color="#fff" variant="Outline" />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* ─── PROFILE CARD ─── */}
        <View style={{ backgroundColor: '#fff', marginTop: -1, paddingBottom: 22 }}>
          {/* Avatar */}
          <View style={{ alignItems: 'center', marginTop: -46 }}>
            <View style={{
              width: 92, height: 92, borderRadius: 46,
              borderWidth: 4, borderColor: '#fff',
              shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6,
              overflow: 'hidden',
            }}>
              {e?.logo_url
                ? <Image source={{ uri: e.logo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                : <LinearGradient colors={[primary, secondary] as [string,string]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800' }}>{(e?.name || 'S').charAt(0)}</Text>
                  </LinearGradient>
              }
            </View>
          </View>

          {/* Name */}
          <View style={{ alignItems: 'center', paddingHorizontal: 28, marginTop: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', letterSpacing: -0.3 }}>{e?.name || 'Agendamento'}</Text>
            {!!e?.bio && (
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 5, textAlign: 'center', lineHeight: 19, maxWidth: 280 }}>{e.bio}</Text>
            )}
          </View>

          {/* Status badge */}
          <View style={{ alignItems: 'center', marginTop: 11 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: status.dot + '14' }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: status.dot, marginRight: 7 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: status.dot, letterSpacing: 0.1 }}>{status.label}</Text>
            </View>
          </View>

          {/* Action row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, paddingHorizontal: 24 }}>
            <Pressable
              onPress={() => openSheet()}
              style={{
                flex: 1, maxWidth: 172, backgroundColor: primary,
                borderRadius: 13, paddingVertical: 13, flexDirection: 'row',
                alignItems: 'center', justifyContent: 'center', gap: 7,
                shadowColor: primary, shadowOpacity: 0.32, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
              }}
            >
              <Calendar size={18} color="#fff" variant="Outline" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Agendar</Text>
            </Pressable>

            {!!(e?.phone || e?.whatsapp) && (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`tel:${(e.phone || e.whatsapp).replace(/\D/g,'')}`); }}
                style={{ width: 50, height: 50, borderRadius: 13, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
              >
                <Call size={21} color="#374151" variant="Outline" />
              </Pressable>
            )}

            {!!e?.whatsapp && (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`whatsapp://send?phone=55${e.whatsapp.replace(/\D/g,'')}`); }}
                style={{ width: 50, height: 50, borderRadius: 13, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
              >
                <MessageSquare size={21} color="#25D366" variant="Outline" />
              </Pressable>
            )}
          </View>
        </View>

        <View style={{ height: 8 }} />

        {/* ─── SERVICES ─── */}
        {activeServices.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(100)} style={{ backgroundColor: '#fff', paddingVertical: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', letterSpacing: -0.2 }}>Serviços</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500' }}>{activeServices.length} disponíveis</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
              {activeServices.map((svc, i) => (
                <Animated.View key={svc.id} entering={FadeIn.duration(280).delay(i * 40)}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openSheet(svc.id); }}
                    style={{
                      width: 155, backgroundColor: '#FAFAFA', borderRadius: 16,
                      padding: 14, borderWidth: 1, borderColor: '#EFEFEF',
                    }}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: primary + '14', alignItems: 'center', justifyContent: 'center', marginBottom: 11 }}>
                      <Scissor size={18} color={primary} variant="Outline" />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4, lineHeight: 19 }} numberOfLines={2}>{svc.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Clock size={11} color="#9CA3AF" variant="Outline" />
                      <Text style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 3 }}>{svc.duration} min</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: primary, letterSpacing: -0.3 }}>{fmtBRL(svc.price)}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={{ height: 8 }} />

        {/* ─── HOURS ─── */}
        <View style={{ backgroundColor: '#fff' }}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHoursExpanded(!hoursExpanded); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Clock size={19} color="#374151" variant="Outline" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Horário de Funcionamento</Text>
              <Text style={{ fontSize: 13, color: status.dot, marginTop: 2, fontWeight: '500' }}>{status.label}</Text>
            </View>
            {hoursExpanded
              ? <ArrowUp2 size={18} color="#9CA3AF" variant="Outline" />
              : <ArrowDown2 size={18} color="#9CA3AF" variant="Outline" />
            }
          </Pressable>

          {hoursExpanded && validHours(hoursJson) && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 18, borderTopWidth: 1, borderTopColor: '#F5F5F7' }}>
              {DAY_KEYS.map(key => {
                const dh = (hoursJson as HoursJson)[key];
                const isToday = DAY_KEYS[new Date().getDay()] === key;
                const isClosed = !dh || dh.active === false;
                return (
                  <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' }}>
                    <Text style={{ fontSize: 14, color: isToday ? primary : '#374151', fontWeight: isToday ? '700' : '400' }}>
                      {DAY_PT[key]}
                    </Text>
                    <Text style={{ fontSize: 14, color: isClosed ? '#EF4444' : '#111827', fontWeight: isToday ? '700' : '400' }}>
                      {isClosed ? 'Fechado' : `${dh.open} – ${dh.close}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 8 }} />

        {/* ─── INFO ─── */}
        <View style={{ backgroundColor: '#fff' }}>
          {!!(e?.address || e?.city) && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Location size={18} color="#374151" variant="Outline" />
              </View>
              <View style={{ flex: 1, paddingTop: 8 }}>
                <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>{[e?.address, e?.city].filter(Boolean).join(', ')}</Text>
              </View>
            </View>
          )}

          {!!(e?.phone || e?.whatsapp) && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${(e.phone || e.whatsapp).replace(/\D/g,'')}`)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Call size={18} color="#374151" variant="Outline" />
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: '#374151', paddingTop: 8 }}>{e.phone || e.whatsapp}</Text>
            </Pressable>
          )}

          {!!e?.instagram && (
            <Pressable
              onPress={() => Linking.openURL(`https://instagram.com/${e.instagram.replace('@','')}`)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Text style={{ fontSize: 18 }}>📷</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: primary, paddingTop: 8 }}>{e.instagram.startsWith('@') ? e.instagram : `@${e.instagram}`}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* ─── STICKY CTA ─── */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EFEFEF',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16,
      }}>
        <Animated.View style={scaleStyle}>
          <Pressable
            onPress={() => openSheet()}
            onPressIn={() => { scale.value = withSpring(0.97, { stiffness: 400 }); }}
            onPressOut={() => { scale.value = withSpring(1, { stiffness: 400 }); }}
            style={{
              backgroundColor: primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
              shadowColor: primary, shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.1 }}>Agendar agora</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* ─── BOOKING BOTTOM SHEET ─── */}
      <Modal visible={sheetVisible} animationType="slide" transparent statusBarTranslucent onRequestClose={closeSheet}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.48)' }} onPress={closeSheet} />
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: H * 0.91, position: 'absolute', bottom: 0, left: 0, right: 0 }}>

          {/* Handle bar */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 2 }}>
            <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' }} />
          </View>

          {done ? (
            /* ── SUCCESS ── */
            <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 44, paddingBottom: insets.bottom + 36 }}>
              <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: '#10B981' + '14', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
                <TickSquare size={38} color="#10B981" variant="Outline" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 10, letterSpacing: -0.3 }}>Pedido enviado!</Text>
              <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 23, marginBottom: 36 }}>
                Aguarde a confirmação. O estabelecimento entrará em contato pelo WhatsApp.
              </Text>
              <Pressable onPress={closeSheet} style={{ backgroundColor: primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 44 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Perfeito!</Text>
              </Pressable>
            </View>
          ) : (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              {/* Sheet header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
                <Pressable onPress={goBack} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeft2 size={18} color="#374151" variant="Outline" />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{stepLabel}</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Passo {stepNum} de 4</Text>
                </View>
                <Pressable onPress={closeSheet} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <CloseCircle size={18} color="#374151" variant="Outline" />
                </Pressable>
              </View>

              {/* Progress */}
              <View style={{ height: 3, backgroundColor: '#F0F0F0', marginHorizontal: 20, borderRadius: 2, marginBottom: 2 }}>
                <View style={{ height: 3, borderRadius: 2, backgroundColor: primary, width: `${(stepNum / 4) * 100}%` }} />
              </View>

              {/* Step content */}
              <ScrollView
                style={{ maxHeight: H * 0.64 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
              >

                {/* STEP 1 — Service */}
                {step === 'service' && (
                  <View>
                    {activeServices.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <Scissor size={36} color="#D1D5DB" variant="Outline" />
                        <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>Nenhum serviço cadastrado</Text>
                      </View>
                    ) : activeServices.map(svc => (
                      <Pressable
                        key={svc.id}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelSvc(svc.id); }}
                        style={{
                          flexDirection: 'row', alignItems: 'center', padding: 14,
                          borderRadius: 14, marginBottom: 10,
                          borderWidth: 2, borderColor: selSvc === svc.id ? primary : '#F0F0F0',
                          backgroundColor: selSvc === svc.id ? primary + '07' : '#FAFAFA',
                        }}
                      >
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: selSvc === svc.id ? primary : '#EBEBEB', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                          <Scissor size={20} color={selSvc === svc.id ? '#fff' : '#9CA3AF'} variant="Outline" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 }}>{svc.name}</Text>
                          {!!(svc as any).description && <Text style={{ fontSize: 12, color: '#9CA3AF' }} numberOfLines={1}>{(svc as any).description}</Text>}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Clock size={11} color="#9CA3AF" variant="Outline" />
                            <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 3 }}>{svc.duration} min</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: primary, marginLeft: 10, letterSpacing: -0.3 }}>{fmtBRL(svc.price)}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* STEP 2 — Professional */}
                {step === 'professional' && (
                  <View>
                    {professionals.map(pro => (
                      <Pressable
                        key={pro.id}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelPro(pro.id); }}
                        style={{
                          flexDirection: 'row', alignItems: 'center', padding: 14,
                          borderRadius: 14, marginBottom: 10,
                          borderWidth: 2, borderColor: selPro === pro.id ? primary : '#F0F0F0',
                          backgroundColor: selPro === pro.id ? primary + '07' : '#FAFAFA',
                        }}
                      >
                        {pro.avatar
                          ? <Image source={{ uri: pro.avatar }} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 14 }} />
                          : <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: selPro === pro.id ? primary : '#EBEBEB', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                              <User size={22} color={selPro === pro.id ? '#fff' : '#9CA3AF'} variant="Outline" />
                            </View>
                        }
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 }}>{pro.name}</Text>
                          <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{pro.spec}</Text>
                        </View>
                        {selPro === pro.id && (
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                            <TickSquare size={14} color="#fff" variant="Outline" />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* STEP 3 — Date & Time */}
                {step === 'datetime' && (
                  <View>
                    {/* Date row */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }} contentContainerStyle={{ gap: 8 }}>
                      {dates.map(d => {
                        const sel = selDate === d.date;
                        return (
                          <Pressable
                            key={d.date}
                            onPress={() => { if (!d.closed) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelDate(d.date); setSelTime(null); }}}
                            disabled={d.closed}
                            style={{
                              width: 58, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
                              backgroundColor: sel ? primary : '#F5F5F7',
                              borderWidth: 1.5, borderColor: sel ? primary : '#EBEBEB',
                              opacity: d.closed ? 0.32 : 1,
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '600', color: sel ? 'rgba(255,255,255,0.75)' : '#9CA3AF', marginBottom: 2 }}>{d.wd}</Text>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: sel ? '#fff' : '#111827' }}>{d.day}</Text>
                            <Text style={{ fontSize: 11, color: sel ? 'rgba(255,255,255,0.65)' : '#9CA3AF', marginTop: 1 }}>{d.mo}</Text>
                            {d.isToday && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: sel ? 'rgba(255,255,255,0.7)' : primary, marginTop: 4 }} />}
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {/* Period tabs */}
                    <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 3, marginBottom: 16 }}>
                      {[{ id: 'morning', label: '☀️ Manhã' }, { id: 'afternoon', label: '🌤 Tarde' }, { id: 'evening', label: '🌙 Noite' }].map(p => (
                        <Pressable
                          key={p.id}
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeriod(p.id as any); }}
                          style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: period === p.id ? '#fff' : 'transparent' }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: period === p.id ? '700' : '500', color: period === p.id ? '#111827' : '#9CA3AF' }}>{p.label}</Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Time grid */}
                    {!selDate ? (
                      <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                        <Calendar size={32} color="#D1D5DB" variant="Outline" />
                        <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 14 }}>Selecione uma data</Text>
                      </View>
                    ) : visibleSlots.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Sem horários neste período</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {visibleSlots.map(slot => {
                          const sel = selTime === slot.time;
                          return (
                            <Pressable
                              key={slot.time}
                              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelTime(slot.time); }}
                              style={{
                                width: (W - 60) / 4, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                                backgroundColor: sel ? primary : '#F5F5F7',
                                borderWidth: 1.5, borderColor: sel ? primary : '#EBEBEB',
                              }}
                            >
                              <Text style={{ fontSize: 14, fontWeight: '700', color: sel ? '#fff' : '#374151' }}>{slot.time}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}

                {/* STEP 4 — Confirm */}
                {step === 'confirm' && (
                  <View>
                    {/* Summary card */}
                    <View style={{ backgroundColor: primary + '08', borderRadius: 16, padding: 16, marginBottom: 22, borderWidth: 1.5, borderColor: primary + '1A' }}>
                      <Text style={{ fontSize: 11, color: primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Resumo do agendamento</Text>
                      {[
                        { label: 'Serviço', value: svcData?.name },
                        { label: 'Profissional', value: proData?.name },
                        { label: 'Data', value: dateData ? `${dateData.wd}, ${dateData.day} ${dateData.mo}` : '' },
                        { label: 'Horário', value: selTime },
                      ].map(row => (
                        <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }}>
                          <Text style={{ fontSize: 14, color: '#6B7280' }}>{row.label}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', maxWidth: 180, textAlign: 'right' }}>{row.value}</Text>
                        </View>
                      ))}
                      <View style={{ height: 1, backgroundColor: primary + '20', marginTop: 4, marginBottom: 12 }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Total</Text>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: primary }}>{fmtBRL(svcData?.price || 0)}</Text>
                      </View>
                    </View>

                    {/* Form fields */}
                    {[
                      { label: 'Seu nome', value: name, set: setName, placeholder: 'Como podemos te chamar?', type: 'default' as const },
                      { label: 'WhatsApp', value: phone, set: (v: string) => setPhone(fmtPhone(v)), placeholder: '(00) 00000-0000', type: 'phone-pad' as const },
                    ].map(field => (
                      <View key={field.label} style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>{field.label}</Text>
                        <View style={{ borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFAFA' }}>
                          <TextInput value={field.value} onChangeText={field.set} placeholder={field.placeholder} placeholderTextColor="#C4C4C4" keyboardType={field.type} style={{ fontSize: 15, color: '#111827' }} />
                        </View>
                      </View>
                    ))}

                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Observações <Text style={{ fontWeight: '400', color: '#9CA3AF' }}>(opcional)</Text></Text>
                      <View style={{ borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFAFA' }}>
                        <TextInput value={obs} onChangeText={setObs} placeholder="Alguma informação adicional..." placeholderTextColor="#C4C4C4" multiline numberOfLines={2} style={{ fontSize: 15, color: '#111827', textAlignVertical: 'top', minHeight: 48 }} />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, gap: 8, opacity: 0.6 }}>
                      <InfoCircle size={14} color="#9CA3AF" variant="Outline" style={{ marginTop: 1 }} />
                      <Text style={{ flex: 1, fontSize: 12, color: '#9CA3AF', lineHeight: 18 }}>O agendamento está sujeito à confirmação do estabelecimento.</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* CTA button */}
              <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 18 }}>
                {!!bookingError && (
                  <Text style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 10, fontWeight: '600' }}>
                    {bookingError}
                  </Text>
                )}
                <Pressable
                  onPress={step === 'confirm' ? confirm : goNext}
                  onPressIn={() => { scale.value = withSpring(0.97, { stiffness: 400 }); }}
                  onPressOut={() => { scale.value = withSpring(1, { stiffness: 400 }); }}
                  disabled={!canNext() || submitting}
                  style={{
                    backgroundColor: canNext() ? primary : '#E8E8E8',
                    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
                    opacity: submitting ? 0.75 : 1,
                  }}
                >
                  <Text style={{ color: canNext() ? '#fff' : '#ADADAD', fontSize: 16, fontWeight: '800', letterSpacing: 0.1 }}>
                    {submitting ? 'Confirmando...' : step === 'confirm' ? 'Confirmar Agendamento' : 'Continuar'}
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>
    </View>
  );
}
