'use client';

import { AppError } from '@/components/system/AppError';

export default function DashboardError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <AppError {...props} title="Não foi possível carregar o painel" />;
}
