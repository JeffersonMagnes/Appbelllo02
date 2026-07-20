import { colors } from '@/lib/theme';
import { type ClientPackage } from '@/lib/state/client-packages-store';

export function statusLabel(pkg: ClientPackage) {
  if (pkg.status === 'depleted') return 'Esgotado';
  if (pkg.status === 'expired') return 'Expirado';
  return 'Ativo';
}

export function statusColor(pkg: ClientPackage) {
  if (pkg.status === 'depleted') return colors.error;
  if (pkg.status === 'expired') return colors.textMuted;
  return colors.success;
}

export function expiresLabel(expiresAt: string) {
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Expirado';
  if (diff === 0) return 'Expira hoje';
  return `${diff}d restantes`;
}
