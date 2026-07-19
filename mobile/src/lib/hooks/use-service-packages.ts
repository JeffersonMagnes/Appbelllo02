import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type ServicePackageRow = Database['public']['Tables']['service_packages']['Row'];
type ServicePackageInsert = Database['public']['Tables']['service_packages']['Insert'];
type ServicePackageUpdate = Database['public']['Tables']['service_packages']['Update'];

export interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sessions: number;
  validityDays: number;
  discountPercent: number;
  serviceIds: string[];
  active: boolean;
}

function mapRow(row: ServicePackageRow): ServicePackage {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    sessions: row.sessions,
    validityDays: row.validity_days,
    discountPercent: row.discount_percent ?? 0,
    serviceIds: row.service_ids ?? [],
    active: row.active,
  };
}

export function useServicePackages(establishmentId?: string) {
  return useQuery({
    queryKey: ['service_packages', establishmentId],
    queryFn: async (): Promise<ServicePackage[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return [];
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('establishment_id', establishmentId)
        .eq('active', true)
        .order('name');
      if (error || !data) return [];
      return data.map(mapRow);
    },
  });
}

export function useCreateServicePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ServicePackageInsert) => {
      const { data, error } = await supabase
        .from('service_packages')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service_packages', data.establishment_id] });
    },
  });
}

export function useUpdateServicePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId, ...updates }: ServicePackageUpdate & { id: string; establishmentId: string }) => {
      const { data, error } = await supabase
        .from('service_packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, establishmentId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['service_packages', result.establishmentId] });
    },
  });
}

export function useDeleteServicePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId }: { id: string; establishmentId: string }) => {
      const { error } = await supabase
        .from('service_packages')
        .update({ active: false })
        .eq('id', id);
      if (error) throw error;
      return establishmentId;
    },
    onSuccess: (establishmentId) => {
      queryClient.invalidateQueries({ queryKey: ['service_packages', establishmentId] });
    },
  });
}
