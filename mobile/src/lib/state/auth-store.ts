import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ensureEstablishment } from '@/lib/hooks/use-establishment';
import { useSubscriptionStore } from '@/lib/state/subscription-store';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useSetupStore } from '@/lib/state/setup-store';

// Sincroniza o trial com o created_at do estabelecimento no Supabase
async function syncTrialWithSupabase(userId: string): Promise<void> {
  try {
    const { data } = await (supabase as any)
      .from('establishments')
      .select('trial_started_at, extra_trial_days')
      .eq('owner_id', userId)
      .single();
    if (data?.trial_started_at) {
      useSubscriptionStore.getState().syncTrialStartDate(data.trial_started_at as string);
      useSubscriptionStore.getState().syncExtraTrialDays((data.extra_trial_days as number) ?? 0);
    }
  } catch (error) {
    console.error('syncTrialWithSupabase failed:', error);
  }
}

export type UserRole = 'owner' | 'admin' | 'employee';

export type EmployeePermissions = {
  viewAgenda: boolean;
  viewClients: boolean;
  viewFinancial: boolean;
  viewReports: boolean;
  viewProducts: boolean;
  viewComandas: boolean;
  editAgenda: boolean;
  editClients: boolean;
};

export type EmployeeAccess = {
  id: string;
  employeeId: string;
  email: string;
  pin: string;
  isActive: boolean;
  permissions: EmployeePermissions;
  createdAt: string;
  lastLogin?: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  employeeId?: string;
  permissions?: EmployeePermissions;
};

export const defaultEmployeePermissions: EmployeePermissions = {
  viewAgenda: true,
  viewClients: false,
  viewFinancial: false,
  viewReports: false,
  viewProducts: false,
  viewComandas: false,
  editAgenda: true,
  editClients: false,
};

export const adminPermissions: EmployeePermissions = {
  viewAgenda: true,
  viewClients: true,
  viewFinancial: true,
  viewReports: true,
  viewProducts: true,
  viewComandas: true,
  editAgenda: true,
  editClients: true,
};

interface AuthState {
  currentUser: CurrentUser | null;
  establishmentId: string | null;
  employeeAccesses: EmployeeAccess[];
  hasSeenAppbelloOnboarding: boolean;
  setHasSeenAppbelloOnboarding: (value: boolean) => void;
  isAuthenticated: boolean;

  setCurrentUser: (user: CurrentUser | null) => void;
  setEstablishmentId: (id: string | null) => void;

  isDemoMode: boolean;

  // Owner auth via Supabase
  loginAsOwner: (email: string, password: string) => Promise<{ success: boolean; error?: string; isDemoMode?: boolean }>;
  signUpOwner: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;

  // Employee auth (local PIN)
  loginAsEmployee: (pin: string) => { success: boolean; error?: string };

  // Employee access management
  createEmployeeAccess: (employeeId: string, email: string, pin: string, permissions?: EmployeePermissions) => void;
  updateEmployeeAccess: (id: string, updates: Partial<EmployeeAccess>) => void;
  deleteEmployeeAccess: (id: string) => void;
  toggleEmployeeAccessActive: (id: string) => void;
  updateEmployeePermissions: (id: string, permissions: EmployeePermissions) => void;
  getEmployeeAccess: (employeeId: string) => EmployeeAccess | undefined;

  hasPermission: (permission: keyof EmployeePermissions) => boolean;
  isOwner: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      establishmentId: null,
      employeeAccesses: [],
      hasSeenAppbelloOnboarding: false,
      isAuthenticated: false,
      isDemoMode: false,

      setHasSeenAppbelloOnboarding: (value) => set({ hasSeenAppbelloOnboarding: value }),
      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
      setEstablishmentId: (id) => set({ establishmentId: id }),

      loginAsOwner: async (email, password) => {
        if (!isSupabaseConfigured()) {
          set({
            currentUser: {
              id: 'owner-demo',
              name: email.split('@')[0],
              email,
              role: 'owner',
              permissions: adminPermissions,
            },
            isAuthenticated: true,
            isDemoMode: true,
          });
          return { success: true, isDemoMode: true };
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
          let errorMessage = error?.message ?? 'Erro ao fazer login';
          if (errorMessage.toLowerCase().includes('email not confirmed')) {
            errorMessage = 'E-mail não confirmado. Verifique sua caixa de entrada e clique no link de confirmação para ativar sua conta.';
          } else if (errorMessage.toLowerCase().includes('invalid login credentials')) {
            errorMessage = 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
          } else if (errorMessage.toLowerCase().includes('too many requests')) {
            errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
          } else if (errorMessage.toLowerCase().includes('user not found')) {
            errorMessage = 'Usuário não encontrado. Verifique o e-mail informado.';
          }
          return { success: false, error: errorMessage };
        }

        const name = (data.user.user_metadata?.name as string | undefined)
          ?? email.split('@')[0];

        const estId = await ensureEstablishment(data.user.id, name);

        // Garantir que o dono aparece como funcionário
        if (estId) {
          try {
            const { data: existingEmps } = await (supabase as any)
              .from('employees')
              .select('id')
              .eq('establishment_id', estId)
              .limit(1);
            if (!existingEmps || existingEmps.length === 0) {
              await (supabase as any).from('employees').insert({
                establishment_id: estId,
                name,
                email: data.user.email ?? email,
                role: 'professional',
                specialty: 'Proprietário',
                commission_type: 'percentage',
                commission_value: 0,
                active: true,
              });
            }
          } catch (error) {
            console.error('Failed to ensure owner employee record (login):', error);
          }
        }

        set({
          currentUser: {
            id: data.user.id,
            name,
            email: data.user.email ?? email,
            role: 'owner',
            permissions: adminPermissions,
          },
          establishmentId: estId,
          isAuthenticated: true,
          isDemoMode: false,
        });

        // Sincroniza o trial com a data real do Supabase
        syncTrialWithSupabase(data.user.id);

        return { success: true };
      },

      signUpOwner: async (email, password, name) => {
        if (!isSupabaseConfigured()) {
          return { success: false, error: 'Supabase não configurado' };
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: 'appbello://' },
        });
        if (error || !data.user) {
          return { success: false, error: error?.message ?? 'Erro ao criar conta' };
        }

        // Session is null when Supabase requires email confirmation
        if (!data.session) {
          return { success: true, needsEmailConfirmation: true };
        }

        const estId = await ensureEstablishment(data.user.id, name);

        set({
          currentUser: {
            id: data.user.id,
            name,
            email: data.user.email ?? email,
            role: 'owner',
            permissions: adminPermissions,
          },
          establishmentId: estId,
          isAuthenticated: true,
        });

        return { success: true };
      },

      restoreSession: async () => {
        if (!isSupabaseConfigured()) return;
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) return;

        const user = data.session.user;
        const name = (user.user_metadata?.name as string | undefined) ?? user.email?.split('@')[0] ?? 'Usuário';

        // Garante que o estabelecimento existe (cria se necessário)
        const estId = await ensureEstablishment(user.id, name);

        // Garantir que o dono aparece como funcionário
        if (estId) {
          try {
            const { data: existingEmps } = await (supabase as any)
              .from('employees')
              .select('id')
              .eq('establishment_id', estId)
              .limit(1);
            if (!existingEmps || existingEmps.length === 0) {
              await (supabase as any).from('employees').insert({
                establishment_id: estId,
                name,
                email: user.email ?? '',
                role: 'professional',
                specialty: 'Proprietário',
                commission_type: 'percentage',
                commission_value: 0,
                active: true,
              });
            }
          } catch (error) {
            console.error('Failed to ensure owner employee record (restoreSession):', error);
          }
        }

        set({
          currentUser: {
            id: user.id,
            name,
            email: user.email ?? '',
            role: 'owner',
            permissions: adminPermissions,
          },
          establishmentId: estId,
          isAuthenticated: true,
        });

        // Sincroniza o trial com a data real do Supabase
        syncTrialWithSupabase(user.id);
      },

      logout: async () => {
        if (isSupabaseConfigured()) {
          await supabase.auth.signOut();
        }
        set({ currentUser: null, isAuthenticated: false, establishmentId: null, isDemoMode: false });
        useOnboardingStore.getState().resetOnboarding();
        useSetupStore.setState({ completedSteps: [], dismissed: false, lastShownAt: null });
      },

      loginAsEmployee: (pin) => {
        const { employeeAccesses } = get();
        const access = employeeAccesses.find((a) => a.pin === pin && a.isActive);
        if (!access) return { success: false, error: 'PIN inválido ou acesso desativado' };

        set({
          currentUser: {
            id: access.id,
            name: access.email.split('@')[0],
            email: access.email,
            role: 'employee',
            employeeId: access.employeeId,
            permissions: access.permissions,
          },
          isAuthenticated: true,
        });

        set((state) => ({
          employeeAccesses: state.employeeAccesses.map((a) =>
            a.id === access.id ? { ...a, lastLogin: new Date().toISOString() } : a
          ),
        }));

        return { success: true };
      },

      createEmployeeAccess: (employeeId, email, pin, permissions = defaultEmployeePermissions) => {
        const newAccess: EmployeeAccess = {
          id: `access-${Date.now()}`,
          employeeId,
          email,
          pin,
          isActive: true,
          permissions,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ employeeAccesses: [...state.employeeAccesses, newAccess] }));
      },

      updateEmployeeAccess: (id, updates) => {
        set((state) => ({
          employeeAccesses: state.employeeAccesses.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      deleteEmployeeAccess: (id) => {
        set((state) => ({
          employeeAccesses: state.employeeAccesses.filter((a) => a.id !== id),
        }));
      },

      toggleEmployeeAccessActive: (id) => {
        set((state) => ({
          employeeAccesses: state.employeeAccesses.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive } : a
          ),
        }));
      },

      updateEmployeePermissions: (id, permissions) => {
        set((state) => ({
          employeeAccesses: state.employeeAccesses.map((a) =>
            a.id === id ? { ...a, permissions } : a
          ),
        }));
      },

      getEmployeeAccess: (employeeId) => {
        return get().employeeAccesses.find((a) => a.employeeId === employeeId);
      },

      hasPermission: (permission) => {
        const { currentUser } = get();
        if (!currentUser) return false;
        if (currentUser.role === 'owner') return true;
        return currentUser.permissions?.[permission] ?? false;
      },

      isOwner: () => get().currentUser?.role === 'owner',
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        employeeAccesses: state.employeeAccesses,
        establishmentId: state.establishmentId,
        hasSeenAppbelloOnboarding: state.hasSeenAppbelloOnboarding,
      }),
    }
  )
);
