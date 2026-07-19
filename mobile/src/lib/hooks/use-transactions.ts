import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { transactions as mockTransactions } from '@/lib/mockData';
import type { Transaction } from '@/lib/types';
import type { Database } from '@/lib/database.types';
import { toLocalDateStr } from '@/lib/utils/date';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export function useTransactions(establishmentId?: string, filters?: { period?: 'today' | 'week' | 'month'; type?: 'income' | 'expense' }) {
  return useQuery({
    queryKey: ['transactions', establishmentId, filters],
    queryFn: async (): Promise<Transaction[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return mockTransactions;
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('date', { ascending: false });

      if (filters?.type) query = query.eq('type', filters.type);

      if (filters?.period) {
        const now = new Date();
        let startDate: string;
        if (filters.period === 'today') {
          startDate = toLocalDateStr(now);
        } else if (filters.period === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = toLocalDateStr(weekAgo);
        } else {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          startDate = toLocalDateStr(monthAgo);
        }
        query = query.gte('date', startDate);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      if (data.length === 0) return [];
      return data.map((t) => ({
        id: t.id,
        type: t.type as Transaction['type'],
        category: t.category,
        description: t.description,
        amount: t.amount,
        paymentMethod: t.payment_method as Transaction['paymentMethod'],
        date: t.date,
        employeeId: t.employee_id ?? undefined,
        clientId: t.client_id ?? undefined,
        status: t.status as Transaction['status'],
      }));
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TransactionInsert) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', data.establishment_id] });
    },
  });
}
