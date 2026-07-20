import React from 'react';
import { View, Text, Pressable, Modal, FlatList, TextInput } from 'react-native';
import { Book1, SearchNormal1, CloseCircle, ArrowRight2 } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import type * as Contacts from 'expo-contacts';

export function ClientsContactsImportModal({
  visible,
  onClose,
  contactsList,
  contactsSearch,
  setContactsSearch,
  onSelectContact,
}: {
  visible: boolean;
  onClose: () => void;
  contactsList: Contacts.Contact[];
  contactsSearch: string;
  setContactsSearch: (v: string) => void;
  onSelectContact: (contact: Contacts.Contact) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
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
          <Pressable onPress={onClose}
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
              <Pressable onPress={() => onSelectContact(contact)}
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
  );
}
