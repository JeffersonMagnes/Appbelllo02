import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '@/lib/theme';
import { Calendar, DocumentText, Profile2User, Box, SearchNormal1 } from 'iconsax-react-native';
import { Button } from './Button';

interface EmptyStateProps {
  type?: 'appointments' | 'clients' | 'products' | 'transactions' | 'search' | 'generic';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  type = 'generic',
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'appointments':
        return <Calendar size={48} color={colors.textMuted} strokeWidth={1.5}  variant="Outline" />;
      case 'clients':
        return <Profile2User size={48} color={colors.textMuted} strokeWidth={1.5}  variant="Outline" />;
      case 'products':
        return <Box size={48} color={colors.textMuted} strokeWidth={1.5}  variant="Outline" />;
      case 'transactions':
        return <DocumentText size={48} color={colors.textMuted} strokeWidth={1.5}  variant="Outline" />;
      case 'search':
        return <SearchNormal1 size={48} color={colors.textMuted} strokeWidth={1.5}  variant="Outline" />;
      default:
        return <DocumentText size={48} color={colors.textMuted} strokeWidth={1.5}  variant="Outline" />;
    }
  };

  return (
    <View className="items-center justify-center py-12 px-8">
      <View
        className="w-24 h-24 rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: colors.backgroundCard }}
      >
        {getIcon()}
      </View>
      <Text className="text-gray-900 text-lg font-semibold text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-gray-900/50 text-center mb-6 leading-5">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

// Quick empty states
export function NoAppointments({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      type="appointments"
      title="Nenhum agendamento"
      description="Você não tem agendamentos para este período. Que tal agendar um novo serviço?"
      actionLabel="Novo Agendamento"
      onAction={onAdd}
    />
  );
}

export function NoClients({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      type="clients"
      title="Nenhum cliente cadastrado"
      description="Comece adicionando seus primeiros clientes para gerenciar melhor seu negócio."
      actionLabel="Adicionar Cliente"
      onAction={onAdd}
    />
  );
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      type="search"
      title="Nenhum resultado encontrado"
      description={`Não encontramos resultados para "${query}". Tente buscar com outros termos.`}
    />
  );
}

export function NoProducts({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      type="products"
      title="Nenhum produto cadastrado"
      description="Adicione produtos para vender junto com seus serviços."
      actionLabel="Adicionar Produto"
      onAction={onAdd}
    />
  );
}
