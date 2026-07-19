import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface BlockedSlot {
  id: string;
  establishmentId: string;
  employeeId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdAt: string;
}

export function useBlockedSlots(establishmentId?: string, date?: string) {
  return useQuery({
    queryKey: ['blocked-slots', establishmentId, date],
    queryFn: async (): Promise<BlockedSlot[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return [];
      let query = (supabase as any)
        .from('blocked_slots')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('date')
        .order('start_time');
      if (date) query = query.eq('date', date);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((s: any) => ({
        id: s.id,
        establishmentId: s.establishment_id,
        employeeId: s.employee_id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        reason: s.reason,
        createdAt: s.created_at,
      }));
    },
  });
}

export function useCreateBlockedSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      establishment_id: string;
      employee_id?: string | null;
      date: string;
      start_time: string;
      end_time: string;
      reason?: string | null;
    }) => {
      const { data, error } = await (supabase as any)
        .from('blocked_slots')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-slots', data.establishment_id] });
    },
  });
}

export function useDeleteBlockedSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId }: { id: string; establishmentId: string }) => {
      const { error } = await (supabase as any).from('blocked_slots').delete().eq('id', id);
      if (error) throw error;
      return establishmentId;
    },
    onSuccess: (establishmentId: string) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-slots', establishmentId] });
    },
  });
}
