import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { colors, statusColors } from '@/lib/theme';

// Status Badge
interface BadgeProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = colors.primary, size = 'md' }: BadgeProps) {
  return (
    <View
      className={size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'}
      style={{ backgroundColor: color + '20', borderRadius: 100 }}
    >
      <Text
        className={size === 'sm' ? 'text-xs' : 'text-sm'}
        style={{ color, fontWeight: '600' }}
      >
        {label}
      </Text>
    </View>
  );
}

// Status Badge with predefined colors
interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'open' | 'closed' | 'paid';
  size?: 'sm' | 'md';
}

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Pago',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <Badge
      label={statusLabels[status] || status}
      color={statusColors[status]}
      size={size}
    />
  );
}

// Chip / Tag
interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-2 rounded-full mr-2 mb-2"
      style={{
        backgroundColor: selected ? colors.primary : colors.backgroundCard,
        borderWidth: selected ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text
        className="text-sm font-medium"
        style={{ color: selected ? '#FFFFFF' : colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Chip Group
interface ChipGroupProps {
  options: { label: string; value: string; icon?: React.ReactNode }[];
  selected: string | string[];
  onSelect: (value: string) => void;
  multiple?: boolean;
}

export function ChipGroup({ options, selected, onSelect, multiple = false }: ChipGroupProps) {
  const isSelected = (value: string) => {
    if (Array.isArray(selected)) {
      return selected.includes(value);
    }
    return selected === value;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 20 }}
      style={{ flexGrow: 0 }}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          icon={option.icon}
          selected={isSelected(option.value)}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </ScrollView>
  );
}

// Divider
interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <View className={`flex-row items-center my-4 ${className}`}>
        <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
        <Text className="text-gray-400 text-xs uppercase mx-3">{label}</Text>
        <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
      </View>
    );
  }

  return (
    <View
      className={`h-px my-4 ${className}`}
      style={{ backgroundColor: colors.border }}
    />
  );
}

// Section Header
interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-gray-900 font-semibold text-lg">{title}</Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={{ color: colors.secondary }} className="text-sm font-medium">
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// Progress Bar
interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  color = colors.primary,
  height = 8,
  showLabel = false,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View>
      <View
        className="rounded-full overflow-hidden"
        style={{ height, backgroundColor: colors.surface }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: color,
          }}
        />
      </View>
      {showLabel && (
        <Text className="text-gray-500 text-xs mt-1 text-right">
          {clampedProgress.toFixed(0)}%
        </Text>
      )}
    </View>
  );
}

// Avatar
interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  badgeColor?: string;
}

export function Avatar({
  uri,
  name,
  size = 'md',
  showBadge = false,
  badgeColor = colors.success,
}: AvatarProps) {
  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };
  const dimension = sizes[size];
  const fontSize = dimension / 2.5;
  const initial = name?.charAt(0).toUpperCase() || '?';

  return (
    <View style={{ position: 'relative' }}>
      {uri ? (
        <View
          className="rounded-full overflow-hidden"
          style={{ width: dimension, height: dimension }}
        >
          {/* Note: Image would go here, using View as placeholder */}
          <View
            className="w-full h-full items-center justify-center"
            style={{ backgroundColor: colors.primary + '30' }}
          >
            <Text style={{ fontSize, color: colors.primary, fontWeight: '600' }}>
              {initial}
            </Text>
          </View>
        </View>
      ) : (
        <View
          className="rounded-full items-center justify-center"
          style={{
            width: dimension,
            height: dimension,
            backgroundColor: colors.primary + '30',
          }}
        >
          <Text style={{ fontSize, color: colors.primary, fontWeight: '600' }}>
            {initial}
          </Text>
        </View>
      )}
      {showBadge && (
        <View
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: dimension / 4,
            height: dimension / 4,
            backgroundColor: badgeColor,
            borderColor: colors.background,
          }}
        />
      )}
    </View>
  );
}
