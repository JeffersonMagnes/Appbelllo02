// Remaining-trial display, shared by every mobile screen that shows a deadline.
// Mirrors Portal-site/lib/trial-remaining.ts — keep the two in sync.
//
// The remaining time comes from the effective expiry (trial_ends_at) and the
// server's own clock (server_time) at the moment the data was read, minus the
// time elapsed since then on a MONOTONIC clock. The device's wall clock is never
// read, and nothing is rounded up to "1 day".

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export type TrialTone = 'expired' | 'urgent' | 'warning' | 'ok';

export type TrialRemaining = {
  /** Milliseconds left (never negative). */
  ms: number;
  expired: boolean;
  /** Compact value without suffix: "45 min", "3h 20min", "2d 5h", "Menos de 1 min", "Trial expirado". */
  short: string;
  /** Full text for the UI: "45 min restantes", "Menos de 1 min", "Trial expirado". */
  label: string;
  tone: TrialTone;
};

/** Remaining ms from server-provided values; null when the server gave no usable expiry. */
export function remainingMs(
  trialEndsAt: string | null | undefined,
  serverTime: string | null | undefined,
  elapsedSinceReadMs: number,
): number | null {
  if (!trialEndsAt || !serverTime) return null;
  const ends = Date.parse(trialEndsAt);
  const serverNow = Date.parse(serverTime);
  if (Number.isNaN(ends) || Number.isNaN(serverNow)) return null;
  return ends - serverNow - Math.max(0, elapsedSinceReadMs);
}

export function formatTrialRemaining(ms: number | null | undefined): TrialRemaining {
  if (ms === null || ms === undefined || Number.isNaN(ms) || ms <= 0) {
    return { ms: 0, expired: true, short: 'Trial expirado', label: 'Trial expirado', tone: 'expired' };
  }
  let short: string;
  let label: string;
  if (ms < MINUTE) {
    short = 'Menos de 1 min';
    label = short;
  } else if (ms < HOUR) {
    short = `${Math.floor(ms / MINUTE)} min`;
    label = `${short} restantes`;
  } else if (ms < DAY) {
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    short = minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    label = `${short} restantes`;
  } else {
    const days = Math.floor(ms / DAY);
    const hours = Math.floor((ms % DAY) / HOUR);
    short = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    label = `${short} restantes`;
  }
  const tone: TrialTone = ms < DAY ? 'urgent' : ms <= 7 * DAY ? 'warning' : 'ok';
  return { ms, expired: false, short, label, tone };
}

/** "Trial expira em 35 min" / "Trial expira em menos de 1 min" / "Trial expirado". */
export function formatTrialExpiresIn(r: TrialRemaining): string {
  if (r.expired) return 'Trial expirado';
  if (r.ms < MINUTE) return 'Trial expira em menos de 1 min';
  return `Trial expira em ${r.short}`;
}

/** Fraction (0..1) of a nominal trial window still left, for progress bars. */
export function remainingFraction(ms: number | null | undefined, windowDays = 30): number {
  if (!ms || ms <= 0) return 0;
  return Math.min(1, ms / (windowDays * DAY));
}

export const TRIAL_DAY_MS = DAY;
