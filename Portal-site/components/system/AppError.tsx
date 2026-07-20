'use client';

import { useEffect } from 'react';

type Props = { error: Error & { digest?: string }; reset: () => void; title?: string };

export function AppError({ error, reset, title = 'Não foi possível carregar esta página' }: Props) {
  useEffect(() => {
    // Only the opaque server digest is emitted; messages can contain personal data.
    console.error(JSON.stringify({ event: 'ui.render.failed', digest: error.digest ?? 'client-error' }));
  }, [error.digest]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6" role="alert">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">Tente novamente. Se o problema continuar, informe o código abaixo ao suporte.</p>
        <code className="mt-4 block rounded bg-slate-100 p-2 text-xs text-slate-700">{error.digest ?? 'client-error'}</code>
        <button type="button" onClick={reset} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
