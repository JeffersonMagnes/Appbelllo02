import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type PlanFeatures = Record<string, boolean | number>;

export interface EstablishmentAccess {
  has_access: boolean;
  status: 'subscription_active' | 'trial' | 'trial_expired';
  plan_id: string | null;
  trial_days_left: number;
  reason: string;
}

// Single server-side source of truth for trial/subscription access. Never a
// local calculation, and never "allowed" just because the plan string is
// missing/unrecognized or the query is still loading.
export function useEstablishmentAccess(establishmentId?: string) {
  return useQuery({
    queryKey: ['establishment-access', establishmentId],
    enabled: !!establishmentId,
    queryFn: async (): Promise<EstablishmentAccess | null> => {
      if (!isSupabaseConfigured() || !establishmentId) return null;
      const { data, error } = await (supabase as any).rpc('get_establishment_access', {
        p_establishment_id: establishmentId,
      });
      if (error) throw error;
      return data as EstablishmentAccess;
    },
    staleTime: 60 * 1000,
  });
}

export function usePlanFeatures(establishmentId?: string) {
  const { data: access } = useEstablishmentAccess(establishmentId);
  return useQuery({
    queryKey: ['plan-features', establishmentId, access?.plan_id, access?.status, access?.has_access],
    enabled: !!access,
    queryFn: async (): Promise<PlanFeatures> => {
      if (!access?.has_access || !access.plan_id) return {};
      const { data: plan } = await (supabase as any)
        .from('plans')
        .select('features')
        .eq('slug', access.plan_id)
        .eq('active', true)
        .single();
      return (plan?.features as PlanFeatures) ?? {};
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeatureGate(featureKey: string, establishmentId?: string) {
  const { data: access, isLoading: accessLoading } = useEstablishmentAccess(establishmentId);
  const needsFeatureLookup = !!access?.has_access && access.status === 'subscription_active';
  const { data: features, isLoading: featuresLoading } = usePlanFeatures(establishmentId);

  if (accessLoading || (needsFeatureLookup && featuresLoading)) {
    return { allowed: false, loading: true };
  }
  if (!access || !access.has_access) return { allowed: false, loading: false };
  // Trial grants every feature; a paid plan is gated by its own feature flags.
  if (access.status === 'trial') return { allowed: true, loading: false };
  const value = features?.[featureKey];
  if (typeof value === 'boolean') return { allowed: value, loading: false };
  return { allowed: false, loading: false };
}
