'use client';

import { CloseCircle } from 'iconsax-react';
import { Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Employee = { id: string; name: string };

export function BlockSlotModal({
  visible,
  onClose,
  blockDate,
  setBlockDate,
  blockStartTime,
  setBlockStartTime,
  blockEndTime,
  setBlockEndTime,
  blockReason,
  setBlockReason,
  blockEmployeeId,
  setBlockEmployeeId,
  employees,
  savingBlock,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  blockDate: string;
  setBlockDate: (v: string) => void;
  blockStartTime: string;
  setBlockStartTime: (v: string) => void;
  blockEndTime: string;
  setBlockEndTime: (v: string) => void;
  blockReason: string;
  setBlockReason: (v: string) => void;
  blockEmployeeId: string;
  setBlockEmployeeId: (v: string) => void;
  employees: Employee[];
  savingBlock: boolean;
  onSubmit: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <Ban className="w-4 h-4 text-gray-600" />
            </div>
            <h3 className="font-bold text-gray-900">Bloquear Horário</h3>
          </div>
          <button onClick={onClose}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Data *</Label>
            <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)}
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Início *</Label>
              <input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)}
                className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Fim *</Label>
              <input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)}
                className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Profissional</Label>
            <select value={blockEmployeeId} onChange={e => setBlockEmployeeId(e.target.value)}
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
              <option value="">Todos os profissionais</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Motivo</Label>
            <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
              placeholder="Ex: Almoço, Reunião, Manutenção..."
              className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button onClick={onSubmit} disabled={savingBlock || !blockDate || !blockStartTime || !blockEndTime}
              className="flex-1 bg-gray-700 hover:bg-gray-800 text-white border-0 rounded-xl font-bold">
              {savingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                <Ban className="w-4 h-4 mr-1" /> Bloquear
              </>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
