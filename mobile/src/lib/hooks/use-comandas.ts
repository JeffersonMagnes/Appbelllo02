import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { comandas as mockComandas } from '@/lib/mockData';
import type { Comanda, ComandaItem } from '@/lib/types';

export function useComandas(establishmentId?: string) {
  return useQuery({
    queryKey: ['comandas', establishmentId],
    queryFn: async (): Promise<Comanda[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return mockComandas;

      const { data, error } = await (supabase as any)
        .from('comandas')
        .select('*, comanda_items(*)')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (error) { console.log('[useComandas] SELECT error:', JSON.stringify(error)); return []; }
      if (!data || data.length === 0) return [];

      return (data as any[]).map((c): Comanda => ({
        id: c.id,
        clientId: c.client_id ?? '',
        clientName: c.client_name ?? '',
        items: ((c.comanda_items ?? []) as any[]).map((i): ComandaItem => ({
          id: i.id,
          type: (i.type ?? (i.service_id ? 'service' : 'product')) as ComandaItem['type'],
          itemId: i.service_id ?? i.product_id ?? '',
          name: i.description ?? i.name ?? '',
          quantity: i.quantity ?? 1,
          unitPrice: i.unit_price ?? 0,
          total: (i.quantity ?? 1) * (i.unit_price ?? 0),
          employeeId: i.employee_id ?? undefined,
        })),
        total: c.total ?? 0,
        status: c.status as Comanda['status'],
        createdAt: c.created_at,
        closedAt: c.closed_at ?? undefined,
      }));
    },
  });
}

export function useCreateComanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      establishment_id: string;
      client_id: string;
      client_name: string;
      status?: string;
      total?: number;
      notes?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('comandas')
        .insert({
          establishment_id: payload.establishment_id,
          client_id: payload.client_id,
          client_name: payload.client_name,
          status: payload.status ?? 'open',
          total: payload.total ?? 0,
          notes: payload.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['comandas', data.establishment_id] });
    },
  });
}

export function useUpdateComanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      establishmentId,
      ...updates
    }: {
      id: string;
      establishmentId: string;
      status?: string;
      total?: number;
      discount?: number;
      payment_method?: string;
      notes?: string;
      closed_at?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('comandas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data: data as any, establishmentId };
    },
    onSuccess: ({ establishmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['comandas', establishmentId] });
    },
  });
}

export function useAddComandaItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      comanda_id: string;
      establishment_id: string;
      type: 'service' | 'product';
      service_id?: string;
      product_id?: string;
      description: string;
      quantity: number;
      unit_price: number;
      employee_id?: string;
    }) => {
      const { data: item, error: itemError } = await (supabase as any)
        .from('comanda_items')
        .insert({
          comanda_id: payload.comanda_id,
          type: payload.type,
          service_id: payload.type === 'service' ? payload.service_id : null,
          product_id: payload.type === 'product' ? payload.product_id : null,
          name: payload.description,
          description: payload.description,
          price: payload.unit_price,
          unit_price: payload.unit_price,
          quantity: payload.quantity,
          employee_id: payload.employee_id ?? null,
        })
        .select()
        .single();
      if (itemError) throw itemError;

      // Update comanda total
      const { data: comanda } = await (supabase as any)
        .from('comandas')
        .select('total')
        .eq('id', payload.comanda_id)
        .single();
      const newTotal = (comanda?.total ?? 0) + payload.unit_price * payload.quantity;
      await (supabase as any)
        .from('comandas')
        .update({ total: newTotal })
        .eq('id', payload.comanda_id);

      return { item, establishmentId: payload.establishment_id };
    },
    onSuccess: ({ establishmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['comandas', establishmentId] });
    },
  });
}

export function useDeleteComandaItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, comandaId, unitPrice, quantity, establishmentId }: { itemId: string; comandaId: string; unitPrice: number; quantity: number; establishmentId: string }) => {
      const { error } = await (supabase as any).from('comanda_items').delete().eq('id', itemId);
      if (error) throw error;
      const { data: comanda } = await (supabase as any).from('comandas').select('total').eq('id', comandaId).single();
      const newTotal = Math.max(0, (comanda?.total ?? 0) - unitPrice * quantity);
      await (supabase as any).from('comandas').update({ total: newTotal }).eq('id', comandaId);
      return establishmentId;
    },
    onSuccess: (establishmentId) => {
      queryClient.invalidateQueries({ queryKey: ['comandas', establishmentId] });
    },
  });
}

export function useDeleteComanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId }: { id: string; establishmentId: string }) => {
      await (supabase as any).from('comanda_items').delete().eq('comanda_id', id);
      const { error } = await (supabase as any).from('comandas').delete().eq('id', id);
      if (error) throw error;
      return establishmentId;
    },
    onSuccess: (establishmentId) => {
      queryClient.invalidateQueries({ queryKey: ['comandas', establishmentId] });
    },
  });
}
