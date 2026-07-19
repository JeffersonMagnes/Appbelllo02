import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GoalsStore {
  monthlyGoal: number;
  setMonthlyGoal: (value: number) => void;
}

export const useGoalsStore = create<GoalsStore>()(
  persist(
    (set) => ({
      monthlyGoal: 0,
      setMonthlyGoal: (value) => set({ monthlyGoal: value }),
    }),
    {
      name: 'goals-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
