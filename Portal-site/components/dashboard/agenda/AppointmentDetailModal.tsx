'use client';

import { CloseCircle, TickSquare } from 'iconsax-react';
import { Loader2, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { statusBadgeColors, statusLabels, PAY_METHODS, fmtBRL } from '@/lib/agenda-format';
import type { Appointment } from '@/lib/supabase/types';

export function AppointmentDetailModal({
  apt,
  onClose,
  getServiceName,
  getClientName,
  getEmployeeName,
  getServicePrice,
  getServiceDuration,
  editingDateTime,
  setEditingDateTime,
  editDate,
  setEditDate,
  editTime,
  setEditTime,
  savingDateTime,
  onSaveDateTime,
  onCancelEditDateTime,
  updatingStatus,
  onUpdateStatus,
  payMethod,
  setPayMethod,
  onOpenDoc,
}: {
  apt: Appointment | null;
  onClose: () => void;
  getServiceName: (apt: Appointment) => string;
  getClientName: (apt: Appointment) => string;
  getEmployeeName: (apt: Appointment) => string;
  getServicePrice: (apt: Appointment) => number;
  getServiceDuration: (apt: Appointment) => number;
  editingDateTime: boolean;
  setEditingDateTime: (v: boolean) => void;
  editDate: string;
  setEditDate: (v: string) => void;
  editTime: string;
  setEditTime: (v: string) => void;
  savingDateTime: boolean;
  onSaveDateTime: () => void;
  onCancelEditDateTime: () => void;
  updatingStatus: boolean;
  onUpdateStatus: (status: string) => void;
  payMethod: string;
  setPayMethod: (v: string) => void;
  onOpenDoc: (type: 'cobranca' | 'recibo') => void;
}) {
  if (!apt) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-black text-lg text-gray-900">{getServiceName(apt)}</p>
              <p className="text-gray-500 text-sm">{getClientName(apt)}</p>
            </div>
            <button onClick={onClose}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
          </div>
          <span className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadgeColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
            {statusLabels[apt.status] || apt.status}
          </span>
        </div>
        <div className="p-5 space-y-4">
          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setEditingDateTime(true)}>
              <p className="text-xs text-gray-400 mb-0.5">Data {!editingDateTime && <span className="text-[10px]">✏️</span>}</p>
              {editingDateTime ? (
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                  className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#6666cc]" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setEditingDateTime(true)}>
              <p className="text-xs text-gray-400 mb-0.5">Horário {!editingDateTime && <span className="text-[10px]">✏️</span>}</p>
              {editingDateTime ? (
                <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                  className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#6666cc]" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{apt.time}</p>
              )}
            </div>
            {editingDateTime && (
              <div className="col-span-2 flex gap-2">
                <button onClick={onCancelEditDateTime}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={onSaveDateTime} disabled={savingDateTime}
                  className="flex-1 py-2 rounded-lg bg-[#6666cc] text-white text-xs font-bold hover:bg-[#5555aa] disabled:opacity-50">
                  {savingDateTime ? 'Salvando...' : 'Reagendar'}
                </button>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Profissional</p>
              <p className="text-sm font-semibold text-gray-900">{getEmployeeName(apt)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Valor</p>
              <p className="text-sm font-semibold text-brand-primary">{fmtBRL(getServicePrice(apt))}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Duração</p>
              <p className="text-sm font-semibold text-gray-900">{(() => { const d = getServiceDuration(apt); return d >= 60 ? `${Math.floor(d/60)}h${d%60 ? ` ${d%60}min` : ''}` : `${d} min`; })()}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusLabels).map(([k, v]) => (
                <button key={k} onClick={() => { if (k !== 'completed') onUpdateStatus(k); }}
                  disabled={updatingStatus || apt.status === k}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border-2 ${apt.status === k
                    ? `${statusBadgeColors[k]} border-current`
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  } ${k === 'completed' && (apt.status as string) !== 'completed' ? 'opacity-50 cursor-default' : ''}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Payment method — shown when marking as completed */}
          {(apt.status as string) !== 'completed' && (apt.status as string) !== 'cancelled' && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Pagamento ao concluir</p>
              <div className="grid grid-cols-2 gap-2">
                {PAY_METHODS.map(m => (
                  <button key={m.v} onClick={() => setPayMethod(m.v)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-semibold flex items-center gap-2 transition-all ${payMethod === m.v ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 text-gray-600'}`}>
                    <m.Icon className="w-4 h-4" variant="Outline" /> {m.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {(apt.status as string) !== 'completed' && (apt.status as string) !== 'cancelled' && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => onUpdateStatus('cancelled')} disabled={updatingStatus}
                className="flex-1 rounded-xl text-gray-500 border-gray-200 hover:bg-gray-50 text-sm">
                Cancelar
              </Button>
              <Button onClick={() => onUpdateStatus('completed')} disabled={updatingStatus}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm border-0">
                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                  <TickSquare className="w-4 h-4 mr-1" variant="Outline" /> Concluir
                </>}
              </Button>
            </div>
          )}

          {(apt.status as string) === 'completed' && (
            <div className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-xl text-gray-600 text-sm font-semibold">
              <TickSquare className="w-4 h-4" variant="Outline" /> Concluído
            </div>
          )}

          {/* Gerar Cobrança / Gerar Recibo */}
          <div className="flex gap-2 pt-1">
            <button onClick={() => onOpenDoc('cobranca')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Cobrança
            </button>
            <button onClick={() => onOpenDoc('recibo')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">
              <Receipt className="w-3.5 h-3.5" /> Recibo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
