import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Como mostrar notificações quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Agenda lembretes locais para atendimentos futuros ─────────────────────────
export async function scheduleAppointmentReminders(
  appointments: { id: string; date: string; time: string; status: string; clientName?: string; clientId?: string; serviceId?: string }[],
  services: { id: string; name: string }[],
  clients: { id: string; name: string }[],
  minutesBefore: number = 30
): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Cancela lembretes anteriores
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(n => n.identifier.startsWith('reminder-'))
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    const now = new Date();

    for (const apt of appointments) {
      if (apt.status === 'cancelled' || apt.status === 'completed') continue;

      // Monta a data/hora do atendimento
      const [h, m] = apt.time.split(':').map(Number);
      const aptDateTime = new Date(`${apt.date}T00:00:00`);
      aptDateTime.setHours(h, m, 0, 0);

      const reminderDate = new Date(aptDateTime.getTime() - minutesBefore * 60 * 1000);
      if (reminderDate <= now) continue; // Já passou

      const client = clients.find(c => c.id === apt.clientId);
      const service = services.find(s => s.id === apt.serviceId);
      const clientName = client?.name ?? apt.clientName ?? 'Cliente';
      const serviceName = service?.name ?? 'Atendimento';

      await Notifications.scheduleNotificationAsync({
        identifier: `reminder-${apt.id}`,
        content: {
          title: `🕐 Atendimento em ${minutesBefore} minutos`,
          body: `${clientName} — ${serviceName} às ${apt.time}`,
          sound: 'default',
          data: { type: 'reminder', appointmentId: apt.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });
    }
  } catch (e) {
    console.log('[Push] Erro ao agendar lembretes:', e);
  }
}

// ── Cancela lembrete de um atendimento específico ─────────────────────────────
export async function cancelAppointmentReminder(appointmentId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`reminder-${appointmentId}`);
  } catch {}
}

export async function registerPushToken(userId: string): Promise<void> {
  try {
    // Pede permissão
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    // Canal Android (necessário para Android 8+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('agendamentos', {
        name: 'Agendamentos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5333ED',
        sound: 'default',
        description: 'Notificações de novos agendamentos',
      });
    }

    // Obtém token FCM nativo do dispositivo (requer google-services.json)
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data as string;

    if (!token || !isSupabaseConfigured()) return;

    // Salva token no Supabase
    await supabase
      .from('profiles')
      .update({ push_token: token } as any)
      .eq('id', userId);

  } catch (e) {
    // Silencioso — não trava o app
    console.log('[Push] Erro ao registrar token:', e);
  }
}
