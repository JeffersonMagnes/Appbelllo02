import React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors } from '@/lib/theme';

interface OnboardingFooterProps {
  onContinue: () => void;
  continueLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  showSecondary?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function OnboardingFooter({
  onContinue,
  continueLabel = 'Continuar',
  loading = false,
  disabled = false,
  showSecondary = false,
  secondaryLabel = 'Pular',
  onSecondary,
}: OnboardingFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View
        className="px-5 pt-4"
        style={{
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Button
          onPress={onContinue}
          loading={loading}
          disabled={disabled}
          fullWidth
          size="lg"
        >
          {continueLabel}
        </Button>

        {showSecondary && onSecondary && (
          <Button
            onPress={onSecondary}
            variant="ghost"
            fullWidth
            className="mt-3"
          >
            {secondaryLabel}
          </Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
