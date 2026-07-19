import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { clients as mockClients } from '@/lib/mockData';
import type { Client } from '@/lib/types';
import type { Database } from '@/lib/database.types';

type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export function useClients(establishmentId?: string) {
  return useQuery({
    queryKey: ['clients', establishmentId],
    queryFn: async (): Promise<Client[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return mockClients;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name');
      if (error) { console.log('[useClients] Supabase error:', error); return []; }
      if (!data || data.length === 0) { console.log('[useClients] No clients found for establishment', establishmentId); return []; }
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email ?? '',
        phone: c.phone ?? '',
        avatar: c.avatar_url ?? undefined,
        birthDate: c.birth_date ?? undefined,
        notes: c.notes ?? undefined,
        createdAt: c.created_at,
      }));
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClientInsert) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients', data.establishment_id] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ClientUpdate }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients', data.establishment_id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId }: { id: string; establishmentId: string }) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      return establishmentId;
    },
    onSuccess: (establishmentId) => {
      queryClient.invalidateQueries({ queryKey: ['clients', establishmentId] });
    },
  });
}
