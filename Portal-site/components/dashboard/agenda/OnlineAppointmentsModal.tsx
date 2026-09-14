'use client';

import { Link2, SearchNormal1 } from 'iconsax-react';
import { X } from 'lucide-react';
import { statusColors, statusLabels, fmtBRL } from '@/lib/agenda-format';
import type { Appointment } from '@/lib/supabase/types';

type Service = { id: string; name: string; price?: number; duration?: number };

export function OnlineAppointmentsModal({
  visible,
  onClose,
  onlineSearch,
  setOnlineSearch,
  onlinePeriod,
  setOnlinePeriod,
  onlineApts,
  onlineTotal,
  services,
  getClientName,
}: {
  visible: boolean;
  onClose: () => void;
  onlineSearch: string;
  setOnlineSearch: (v: string) => void;
  onlinePeriod: number;
  setOnlinePeriod: (v: number) => void;
  onlineApts: Appointment[];
  onlineTotal: number;
  services: Service[];
  getClientName: (apt: Appointment) => string;
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#6666cc]/10 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-[#6666cc]" variant="Outline" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Agendamentos Online</h2>
              <p className="text-xs text-gray-400">Feitos pelo link público</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-50 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <SearchNormal1 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" variant="Outline" />
            <input value={onlineSearch} onChange={e => setOnlineSearch(e.target.value)} placeholder="Buscar cliente..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6666cc]" />
          </div>
          <select value={onlinePeriod} onChange={e => setOnlinePeriod(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6666cc] bg-white">
            <option value={15}>Últimos 15 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={60}>Últimos 60 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </div>

        <div className="px-5 py-2.5 bg-[#6666cc]/5 border-b border-[#6666cc]/10 flex items-center justify-between">
          <span className="text-xs text-gray-600 font-medium">{onlineApts.length} agendamento{onlineApts.length !== 1 ? 's' : ''}</span>
          <span className="text-sm font-bold text-[#6666cc]">Total: {fmtBRL(onlineTotal)}</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {onlineApts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Link2 className="w-8 h-8 mb-2 opacity-30" variant="Outline" />
              <p className="text-sm">Nenhum agendamento online no período</p>
            </div>
          ) : (
            onlineApts.map(apt => {
              const svc = services.find(s => s.id === (apt as any).service_id);
              return (
                <div key={apt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[apt.status] || 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{getClientName(apt)}</p>
                    <p className="text-xs text-gray-400">{svc?.name ?? '—'} · {apt.date} às {apt.time}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-700">{svc?.price ? fmtBRL(svc.price) : '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusColors[apt.status] || 'bg-gray-400'}`}>
                      {statusLabels[apt.status] ?? apt.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
