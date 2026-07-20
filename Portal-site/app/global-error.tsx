'use client';

import { AppError } from '@/components/system/AppError';

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body><AppError {...props} title="O Appbello encontrou um problema" /></body>
    </html>
  );
}
