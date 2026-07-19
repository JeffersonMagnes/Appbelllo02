import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from '@/lib/theme';
import { ArrowRight2 } from 'iconsax-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  animate?: boolean;
}

export function Card({ children, className, onPress, animate = false }: CardProps) {
  const Wrapper = animate ? Animated.View : View;
  const content = (
    <Wrapper
      entering={animate ? FadeIn.duration(300) : undefined}
      className={cn('rounded-2xl overflow-hidden', className)}
      style={{ backgroundColor: colors.backgroundCard }}
    >
      {children}
    </Wrapper>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-90">
        {content}
      </Pressable>
    );
  }

  return content;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <View
      className="px-4 py-3 flex-row items-center justify-between"
      style={{ backgroundColor: colors.backgroundLight }}
    >
      <View className="flex-row items-center flex-1">
        {icon && <View className="mr-3">{icon}</View>}
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold">{title}</Text>
          {subtitle && (
            <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
          )}
        </View>
      </View>
      {action}
    </View>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <View className={cn('p-4', className)}>{children}</View>;
}

// Stat Card for KPIs
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  onPress?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = colors.secondary,
  onPress,
}: StatCardProps) {
  return (
    <Card onPress={onPress} className="flex-1">
      <CardContent>
        <View className="flex-row items-center justify-between mb-2">
          {icon && (
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: color + '20' }}
            >
              {icon}
            </View>
          )}
          {trend && (
            <View
              className="px-2 py-1 rounded-full flex-row items-center"
              style={{
                backgroundColor: trend.isPositive ? colors.success + '20' : colors.error + '20',
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: trend.isPositive ? colors.success : colors.error }}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Text>
            </View>
          )}
        </View>
        <Text className="text-2xl font-bold" style={{ color }}>
          {value}
        </Text>
        <Text className="text-gray-600 text-xs mt-1">{title}</Text>
        {subtitle && (
          <Text className="text-gray-400 text-xs mt-0.5">{subtitle}</Text>
        )}
      </CardContent>
    </Card>
  );
}

// TextalignLeft Item Card
interface ListItemCardProps {
  title: string;
  subtitle?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  badge?: { text: string; color: string };
}

export function ListItemCard({
  title,
  subtitle,
  leftContent,
  rightContent,
  showChevron = true,
  onPress,
  badge,
}: ListItemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 rounded-xl mb-2 active:opacity-80"
      style={{ backgroundColor: colors.backgroundCard }}
    >
      {leftContent && <View className="mr-3">{leftContent}</View>}
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-gray-900 font-medium flex-1" numberOfLines={1}>
            {title}
          </Text>
          {badge && (
            <View
              className="px-2 py-0.5 rounded ml-2"
              style={{ backgroundColor: badge.color + '20' }}
            >
              <Text className="text-xs font-medium" style={{ color: badge.color }}>
                {badge.text}
              </Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightContent && <View className="ml-3">{rightContent}</View>}
      {showChevron && !rightContent && (
        <ArrowRight2 size={20} color={colors.textMuted}  variant="Outline" />
      )}
    </Pressable>
  );
}
