import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  required: boolean;
}

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'business',
    title: 'Dados do Estabelecimento',
    description: 'Nome, tipo e contato do seu negócio',
    route: '/onboarding/step-2',
    icon: 'building',
    required: true,
  },
  {
    id: 'address',
    title: 'Endereço',
    description: 'Localização do seu estabelecimento',
    route: '/onboarding/step-3',
    icon: 'map-pin',
    required: true,
  },
  {
    id: 'branding',
    title: 'Logo & Cores',
    description: 'Personalize a identidade visual',
    route: '/onboarding/step-4',
    icon: 'palette',
    required: false,
  },
  {
    id: 'hours',
    title: 'Horário de Funcionamento',
    description: 'Dias e horários de atendimento',
    route: '/onboarding/step-5',
    icon: 'clock',
    required: true,
  },
  {
    id: 'services',
    title: 'Serviços',
    description: 'Quais serviços você oferece',
    route: '/(tabs)/services',
    icon: 'scissors',
    required: false,
  },
];

interface SetupState {
  completedSteps: string[];
  dismissed: boolean;
  lastShownAt: string | null;

  completeStep: (stepId: string) => void;
  uncompleteStep: (stepId: string) => void;
  isStepComplete: (stepId: string) => boolean;
  getCompletionPercent: () => number;
  getPendingSteps: () => SetupStep[];
  getRequiredPendingSteps: () => SetupStep[];
  dismiss: () => void;
  resetDismiss: () => void;
  isFullyComplete: () => boolean;
  syncFromSupabase: (establishmentId: string) => Promise<void>;
}

export const useSetupStore = create<SetupState>()(
  persist(
    (set, get) => ({
      completedSteps: [],
      dismissed: false,
      lastShownAt: null,

      completeStep: (stepId) => {
        set(s => ({
          completedSteps: s.completedSteps.includes(stepId)
            ? s.completedSteps
            : [...s.completedSteps, stepId],
        }));
      },

      uncompleteStep: (stepId) => {
        set(s => ({
          completedSteps: s.completedSteps.filter(id => id !== stepId),
        }));
      },

      isStepComplete: (stepId) => {
        return get().completedSteps.includes(stepId);
      },

      getCompletionPercent: () => {
        const total = SETUP_STEPS.length;
        const done = get().completedSteps.length;
        return Math.round((done / total) * 100);
      },

      getPendingSteps: () => {
        return SETUP_STEPS.filter(s => !get().completedSteps.includes(s.id));
      },

      getRequiredPendingSteps: () => {
        return SETUP_STEPS.filter(s => s.required && !get().completedSteps.includes(s.id));
      },

      dismiss: () => {
        set({ dismissed: true, lastShownAt: new Date().toISOString() });
      },

      resetDismiss: () => {
        set({ dismissed: false });
      },

      isFullyComplete: () => {
        return SETUP_STEPS.every(s => get().completedSteps.includes(s.id));
      },

      syncFromSupabase: async (establishmentId: string) => {
        if (!isSupabaseConfigured() || !establishmentId) return;
        try {
          const [estResult, profResult, svcResult] = await Promise.all([
            supabase.from('establishments').select('name, address, phone, business_type, logo_url, primary_color, hours_json').eq('id', establishmentId).single(),
            supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('establishment_id', establishmentId).eq('active', true),
            supabase.from('services').select('id', { count: 'exact', head: true }).eq('establishment_id', establishmentId).eq('active', true),
          ]);
          const est = estResult.data as any;
          const verified: string[] = [];
          if (est?.name && est?.phone) verified.push('business');
          if (est?.address) verified.push('address');
          if (est?.logo_url || est?.primary_color) verified.push('branding');
          if (est?.hours_json) verified.push('hours');
          if ((profResult.count ?? 0) > 0) verified.push('professional');
          if ((svcResult.count ?? 0) > 0) verified.push('services');
          if (verified.length > 0) {
            set(s => ({ completedSteps: [...new Set([...s.completedSteps, ...verified])] }));
          }
        } catch {
          // ignora silenciosamente
        }
      },
    }),
    {
      name: 'setup-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
