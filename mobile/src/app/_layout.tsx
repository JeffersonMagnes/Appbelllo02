import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/state/auth-store';
import { useSetupStore } from '@/lib/state/setup-store';
import { registerPushToken, scheduleAppointmentReminders } from '@/lib/push-notifications';
import { useNotificationSettings } from '@/lib/state/notification-settings-store';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useServices } from '@/lib/hooks/use-services';
import { useClients } from '@/lib/hooks/use-clients';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useTutorialStore } from '@/lib/state/tutorial-store';
import { TutorialOverlay } from '@/components/TutorialOverlay';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="booking"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="admin/clients"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="admin/financial"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="admin/employees"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="admin/products"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="admin/reports"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="admin/comandas"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="admin/pedidos"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="admin/settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="offer/[id]"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="supplier/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/booking-link"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="booking-public"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="booking-success"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="admin/anamnesis-templates"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="admin/anamnesis-form"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/client-detail"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/cash-register"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/employee-access"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="referral"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="employee-home"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ai-assistant"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="reset-password"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="new-password"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="billing"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="anamnesis-public"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/top-clients"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin/meu-perfil"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="help-tutorials"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}



function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const restoreSession = useAuthStore(s => s.restoreSession);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const establishmentId = useAuthStore(s => s.establishmentId);
  const currentUserId = useAuthStore(s => s.currentUser?.id);
  const hasSeenOnboarding = useAuthStore(s => s.hasSeenAppbelloOnboarding);
  const syncSetup = useSetupStore(s => s.syncFromSupabase);
  const [sessionRestored, setSessionRestored] = useState(false);
  const hasSeenTutorial = useTutorialStore(s => s.hasSeenTutorial);
  const startTutorial = useTutorialStore(s => s.startTutorial);

  const handleDeepLink = async (url: string) => {
    if (!url.includes('access_token')) return;
    const fragment = url.split('#')[1];
    if (!fragment) return;
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      // If this is a password recovery link, navigate to the new-password screen
      // instead of restoring the normal session flow
      if (type === 'recovery' || url.includes('new-password')) {
        router.replace('/new-password');
      } else {
        await restoreSession();
      }
    }
  };

  useEffect(() => {
    Linking.getInitialURL().then(url => { if (url) return handleDeepLink(url); }).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => { handleDeepLink(url).catch(() => {}); });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    restoreSession()
      .catch(() => {})
      .finally(() => {
        setSessionRestored(true);
        SplashScreen.hideAsync();
      });
  }, []);

  // Registra push token e sincroniza setup após autenticação
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      registerPushToken(currentUserId);
    }
    if (isAuthenticated && establishmentId) {
      syncSetup(establishmentId);
    }
  }, [isAuthenticated, currentUserId, establishmentId]);

  useEffect(() => {
    if (!sessionRestored) return;
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'onboarding' || segments[0] === 'reset-password' || segments[0] === 'new-password' || segments[0] === 'anamnesis-public' || segments[0] === 'register';
    if (!isAuthenticated && !inAuthGroup) {
      if (!hasSeenOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, segments, sessionRestored, hasSeenOnboarding]);

  // Tutorial antigo desativado — agora usa Walkthrough na tela principal

  return null;
}

// ── Agenda lembretes locais para atendimentos futuros ─────────────────────────
function ReminderScheduler() {
  const establishmentId = useAuthStore(s => s.establishmentId);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const reminderEnabled = useNotificationSettings(s => s.reminderEnabled);
  const reminderMinutes = useNotificationSettings(s => s.reminderMinutes);
  const { data: appointments = [] } = useAppointments(establishmentId ?? undefined);
  const { data: services = [] } = useServices(establishmentId ?? undefined);
  const { data: clients = [] } = useClients(establishmentId ?? undefined);

  useEffect(() => {
    if (!isAuthenticated || !reminderEnabled || appointments.length === 0) return;
    scheduleAppointmentReminders(appointments, services, clients, reminderMinutes);
  }, [isAuthenticated, reminderEnabled, reminderMinutes, appointments, services, clients]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootLayoutNav colorScheme={colorScheme} />
          <AuthGate />
          <ReminderScheduler />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}