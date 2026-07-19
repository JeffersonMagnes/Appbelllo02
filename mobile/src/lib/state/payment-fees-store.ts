import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CardBrand = 'any' | 'mastercard' | 'visa' | 'elo' | 'hipercard' | 'amex';
export type ReceivesIn = 'per_installment' | 'today' | 'tomorrow' | 2 | 3 | 4 | 5 | 6 | 7 | 14 | 21 | 30 | 31 | 60 | 90;

export interface CardTaxEntry {
  id: string;
  installments: number; // 1 = à vista
  brand: CardBrand;
  feePercent: number;
  receivesIn: ReceivesIn;
}

export interface PixFee {
  feePercent: number;
  receivesIn: ReceivesIn;
}

export interface DebitFee {
  feePercent: number;
  receivesIn: ReceivesIn;
  brand: CardBrand;
}

interface PaymentFeesState {
  creditTaxes: CardTaxEntry[];
  debitTaxes: DebitFee[];
  pixFee: PixFee;

  addCreditTax: (entry: Omit<CardTaxEntry, 'id'>) => void;
  removeCreditTax: (id: string) => void;
  addDebitTax: (entry: DebitFee) => void;
  removeDebitTax: (index: number) => void;
  setPixFee: (fee: PixFee) => void;

  // Calcula taxa para um pagamento
  calcFeeForCredit: (amount: number, installments: number, brand?: CardBrand) => number;
  calcFeeForDebit: (amount: number, brand?: CardBrand) => number;
  calcFeeForPix: (amount: number) => number;
  calcFeeByMethod: (amount: number, method: string) => number;
}

const DEFAULT_CREDIT: CardTaxEntry[] = [
  { id: '1', installments: 1, brand: 'any', feePercent: 3.19, receivesIn: 'today' },
  { id: '2', installments: 2, brand: 'any', feePercent: 3.79, receivesIn: 'today' },
  { id: '3', installments: 3, brand: 'any', feePercent: 3.79, receivesIn: 'today' },
];

export const usePaymentFeesStore = create<PaymentFeesState>()(
  persist(
    (set, get) => ({
      creditTaxes: DEFAULT_CREDIT,
      debitTaxes: [{ feePercent: 1.99, receivesIn: 'today', brand: 'any' }],
      pixFee: { feePercent: 0.99, receivesIn: 'today' },

      addCreditTax: (entry) =>
        set((s) => ({
          creditTaxes: [...s.creditTaxes, { ...entry, id: Date.now().toString() }],
        })),

      removeCreditTax: (id) =>
        set((s) => ({ creditTaxes: s.creditTaxes.filter((t) => t.id !== id) })),

      addDebitTax: (entry) =>
        set((s) => ({ debitTaxes: [...s.debitTaxes, entry] })),

      removeDebitTax: (index) =>
        set((s) => ({ debitTaxes: s.debitTaxes.filter((_, i) => i !== index) })),

      setPixFee: (fee) => set({ pixFee: fee }),

      calcFeeForCredit: (amount, installments, brand = 'any') => {
        const taxes = get().creditTaxes;
        const match =
          taxes.find((t) => t.installments === installments && t.brand === brand) ||
          taxes.find((t) => t.installments === installments && t.brand === 'any') ||
          taxes.find((t) => t.brand === 'any') ||
          taxes[0];
        if (!match) return 0;
        return (amount * match.feePercent) / 100;
      },

      calcFeeForDebit: (amount, brand = 'any') => {
        const taxes = get().debitTaxes;
        const match =
          taxes.find((t) => t.brand === brand) ||
          taxes.find((t) => t.brand === 'any') ||
          taxes[0];
        if (!match) return 0;
        return (amount * match.feePercent) / 100;
      },

      calcFeeForPix: (amount) => {
        const { pixFee } = get();
        return (amount * pixFee.feePercent) / 100;
      },

      calcFeeByMethod: (amount, method) => {
        switch (method) {
          case 'credit': return get().calcFeeForCredit(amount, 1);
          case 'debit': return get().calcFeeForDebit(amount);
          case 'pix': return get().calcFeeForPix(amount);
          default: return 0;
        }
      },
    }),
    {
      name: 'payment-fees-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
