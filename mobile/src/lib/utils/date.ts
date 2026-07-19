/**
 * Returns YYYY-MM-DD in local timezone.
 * Use instead of `new Date().toISOString().split('T')[0]` — toISOString() uses UTC
 * which shifts the date backward in timezones west of UTC (e.g. Brazil UTC-3).
 */
export function toLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD string as local noon to avoid UTC-midnight shift.
 * Use instead of `new Date(dateStr)` when you need a Date object for display/comparison.
 */
export function localDateFromStr(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}
