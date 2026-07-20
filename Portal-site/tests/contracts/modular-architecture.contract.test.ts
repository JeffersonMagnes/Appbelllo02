import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '../..');
const source = (path: string) => readFileSync(join(root, path), 'utf8');

describe('modular architecture', () => {
  test('appointment routes delegate validation and persistence to the module', () => {
    for (const route of ['app/api/appointments/route.ts', 'app/api/appointments/[id]/route.ts']) {
      const code = source(route);
      expect(code).toContain('AppointmentService');
      expect(code).toContain('AppointmentRepository');
      expect(code).not.toContain(".from('appointments')");
    }
  });

  test('appointment writes use a whitelist and the canonical status vocabulary', () => {
    const contract = source('lib/modules/appointments/contract.ts');
    const repository = source('lib/modules/appointments/repository.ts');
    expect(contract).toContain('.strict()');
    expect(contract).toContain("'cancelled'");
    expect(repository).not.toContain("'cancelado'");
  });
});
