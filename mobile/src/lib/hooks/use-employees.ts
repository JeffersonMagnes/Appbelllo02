import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Employee } from '@/lib/types';
import type { Database } from '@/lib/database.types';

type DbEmployee = Database['public']['Tables']['employees']['Row'];

function toEmployee(e: DbEmployee): Employee {
  return {
    id: e.id,
    name: e.name,
    avatar: e.avatar_url ?? '',
    role: e.role,
    specialty: e.specialty ?? undefined,
    phone: e.phone ?? '',
    email: e.email ?? '',
    commissionType: e.commission_type,
    commissionValue: e.commission_value,
    services: [],
    active: e.active,
    hireDate: e.hire_date ?? e.created_at,
  };
}

export function useEmployees(establishmentId?: string) {
  return useQuery({
    queryKey: ['employees', establishmentId],
    queryFn: async (): Promise<Employee[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name');
      if (error || !data) return [];
      if (data.length === 0) return [];
      return data.map(toEmployee);
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      establishment_id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      role: 'professional' | 'receptionist' | 'admin';
      specialty?: string | null;
      commission_type?: 'percentage' | 'fixed';
      commission_value?: number;
      avatar_url?: string | null;
      pin?: string | null;
      active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('employees')
        .insert({ ...payload, active: payload.active ?? true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees', data.establishment_id] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      establishment_id: string;
      name?: string;
      email?: string | null;
      phone?: string | null;
      role?: 'professional' | 'receptionist' | 'admin';
      specialty?: string | null;
      commission_type?: 'percentage' | 'fixed';
      commission_value?: number;
      avatar_url?: string | null;
      pin?: string | null;
      active?: boolean;
      permissions?: Record<string, boolean>;
    }) => {
      const { id, establishment_id, ...updates } = payload;
      const { data, error } = await (supabase as any)
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, establishment_id };
    },
    onSuccess: ({ establishment_id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees', establishment_id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId }: { id: string; establishmentId: string }) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { establishmentId };
    },
    onSuccess: ({ establishmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['employees', establishmentId] });
    },
  });
}
