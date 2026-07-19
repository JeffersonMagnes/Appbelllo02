'use client';

import { useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar, Clock, TickCircle, CloseCircle, InfoCircle } from 'iconsax-react';

type EmployeeSession = {
  employeeId: string;
  employeeName: string;
  establishmentId: string;
  establishmentName: string;
  role: string;
  permissions: Record<string, boolean>;
};

type Appointment = {
  id: string;
  client_name: string | null;
  client_id: string | null;
  service_id: string | null;
  date: string;
  time: string;
  status: string;
  notes: string | null;
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-700', bg: 'bg-amber-50' },
  confirmed: { label: 'Confirmado', color: 'text-green-700', bg: 'bg-green-50' },
  completed: { label: 'Concluído', color: 'text-blue-700', bg: 'bg-blue-50' },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-50' },
};

export default function EmployeeDashboardPage() {
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; price: number; duration: number }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch('/api/employee/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Unauthorized');
        setSession(await response.json());
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setLoading(true);
      const response = await fetch(`/api/employee/dashboard?date=${encodeURIComponent(selectedDate)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const result = response.ok ? await response.json() : { appointments: [], services: [], clients: [] };
      setAppointments(result.appointments || []);
      setServices(result.services || []);
      setClients(result.clients || []);
      setLoading(false);
    };
    load();
  }, [session, selectedDate]);

  if (!session) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === selectedDate);
  const upcomingApts = appointments.filter(a => a.date > todayStr && a.date !== selectedDate).slice(0, 10);

  const totalToday = todayApts.length;
  const completedToday = todayApts.filter(a => a.status === 'completed').length;
  const pendingToday = todayApts.filter(a => a.status === 'pending' || a.status === 'confirmed').length;

  const getServiceName = (id: string | null) => services.find(s => s.id === id)?.name || 'Serviço';
  const getClientName = (apt: Appointment) => apt.client_name || clients.find(c => c.id === apt.client_id)?.name || 'Cliente';

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (dateStr === todayStr) return 'Hoje';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Amanhã';
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-br from-[#5333ED] to-[#0BBDB6] px-6 pt-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-sm">Olá,</p>
          <h1 className="text-2xl font-black text-white">{session.employeeName}</h1>
          <p className="text-white/60 text-sm mt-1">{session.establishmentName}</p>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 -mt-10 space-y-5 pb-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-gray-900">{totalToday}</p>
            <p className="text-xs text-gray-500 mt-0.5">Agendamentos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-green-600">{completedToday}</p>
            <p className="text-xs text-gray-500 mt-0.5">Concluídos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-amber-500">{pendingToday}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pendentes</p>
          </div>
        </div>

        {/* Date selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => changeDate(-1)} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="font-bold text-gray-900 capitalize">{formatDate(selectedDate)}</p>
              <p className="text-xs text-gray-400">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Today's appointments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5333ED]" variant="Outline" />
            <h2 className="font-bold text-gray-900">Agenda — {formatDate(selectedDate)}</h2>
            <span className="ml-auto text-xs font-bold text-gray-400">{todayApts.length} atendimentos</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#5333ED]" />
            </div>
          ) : todayApts.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" variant="Outline" />
              <p className="text-sm text-gray-400">Nenhum atendimento neste dia.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayApts.map(apt => {
                const cfg = statusConfig[apt.status] || statusConfig.pending;
                return (
                  <div key={apt.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-14 text-center flex-shrink-0">
                      <p className="text-lg font-black text-[#5333ED]">{apt.time?.slice(0, 5)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{getClientName(apt)}</p>
                      <p className="text-xs text-gray-500 truncate">{getServiceName(apt.service_id)}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming */}
        {upcomingApts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0BBDB6]" variant="Outline" />
              <h2 className="font-bold text-gray-900">Próximos Dias</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingApts.map(apt => {
                const cfg = statusConfig[apt.status] || statusConfig.pending;
                const d = new Date(apt.date + 'T00:00:00');
                return (
                  <div key={apt.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="w-14 text-center flex-shrink-0">
                      <p className="text-xs text-gray-400">{d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-sm font-bold text-gray-700">{apt.time?.slice(0, 5)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{getClientName(apt)}</p>
                      <p className="text-xs text-gray-400 truncate">{getServiceName(apt.service_id)}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <InfoCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" variant="Outline" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Acesso limitado</p>
            <p className="text-xs text-amber-600 mt-0.5">Você está usando o portal como funcionário. Algumas funcionalidades podem estar restritas conforme as permissões definidas pelo gestor.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
