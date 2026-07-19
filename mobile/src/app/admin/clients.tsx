import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, TextInput,
  Alert, Modal, KeyboardAvoidingView, Platform, FlatList, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft2, SearchNormal1, Add, Call, Sms, Calendar, DocumentText,
  ArrowRight2, User, ClipboardText, CloseCircle, Box, TickSquare, Flash,
  Book1, Whatsapp, Profile2User,
} from 'iconsax-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import { useServices } from '@/lib/hooks/use-services';
import { useServicePackages, type ServicePackage } from '@/lib/hooks/use-service-packages';
import * as Contacts from 'expo-contacts';
import {
  useClientPackagesStore,
  type ClientPackage,
} from '@/lib/state/client-packages-store';
import { useClients, useCreateClient } from '@/lib/hooks/use-clients';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useAuthStore } from '@/lib/state/auth-store';
import { useAnamnesisStore } from '@/lib/state/anamnesis-store';
import type { Client } from '@/lib/types';

// ─── Packages ────────────────────────────────────────────────────────────────

function statusLabel(pkg: ClientPackage) {
  if (pkg.status === 'depleted') return 'Esgotado';
  if (pkg.status === 'expired') return 'Expirado';
  return 'Ativo';
}

function statusColor(pkg: ClientPackage) {
  if (pkg.status === 'depleted') return colors.error;
  if (pkg.status === 'expired') return colors.textMuted;
  return colors.success;
}

function expiresLabel(expiresAt: string) {
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Expirado';
  if (diff === 0) return 'Expira hoje';
  return `${diff}d restantes`;
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabKey = 'clients' | 'retornos' | 'sumidos' | 'anamnesis' | 'birthday';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'clients',   label: 'Clientes'  },
  { key: 'retornos',  label: 'Retornos'  },
  { key: 'sumidos',   label: 'Sumidos'   },
  { key: 'anamnesis', label: 'Fichas'    },
  { key: 'birthday',  label: '🎂'        },
];

const DAYS_OPTIONS = [14, 30, 60, 90, 120];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ─── Empty state helper ───────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 56 }}>
      {icon}
      <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 12, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ClientsScreen() {
  const router = useRouter();

  // Packages store
  const addClientPackage = useClientPackagesStore(s => s.addClientPackage);
  const consumeSession   = useClientPackagesStore(s => s.consumeSession);
  const getClientPackages = useClientPackagesStore(s => s.getClientPackages);

  // ── Real data ──────────────────────────────────────────────────────────────
  const establishmentId = useAuthStore(s => s.establishmentId);
  const { data: clientsData = [] } = useClients(establishmentId ?? undefined);
  const { data: allAppointments = [] } = useAppointments(establishmentId ?? undefined);
  const { data: services = [] } = useServices(establishmentId ?? undefined);
  const { data: availablePackages = [] } = useServicePackages(establishmentId ?? undefined);
  const createClient    = useCreateClient();
  const getClientAnamnesis = useAnamnesisStore(s => s.getClientAnamnesis);
  const filledAnamnesis    = useAnamnesisStore(s => s.filledAnamnesis);

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>('clients');

  // ── Search ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  // ── Add client modal ───────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal]         = useState(false);
  const [newClientName, setNewClientName]       = useState('');
  const [newClientPhone, setNewClientPhone]     = useState('');
  const [newClientEmail, setNewClientEmail]     = useState('');
  const [newClientBirthDate, setNewClientBirthDate] = useState('');

  // ── Client picker (para nova ficha de anamnese) ────────────────────────────
  const [showClientPickerModal, setShowClientPickerModal] = useState(false);
  const [clientPickerSearch, setClientPickerSearch]       = useState('');

  // ── Contacts import ────────────────────────────────────────────────────────
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactsList, setContactsList]           = useState<Contacts.Contact[]>([]);
  const [contactsSearch, setContactsSearch]       = useState('');
  const [loadingContacts, setLoadingContacts]     = useState(false);

  // ── Client packages UI ─────────────────────────────────────────────────────
  const [selectedClient, setSelectedClient]         = useState<Client | null>(null);
  const [showVincularModal, setShowVincularModal]   = useState(false);
  const [vincularClient, setVincularClient]         = useState<Client | null>(null);
  const [showUseSessionModal, setShowUseSessionModal] = useState(false);
  const [useSessionPkg, setUseSessionPkg]           = useState<ClientPackage | null>(null);
  const [sessionNote, setSessionNote]               = useState('');

  // ── Retornos filters ───────────────────────────────────────────────────────
  const RETORNOS_DAYS = [7, 14, 30, 60, 90];
  const [retornosDays, setRetornosDays]         = useState(30);
  const [retornosClientSearch, setRetornosClientSearch] = useState('');

  // ── Sumidos filters ────────────────────────────────────────────────────────
  const [sumidosDays, setSumidosDays]         = useState(30);
  const [sumidosMinApts, setSumidosMinApts]   = useState(1);
  const [sumidosClientSearch, setSumidosClientSearch] = useState('');

  // ── Birthday tab ───────────────────────────────────────────────────────────
  const [birthdayMonth, setBirthdayMonth]               = useState(new Date().getMonth());
  const [showBirthdayMonthPicker, setShowBirthdayMonthPicker] = useState(false);
  const [bdPickerMonth, setBdPickerMonth]               = useState(new Date().getMonth());
  const [bdPickerYear, setBdPickerYear]                 = useState(new Date().getFullYear());

  // ── Anamnesis filters ──────────────────────────────────────────────────────
  const now = new Date();
  const [anamnesisYear, setAnamnesisYear]   = useState(now.getFullYear());
  const [anamnesisMonth, setAnamnesisMonth] = useState(now.getMonth());
  const [anamnesisClientSearch, setAnamnesisClientSearch] = useState('');
  const [showMonthPicker, setShowMonthPicker]             = useState(false);
  const [pickerYear, setPickerYear]   = useState(now.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(now.getMonth());

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getLastAppointment = (clientId: string) =>
    allAppointments
      .filter(a => a.clientId === clientId && a.status !== 'cancelled')
      .sort((a, b) => b.date.localeCompare(a.date))[0];

  const daysSince = (dateStr: string) =>
    Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000);

  const getClientAppointmentsCount = (clientId: string) =>
    allAppointments.filter(a => a.clientId === clientId).length;

  const hasAnamnesis = (clientId: string) =>
    getClientAnamnesis(clientId).length > 0;

  // ── Derived data ───────────────────────────────────────────────────────────

  const filteredClients = clientsData.filter((c: Client) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const retornosClients = clientsData
    .filter((c: Client) => {
      const last = getLastAppointment(c.id);
      if (!last || daysSince(last.date) >= retornosDays) return false;
      if (retornosClientSearch.trim()) return c.name.toLowerCase().includes(retornosClientSearch.toLowerCase());
      return true;
    })
    .sort((a: Client, b: Client) =>
      (getLastAppointment(b.id)?.date ?? '').localeCompare(getLastAppointment(a.id)?.date ?? '')
    );

  const sumidosClients = clientsData
    .filter((c: Client) => {
      const count = getClientAppointmentsCount(c.id);
      if (count < sumidosMinApts) return false;
      const last = getLastAppointment(c.id);
      if (!last || daysSince(last.date) < sumidosDays) return false;
      if (sumidosClientSearch.trim()) return c.name.toLowerCase().includes(sumidosClientSearch.toLowerCase());
      return true;
    })
    .sort((a: Client, b: Client) =>
      (getLastAppointment(b.id)?.date ?? '').localeCompare(getLastAppointment(a.id)?.date ?? '')
    );

  const birthdayClients = clientsData
    .filter((c: Client) => c.birthDate &&
      new Date(c.birthDate + 'T12:00:00').getMonth() === birthdayMonth
    )
    .sort((a: Client, b: Client) =>
      new Date(a.birthDate! + 'T12:00:00').getDate() - new Date(b.birthDate! + 'T12:00:00').getDate()
    );

  const filteredAnamnesis = filledAnamnesis.filter(a => {
    const d = new Date(a.filledAt);
    const matchDate = d.getMonth() === anamnesisMonth && d.getFullYear() === anamnesisYear;
    if (!matchDate) return false;
    if (anamnesisClientSearch.trim()) {
      const client = clientsData.find((c: Client) => c.id === a.clientId);
      return client?.name.toLowerCase().includes(anamnesisClientSearch.toLowerCase());
    }
    return true;
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenContacts = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingContacts(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso aos seus contatos para importar clientes.');
      setLoadingContacts(false);
      return;
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      sort: Contacts.SortTypes.FirstName,
    });
    setContactsList(data.filter(c => c.name));
    setContactsSearch('');
    setLoadingContacts(false);
    setShowContactsModal(true);
  };

  const handleSelectContact = (contact: Contacts.Contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNewClientName(contact.name ?? '');
    setNewClientPhone(contact.phoneNumbers?.[0]?.number ?? '');
    setNewClientEmail(contact.emails?.[0]?.email ?? '');
    setShowContactsModal(false);
    setShowAddModal(true);
  };

  const handleAddClient = async () => {
    if (!newClientName.trim()) { Alert.alert('Atenção', 'O nome é obrigatório.'); return; }
    if (!establishmentId) { Alert.alert('Erro', 'Estabelecimento não encontrado.'); return; }

    let birthDateISO: string | null = null;
    const bd = newClientBirthDate.trim();
    if (bd.length === 10) {
      const [d, m, y] = bd.split('/');
      if (d && m && y) birthDateISO = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }

    try {
      await createClient.mutateAsync({
        establishment_id: establishmentId,
        name: newClientName.trim(),
        phone: newClientPhone.trim() || null,
        email: newClientEmail.trim() || null,
        birth_date: birthDateISO,
      } as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      setNewClientName(''); setNewClientPhone(''); setNewClientEmail(''); setNewClientBirthDate('');
    } catch (e: any) {
      Alert.alert('Erro ao cadastrar', e?.message ?? 'Tente novamente.');
    }
  };

  const handleVincularPackage = (pkg: ServicePackage) => {
    if (!vincularClient) return;
    const expiresAt = new Date(Date.now() + pkg.validityDays * 86400000).toISOString();
    addClientPackage({
      clientId: vincularClient.id,
      packageId: pkg.id,
      packageName: pkg.name,
      serviceIds: pkg.serviceIds,
      totalSessions: pkg.sessions,
      price: pkg.price,
      purchasedAt: new Date().toISOString(),
      expiresAt,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowVincularModal(false);
    Alert.alert('Pacote vinculado!', `"${pkg.name}" foi vinculado a ${vincularClient.name}.`);
  };

  const handleUseSession = () => {
    if (!useSessionPkg) return;
    const ok = consumeSession(useSessionPkg.id, undefined, sessionNote.trim() || undefined);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sessão registrada!', 'Uma sessão foi descontada do pacote.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível registrar a sessão.');
    }
    setShowUseSessionModal(false);
    setSessionNote('');
    setUseSessionPkg(null);
  };

  const handleNewAnamnesis = (client: Client) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/admin/anamnesis-templates', params: { clientId: client.id, clientName: client.name } });
  };

  const openWhatsApp = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tel = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${tel}`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={['top']}>

        {/* Header */}
        <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.backgroundCard }}>
              <ArrowLeft2 size={24} color="#1C1C1E" variant="Outline" />
            </Pressable>
            <Text className="text-gray-900 text-xl font-bold">Clientes</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(activeTab === 'clients' || activeTab === 'retornos' || activeTab === 'sumidos' || activeTab === 'birthday') && (
              <Pressable onPress={handleOpenContacts}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.backgroundCard, alignItems: 'center', justifyContent: 'center' }}>
                {loadingContacts
                  ? <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.primary + '40', borderTopColor: colors.primary }} />
                  : <Book1 size={20} color={colors.primary} />}
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (activeTab === 'anamnesis') {
                  setClientPickerSearch('');
                  setShowClientPickerModal(true);
                } else {
                  setShowAddModal(true);
                }
              }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Add size={22} color="white" variant="Outline" />
            </Pressable>
          </View>
        </View>

        {/* Tab bar — scrollável */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {TABS.map(tab => (
            <Pressable key={tab.key}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.key); }}
              style={{ paddingBottom: 10, marginRight: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: activeTab === tab.key ? '700' : '500', color: activeTab === tab.key ? colors.primary : colors.textMuted }}>
                {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, borderRadius: 1 }} />
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* ════════════════════════════════════════════════════════════════
            ABA: CLIENTES
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'clients' && <>
          {/* Search */}
          <View className="px-5 mt-3 mb-3">
            <View className="flex-row items-center px-4 py-3 rounded-xl" style={{ backgroundColor: colors.backgroundCard }}>
              <SearchNormal1 size={20} color={colors.textMuted} variant="Outline" />
              <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar por nome ou telefone..."
                placeholderTextColor={colors.textMuted} className="flex-1 ml-3 text-gray-900" />
            </View>
          </View>

          {/* Stats */}
          <View className="px-5 mb-3">
            <View className="flex-row">
              <View className="flex-1 mr-2 p-3 rounded-xl items-center" style={{ backgroundColor: colors.backgroundCard }}>
                <Text style={{ color: colors.secondary }} className="text-2xl font-bold">{clientsData.length}</Text>
                <Text className="text-gray-500 text-xs">Total</Text>
              </View>
              <View className="flex-1 mx-2 p-3 rounded-xl items-center" style={{ backgroundColor: colors.backgroundCard }}>
                <Text style={{ color: colors.success }} className="text-2xl font-bold">{filledAnamnesis.length}</Text>
                <Text className="text-gray-500 text-xs">Com Anamnese</Text>
              </View>
              <View className="flex-1 ml-2 p-3 rounded-xl items-center" style={{ backgroundColor: colors.backgroundCard }}>
                <Text style={{ color: colors.warning }} className="text-2xl font-bold">
                  {clientsData.filter((c: Client) => {
                    const d = new Date(c.createdAt); const n = new Date();
                    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
                  }).length}
                </Text>
                <Text className="text-gray-500 text-xs">Novos (mês)</Text>
              </View>
            </View>
          </View>

          {/* Client list */}
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {filteredClients.map((client: Client) => {
              const clientPkgs = getClientPackages(client.id);
              const activePkgs = clientPkgs.filter(p => p.status === 'active');
              return (
                <Pressable key={client.id}
                  onPress={() => router.push(`/admin/client-detail?id=${client.id}`)}
                  className="mb-3 rounded-xl overflow-hidden"
                  style={{ backgroundColor: colors.backgroundCard }}>
                  <View className="p-4">
                    <View className="flex-row items-center">
                      {client.avatar
                        ? <Image source={{ uri: client.avatar }} className="w-14 h-14 rounded-full mr-3" />
                        : <View className="w-14 h-14 rounded-full mr-3 items-center justify-center" style={{ backgroundColor: colors.primary + '30' }}>
                            <User size={24} color={colors.primary} variant="Outline" />
                          </View>
                      }
                      <View className="flex-1">
                        <View className="flex-row items-center flex-wrap gap-1.5">
                          <Text className="text-gray-900 font-semibold text-base">{client.name}</Text>
                          {hasAnamnesis(client.id) && (
                            <View className="px-2 py-0.5 rounded" style={{ backgroundColor: colors.success + '20' }}>
                              <Text style={{ color: colors.success }} className="text-xs">Anamnese</Text>
                            </View>
                          )}
                          {activePkgs.length > 0 && (
                            <View className="px-2 py-0.5 rounded flex-row items-center" style={{ backgroundColor: colors.primary + '15' }}>
                              <Box size={10} color={colors.primary} variant="Outline" />
                              <Text style={{ color: colors.primary }} className="text-xs ml-1">{activePkgs.length} pacote{activePkgs.length > 1 ? 's' : ''}</Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row items-center mt-1">
                          <Call size={12} color={colors.textMuted} />
                          <Text className="text-gray-500 text-sm ml-1">{client.phone}</Text>
                        </View>
                        <View className="flex-row items-center mt-0.5">
                          <Sms size={12} color={colors.textMuted} variant="Outline" />
                          <Text className="text-gray-500 text-sm ml-1">{client.email}</Text>
                        </View>
                      </View>
                      <ArrowRight2 size={20} color={colors.textMuted} variant="Outline" />
                    </View>

                    {/* Active packages mini preview */}
                    {activePkgs.length > 0 && (
                      <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                        {activePkgs.slice(0, 2).map(pkg => {
                          const remaining = pkg.totalSessions - pkg.usedSessions;
                          const progress = pkg.usedSessions / pkg.totalSessions;
                          return (
                            <View key={pkg.id} className="mb-2">
                              <View className="flex-row items-center justify-between mb-1">
                                <View className="flex-row items-center flex-1 mr-2">
                                  <Box size={11} color={colors.primary} variant="Outline" />
                                  <Text className="text-gray-700 text-xs font-medium ml-1" numberOfLines={1}>{pkg.packageName}</Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                  <Text className="text-xs font-bold" style={{ color: remaining > 0 ? colors.primary : colors.error }}>
                                    {remaining} sessão{remaining !== 1 ? 'ões' : ''} restante{remaining !== 1 ? 's' : ''}
                                  </Text>
                                  <Pressable
                                    onPress={e => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setUseSessionPkg(pkg); setShowUseSessionModal(true); }}
                                    className="px-2 py-1 rounded-lg flex-row items-center"
                                    style={{ backgroundColor: colors.primary }}>
                                    <Flash size={10} color="white" />
                                    <Text className="text-white text-xs font-bold ml-1">Usar</Text>
                                  </Pressable>
                                </View>
                              </View>
                              <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
                                <View style={{ height: 6, borderRadius: 3, width: `${Math.min(progress * 100, 100)}%`, backgroundColor: progress >= 1 ? colors.error : colors.primary }} />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Quick actions */}
                    <View className="flex-row mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                      <View className="flex-1 flex-row items-center">
                        <Calendar size={14} color={colors.secondary} variant="Outline" />
                        <Text className="text-gray-600 text-xs ml-1">{getClientAppointmentsCount(client.id)} atendimentos</Text>
                      </View>
                      {client.notes && (
                        <View className="flex-row items-center mr-3">
                          <DocumentText size={14} color={colors.warning} variant="Outline" />
                          <Text className="text-gray-600 text-xs ml-1">Obs.</Text>
                        </View>
                      )}
                      <Pressable
                        onPress={e => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setVincularClient(client); setShowVincularModal(true); }}
                        className="flex-row items-center px-3 py-1.5 rounded-lg mr-2"
                        style={{ backgroundColor: colors.primary + '15' }}>
                        <Box size={13} color={colors.primary} variant="Outline" />
                        <Text className="text-xs ml-1.5 font-medium" style={{ color: colors.primary }}>Pacote</Text>
                      </Pressable>
                      <Pressable
                        onPress={e => { e.stopPropagation(); handleNewAnamnesis(client); }}
                        className="flex-row items-center px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: colors.primary + '20' }}>
                        <ClipboardText size={13} color={colors.primary} />
                        <Text className="text-xs ml-1.5 font-medium" style={{ color: colors.primary }}>Ficha</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            <View className="h-6" />
          </ScrollView>
        </>}

        {/* ════════════════════════════════════════════════════════════════
            ABA: RETORNOS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'retornos' && (
          <>
            {/* Filtros */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 10 }}>
                {/* Chip de dias — cíclico */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
                    Últimos
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const idx = RETORNOS_DAYS.indexOf(retornosDays);
                      setRetornosDays(RETORNOS_DAYS[(idx + 1) % RETORNOS_DAYS.length]);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                      borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.backgroundCard }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
                      {retornosDays} dias
                    </Text>
                    <ArrowRight2 size={14} color={colors.primary} variant="Outline" />
                  </Pressable>
                </View>
                {/* Resultado */}
                <View style={{ alignItems: 'center', paddingBottom: 2 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 22, lineHeight: 26 }}>
                    {retornosClients.length}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>cliente{retornosClients.length !== 1 ? 's' : ''}</Text>
                </View>
              </View>

              {/* Filtrar por cliente */}
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                Filtrar por cliente
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard,
                borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 42 }}>
                <SearchNormal1 size={15} color={colors.textMuted} variant="Outline" />
                <TextInput
                  value={retornosClientSearch}
                  onChangeText={setRetornosClientSearch}
                  placeholder="Buscar cliente..."
                  placeholderTextColor={colors.textMuted}
                  style={{ flex: 1, marginLeft: 8, color: colors.textPrimary, fontSize: 14 }}
                />
              </View>

              {/* Subtítulo */}
              <View style={{ backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginTop: 10 }}>
                <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                  Clientes que retornaram nos últimos {retornosDays} dias
                </Text>
              </View>
            </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            {retornosClients.length === 0
              ? <EmptyState
                  icon={<Calendar size={40} color={colors.textMuted} variant="Outline" />}
                  text={`Nenhum cliente retornou nos últimos ${retornosDays} dias.`} />
              : (retornosClients as Client[]).map(c => {
                  const last = getLastAppointment(c.id)!;
                  const count = getClientAppointmentsCount(c.id);
                  const days = daysSince(last.date);
                  const dateFormatted = new Date(last.date + 'T12:00:00')
                    .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' });
                  return (
                    <Pressable key={c.id}
                      onPress={() => router.push(`/admin/client-detail?id=${c.id}`)}
                      style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                      {c.phone ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>{c.phone}</Text> : null}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <Calendar size={12} color={colors.primary} variant="Outline" />
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                          Último: {dateFormatted} · há {days} dia{days !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                        Número de atendimentos: {count}
                      </Text>
                    </Pressable>
                  );
                })
            }
          </ScrollView>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ABA: SUMIDOS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sumidos' && (
          <>
            {/* Filtros */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                {/* Chip de dias — cíclico */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
                    Último atendimento a
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const idx = DAYS_OPTIONS.indexOf(sumidosDays);
                      setSumidosDays(DAYS_OPTIONS[(idx + 1) % DAYS_OPTIONS.length]);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                      borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.backgroundCard }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
                      {sumidosDays} dias ou mais
                    </Text>
                    <ArrowRight2 size={14} color={colors.primary} variant="Outline" />
                  </Pressable>
                </View>

                {/* Stepper mínimo de atendimentos */}
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
                    Pelo menos...
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: colors.backgroundCard, borderRadius: 10,
                    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8 }}>
                    <Pressable onPress={() => setSumidosMinApts(m => Math.max(1, m - 1))}>
                      <Text style={{ fontSize: 20, color: colors.primary, fontWeight: '700', lineHeight: 24 }}>−</Text>
                    </Pressable>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, minWidth: 20, textAlign: 'center' }}>
                      {sumidosMinApts}
                    </Text>
                    <Pressable onPress={() => setSumidosMinApts(m => m + 1)}>
                      <Text style={{ fontSize: 20, color: colors.primary, fontWeight: '700', lineHeight: 24 }}>+</Text>
                    </Pressable>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Atendimentos</Text>
                </View>
              </View>

              {/* Filtrar por cliente */}
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 }}>
                Filtrar por cliente
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard,
                borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 42, marginBottom: 4 }}>
                <SearchNormal1 size={15} color={colors.textMuted} variant="Outline" />
                <TextInput
                  value={sumidosClientSearch}
                  onChangeText={setSumidosClientSearch}
                  placeholder="Buscar cliente..."
                  placeholderTextColor={colors.textMuted}
                  style={{ flex: 1, marginLeft: 8, color: colors.textPrimary, fontSize: 14 }}
                />
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
              {sumidosClients.length === 0
                ? <EmptyState
                    icon={<Profile2User size={40} color={colors.textMuted} variant="Outline" />}
                    text="Nenhum cliente sumido com esses filtros." />
                : (sumidosClients as Client[]).map(c => {
                    const last = getLastAppointment(c.id)!;
                    const count = getClientAppointmentsCount(c.id);
                    const days = daysSince(last.date);
                    const dateFormatted = new Date(last.date + 'T12:00:00')
                      .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' });
                    return (
                      <Pressable key={c.id}
                        onPress={() => router.push(`/admin/client-detail?id=${c.id}`)}
                        style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <User size={14} color={colors.primary} variant="Outline" />
                              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                              <Calendar size={12} color={colors.textMuted} variant="Outline" />
                              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                Último atendimento: {dateFormatted} · à {days} dias
                              </Text>
                            </View>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                              Número de atendimentos: {count}
                            </Text>
                          </View>
                          {c.phone ? (
                            <Pressable
                              onPress={e => { e.stopPropagation(); openWhatsApp(c.phone); }}
                              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
                                paddingVertical: 8, borderRadius: 10, backgroundColor: '#25D36620' }}>
                              <Whatsapp size={16} color="#25D366" variant="Bold" />
                              <Text style={{ color: '#25D366', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
                                WhatsApp
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })
              }
            </ScrollView>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ABA: FICHAS ANAMNESE
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'anamnesis' && (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                Filtrar por data
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Pressable
                  onPress={() => { setPickerYear(anamnesisYear); setPickerMonth(anamnesisMonth); setShowMonthPicker(true); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                    borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.backgroundCard }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                    {MONTHS_PT[anamnesisMonth]} de {anamnesisYear}
                  </Text>
                  <ArrowRight2 size={16} color={colors.primary} style={{ transform: [{ rotate: '90deg' }] }} variant="Outline" />
                </Pressable>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>ou</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Filtrar por cliente</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 10,
                    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundCard,
                    paddingHorizontal: 10, height: 40 }}>
                    <TextInput value={anamnesisClientSearch} onChangeText={setAnamnesisClientSearch}
                      placeholder="Selecione..." placeholderTextColor={colors.textMuted}
                      style={{ flex: 1, color: colors.textPrimary, fontSize: 13 }} />
                    <SearchNormal1 size={14} color={colors.textMuted} variant="Outline" />
                  </View>
                </View>
              </View>
              <View style={{ backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  Fichas para {MONTHS_PT[anamnesisMonth]} de {anamnesisYear}
                </Text>
              </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {filteredAnamnesis.length === 0
                ? <EmptyState icon={<DocumentText size={40} color={colors.textMuted} variant="Outline" />} text="Nenhum resultado encontrado." />
                : filteredAnamnesis.map(a => {
                    const client = clientsData.find((c: Client) => c.id === a.clientId);
                    const date = new Date(a.filledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                    return (
                      <Pressable key={a.id}
                        onPress={() => router.push({ pathname: '/admin/anamnesis-form', params: { anamnesisId: a.id, clientId: a.clientId, templateId: a.templateId } })}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <DocumentText size={18} color={colors.primary} variant="Outline" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>{client?.name ?? 'Cliente'}</Text>
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{a.templateName} · {date}</Text>
                        </View>
                        <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" />
                      </Pressable>
                    );
                  })
              }
              <View style={{ height: 32 }} />
            </ScrollView>

            <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
                <Pressable style={{ position: 'absolute', inset: 0 }} onPress={() => setShowMonthPicker(false)} />
                <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 20, overflow: 'hidden' }}>
                  <View style={{ padding: 20 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>Ano</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4, marginBottom: 20 }} style={{ flexGrow: 0 }}>
                      {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                        <Pressable key={y} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPickerYear(y); }}
                          style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: pickerYear === y ? colors.primary : colors.border, backgroundColor: pickerYear === y ? colors.primary : colors.background }}>
                          <Text style={{ color: pickerYear === y ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{y}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>Mês</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                      {MONTHS_SHORT.map((m, idx) => (
                        <Pressable key={m} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPickerMonth(idx); }}
                          style={{ width: '30%', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: pickerMonth === idx ? colors.primary : colors.border, backgroundColor: pickerMonth === idx ? colors.primary : colors.background, alignItems: 'center' }}>
                          <Text style={{ color: pickerMonth === idx ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{m}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable onPress={() => { setAnamnesisYear(pickerYear); setAnamnesisMonth(pickerMonth); setShowMonthPicker(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
                      style={{ height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Confirmar</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ABA: ANIVERSARIANTES
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'birthday' && (
          <>
            {/* Filtro de mês */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: colors.border }}>
                <SearchNormal1 size={15} color={colors.textMuted} variant="Outline" />
                <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar..."
                  placeholderTextColor={colors.textMuted}
                  style={{ flex: 1, marginLeft: 8, color: colors.textPrimary, fontSize: 14 }} />
              </View>
              <Pressable
                onPress={() => { setBdPickerMonth(birthdayMonth); setShowBirthdayMonthPicker(true); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10,
                  borderRadius: 10, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.backgroundCard }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
                  {MONTHS_SHORT[birthdayMonth]}
                </Text>
                <ArrowRight2 size={14} color={colors.primary} style={{ transform: [{ rotate: '90deg' }] }} variant="Outline" />
              </Pressable>
            </View>

            {/* Subtítulo */}
            <View style={{ backgroundColor: colors.surface, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginBottom: 8 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                Aniversariantes do mês de {MONTHS_PT[birthdayMonth]}
              </Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
              {birthdayClients.length === 0
                ? <EmptyState icon={<Text style={{ fontSize: 40 }}>🎂</Text>} text="Nenhum dado encontrado." />
                : (birthdayClients as Client[])
                    .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(c => {
                      const bd = new Date(c.birthDate! + 'T12:00:00');
                      const age = new Date().getFullYear() - bd.getFullYear();
                      return (
                        <Pressable key={c.id}
                          onPress={() => router.push(`/admin/client-detail?id=${c.id}`)}
                          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                              Dia {bd.getDate()} de {MONTHS_PT[bd.getMonth()]} · {age} anos
                            </Text>
                            {c.phone ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>{c.phone}</Text> : null}
                          </View>
                          <Text style={{ fontSize: 26 }}>🎂</Text>
                        </Pressable>
                      );
                    })
              }
            </ScrollView>

            {/* Birthday month picker modal */}
            <Modal visible={showBirthdayMonthPicker} transparent animationType="fade" onRequestClose={() => setShowBirthdayMonthPicker(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
                <Pressable style={{ position: 'absolute', inset: 0 }} onPress={() => setShowBirthdayMonthPicker(false)} />
                <View style={{ backgroundColor: colors.backgroundCard, borderRadius: 20, overflow: 'hidden' }}>
                  <View style={{ padding: 20 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>Selecione o mês</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                      {MONTHS_SHORT.map((m, idx) => (
                        <Pressable key={m} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBdPickerMonth(idx); }}
                          style={{ width: '30%', paddingVertical: 10, borderRadius: 10, borderWidth: 1,
                            borderColor: bdPickerMonth === idx ? colors.primary : colors.border,
                            backgroundColor: bdPickerMonth === idx ? colors.primary : colors.background, alignItems: 'center' }}>
                          <Text style={{ color: bdPickerMonth === idx ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{m}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable onPress={() => { setBirthdayMonth(bdPickerMonth); setShowBirthdayMonthPicker(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
                      style={{ height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Confirmar</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}

      </SafeAreaView>

      {/* ════════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════════ */}

      {/* Add Client Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
            <View className="px-5 py-4 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text className="text-gray-900 text-xl font-bold">Novo Cliente</Text>
              <Pressable onPress={() => setShowAddModal(false)} className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.backgroundCard }}>
                <CloseCircle size={20} color={colors.textMuted} variant="Outline" />
              </Pressable>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
              <ScrollView className="flex-1 px-5 pt-6" keyboardShouldPersistTaps="handled">
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">Nome *</Text>
                <TextInput value={newClientName} onChangeText={setNewClientName} placeholder="Nome completo"
                  placeholderTextColor={colors.textMuted}
                  className="text-gray-900 px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: colors.backgroundCard, fontSize: 16 }} />
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">Telefone</Text>
                <TextInput value={newClientPhone} onChangeText={setNewClientPhone} placeholder="(11) 99999-9999"
                  placeholderTextColor={colors.textMuted} keyboardType="phone-pad"
                  className="text-gray-900 px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: colors.backgroundCard, fontSize: 16 }} />
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">E-mail</Text>
                <TextInput value={newClientEmail} onChangeText={setNewClientEmail} placeholder="email@exemplo.com"
                  placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none"
                  className="text-gray-900 px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: colors.backgroundCard, fontSize: 16 }} />
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">Data de Nascimento</Text>
                <TextInput value={newClientBirthDate} onChangeText={setNewClientBirthDate} placeholder="DD/MM/AAAA"
                  placeholderTextColor={colors.textMuted} keyboardType="numeric"
                  className="text-gray-900 px-4 py-3 rounded-xl mb-6" style={{ backgroundColor: colors.backgroundCard, fontSize: 16 }} />
                <Pressable onPress={handleAddClient} className="py-4 rounded-xl items-center mb-4" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white font-bold text-base">Cadastrar Cliente</Text>
                </Pressable>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Vincular Pacote Modal */}
      <Modal visible={showVincularModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowVincularModal(false)}>
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          <LinearGradient colors={[colors.primary + '22', colors.background]} style={{ paddingTop: 20, paddingBottom: 8 }}>
            <View className="flex-row items-center justify-between px-5 mb-2">
              <View>
                <Text className="text-gray-900 text-lg font-bold">Vincular Pacote</Text>
                {vincularClient && <Text className="text-gray-500 text-sm mt-0.5">para {vincularClient.name}</Text>}
              </View>
              <Pressable onPress={() => setShowVincularModal(false)} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
                <CloseCircle size={18} color={colors.textMuted} variant="Outline" />
              </Pressable>
            </View>
          </LinearGradient>
          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
            <Text className="text-gray-500 text-sm mb-4">Selecione o pacote a vincular ao cliente. A validade começa a contar a partir de hoje.</Text>
            {availablePackages.map(pkg => {
              const discount = pkg.discountPercent ?? 0;
              const pkgServices = services.filter(s => pkg.serviceIds.includes(s.id));
              return (
                <Pressable key={pkg.id}
                  onPress={() => Alert.alert(`Vincular "${pkg.name}"?`,
                    `${pkg.sessions} sessões · ${pkg.validityDays} dias de validade\nValor: R$ ${pkg.price.toFixed(2)}`,
                    [{ text: 'Cancelar', style: 'cancel' }, { text: 'Vincular', onPress: () => handleVincularPackage(pkg) }])}
                  className="mb-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.backgroundCard }}>
                  <LinearGradient colors={[colors.primary + 'CC', colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />
                  <View className="p-4">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-gray-900 font-bold text-base flex-1 mr-2">{pkg.name}</Text>
                      {discount > 0 && (
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.success + '20' }}>
                          <Text className="text-xs font-bold" style={{ color: colors.success }}>-{discount}%</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{pkg.description}</Text>
                    <View className="flex-row flex-wrap gap-1.5 mb-3">
                      {pkgServices.map(s => (
                        <View key={s.id} className="px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.primary + '12' }}>
                          <Text className="text-xs font-medium" style={{ color: colors.primary }}>{s.name}</Text>
                        </View>
                      ))}
                    </View>
                    <View className="flex-row items-center justify-between pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                      <View className="flex-row items-center gap-4">
                        <Text className="text-gray-500 text-xs">{pkg.sessions} sessões</Text>
                        <Text className="text-gray-500 text-xs">{pkg.validityDays}d validade</Text>
                      </View>
                      <View className="items-end">
                        {discount > 0 && <Text className="text-xs line-through" style={{ color: colors.textMuted }}>-{discount}%</Text>}
                        <Text className="font-bold" style={{ color: colors.primary }}>R$ {pkg.price.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            <View className="h-6" />
          </ScrollView>
        </View>
      </Modal>

      {/* Use Session Modal */}
      <Modal visible={showUseSessionModal} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => { setShowUseSessionModal(false); setSessionNote(''); setUseSessionPkg(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text className="text-gray-900 text-lg font-bold">Registrar Sessão</Text>
            <Pressable onPress={() => { setShowUseSessionModal(false); setSessionNote(''); setUseSessionPkg(null); }}
              className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
              <CloseCircle size={18} color={colors.textMuted} variant="Outline" />
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
            {useSessionPkg && (
              <>
                <View className="rounded-2xl p-4 mb-5" style={{ backgroundColor: colors.backgroundCard }}>
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '15' }}>
                      <Box size={18} color={colors.primary} variant="Outline" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-400 text-xs">Pacote</Text>
                      <Text className="text-gray-900 font-bold">{useSessionPkg.packageName}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-500 text-sm">Sessões utilizadas</Text>
                    <Text className="font-bold text-sm" style={{ color: colors.primary }}>
                      {useSessionPkg.usedSessions} / {useSessionPkg.totalSessions}
                    </Text>
                  </View>
                  <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
                    <View style={{ height: 8, borderRadius: 4, width: `${(useSessionPkg.usedSessions / useSessionPkg.totalSessions) * 100}%`, backgroundColor: colors.primary }} />
                  </View>
                  <Text className="text-gray-400 text-xs mt-2">
                    {useSessionPkg.totalSessions - useSessionPkg.usedSessions} sessão(ões) restante(s) · Expira em {expiresLabel(useSessionPkg.expiresAt)}
                  </Text>
                </View>
                <Text className="text-gray-700 text-sm font-medium mb-2">Serviços do pacote</Text>
                <View className="rounded-xl mb-5 overflow-hidden" style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border }}>
                  {services.filter(s => useSessionPkg.serviceIds.includes(s.id)).map((svc, idx) => (
                    <View key={svc.id} className="flex-row items-center px-4 py-3" style={idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : {}}>
                      <Text className="text-gray-900 text-sm flex-1">{svc.name}</Text>
                      <Text className="text-gray-400 text-xs">{svc.duration} min</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-gray-700 text-sm font-medium mb-2">Observação (opcional)</Text>
                <TextInput value={sessionNote} onChangeText={setSessionNote}
                  placeholder="Ex: Realizado corte + barba hoje..." placeholderTextColor={colors.textMuted}
                  multiline numberOfLines={3}
                  className="rounded-xl px-4 py-3 text-gray-900 mb-8"
                  style={{ backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' }} />
              </>
            )}
          </ScrollView>
          <View className="px-5 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable onPress={handleUseSession}
              className="py-4 rounded-2xl items-center flex-row justify-center"
              style={{ backgroundColor: colors.primary }}>
              <TickSquare size={18} color="white" variant="Outline" />
              <Text className="text-white font-bold text-base ml-2">Confirmar Sessão</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Contacts Import Modal */}
      <Modal visible={showContactsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowContactsModal(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Book1 size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>Importar da Agenda</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{contactsList.length} contatos encontrados</Text>
              </View>
            </View>
            <Pressable onPress={() => setShowContactsModal(false)}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <CloseCircle size={16} color={colors.textMuted} variant="Outline" />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard,
              borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: colors.border }}>
              <SearchNormal1 size={15} color={colors.textMuted} variant="Outline" />
              <TextInput value={contactsSearch} onChangeText={setContactsSearch} placeholder="Buscar contato..."
                placeholderTextColor={colors.textMuted} style={{ flex: 1, marginLeft: 10, color: colors.textPrimary, fontSize: 14 }} />
              {contactsSearch.length > 0 && (
                <Pressable onPress={() => setContactsSearch('')}>
                  <CloseCircle size={14} color={colors.textMuted} variant="Outline" />
                </Pressable>
              )}
            </View>
          </View>
          <FlatList
            data={contactsList.filter(c => !contactsSearch || c.name?.toLowerCase().includes(contactsSearch.toLowerCase()))}
            keyExtractor={c => c.id ?? c.name ?? Math.random().toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
            renderItem={({ item: contact }) => {
              const phone = contact.phoneNumbers?.[0]?.number ?? '';
              const email = contact.emails?.[0]?.email ?? '';
              const initials = (contact.name ?? '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
              return (
                <Pressable onPress={() => handleSelectContact(contact)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, backgroundColor: pressed ? colors.primary + '08' : 'transparent' })}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>{contact.name}</Text>
                    {phone ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>{phone}</Text> : null}
                    {email ? <Text style={{ color: colors.textMuted, fontSize: 11 }}>{email}</Text> : null}
                  </View>
                  <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Book1 size={36} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
                  {contactsSearch ? 'Nenhum contato encontrado' : 'Sem contatos na agenda'}
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Client Picker — selecionar cliente para nova ficha de anamnese */}
      <Modal visible={showClientPickerModal} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => setShowClientPickerModal(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
            borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 11,
                backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardText size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>Nova Ficha</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Selecione o cliente</Text>
              </View>
            </View>
            <Pressable onPress={() => setShowClientPickerModal(false)}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <CloseCircle size={16} color={colors.textMuted} variant="Outline" />
            </Pressable>
          </View>

          {/* Busca */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard,
              borderRadius: 12, paddingHorizontal: 12, height: 44,
              borderWidth: 1, borderColor: colors.border }}>
              <SearchNormal1 size={15} color={colors.textMuted} variant="Outline" />
              <TextInput
                value={clientPickerSearch}
                onChangeText={setClientPickerSearch}
                placeholder="Buscar cliente..."
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, marginLeft: 10, color: colors.textPrimary, fontSize: 14 }}
              />
              {clientPickerSearch.length > 0 && (
                <Pressable onPress={() => setClientPickerSearch('')}>
                  <CloseCircle size={14} color={colors.textMuted} variant="Outline" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Lista de clientes */}
          <FlatList
            data={(clientsData as Client[]).filter(c =>
              !clientPickerSearch || c.name.toLowerCase().includes(clientPickerSearch.toLowerCase())
            )}
            keyExtractor={c => c.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
            renderItem={({ item: client }) => {
              const initials = client.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
              return (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowClientPickerModal(false);
                    router.push({
                      pathname: '/admin/anamnesis-templates',
                      params: { clientId: client.id, clientName: client.name },
                    });
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
                    backgroundColor: pressed ? colors.primary + '08' : 'transparent',
                  })}>
                  {client.avatar
                    ? <Image source={{ uri: client.avatar }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
                    : <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '18',
                        alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>{initials}</Text>
                      </View>
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                      {client.name}
                    </Text>
                    {client.phone ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>{client.phone}</Text> : null}
                  </View>
                  <ArrowRight2 size={16} color={colors.textMuted} variant="Outline" />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <User size={36} color={colors.textMuted} variant="Outline" />
                <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
                  {clientPickerSearch ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

    </View>
  );
}
