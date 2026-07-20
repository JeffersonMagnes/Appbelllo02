// Day-of-week mapping: JS getDay() index -> hours_json key
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export type EstablishmentHoursJson =
  | Record<string, { open: string; close: string; active: boolean }>
  | null
  | undefined;

/** Working hours for a given weekday, based on establishment config. Falls back to 7h–21h. */
export function getDayHours(hoursJson: EstablishmentHoursJson, date: Date): { openHour: number; closeHour: number } {
  const dayKey = DAY_KEYS[date.getDay()];
  const dayHours = hoursJson?.[dayKey];
  if (!dayHours || !dayHours.active) return { openHour: 7, closeHour: 21 };
  const openHour = parseInt(dayHours.open.split(':')[0], 10) || 7;
  const closeHour = parseInt(dayHours.close.split(':')[0], 10) || 21;
  return { openHour, closeHour: Math.max(closeHour, openHour + 1) };
}
