import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export type LogLevel = 'info' | 'warn' | 'error';
type SafeValue = string | number | boolean | null | undefined;

const BLOCKED_KEYS = /email|phone|name|token|secret|password|pin|notes|document|cpf|address|payload|body/i;

function safeContext(context: Record<string, SafeValue> = {}) {
  return Object.fromEntries(
    Object.entries(context)
      .filter(([key, value]) => !BLOCKED_KEYS.test(key) && ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 160) : value]),
  );
}

export function correlationId() {
  return headers().get('x-correlation-id') ?? crypto.randomUUID();
}

export function logEvent(level: LogLevel, event: string, context: Record<string, SafeValue> = {}) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    correlationId: correlationId(),
    ...safeContext(context),
  });
  if (level === 'error') console.error(record);
  else if (level === 'warn') console.warn(record);
  else console.info(record);
}

export function apiError(
  status: number,
  code: string,
  message: string,
  context: Record<string, SafeValue> = {},
) {
  const id = correlationId();
  if (status >= 500) logEvent('error', 'api.request.failed', { status, code, ...context });
  const response = NextResponse.json({ error: { code, message, correlationId: id } }, { status });
  response.headers.set('x-correlation-id', id);
  return response;
}

export function apiSuccess<T>(value: T, status = 200) {
  const id = correlationId();
  const response = NextResponse.json(value, { status });
  response.headers.set('x-correlation-id', id);
  return response;
}
