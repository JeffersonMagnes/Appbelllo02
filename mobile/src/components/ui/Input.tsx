import React from 'react';
import { View, TextInput as RNTextInput, Text, Pressable } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from '@/lib/theme';
import { Eye, EyeSlash, SearchNormal1, CloseCircle } from 'iconsax-react-native';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  className?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  helper,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  className,
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View className={cn('mb-4', className)}>
      {label && (
        <Text className="text-gray-700 text-sm font-medium mb-2">{label}</Text>
      )}
      <View
        className="flex-row items-center rounded-xl px-4"
        style={{
          backgroundColor: '#F3F4F6',
          borderWidth: 1.5,
          borderColor: error
            ? colors.error
            : isFocused
            ? colors.primary
            : '#E5E7EB',
          minHeight: multiline ? numberOfLines * 24 + 24 : 52,
        }}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 py-3"
          style={{
            fontSize: 16,
            color: '#111827',
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
            {showPassword ? (
              <EyeSlash size={20} color={colors.textMuted}  variant="Outline" />
            ) : (
              <Eye size={20} color={colors.textMuted}  variant="Outline" />
            )}
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="text-red-400 text-xs mt-1">{error}</Text>
      )}
      {helper && !error && (
        <Text className="text-gray-900/40 text-xs mt-1">{helper}</Text>
      )}
    </View>
  );
}

// Search Input
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  onClear,
  autoFocus = false,
}: SearchInputProps) {
  return (
    <View
      className="flex-row items-center rounded-xl px-4 py-3"
      style={{ backgroundColor: colors.backgroundCard }}
    >
      <SearchNormal1 size={20} color={colors.textMuted}  variant="Outline" />
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        className="flex-1 ml-3 text-gray-900"
        style={{ fontSize: 16 }}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          className="p-1"
        >
          <CloseCircle size={18} color={colors.textMuted}  variant="Outline" />
        </Pressable>
      )}
    </View>
  );
}

// Select / Dropdown placeholder (basic)
interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function Select({ value, options, onSelect, placeholder, label }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-900/80 text-sm font-medium mb-2">{label}</Text>
      )}
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center justify-between rounded-xl px-4 py-4"
        style={{ backgroundColor: colors.backgroundCard }}
      >
        <Text
          className={selectedOption ? 'text-gray-900' : 'text-gray-400'}
          style={{ fontSize: 16 }}
        >
          {selectedOption?.label || placeholder || 'Selecione...'}
        </Text>
        <View
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        >
          <Text className="text-gray-900/40">▼</Text>
        </View>
      </Pressable>
      {isOpen && (
        <View
          className="mt-2 rounded-xl overflow-hidden"
          style={{ backgroundColor: colors.backgroundCard }}
        >
          {options.map((option, index) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className="px-4 py-3"
              style={{
                backgroundColor:
                  option.value === value ? colors.primary + '20' : 'transparent',
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.border,
              }}
            >
              <Text
                className="font-medium"
                style={{
                  color: option.value === value ? colors.primary : colors.textPrimary,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
