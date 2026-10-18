// Pure helpers for the admin "Estender Trial" flow. The server is the only
// place that computes trial end dates (admin_preview_trial_adjustment /
// admin_grant_trial_time); nothing here derives an expiry from the browser clock.

export type TrialUnit = 'minutes' | 'hours' | 'days';
export type TrialMode = 'extend' | 'from_now';

export const TRIAL_UNITS: { value: TrialUnit; label: string; max: number }[] = [
  { value: 'minutes', label: 'Minutos', max: 365 * 24 * 60 },
  { value: 'hours', label: 'Horas', max: 365 * 24 },
  { value: 'days', label: 'Dias', max: 365 },
];

export const BRASILIA_TZ = 'America/Sao_Paulo';
export const BRASILIA_LABEL = 'Brasília, UTC−3';

const brasiliaFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BRASILIA_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** "18/10/2026 18:30:00 (Brasília, UTC−3)" — always the Brasília wall clock, whatever the browser timezone. */
export function formatBrasilia(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  // Built from parts so the output does not depend on the ICU version's separators.
  const p: Record<string, string> = {};
  for (const part of brasiliaFormat.formatToParts(date)) p[part.type] = part.value;
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second} (${BRASILIA_LABEL})`;
}

/** Returns an error message, or null when the amount is acceptable for the unit. Mirrors the server rules. */
export function validateAmount(raw: string, unit: TrialUnit): string | null {
  if (!/^\d+$/.test(raw.trim())) return 'Informe um número inteiro maior que zero.';
  const amount = Number(raw);
  if (!Number.isSafeInteger(amount) || amount <= 0) return 'Informe um número inteiro maior que zero.';
  const max = TRIAL_UNITS.find((u) => u.value === unit)!.max;
  if (amount > max) return `O máximo é ${max} ${unit === 'days' ? 'dias' : unit === 'hours' ? 'horas' : 'minutos'} (365 dias).`;
  return null;
}

export type RpcError = { message?: string; code?: string; details?: string; hint?: string } | null | undefined;

/** Real server error, translated when the cause is known; the raw message is always kept. */
export function describeTrialError(error: RpcError): string {
  const raw = error?.message?.trim() || 'erro desconhecido';
  const code = error?.code ?? '';
  let friendly: string;
  if (code === '42501') friendly = 'Sem permissão: apenas administradores podem alterar o trial.';
  else if (code === '55000') friendly = 'Este estabelecimento tem assinatura ativa; o trial não pode ser alterado.';
  else if (code === 'P0002') friendly = 'Estabelecimento não encontrado.';
  else if (code === '22023') friendly = 'Valor recusado pelo servidor.';
  else if (code === 'PGRST202' || code === '42883') friendly = 'A função de ajuste de trial ainda não existe neste ambiente (migration 20261018150000 não aplicada).';
  else friendly = 'Não foi possível concluir a operação.';
  return `${friendly} (${raw}${code ? ` — ${code}` : ''})`;
}

export type TrialPreview = {
  current_ends_at: string;
  new_ends_at: string;
  access_status: string;
  server_time: string;
  shortens: boolean;
};

export type TrialGrantRow = {
  id: string;
  establishment_id: string;
  previous_ends_at: string;
  new_ends_at: string;
  amount: number;
  unit: TrialUnit;
  mode: TrialMode;
};

/** A preview/grant RPC may answer with a row or a one-element array depending on the client; normalise. */
export function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null;
  return (data as T) ?? null;
}
