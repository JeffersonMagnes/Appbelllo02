import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { products as mockProducts } from '@/lib/mockData';
import type { Database } from '@/lib/database.types';

type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductRow = Database['public']['Tables']['products']['Row'];

export function useProducts(establishmentId?: string) {
  return useQuery({
    queryKey: ['products', establishmentId],
    queryFn: async (): Promise<ProductRow[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return mockProducts as any;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name');
      if (error || !data) return [];
      return data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProductInsert): Promise<ProductRow> => {
      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', data.establishment_id] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId, ...updates }: Partial<ProductRow> & { id: string; establishmentId: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, establishmentId };
    },
    onSuccess: ({ establishmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['products', establishmentId] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId }: { id: string; establishmentId: string }) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return establishmentId;
    },
    onSuccess: (establishmentId) => {
      queryClient.invalidateQueries({ queryKey: ['products', establishmentId] });
    },
  });
}
