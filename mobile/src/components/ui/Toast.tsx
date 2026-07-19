import React, { useEffect, useRef } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, withSequence, withDelay, runOnJS,
} from 'react-native-reanimated';
import { TickSquare, Warning2, InfoCircle, CloseCircle } from 'iconsax-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

const TOAST_CONFIG = {
  success: { bg: '#0D2B1A', border: '#30D158', icon: <TickSquare size={16} color="#30D158" strokeWidth={3}  variant="Outline" />, color: '#30D158' },
  error:   { bg: '#2B0D0D', border: '#FF453A', icon: <CloseCircle size={16} color="#FF453A" strokeWidth={3}  variant="Outline" />,    color: '#FF453A' },
  warning: { bg: '#2B1E0D', border: '#FF9F0A', icon: <Warning2 size={16} color="#FF9F0A"  variant="Outline" />,         color: '#FF9F0A' },
  info:    { bg: '#0D1A2B', border: '#5333ed', icon: <InfoCircle size={16} color="#5333ed"  variant="Outline" />,                  color: '#5333ed' },
};

export function Toast({ visible, message, type = 'success', duration = 2500, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const cfg = TOAST_CONFIG[type];

  const hide = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => runOnJS(onHide)());
  };

  useEffect(() => {
    if (visible) {
      if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      translateY.value = withSpring(0, { damping: 18, stiffness: 260 });
      opacity.value = withTiming(1, { duration: 200 });

      const timer = setTimeout(hide, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: insets.top + 12,
          left: 20, right: 20,
          zIndex: 9999,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 16,
          backgroundColor: cfg.bg,
          borderWidth: 1,
          borderColor: cfg.border + '60',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 10,
        },
        animStyle,
      ]}
    >
      <View style={{
        width: 30, height: 30, borderRadius: 9,
        backgroundColor: cfg.color + '18',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 10,
      }}>
        {cfg.icon}
      </View>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 19 }}>
        {message}
      </Text>
    </Animated.View>
  );
}

// ── Hook helper ───────────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = React.useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: '', type: 'success',
  });

  const show = (message: string, type: ToastType = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hide = () => setToast(t => ({ ...t, visible: false }));

  const ToastComponent = () => (
    <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hide} />
  );

  return { show, ToastComponent };
}
