import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type OrderStatus = 'pendente' | 'confirmado' | 'em_preparo' | 'enviado' | 'entregue' | 'cancelado';

export interface OnlineOrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface OnlineOrder {
  id: string;
  establishment_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  notes: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
  items?: OnlineOrderItem[];
}

export function useOnlineOrders(establishmentId?: string) {
  return useQuery({
    queryKey: ['online_orders', establishmentId],
    queryFn: async (): Promise<OnlineOrder[]> => {
      if (!isSupabaseConfigured() || !establishmentId) return [];
      const { data: orders, error } = await (supabase as any)
        .from('online_orders')
        .select('*, online_order_items(*)')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });
      if (error || !orders) return [];
      return orders.map((o: any) => ({ ...o, items: o.online_order_items ?? [] }));
    },
    refetchInterval: 30000, // atualiza a cada 30s
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, establishmentId, status }: { id: string; establishmentId: string; status: OrderStatus }) => {
      const { error } = await (supabase as any)
        .from('online_orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      return { id, status };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['online_orders', variables.establishmentId] });
    },
  });
}

export function usePendingOrdersCount(establishmentId?: string) {
  const { data: orders = [] } = useOnlineOrders(establishmentId);
  return orders.filter(o => o.status === 'pendente').length;
}
