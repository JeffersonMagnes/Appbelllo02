/**
 * Appbello application contract v1.
 *
 * This package is dependency-free so Web, Mobile and server code can consume the
 * same vocabulary without coupling domain rules to a UI framework.
 */
export const CONTRACT_VERSION = '1.0.0' as const;

export const MODULES = [
  'identity',
  'agenda',
  'clients',
  'catalog',
  'team',
  'inventory',
  'comandas',
  'anamnesis',
  'subscriptions',
  'notifications',
] as const;

export type AppModule = (typeof MODULES)[number];
export type Actor = 'anonymous' | 'owner' | 'admin' | 'employee' | 'service';
export type TenantScope = 'public' | 'own_establishment' | 'assigned_employee' | 'platform';
export type Operation = 'read' | 'create' | 'update' | 'delete' | 'execute';

export const PERMISSIONS = [
  'agenda.read',
  'agenda.write',
  'clients.read',
  'clients.write',
  'financial.read',
  'reports.read',
  'inventory.read',
  'inventory.write',
  'comandas.read',
  'comandas.write',
  'team.manage',
  'anamnesis.read',
  'anamnesis.write',
  'subscriptions.manage',
  'notifications.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type AuthorizationRule = Readonly<{
  module: AppModule;
  actors: readonly Actor[];
  operations: readonly Operation[];
  scope: TenantScope;
  permission?: Permission;
  constraints?: readonly string[];
}>;

export const AUTHORIZATION_MATRIX: readonly AuthorizationRule[] = [
  { module: 'identity', actors: ['anonymous'], operations: ['create'], scope: 'public', constraints: ['credentials validated server-side', 'rate limited'] },
  { module: 'identity', actors: ['owner', 'admin', 'employee'], operations: ['read', 'execute'], scope: 'own_establishment' },
  { module: 'agenda', actors: ['anonymous'], operations: ['read', 'create'], scope: 'public', constraints: ['active public catalog only', 'booking through transactional RPC'] },
  { module: 'agenda', actors: ['owner', 'admin'], operations: ['read', 'create', 'update', 'delete'], scope: 'own_establishment' },
  { module: 'agenda', actors: ['employee'], operations: ['read'], scope: 'assigned_employee', permission: 'agenda.read' },
  { module: 'agenda', actors: ['employee'], operations: ['create', 'update'], scope: 'assigned_employee', permission: 'agenda.write' },
  { module: 'clients', actors: ['owner', 'admin'], operations: ['read', 'create', 'update', 'delete'], scope: 'own_establishment' },
  { module: 'clients', actors: ['employee'], operations: ['read'], scope: 'own_establishment', permission: 'clients.read' },
  { module: 'clients', actors: ['employee'], operations: ['create', 'update'], scope: 'own_establishment', permission: 'clients.write' },
  { module: 'catalog', actors: ['anonymous'], operations: ['read'], scope: 'public', constraints: ['active and explicitly public records only'] },
  { module: 'catalog', actors: ['owner', 'admin'], operations: ['read', 'create', 'update', 'delete'], scope: 'own_establishment' },
  { module: 'team', actors: ['owner', 'admin'], operations: ['read', 'create', 'update', 'delete'], scope: 'own_establishment', permission: 'team.manage' },
  { module: 'inventory', actors: ['owner', 'admin'], operations: ['read', 'create', 'update', 'delete'], scope: 'own_establishment' },
  { module: 'inventory', actors: ['employee'], operations: ['read'], scope: 'own_establishment', permission: 'inventory.read' },
  { module: 'inventory', actors: ['employee'], operations: ['create', 'update'], scope: 'own_establishment', permission: 'inventory.write' },
  { module: 'comandas', actors: ['owner', 'admin'], operations: ['read', 'create', 'update', 'execute'], scope: 'own_establishment' },
  { module: 'comandas', actors: ['employee'], operations: ['read'], scope: 'assigned_employee', permission: 'comandas.read' },
  { module: 'comandas', actors: ['employee'], operations: ['create', 'update', 'execute'], scope: 'assigned_employee', permission: 'comandas.write', constraints: ['closing and stock changes are transactional and idempotent'] },
  { module: 'anamnesis', actors: ['owner', 'admin'], operations: ['read', 'create', 'update'], scope: 'own_establishment', constraints: ['sensitive data access is auditable'] },
  { module: 'anamnesis', actors: ['employee'], operations: ['read'], scope: 'assigned_employee', permission: 'anamnesis.read', constraints: ['sensitive data access is auditable'] },
  { module: 'anamnesis', actors: ['employee'], operations: ['create', 'update'], scope: 'assigned_employee', permission: 'anamnesis.write', constraints: ['sensitive data access is auditable'] },
  { module: 'subscriptions', actors: ['owner'], operations: ['read', 'create', 'update'], scope: 'own_establishment', permission: 'subscriptions.manage', constraints: ['entitlements and dates are decided server-side'] },
  { module: 'subscriptions', actors: ['service'], operations: ['update', 'execute'], scope: 'platform', constraints: ['verified idempotent webhook only'] },
  { module: 'notifications', actors: ['owner', 'admin'], operations: ['read', 'create', 'update', 'delete', 'execute'], scope: 'own_establishment', permission: 'notifications.manage' },
  { module: 'notifications', actors: ['service'], operations: ['create', 'execute'], scope: 'platform', constraints: ['no secrets or unnecessary PII in payloads'] },
] as const;

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export type ApiError = Readonly<{
  error: { code: ApiErrorCode; message: string; correlationId?: string; details?: Record<string, unknown> };
}>;

export type TenantContext = Readonly<{
  actor: Actor;
  actorId?: string;
  establishmentId?: string;
  employeeId?: string;
  permissions: readonly Permission[];
}>;

export type PageRequest = Readonly<{ cursor?: string; limit?: number }>;
export type Page<T> = Readonly<{ data: readonly T[]; nextCursor: string | null }>;

export function can(
  context: TenantContext,
  module: AppModule,
  operation: Operation,
  requestedEstablishmentId?: string,
): boolean {
  return AUTHORIZATION_MATRIX.some((rule) => {
    if (rule.module !== module || !rule.actors.includes(context.actor) || !rule.operations.includes(operation)) return false;
    if (rule.permission && !context.permissions.includes(rule.permission)) return false;
    if (rule.scope === 'own_establishment' && requestedEstablishmentId !== context.establishmentId) return false;
    return true;
  });
}
