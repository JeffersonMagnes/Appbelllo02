import { Mobile, Card, Money, TickSquare } from 'iconsax-react';

export const DEFAULT_HOURS = Array.from({ length: 14 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
export const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const statusColors: Record<string, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  completed: 'bg-blue-500',
  delayed: 'bg-orange-500',
  no_show: 'bg-gray-500',
};

export const statusBadgeColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  delayed: 'bg-orange-100 text-orange-700',
  no_show: 'bg-gray-100 text-gray-700',
};

export const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  delayed: 'Atrasado',
  no_show: 'Não Compareceu',
};

export function fmt(date: Date) {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}
export function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}
export function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
export function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export const HOUR_PX = 60;

export const PAY_METHODS = [
  { v: 'pix', l: 'PIX', Icon: Mobile, color: '#0BBDB6' },
  { v: 'credito', l: 'Crédito', Icon: Card, color: '#7C3AED' },
  { v: 'debito', l: 'Débito', Icon: Card, color: '#3B82F6' },
  { v: 'dinheiro', l: 'Dinheiro', Icon: Money, color: '#22C55E' },
  { v: 'cheque', l: 'Cheque', Icon: Card, color: '#F59E0B' },
  { v: 'cortesia', l: 'Cortesia', Icon: TickSquare, color: '#EC4899' },
];
