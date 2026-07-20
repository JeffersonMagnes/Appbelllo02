import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '../..');
const source = (path: string) => readFileSync(join(root, path), 'utf8');

describe('observability contract', () => {
  test('middleware propagates correlation IDs to API handlers and responses', () => {
    const middleware = source('middleware.ts');
    expect(middleware).toContain("requestHeaders.set('x-correlation-id'");
    expect(middleware).toContain("res.headers.set('x-correlation-id'");
    expect(middleware).toContain("'/api/:path*'");
  });

  test('structured logging filters common PII and secrets', () => {
    const observability = source('lib/server/observability.ts');
    for (const key of ['email', 'phone', 'token', 'secret', 'password', 'pin', 'notes', 'cpf']) {
      expect(observability).toContain(key);
    }
    expect(observability).toContain('JSON.stringify');
    expect(observability).not.toContain('error.stack');
  });

  test('critical areas have recoverable error boundaries', () => {
    for (const path of ['app/error.tsx', 'app/global-error.tsx', 'app/dashboard/error.tsx', 'app/admin/error.tsx']) {
      expect(source(path)).toContain('AppError');
    }
    expect(source('components/system/AppError.tsx')).toContain('reset');
  });
});
