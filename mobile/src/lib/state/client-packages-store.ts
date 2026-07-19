import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SessionUsage {
  usedAt: string; // ISO date string
  serviceId?: string;
  note?: string;
}

export interface ClientPackage {
  id: string;
  clientId: string;
  packageId: string;
  packageName: string;
  serviceIds: string[];       // services included in the package
  totalSessions: number;
  usedSessions: number;
  sessionUsages: SessionUsage[];
  price: number;
  purchasedAt: string;        // ISO date string
  expiresAt: string;          // ISO date string
  status: 'active' | 'expired' | 'depleted';
}

interface ClientPackagesState {
  clientPackages: ClientPackage[];

  // Actions
  addClientPackage: (pkg: Omit<ClientPackage, 'id' | 'usedSessions' | 'sessionUsages' | 'status'>) => void;
  consumeSession: (clientPackageId: string, serviceId?: string, note?: string) => boolean;
  getClientPackages: (clientId: string) => ClientPackage[];
  getActiveClientPackages: (clientId: string) => ClientPackage[];
  recalcStatus: (clientPackageId: string) => void;
}

export const useClientPackagesStore = create<ClientPackagesState>()(
  persist(
    (set, get) => ({
      clientPackages: [],

      addClientPackage: (pkg) => {
        const newPkg: ClientPackage = {
          ...pkg,
          id: `cpkg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          usedSessions: 0,
          sessionUsages: [],
          status: 'active',
        };
        set(state => ({ clientPackages: [newPkg, ...state.clientPackages] }));
      },

      consumeSession: (clientPackageId: string, serviceId?: string, note?: string) => {
        const pkg = get().clientPackages.find(p => p.id === clientPackageId);
        if (!pkg || pkg.status !== 'active') return false;
        if (pkg.usedSessions >= pkg.totalSessions) return false;

        const usage: SessionUsage = {
          usedAt: new Date().toISOString(),
          serviceId,
          note,
        };

        set(state => ({
          clientPackages: state.clientPackages.map(p => {
            if (p.id !== clientPackageId) return p;
            const newUsed = p.usedSessions + 1;
            const nowExpired = new Date() > new Date(p.expiresAt);
            return {
              ...p,
              usedSessions: newUsed,
              sessionUsages: [...p.sessionUsages, usage],
              status: newUsed >= p.totalSessions
                ? 'depleted'
                : nowExpired
                ? 'expired'
                : 'active',
            };
          }),
        }));
        return true;
      },

      getClientPackages: (clientId) =>
        get().clientPackages.filter(p => p.clientId === clientId),

      getActiveClientPackages: (clientId) =>
        get().clientPackages.filter(
          p => p.clientId === clientId && p.status === 'active'
        ),

      recalcStatus: (clientPackageId) => {
        set(state => ({
          clientPackages: state.clientPackages.map(p => {
            if (p.id !== clientPackageId) return p;
            const nowExpired = new Date() > new Date(p.expiresAt);
            const depleted = p.usedSessions >= p.totalSessions;
            return {
              ...p,
              status: depleted ? 'depleted' : nowExpired ? 'expired' : 'active',
            };
          }),
        }));
      },
    }),
    {
      name: 'client-packages-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
