'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Logout, TickCircle, InfoCircle, CloseCircle, DollarCircle } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const statusColor: Record<string, string> = {
  confirmado: 'text-green-600 bg-green-50',
  confirmed:  'text-green-600 bg-green-50',
  pendente:   'text-amber-500 bg-amber-50',
  pending:    'text-amber-500 bg-amber-50',
  cancelado:  'text-red-500 bg-red-50',
  cancelled:  'text-red-500 bg-red-50',
  concluido:  'text-blue-600 bg-blue-50',
  completed:  'text-blue-600 bg-blue-50',
};
const statusLabel: Record<string, string> = {
  confirmado: 'Confirmado', confirmed: 'Confirmado',
  pendente: 'Pendente', pending: 'Pendente',
  cancelado: 'Cancelado', cancelled: 'Cancelado',
  concluido: 'Concluído', completed: 'Concluído',
};

function StatusIcon({ s }: { s: string }) {
  if (s === 'confirmado' || s === 'confirmed' || s === 'concluido' || s === 'completed') return <TickCircle className="w-3.5 h-3.5" variant="Outline" />;
  if (s === 'cancelado' || s === 'cancelled') return <CloseCircle className="w-3.5 h-3.5" variant="Outline" />;
  return <Clock className="w-3.5 h-3.5" variant="Outline" />;
}

export default function ProfissionalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [empName, setEmpName] = useState('');
  const [todayApts, setTodayApts] = useState<any[]>([]);
  const [weekApts, setWeekApts]   = useState<any[]>([]);
  const [services, setServices]   = useState<any[]>([]);
  const [clients,  setClients]    = useState<any[]>([]);
  const [commission, setCommission] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      // Tenta encontrar o funcionário pelo user_id ou pelo e-mail
      const { data: estRaw } = await supabase
        .from('establishments')
        .select('id, name')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (estRaw) {
        // É dono — redireciona para o dashboard
        router.replace('/dashboard');
        return;
      }

      // Busca o estabelecimento e funcionário vinculados
      const { data: empRaw } = await (supabase as any)
        .from('employees')
        .select('id, name, commission_type, commission_value, establishment_id, permissions')
        .eq('email', user.email)
        .maybeSingle();

      const emp = empRaw as { id: string; name: string; commission_type?: string; commission_value?: number; establishment_id: string; permissions?: any } | null;

      if (!emp) {
        // Fallback: busca pela primeira establishment associada
        setEmpName(user.email?.split('@')[0] ?? 'Profissional');
        setLoading(false);
        return;
      }

      setEmpName(emp.name);

      const today = new Date().toISOString().split('T')[0];
      const week7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const [todayRes, weekRes, svcRes, cliRes] = await Promise.all([
        (supabase as any).from('appointments').select('*').eq('establishment_id', emp.establishment_id).eq('employee_id', emp.id).eq('date', today).order('time'),
        (supabase as any).from('appointments').select('*').eq('establishment_id', emp.establishment_id).eq('employee_id', emp.id).gte('date', today).lte('date', week7),
        supabase.from('services').select('id, name, price').eq('establishment_id', emp.establishment_id),
        (supabase as any).from('clients').select('id, name').eq('establishment_id', emp.establishment_id),
      ]);

      const todayList = todayRes.data || [];
      setTodayApts(todayList);
      setWeekApts(weekRes.data || []);
      setServices(svcRes.data || []);
      setClients(cliRes.data || []);

      // Calcula comissão do dia
      if (emp.commission_value && emp.commission_type) {
        const totalToday = todayList
          .filter((a: any) => a.status === 'concluido' || a.status === 'completed')
          .reduce((sum: number, a: any) => {
            const svc = (svcRes.data as any[] || []).find((s: any) => s.id === a.service_id);
            return sum + (svc?.price ?? 0);
          }, 0);
        const comm = emp.commission_type === 'percentual'
          ? (totalToday * emp.commission_value) / 100
          : emp.commission_value * todayList.filter((a: any) => a.status === 'concluido' || a.status === 'completed').length;
        setCommission(comm);
      }

      setLoading(false);
    };
    load();
  }, []);

  const getClientName = (apt: any) => clients.find(c => c.id === apt.client_id)?.name ?? apt.client_name ?? '—';
  const getServiceName = (apt: any) => services.find(s => s.id === apt.service_id)?.name ?? '—';
  const getServiceDuration = (apt: any) => services.find((s: any) => s.id === apt.service_id)?.duration ?? null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#6666cc]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#6666cc]" variant="Outline" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Olá,</p>
              <h1 className="text-base font-bold text-gray-900">{loading ? '...' : empName}</h1>
            </div>
          </div>
          <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Logout className="w-4 h-4 text-gray-500" variant="Outline" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#6666cc] animate-spin" /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                <Calendar className="w-5 h-5 text-[#6666cc] mx-auto mb-2" variant="Outline" />
                <p className="text-2xl font-bold text-[#6666cc]">{todayApts.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Hoje</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" variant="Outline" />
                <p className="text-2xl font-bold text-amber-500">{weekApts.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Próximos 7 dias</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                <DollarCircle className="w-5 h-5 text-green-500 mx-auto mb-2" variant="Outline" />
                <p className="text-2xl font-bold text-green-600">
                  {commission > 0 ? `R$${commission.toFixed(0)}` : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Comissão hoje</p>
              </div>
            </div>

            {/* Agenda de hoje */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Agenda de Hoje</h2>
                <span className="text-xs text-gray-400">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>

              {todayApts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" variant="Outline" />
                  <p className="text-sm font-medium">Sem agendamentos hoje</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayApts.map(apt => (
                    <div key={apt.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
                      <div className="w-14 h-14 rounded-xl bg-[#6666cc]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#6666cc]">{apt.time?.slice(0, 5)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{getServiceName(apt)}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-gray-400" variant="Outline" />
                          <span className="text-xs text-gray-500">{getClientName(apt)}</span>
                        </div>
                        {getServiceDuration(apt) && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" variant="Outline" />
                            <span className="text-xs text-gray-400">{getServiceDuration(apt)} min</span>
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusColor[apt.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        <StatusIcon s={apt.status} />
                        {statusLabel[apt.status] ?? apt.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aviso modo funcionário */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
              <InfoCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" variant="Outline" />
              <p className="text-sm text-gray-700">Você está no modo funcionário. Acesso restrito apenas à sua agenda e comissões.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
