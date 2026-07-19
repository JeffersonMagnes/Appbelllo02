import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';

export async function GET(request: Request) {
  const { user, supabase, establishment } = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!establishment) return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today';

  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const dateFrom = period === 'today' ? today : period === 'week' ? startOfWeek : startOfMonth;

  const [aptsRes, clientsRes, transRes] = await Promise.all([
    supabase.from('appointments').select('id, status').eq('establishment_id', establishment.id).gte('date', dateFrom),
    supabase.from('clients').select('id', { count: 'exact' }).eq('establishment_id', establishment.id).gte('created_at', dateFrom + 'T00:00:00'),
    supabase.from('transactions').select('type, amount, payment_method').eq('establishment_id', establishment.id).gte('date', dateFrom),
  ]);

  const apts = aptsRes.data || [];
  const newClients = clientsRes.count || 0;
  const transactions = transRes.data || [];

  const revenue = transactions.filter((t) => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const byPaymentMethod: Record<string, number> = {};
  transactions.filter((t) => t.type === 'receita').forEach((t) => {
    const pm = t.payment_method || 'outro';
    byPaymentMethod[pm] = (byPaymentMethod[pm] || 0) + t.amount;
  });

  return NextResponse.json({
    appointments: {
      total: apts.length,
      pending: apts.filter((a) => a.status === 'pendente').length,
      confirmed: apts.filter((a) => a.status === 'confirmado').length,
      completed: apts.filter((a) => a.status === 'concluido').length,
      cancelled: apts.filter((a) => a.status === 'cancelado').length,
    },
    revenue: {
      total: revenue,
      byPaymentMethod: Object.entries(byPaymentMethod).map(([method, amount]) => ({ method, amount })),
    },
    clients: { total: newClients, new: newClients },
  });
}
