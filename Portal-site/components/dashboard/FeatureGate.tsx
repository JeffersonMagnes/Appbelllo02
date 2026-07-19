'use client';
import { useFeatureAllowed } from '@/lib/hooks/use-plan-features';
import Link from 'next/link';
import { Crown } from 'iconsax-react';

export function FeatureGate({ featureKey, children }: { featureKey: string; children: React.ReactNode }) {
  const { allowed, loading } = useFeatureAllowed(featureKey);
  if (loading) return <>{children}</>;
  if (allowed) return <>{children}</>;

  return (
    <div className="relative min-h-[60vh]">
      <div className="opacity-15 pointer-events-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center max-w-sm">
          <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" variant="Outline" />
          <h3 className="font-bold text-lg text-gray-900">Recurso Premium</h3>
          <p className="text-sm text-gray-500 mt-2">
            Este recurso não está disponível no seu plano atual.
          </p>
          <Link href="/dashboard/assinatura"
            className="inline-block mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5333ED] to-[#0BBDB6] text-white font-bold text-sm hover:opacity-90 transition-opacity">
            Ver Planos
          </Link>
        </div>
      </div>
    </div>
  );
}
