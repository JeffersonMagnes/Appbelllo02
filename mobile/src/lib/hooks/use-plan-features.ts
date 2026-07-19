import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type PlanFeatures = Record<string, boolean | number>;

export function usePlanFeatures(establishmentId?: string) {
  return useQuery({
    queryKey: ['plan-features', establishmentId],
    queryFn: async (): Promise<PlanFeatures> => {
      if (!isSupabaseConfigured() || !establishmentId) return {};
      const { data: est } = await (supabase as any)
        .from('establishments')
        .select('subscription_plan')
        .eq('id', establishmentId)
        .single();
      if (!est?.subscription_plan || est.subscription_plan === 'trial') {
        return { _isTrial: true };
      }
      const { data: plan } = await (supabase as any)
        .from('plans')
        .select('features')
        .eq('slug', est.subscription_plan)
        .eq('active', true)
        .single();
      return (plan?.features as PlanFeatures) ?? {};
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeatureGate(featureKey: string, establishmentId?: string) {
  const { data: features, isLoading } = usePlanFeatures(establishmentId);
  if (isLoading || !features) return { allowed: true, loading: isLoading };
  if ((features as any)._isTrial) return { allowed: true, loading: false };
  const value = features[featureKey];
  if (typeof value === 'boolean') return { allowed: value, loading: false };
  return { allowed: false, loading: false };
}
