import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockAppointments } from '@/lib/mockData';
import type { Appointment } from '@/lib/types';
import type { Database } from '@/lib/database.types';

type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export function useAppointments(establishmentId?: string, date?: string) {
  return useQuery({
    queryKey: ['appointments', establishmentId, date],
    queryFn: async (): Promise<Appointment[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return mockAppointments;
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (date) query = query.eq('date', date);
      const { data, error } = await query;
      if (error || !data) return [];
      if (data.length === 0) return [];
      return data.map((a) => ({
        id: a.id,
        clientId: a.client_id ?? '',
        clientName: (a as any).client_name ?? undefined,
        professionalId: a.employee_id ?? '',
        serviceId: a.service_id ?? '',
        date: a.date,
        time: a.time,
        status: a.status as Appointment['status'],
        notes: a.notes ?? undefined,
        createdAt: a.created_at,
      }));
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AppointmentInsert) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', data.establishment_id] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      establishmentId,
    }: {
      id: string;
      status: AppointmentUpdate['status'];
      establishmentId: string;
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, establishmentId };
    },
    onSuccess: ({ establishmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', establishmentId] });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      date,
      time,
      establishmentId,
    }: {
      id: string;
      date: string;
      time: string;
      establishmentId: string;
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ date, time })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, establishmentId };
    },
    onSuccess: ({ establishmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', establishmentId] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId }: { id: string; establishmentId: string }) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      return establishmentId;
    },
    onSuccess: (establishmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', establishmentId] });
    },
  });
}
