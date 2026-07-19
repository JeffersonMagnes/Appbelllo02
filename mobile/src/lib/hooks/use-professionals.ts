import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Professional } from '@/lib/types';
import type { Database } from '@/lib/database.types';

type DbProfessional = Database['public']['Tables']['professionals']['Row'];
type ProfessionalInsert = Database['public']['Tables']['professionals']['Insert'];
type ProfessionalUpdate = Database['public']['Tables']['professionals']['Update'];

function toAppType(p: DbProfessional, serviceIds: string[] = []): Professional {
  return {
    id: p.id,
    name: p.name,
    avatar: p.avatar ?? '',
    specialty: p.specialty ?? '',
    rating: p.rating,
    reviewCount: p.review_count,
    services: serviceIds,
  };
}

export function useProfessionals(establishmentId?: string) {
  return useQuery({
    queryKey: ['professionals', establishmentId],
    queryFn: async (): Promise<Professional[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return [];

      const [prosResult, psResult] = await Promise.all([
        supabase
          .from('professionals')
          .select('*')
          .eq('establishment_id', establishmentId)
          .eq('active', true)
          .order('name'),
        supabase
          .from('professional_services')
          .select('professional_id, service_id'),
      ]);

      if (prosResult.error || !prosResult.data) return [];

      const psMap: Record<string, string[]> = {};
      (psResult.data ?? []).forEach(({ professional_id, service_id }) => {
        if (!psMap[professional_id]) psMap[professional_id] = [];
        psMap[professional_id].push(service_id);
      });

      return prosResult.data.map((p) => toAppType(p, psMap[p.id] ?? []));
    },
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProfessionalInsert) => {
      const { data, error } = await supabase
        .from('professionals')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['professionals', data.establishment_id] });
    },
  });
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, establishmentId }: { id: string; updates: ProfessionalUpdate; establishmentId: string }) => {
      const { data, error } = await supabase.from('professionals').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return { data, establishmentId };
    },
    onSuccess: ({ establishmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['professionals', establishmentId] });
    },
  });
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId }: { id: string; establishmentId: string }) => {
      const { error } = await supabase
        .from('professionals')
        .update({ active: false })
        .eq('id', id);
      if (error) throw error;
      return establishmentId;
    },
    onSuccess: (establishmentId) => {
      queryClient.invalidateQueries({ queryKey: ['professionals', establishmentId] });
    },
  });
}
