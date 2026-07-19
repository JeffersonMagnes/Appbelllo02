import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="business" />
      <Stack.Screen name="address" />
      <Stack.Screen name="branding" />
      <Stack.Screen name="hours" />
      <Stack.Screen name="payment-fees" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="goals" />
    </Stack>
  );
}
