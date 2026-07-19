import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '@/lib/theme';

import type { DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={className}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surface,
        },
        animatedStyle,
      ]}
    />
  );
}

// Skeleton for list items
export function SkeletonListItem() {
  return (
    <View
      className="flex-row items-center p-4 rounded-xl mb-2"
      style={{ backgroundColor: colors.backgroundCard }}
    >
      <Skeleton width={48} height={48} borderRadius={24} />
      <View className="flex-1 ml-3">
        <Skeleton width="70%" height={16} className="mb-2" />
        <Skeleton width="50%" height={12} />
      </View>
      <Skeleton width={60} height={20} />
    </View>
  );
}

// Skeleton for stat cards
export function SkeletonStatCard() {
  return (
    <View
      className="flex-1 p-4 rounded-2xl"
      style={{ backgroundColor: colors.backgroundCard }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Skeleton width={40} height={40} borderRadius={12} />
        <Skeleton width={50} height={20} borderRadius={10} />
      </View>
      <Skeleton width={80} height={28} className="mb-2" />
      <Skeleton width={60} height={12} />
    </View>
  );
}

// Skeleton for appointments
export function SkeletonAppointment() {
  return (
    <View
      className="rounded-xl overflow-hidden mb-3"
      style={{ backgroundColor: colors.backgroundCard }}
    >
      <View
        className="px-4 py-2"
        style={{ backgroundColor: colors.backgroundLight }}
      >
        <Skeleton width={120} height={14} />
      </View>
      <View className="p-4 flex-row items-center">
        <Skeleton width={56} height={56} borderRadius={28} />
        <View className="flex-1 ml-3">
          <Skeleton width="60%" height={16} className="mb-2" />
          <Skeleton width="40%" height={12} className="mb-2" />
          <Skeleton width="30%" height={12} />
        </View>
        <Skeleton width={70} height={20} />
      </View>
    </View>
  );
}

// Loading screen
export function LoadingScreen({ message = 'Carregando...' }: { message?: string }) {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.background }}
    >
      <View className="items-center">
        <View className="flex-row mb-4">
          {[0, 1, 2].map((i) => (
            <LoadingDot key={i} delay={i * 150} />
          ))}
        </View>
        <Text className="text-gray-900/60">{message}</Text>
      </View>
    </View>
  );
}

function LoadingDot({ delay }: { delay: number }) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      scale.value = withRepeat(
        withTiming(1.3, { duration: 400 }),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      className="w-3 h-3 rounded-full mx-1"
      style={[{ backgroundColor: colors.primary }, animatedStyle]}
    />
  );
}
