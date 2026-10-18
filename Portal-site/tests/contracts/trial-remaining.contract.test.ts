import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { formatTrialExpiresIn, formatTrialRemaining, remainingFraction, remainingMs } from '@/lib/trial-remaining';

const M = 60_000, H = 3_600_000, D = 86_400_000;

describe('formatTrialRemaining — limits', () => {
  test('expired: zero, negative, missing or invalid → "Trial expirado"', () => {
    for (const v of [0, -1, -5 * D, null, undefined, Number.NaN]) {
      const r = formatTrialRemaining(v as any);
      expect(r.label).toBe('Trial expirado');
      expect(r.expired).toBe(true);
      expect(r.tone).toBe('expired');
    }
  });

  test('under 1 minute → "Menos de 1 min" (including 1 ms and 59.999 s)', () => {
    for (const v of [1, 1_000, 30_000, M - 1]) {
      const r = formatTrialRemaining(v);
      expect(r.label).toBe('Menos de 1 min');
      expect(r.expired).toBe(false);
    }
  });

  test('under 1 hour → minutes remaining, truncated (never rounded up)', () => {
    expect(formatTrialRemaining(M).label).toBe('1 min restantes');
    expect(formatTrialRemaining(M + 59_999).label).toBe('1 min restantes');
    expect(formatTrialRemaining(35 * M + 45_000).label).toBe('35 min restantes');
    expect(formatTrialRemaining(H - 1).label).toBe('59 min restantes');
  });

  test('under 24 hours → hours and minutes', () => {
    expect(formatTrialRemaining(H).label).toBe('1h restantes');
    expect(formatTrialRemaining(H + M).label).toBe('1h 1min restantes');
    expect(formatTrialRemaining(3 * H + 20 * M + 59_000).label).toBe('3h 20min restantes');
    expect(formatTrialRemaining(D - 1).label).toBe('23h 59min restantes');
  });

  test('24 hours or more → days and hours', () => {
    expect(formatTrialRemaining(D).label).toBe('1d restantes');
    expect(formatTrialRemaining(D + H).label).toBe('1d 1h restantes');
    expect(formatTrialRemaining(2 * D + 5 * H + 59 * M).label).toBe('2d 5h restantes');
    expect(formatTrialRemaining(30 * D).label).toBe('30d restantes');
  });

  test('never reports "1 day" for a fraction of a day (the reported bug)', () => {
    // 20:30:45 expiry read at 19:55:00 → 35 min 45 s left
    const left = remainingMs('2026-10-18T23:30:45Z', '2026-10-18T22:55:00Z', 0)!;
    expect(left).toBe(35 * M + 45_000);
    expect(formatTrialRemaining(left).label).toBe('35 min restantes');
    expect(formatTrialRemaining(23 * H).label).not.toMatch(/1d/);
  });

  test('tone: urgent under 24 h, warning up to 7 days, ok beyond', () => {
    expect(formatTrialRemaining(D - 1).tone).toBe('urgent');
    expect(formatTrialRemaining(D).tone).toBe('warning');
    expect(formatTrialRemaining(7 * D).tone).toBe('warning');
    expect(formatTrialRemaining(7 * D + 1).tone).toBe('ok');
  });
});

describe('remainingMs — server reference + monotonic elapsed only', () => {
  const ends = '2026-10-18T23:30:45Z';
  const server = '2026-10-18T22:55:00Z';
  test('subtracts only the time elapsed since the server answer', () => {
    expect(remainingMs(ends, server, 0)).toBe(35 * M + 45_000);
    expect(remainingMs(ends, server, 5 * M)).toBe(30 * M + 45_000);
    expect(remainingMs(ends, server, 35 * M + 45_000)).toBe(0);
    expect(remainingMs(ends, server, 36 * M)).toBeLessThan(0);
  });
  test('negative elapsed (clock glitch) never extends the trial', () => {
    expect(remainingMs(ends, server, -10 * M)).toBe(35 * M + 45_000);
  });
  test('missing or invalid server data → null (caller falls back, never invents time)', () => {
    expect(remainingMs(null, server, 0)).toBeNull();
    expect(remainingMs(ends, undefined, 0)).toBeNull();
    expect(remainingMs('lixo', server, 0)).toBeNull();
  });
  test('does not read the wall clock', () => {
    const realNow = Date.now;
    Date.now = () => Date.parse('2001-01-01T00:00:00Z');
    try { expect(remainingMs(ends, server, 0)).toBe(35 * M + 45_000); } finally { Date.now = realNow; }
  });
});

describe('formatTrialExpiresIn', () => {
  test('banner/alert wording at the boundaries', () => {
    expect(formatTrialExpiresIn(formatTrialRemaining(0))).toBe('Trial expirado');
    expect(formatTrialExpiresIn(formatTrialRemaining(30_000))).toBe('Trial expira em menos de 1 min');
    expect(formatTrialExpiresIn(formatTrialRemaining(35 * M))).toBe('Trial expira em 35 min');
    expect(formatTrialExpiresIn(formatTrialRemaining(3 * H + 5 * M))).toBe('Trial expira em 3h 5min');
    expect(formatTrialExpiresIn(formatTrialRemaining(2 * D + H))).toBe('Trial expira em 2d 1h');
  });
});

describe('remainingFraction', () => {
  test('clamps to 0..1', () => {
    expect(remainingFraction(0)).toBe(0);
    expect(remainingFraction(-5)).toBe(0);
    expect(remainingFraction(15 * D)).toBe(0.5);
    expect(remainingFraction(90 * D)).toBe(1);
  });
});

describe('portal and mobile formatters stay identical', () => {
  const strip = (s: string) => s.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  test('same logic in both copies', () => {
    const a = readFileSync(resolve(import.meta.dir, '../../lib/trial-remaining.ts'), 'utf8');
    const b = readFileSync(resolve(import.meta.dir, '../../../mobile/src/lib/trial-remaining.ts'), 'utf8');
    expect(strip(a)).toBe(strip(b));
  });
});

describe('every portal screen that shows the deadline uses the exact countdown', () => {
  const read = (p: string) => readFileSync(resolve(import.meta.dir, '../..', p), 'utf8');
  const screens = [
    'app/admin/usuarios/page.tsx',
    'app/admin/assinaturas/page.tsx',
    'app/dashboard/page.tsx',
    'app/dashboard/assinatura/page.tsx',
    'components/dashboard/NotificationBanners.tsx',
  ];
  for (const file of screens) {
    test(file, () => {
      const src = read(file);
      expect(src).toContain('formatTrialRemaining');
      expect(src).toContain('remainingMs(');
      expect(src).toContain('useTrialClock');
      // no whole-day rounding left in the text shown to the user
      expect(src).not.toMatch(/\$\{(s|u|sub)?\.?trialDaysLeft\}d/);
      expect(src).not.toContain('{trialDaysLeft} dias restantes');
      expect(src).not.toContain('Hoje!');
      expect(src).not.toMatch(/Trial expira em \$\{trialDaysLeft\}/);
    });
  }

  test('the clock hook uses the monotonic clock, re-reads on focus/visibility and never the wall clock', () => {
    const hook = read('lib/hooks/use-trial-clock.ts');
    expect(hook).toContain('performance.now()');
    expect(hook).toContain('visibilitychange');
    expect(hook).toContain("'focus'");
    expect(hook).toContain('setInterval');
    expect(hook).not.toContain('Date.now()');
    expect(hook).not.toContain('new Date(');
  });
});
