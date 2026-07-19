import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const REFERRAL_DISCOUNT_PERCENT = 20; // 20% de desconto para quem usa código
export const REFERRAL_REWARD_MONTHS = 1; // 1 mês grátis para quem indicou (futuro)

// Gera código determinístico baseado no userId (garante unicidade) ou aleatório como fallback
function generateReferralCode(seed?: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  if (seed) {
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
      hash = hash >>> 0;
    }
    for (let i = 0; i < 8; i++) {
      hash = ((hash << 5) + hash) ^ (i * 31);
      hash = hash >>> 0;
      code += chars.charAt(hash % chars.length);
    }
  } else {
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return code;
}

export interface ReferralUsage {
  usedAt: string; // ISO date
  planId: string;
  discountPercent: number;
}

interface ReferralState {
  // Código deste usuário (para compartilhar)
  myReferralCode: string | null;

  // Código que o usuário inseriu ao assinar
  appliedReferralCode: string | null;

  // Desconto aplicado (em %)
  appliedDiscount: number;

  // Histórico de usos do código deste usuário
  referralUses: ReferralUsage[];

  // Ações
  initReferralCode: (userId?: string) => string;
  applyReferralCode: (code: string) => { success: boolean; message: string };
  clearAppliedCode: () => void;
  getDiscountedPrice: (originalPrice: number) => number;
  addReferralUse: (planId: string) => void;
}

// Lista de códigos válidos para demo (em produção viria do backend)
// O código do usuário atual também será válido
const VALID_DEMO_CODES = [
  'AMIGO2024',
  'DESCONTO20',
  'BELLA2024',
  'SALAO10',
];

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      myReferralCode: null,
      appliedReferralCode: null,
      appliedDiscount: 0,
      referralUses: [],

      initReferralCode: (userId?: string) => {
        const { myReferralCode } = get();
        if (myReferralCode) return myReferralCode;
        const code = generateReferralCode(userId);
        set({ myReferralCode: code });
        return code;
      },

      applyReferralCode: (code: string) => {
        const { myReferralCode } = get();
        const normalized = code.trim().toUpperCase();

        if (!normalized) {
          return { success: false, message: 'Por favor, insira um código.' };
        }

        // Não pode usar o próprio código
        if (normalized === myReferralCode) {
          return { success: false, message: 'Você não pode usar seu próprio código de indicação.' };
        }

        // Verifica se é um código válido — apenas códigos demo conhecidos ou exatos
        const isValid = VALID_DEMO_CODES.includes(normalized);

        if (!isValid) {
          return { success: false, message: 'Código inválido. Verifique e tente novamente.' };
        }

        set({
          appliedReferralCode: normalized,
          appliedDiscount: REFERRAL_DISCOUNT_PERCENT,
        });

        return {
          success: true,
          message: `Código aplicado! Você ganhou ${REFERRAL_DISCOUNT_PERCENT}% de desconto.`,
        };
      },

      clearAppliedCode: () => {
        set({ appliedReferralCode: null, appliedDiscount: 0 });
      },

      getDiscountedPrice: (originalPrice: number) => {
        const { appliedDiscount } = get();
        if (!appliedDiscount) return originalPrice;
        return Math.round(originalPrice * (1 - appliedDiscount / 100));
      },

      addReferralUse: (planId: string) => {
        const { referralUses } = get();
        set({
          referralUses: [
            ...referralUses,
            {
              usedAt: new Date().toISOString(),
              planId,
              discountPercent: REFERRAL_DISCOUNT_PERCENT,
            },
          ],
        });
      },
    }),
    {
      name: 'referral-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
