import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmployeePermissions } from '@/lib/state/auth-store';
import { colors } from '@/lib/theme';

export type BusinessType = 'salon' | 'barbershop' | 'clinic' | 'spa' | 'studio' | '';

export interface EmployeeRole {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: EmployeePermissions;
  isDefault: boolean;
  createdAt: string;
}

const allPerms: EmployeePermissions = {
  viewAgenda: true, editAgenda: true,
  viewClients: true, editClients: true,
  viewFinancial: true, viewReports: true,
  viewProducts: true, viewComandas: true,
};

const agendaOnly: EmployeePermissions = {
  viewAgenda: true, editAgenda: true,
  viewClients: true, editClients: false,
  viewFinancial: false, viewReports: false,
  viewProducts: false, viewComandas: false,
};

const reception: EmployeePermissions = {
  viewAgenda: true, editAgenda: true,
  viewClients: true, editClients: true,
  viewFinancial: false, viewReports: false,
  viewProducts: false, viewComandas: true,
};

const manager: EmployeePermissions = {
  viewAgenda: true, editAgenda: true,
  viewClients: true, editClients: true,
  viewFinancial: false, viewReports: false,
  viewProducts: true, viewComandas: true,
};

const clinicPro: EmployeePermissions = {
  viewAgenda: true, editAgenda: true,
  viewClients: true, editClients: true,
  viewFinancial: false, viewReports: false,
  viewProducts: false, viewComandas: false,
};

function makeRole(id: string, name: string, description: string, color: string, permissions: EmployeePermissions, isDefault = false): EmployeeRole {
  return { id, name, description, color, permissions, isDefault, createdAt: new Date().toISOString() };
}

function generateRolesForType(type: BusinessType): EmployeeRole[] {
  const admin = makeRole('admin', 'Admin', 'Acesso total ao sistema', colors.error, allPerms, true);

  if (type === 'salon') {
    return [
      admin,
      makeRole('cabeleireiro', 'Cabeleireiro/a', 'Atendimento de cabelo e coloração', colors.primary, agendaOnly),
      makeRole('manicure', 'Manicure/Pedicure', 'Cuidados com unhas', colors.secondary, agendaOnly),
      makeRole('recepcionista', 'Recepcionista', 'Agendamentos e atendimento', colors.success, reception),
      makeRole('gerente', 'Gerente', 'Gestão operacional', colors.warning, manager),
    ];
  }

  if (type === 'barbershop') {
    return [
      admin,
      makeRole('barbeiro', 'Barbeiro', 'Cortes e barbearia', colors.primary, agendaOnly),
      makeRole('recepcionista', 'Recepcionista', 'Agendamentos e atendimento', colors.success, reception),
      makeRole('gerente', 'Gerente', 'Gestão operacional', colors.warning, manager),
    ];
  }

  if (type === 'clinic') {
    return [
      admin,
      makeRole('esteticista', 'Esteticista', 'Tratamentos estéticos', colors.primary, clinicPro),
      makeRole('especialista', 'Médico/Especialista', 'Consultas e procedimentos', colors.info, clinicPro),
      makeRole('recepcionista', 'Recepcionista', 'Agendamentos e atendimento', colors.success, reception),
      makeRole('gerente', 'Gerente', 'Gestão operacional', colors.warning, manager),
    ];
  }

  // fallback
  return [
    admin,
    makeRole('professional', 'Profissional', 'Atendimento de clientes', colors.primary, agendaOnly),
    makeRole('receptionist', 'Recepcionista', 'Agendamentos e atendimento', colors.success, reception),
  ];
}

interface RolesStore {
  roles: EmployeeRole[];
  seeded: boolean;
  addRole: (role: Omit<EmployeeRole, 'id' | 'createdAt' | 'isDefault'>) => EmployeeRole;
  updateRole: (id: string, updates: Partial<Pick<EmployeeRole, 'name' | 'description' | 'color' | 'permissions'>>) => void;
  removeRole: (id: string) => void;
  seedRolesForType: (type: BusinessType) => void;
}

export const useRolesStore = create<RolesStore>()(
  persist(
    (set, get) => ({
      roles: [],
      seeded: false,

      addRole: (roleData) => {
        const newRole: EmployeeRole = {
          ...roleData,
          id: `role-${Date.now()}`,
          isDefault: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ roles: [...state.roles, newRole] }));
        return newRole;
      },

      updateRole: (id, updates) => {
        set((state) => ({
          roles: state.roles.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }));
      },

      removeRole: (id) => {
        set((state) => ({
          roles: state.roles.filter((r) => r.id !== id || r.isDefault),
        }));
      },

      seedRolesForType: (type) => {
        if (get().seeded) return;
        set({ roles: generateRolesForType(type), seeded: true });
      },
    }),
    {
      name: 'roles-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ roles: state.roles, seeded: state.seeded }),
    }
  )
);
