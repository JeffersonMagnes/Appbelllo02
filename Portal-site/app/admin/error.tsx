'use client';

import { AppError } from '@/components/system/AppError';

export default function AdminError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <AppError {...props} title="Não foi possível carregar o portal administrativo" />;
}
