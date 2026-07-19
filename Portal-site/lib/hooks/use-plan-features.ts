'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type PlanFeatures = Record<string, boolean | number>;

export function usePlanFeatures() {
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrial, setIsTrial] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: est } = await (supabase as any)
        .from('establishments')
        .select('subscription_plan')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (!est?.subscription_plan || est.subscription_plan === 'trial') {
        setIsTrial(true); setLoading(false); return;
      }
      const { data: plan } = await (supabase as any)
        .from('plans')
        .select('features')
        .eq('slug', est.subscription_plan)
        .eq('active', true)
        .maybeSingle();
      setFeatures((plan?.features as PlanFeatures) ?? {});
      setLoading(false);
    };
    load();
  }, []);

  return { features, loading, isTrial };
}

export function useFeatureAllowed(featureKey: string) {
  const { features, loading, isTrial } = usePlanFeatures();
  if (loading) return { allowed: true, loading: true };
  if (isTrial) return { allowed: true, loading: false };
  if (!features) return { allowed: false, loading: false };
  return { allowed: features[featureKey] === true, loading: false };
}
