import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ArrowLeft2 } from 'iconsax-react-native';
import { useRouter } from 'expo-router';

interface AuthLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export function AuthLayout({ children, showBackButton = false, onBackPress }: AuthLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {showBackButton && (
        <View className="px-6 pt-2 pb-1">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft2 size={24} color="#374151"  variant="Outline" />
          </TouchableOpacity>
        </View>
      )}
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <View className="flex-1 px-6 pt-6 pb-12">
          {children}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
