import { colors } from '@/lib/theme';
import { Comanda } from '@/lib/types';

export const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

export const getStatusConfig = (status: Comanda['status']) => {
  switch (status) {
    case 'open':   return { label: 'Aberta',  color: colors.warning,  bg: colors.warning  + '20' };
    case 'closed': return { label: 'Fechada', color: colors.primary,  bg: colors.primary  + '20' };
    case 'paid':   return { label: 'Paga',    color: colors.success,  bg: colors.success  + '20' };
    default:       return { label: '',        color: colors.textMuted, bg: colors.backgroundCard };
  }
};
