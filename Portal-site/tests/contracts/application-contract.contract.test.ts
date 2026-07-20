import { describe, expect, test } from 'bun:test';
import {
  AUTHORIZATION_MATRIX,
  CONTRACT_VERSION,
  MODULES,
  PERMISSIONS,
  can,
  type TenantContext,
} from '../../../contracts/v1/application-contract';

describe('application contract v1', () => {
  test('is versioned and covers every required module', () => {
    expect(CONTRACT_VERSION).toMatch(/^1\./);
    expect(new Set(AUTHORIZATION_MATRIX.map((rule) => rule.module))).toEqual(new Set(MODULES));
  });

  test('all referenced permissions belong to the canonical vocabulary', () => {
    const known = new Set<string>(PERMISSIONS);
    for (const rule of AUTHORIZATION_MATRIX) {
      if (rule.permission) expect(known.has(rule.permission)).toBe(true);
    }
  });

  test('anonymous users cannot access private modules', () => {
    const anonymous: TenantContext = { actor: 'anonymous', permissions: [] };
    expect(can(anonymous, 'catalog', 'read')).toBe(true);
    expect(can(anonymous, 'clients', 'read', 'tenant-a')).toBe(false);
    expect(can(anonymous, 'subscriptions', 'update', 'tenant-a')).toBe(false);
  });

  test('employee access requires permission and the same tenant', () => {
    const employee: TenantContext = {
      actor: 'employee',
      actorId: 'employee-a',
      employeeId: 'employee-a',
      establishmentId: 'tenant-a',
      permissions: ['clients.read'],
    };
    expect(can(employee, 'clients', 'read', 'tenant-a')).toBe(true);
    expect(can(employee, 'clients', 'read', 'tenant-b')).toBe(false);
    expect(can(employee, 'clients', 'update', 'tenant-a')).toBe(false);
  });
});
