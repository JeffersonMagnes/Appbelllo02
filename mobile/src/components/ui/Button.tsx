import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
}: ButtonProps) {
  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.surface;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      case 'danger':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.textSecondary;
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.primary;
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-4';
      case 'lg':
        return 'py-4 px-8';
      default:
        return 'py-3 px-6';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={cn(
        'flex-row items-center justify-center rounded-xl',
        getPadding(),
        fullWidth && 'w-full',
        className
      )}
      style={{
        backgroundColor: getBackgroundColor(),
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: getBorderColor(),
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View className="mr-2">{icon}</View>
          )}
          <Text
            className={cn('font-semibold', getFontSize())}
            style={{ color: getTextColor() }}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && (
            <View className="ml-2">{icon}</View>
          )}
        </>
      )}
    </Pressable>
  );
}
