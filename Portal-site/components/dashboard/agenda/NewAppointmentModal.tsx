'use client';

import { Add, CloseCircle } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Employee = { id: string; name: string };
type Service = { id: string; name: string; price?: number; duration?: number };
type Client = { id: string; name: string };

export interface AptForm {
  client_id: string;
  service_id: string;
  employee_id: string;
  date: string;
  time: string;
  notes: string;
}

export function NewAppointmentModal({
  visible,
  onClose,
  clients,
  services,
  employees,
  aptForm,
  setAptForm,
  showNewClient,
  setShowNewClient,
  newClientName,
  setNewClientName,
  newClientPhone,
  setNewClientPhone,
  creatingClient,
  onCreateInlineClient,
  savingApt,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  clients: Client[];
  services: Service[];
  employees: Employee[];
  aptForm: AptForm;
  setAptForm: (value: AptForm) => void;
  showNewClient: boolean;
  setShowNewClient: (v: boolean) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  newClientPhone: string;
  setNewClientPhone: (v: string) => void;
  creatingClient: boolean;
  onCreateInlineClient: () => void;
  savingApt: boolean;
  onSubmit: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Novo Agendamento</h3>
          <button onClick={onClose}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Cliente</Label>
              <button type="button" onClick={() => setShowNewClient(!showNewClient)}
                className="text-xs font-semibold text-[#6666cc] hover:underline flex items-center gap-1">
                <Add className="w-3.5 h-3.5" /> Novo cliente
              </button>
            </div>
            {showNewClient && (
              <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <input value={newClientName} onChange={e => setNewClientName(e.target.value)}
                  placeholder="Nome do cliente *"
                  className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
                <input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)}
                  placeholder="Telefone (opcional)"
                  className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
                <Button onClick={onCreateInlineClient} disabled={creatingClient || !newClientName.trim()}
                  className="w-full h-9 bg-[#0BBDB6] hover:bg-[#09a8a2] text-white text-sm rounded-lg border-0">
                  {creatingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar e Selecionar'}
                </Button>
              </div>
            )}
            <select value={aptForm.client_id} onChange={e => setAptForm({ ...aptForm, client_id: e.target.value })}
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
              <option value="">Selecione (opcional)</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Serviço *</Label>
            <select value={aptForm.service_id} onChange={e => setAptForm({ ...aptForm, service_id: e.target.value })}
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
              <option value="">Selecione o serviço</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} {s.price ? `- R$ ${Number(s.price).toFixed(2)}` : ''}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Profissional</Label>
            <select value={aptForm.employee_id} onChange={e => setAptForm({ ...aptForm, employee_id: e.target.value })}
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
              <option value="">Selecione (opcional)</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Data *</Label>
              <input type="date" value={aptForm.date} onChange={e => setAptForm({ ...aptForm, date: e.target.value })}
                className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Horário *</Label>
              <input type="time" value={aptForm.time} onChange={e => setAptForm({ ...aptForm, time: e.target.value })}
                className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Observações</Label>
            <textarea value={aptForm.notes} onChange={e => setAptForm({ ...aptForm, notes: e.target.value })} rows={2}
              placeholder="Observações opcionais..."
              className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:border-[#6666cc]" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button onClick={onSubmit} disabled={savingApt || !aptForm.service_id || !aptForm.date || !aptForm.time}
              className="flex-1 bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl font-bold">
              {savingApt ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agendar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
