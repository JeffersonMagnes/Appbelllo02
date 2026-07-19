import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Employee } from '@/lib/types';

interface EmployeesStore {
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employee: Employee) => void;
  removeEmployee: (id: string) => void;
}

export const useEmployeesStore = create<EmployeesStore>()(
  persist(
    (set) => ({
      employees: [] as Employee[],
      addEmployee: (employee) =>
        set((state) => ({ employees: [...state.employees, employee] })),
      updateEmployee: (employee) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === employee.id ? employee : e)),
        })),
      removeEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id),
        })),
    }),
    {
      name: 'employees-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ employees: state.employees }),
      merge: (persisted, current) => ({
        ...current,
        employees: (persisted as { employees?: Employee[] })?.employees ?? current.employees,
      }),
    }
  )
);
