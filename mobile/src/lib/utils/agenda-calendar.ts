export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function isToday(date: Date | null): boolean {
  if (!date) return false;
  return isSameDay(date, new Date());
}

export function isCurrentMonth(date: Date): boolean {
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function formatYear(date: Date): string {
  return date.getFullYear().toString();
}

/** Days for a month-grid view: null padding before day 1, then one Date per day of the month. */
export function getMonthGridDays(selectedDate: Date): (Date | null)[] {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
  return days;
}

/** The 12 month-start dates for the year of `selectedDate`. */
export function getYearMonths(selectedDate: Date): Date[] {
  const year = selectedDate.getFullYear();
  return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
}
