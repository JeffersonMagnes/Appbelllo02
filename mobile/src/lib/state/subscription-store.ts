import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'none';

export type PlanType = 'starter' | 'pro';

export interface Plan {
  id: PlanType;
  name: string;
  price: string;
  priceMonthly: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 49/mês',
    priceMonthly: 49,
    description: 'Ideal para profissionais autônomos',
    features: [
      'Até 5 profissionais',
      'Agenda ilimitada',
      'Gestão de clientes',
      'Controle financeiro',
      'Relatórios',
      'Controle de estoque',
      'Comissões',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 99/mês',
    priceMonthly: 99,
    description: 'Para salões em crescimento',
    features: [
      'Tudo do Starter',
      'Profissionais ilimitados',
      'Assistente IA',
      'Link de agendamento premium',
      'Suporte prioritário',
    ],
    highlighted: true,
  },
];

export const TRIAL_DAYS = 30;

// Server-computed entitlement (mirrors the SQL type public.establishment_access).
// This is the ONLY authority for access decisions — it is cached here purely so
// the UI has something to render before the RPC resolves or while offline.
// Real enforcement always happens at the database (RLS), never on this cache.
export interface ServerAccess {
  hasAccess: boolean;
  status: 'subscription_active' | 'trial' | 'trial_expired';
  planId: string | null;
  trialDaysLeft: number;
  reason: string;
  fetchedAt: string;
}

interface SubscriptionState {
  trialStartDate: string | null;
  extraTrialDays: number;
  subscriptionStatus: SubscriptionStatus;
  activePlan: PlanType | null;
  subscriptionEndDate: string | null;
  serverAccess: ServerAccess | null;

  // Actions
  startTrial: () => void;
  syncTrialStartDate: (isoDate: string) => void;
  syncExtraTrialDays: (extra: number) => void;
  syncServerAccess: (access: ServerAccess) => void;
  activateSubscription: (plan: PlanType) => void;
  getTrialDaysLeft: () => number;
  getTrialDaysElapsed: () => number;
  getTrialProgress: () => number; // 0 to 1
  isTrialExpired: () => boolean;
  isActive: () => boolean;
  hasAccess: () => boolean;
  resetSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      trialStartDate: null,
      extraTrialDays: 0,
      subscriptionStatus: 'none',
      activePlan: null,
      subscriptionEndDate: null,
      serverAccess: null,

      syncServerAccess: (access) => {
        set({ serverAccess: access });
      },

      startTrial: () => {
        const { trialStartDate } = get();
        if (trialStartDate) return; // Already started
        set({
          trialStartDate: new Date().toISOString(),
          subscriptionStatus: 'trial',
        });
      },

      syncExtraTrialDays: (extra: number) => {
        set({ extraTrialDays: extra });
      },

      // Sincroniza a data de início do trial com a data real do Supabase
      syncTrialStartDate: (isoDate: string) => {
        const { subscriptionStatus } = get();
        // Só atualiza se ainda está em trial ou nunca iniciou
        if (subscriptionStatus === 'active') return;
        set({
          trialStartDate: isoDate,
          subscriptionStatus: 'trial',
        });
      },

      activateSubscription: (plan) => {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
        set({
          subscriptionStatus: 'active',
          activePlan: plan,
          subscriptionEndDate: endDate.toISOString(),
        });
      },

      getTrialDaysLeft: () => {
        const { trialStartDate, extraTrialDays, serverAccess } = get();
        if (serverAccess) return serverAccess.trialDaysLeft;
        // Fallback while the server hasn't answered yet (first render / offline).
        // Never treated as authoritative — the database enforces access
        // regardless of what this local estimate says.
        if (!trialStartDate) return TRIAL_DAYS + extraTrialDays;
        const start = new Date(trialStartDate);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, TRIAL_DAYS + extraTrialDays - elapsed);
      },

      getTrialDaysElapsed: () => {
        const { trialStartDate, extraTrialDays } = get();
        if (!trialStartDate) return 0;
        const start = new Date(trialStartDate);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.min(TRIAL_DAYS + extraTrialDays, elapsed);
      },

      getTrialProgress: () => {
        const { getTrialDaysElapsed, extraTrialDays } = get();
        return getTrialDaysElapsed() / (TRIAL_DAYS + extraTrialDays);
      },

      isTrialExpired: () => {
        const { serverAccess, subscriptionStatus, getTrialDaysLeft } = get();
        if (serverAccess) return serverAccess.status === 'trial_expired';
        if (subscriptionStatus !== 'trial') return false;
        return getTrialDaysLeft() <= 0;
      },

      isActive: () => {
        const { serverAccess, subscriptionStatus } = get();
        if (serverAccess) return serverAccess.status === 'subscription_active';
        return subscriptionStatus === 'active';
      },

      hasAccess: () => {
        // Authoritative when we have it. This only gates client navigation
        // (e.g. redirecting to the paywall) — actual data access is enforced
        // by the database regardless of this value.
        const { serverAccess, subscriptionStatus, getTrialDaysLeft } = get();
        if (serverAccess) return serverAccess.hasAccess;
        if (subscriptionStatus === 'active') return true;
        if (subscriptionStatus === 'trial') return getTrialDaysLeft() > 0;
        return false;
      },

      resetSubscription: () => {
        set({
          trialStartDate: null,
          extraTrialDays: 0,
          subscriptionStatus: 'none',
          activePlan: null,
          subscriptionEndDate: null,
          serverAccess: null,
        });
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
