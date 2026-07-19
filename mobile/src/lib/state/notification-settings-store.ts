import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettingsState {
  reminderEnabled: boolean;
  reminderMinutes: number; // padrão 30
  setReminderEnabled: (v: boolean) => void;
  setReminderMinutes: (v: number) => void;
}

export const useNotificationSettings = create<NotificationSettingsState>()(
  persist(
    (set) => ({
      reminderEnabled: true,
      reminderMinutes: 30,
      setReminderEnabled: (v) => set({ reminderEnabled: v }),
      setReminderMinutes: (v) => set({ reminderMinutes: v }),
    }),
    {
      name: 'notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
