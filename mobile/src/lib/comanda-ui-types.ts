import { Comanda } from '@/lib/types';

export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash' | 'cheque' | 'cortesia';

export interface PaymentSlice {
  id: string;
  method: PaymentMethod;
  amount: number;
}

export interface PaymentState {
  visible: boolean;
  comandaId: string;
  clientName: string;
  total: number;
}

export interface ReceiptData {
  visible: boolean;
  clientName: string;
  items: Comanda['items'];
  originalTotal: number;
  discountAmt: number;
  discountLabel: string;
  finalTotal: number;
  slices: PaymentSlice[];
  paidAt: string;
  receiptNum: string;
}

export interface PrintState {
  visible: boolean;
  clientName: string;
  total: number;
  comandaId: string;
  items: Comanda['items'];
}

export interface NewComandaState {
  visible: boolean;
  search: string;
}

export interface AddItemState {
  visible: boolean;
  comandaId: string;
  tab: 'service' | 'product';
}
