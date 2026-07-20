import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft2, Add, Book1 } from 'iconsax-react-native';
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

import { ClientsTabClientes } from '@/components/clients-tab-clientes';
import { ClientsTabRetornos } from '@/components/clients-tab-retornos';
import { ClientsTabSumidos } from '@/components/clients-tab-sumidos';
import { ClientsTabAnamnesis } from '@/components/clients-tab-anamnesis';
import { ClientsTabBirthday } from '@/components/clients-tab-birthday';
import { ClientAddModal } from '@/components/clients-add-modal';
import { ClientsVincularPackageModal } from '@/components/clients-vincular-package-modal';
import { ClientsUseSessionModal } from '@/components/clients-use-session-modal';
import { ClientsContactsImportModal } from '@/components/clients-contacts-import-modal';
import { ClientsPickerModal } from '@/components/clients-picker-modal';

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabKey = 'clients' | 'retornos' | 'sumidos' | 'anamnesis' | 'birthday';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'clients',   label: 'Clientes'  },
  { key: 'retornos',  label: 'Retornos'  },
  { key: 'sumidos',   label: 'Sumidos'   },
  { key: 'anamnesis', label: 'Fichas'    },
  { key: 'birthday',  label: '🎂'        },
];

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
  const [retornosDays, setRetornosDays]         = useState(30);
  const [retornosClientSearch, setRetornosClientSearch] = useState('');

  // ── Sumidos filters ────────────────────────────────────────────────────────
  const [sumidosDays, setSumidosDays]         = useState(30);
  const [sumidosMinApts, setSumidosMinApts]   = useState(1);
  const [sumidosClientSearch, setSumidosClientSearch] = useState('');

  // ── Birthday tab ───────────────────────────────────────────────────────────
  const [birthdayMonth, setBirthdayMonth]               = useState(new Date().getMonth());
  const [bdPickerYear, setBdPickerYear]                 = useState(new Date().getFullYear());

  // ── Anamnesis filters ──────────────────────────────────────────────────────
  const now = new Date();
  const [anamnesisYear, setAnamnesisYear]   = useState(now.getFullYear());
  const [anamnesisMonth, setAnamnesisMonth] = useState(now.getMonth());
  const [anamnesisClientSearch, setAnamnesisClientSearch] = useState('');

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

  const getClientName = (clientId: string) =>
    clientsData.find((c: Client) => c.id === clientId)?.name;

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

        {activeTab === 'clients' && (
          <ClientsTabClientes
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            clientsData={clientsData}
            filledAnamnesisCount={filledAnamnesis.length}
            filteredClients={filteredClients}
            hasAnamnesis={hasAnamnesis}
            getClientPackages={getClientPackages}
            getClientAppointmentsCount={getClientAppointmentsCount}
            onVincularPackage={(client) => { setVincularClient(client); setShowVincularModal(true); }}
            onUseSession={(pkg) => { setUseSessionPkg(pkg); setShowUseSessionModal(true); }}
          />
        )}

        {activeTab === 'retornos' && (
          <ClientsTabRetornos
            retornosDays={retornosDays}
            setRetornosDays={setRetornosDays}
            retornosClientSearch={retornosClientSearch}
            setRetornosClientSearch={setRetornosClientSearch}
            retornosClients={retornosClients}
            getLastAppointment={getLastAppointment}
            getClientAppointmentsCount={getClientAppointmentsCount}
            daysSince={daysSince}
          />
        )}

        {activeTab === 'sumidos' && (
          <ClientsTabSumidos
            sumidosDays={sumidosDays}
            setSumidosDays={setSumidosDays}
            sumidosMinApts={sumidosMinApts}
            setSumidosMinApts={setSumidosMinApts}
            sumidosClientSearch={sumidosClientSearch}
            setSumidosClientSearch={setSumidosClientSearch}
            sumidosClients={sumidosClients}
            getLastAppointment={getLastAppointment}
            getClientAppointmentsCount={getClientAppointmentsCount}
            daysSince={daysSince}
          />
        )}

        {activeTab === 'anamnesis' && (
          <ClientsTabAnamnesis
            anamnesisYear={anamnesisYear}
            setAnamnesisYear={setAnamnesisYear}
            anamnesisMonth={anamnesisMonth}
            setAnamnesisMonth={setAnamnesisMonth}
            anamnesisClientSearch={anamnesisClientSearch}
            setAnamnesisClientSearch={setAnamnesisClientSearch}
            filteredAnamnesis={filteredAnamnesis}
            getClientName={getClientName}
          />
        )}

        {activeTab === 'birthday' && (
          <ClientsTabBirthday
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            birthdayMonth={birthdayMonth}
            setBirthdayMonth={setBirthdayMonth}
            birthdayClients={birthdayClients}
          />
        )}

      </SafeAreaView>

      {/* ════════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════════ */}

      <ClientAddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        newClientName={newClientName}
        setNewClientName={setNewClientName}
        newClientPhone={newClientPhone}
        setNewClientPhone={setNewClientPhone}
        newClientEmail={newClientEmail}
        setNewClientEmail={setNewClientEmail}
        newClientBirthDate={newClientBirthDate}
        setNewClientBirthDate={setNewClientBirthDate}
        onSubmit={handleAddClient}
      />

      <ClientsVincularPackageModal
        visible={showVincularModal}
        onClose={() => setShowVincularModal(false)}
        vincularClient={vincularClient}
        availablePackages={availablePackages}
        services={services}
        onConfirmPackage={handleVincularPackage}
      />

      <ClientsUseSessionModal
        visible={showUseSessionModal}
        onClose={() => { setShowUseSessionModal(false); setSessionNote(''); setUseSessionPkg(null); }}
        useSessionPkg={useSessionPkg}
        services={services}
        sessionNote={sessionNote}
        setSessionNote={setSessionNote}
        onConfirm={handleUseSession}
      />

      <ClientsContactsImportModal
        visible={showContactsModal}
        onClose={() => setShowContactsModal(false)}
        contactsList={contactsList}
        contactsSearch={contactsSearch}
        setContactsSearch={setContactsSearch}
        onSelectContact={handleSelectContact}
      />

      <ClientsPickerModal
        visible={showClientPickerModal}
        onClose={() => setShowClientPickerModal(false)}
        clientPickerSearch={clientPickerSearch}
        setClientPickerSearch={setClientPickerSearch}
        clientsData={clientsData}
      />

    </View>
  );
}
