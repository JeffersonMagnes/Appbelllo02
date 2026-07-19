import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { services as mockServices, serviceCategories as mockCategories } from '@/lib/mockData';
import type { Service, ServiceCategory } from '@/lib/types';
import type { Database } from '@/lib/database.types';

type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type ServiceUpdate = Database['public']['Tables']['services']['Update'];
type ServiceCategoryInsert = Database['public']['Tables']['service_categories']['Insert'];

export function useServices(establishmentId?: string) {
  return useQuery({
    queryKey: ['services', establishmentId],
    queryFn: async (): Promise<Service[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return mockServices;
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('establishment_id', establishmentId)
        .eq('active', true)
        .order('name');
      if (error || !data) return [];
      return data.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? '',
        duration: s.duration,
        price: s.price,
        category: s.category ?? '',
        professionals: [],
        image_url: (s as any).image_url ?? null,
      }));
    },
  });
}

export function useServiceCategories(establishmentId?: string) {
  return useQuery({
    queryKey: ['service_categories', establishmentId],
    queryFn: async (): Promise<ServiceCategory[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return mockCategories;
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name');
      if (error || !data) return [];
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon ?? 'scissors',
      }));
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ServiceInsert) => {
      const { data, error } = await supabase
        .from('services')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services', data.establishment_id] });
    },
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ServiceCategoryInsert) => {
      const { data, error } = await supabase
        .from('service_categories')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service_categories', data.establishment_id] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, establishmentId }: { id: string; updates: ServiceUpdate; establishmentId: string }) => {
      const { data, error } = await supabase.from('services').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return { data, establishmentId };
    },
    onSuccess: ({ establishmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['services', establishmentId] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId }: { id: string; establishmentId: string }) => {
      const { error } = await supabase.from('services').update({ active: false }).eq('id', id);
      if (error) throw error;
      return establishmentId;
    },
    onSuccess: (establishmentId) => {
      queryClient.invalidateQueries({ queryKey: ['services', establishmentId] });
    },
  });
}
