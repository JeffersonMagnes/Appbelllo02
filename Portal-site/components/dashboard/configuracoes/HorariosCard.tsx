'use client';

import { Clock } from 'iconsax-react';
import { Input } from '@/components/ui/input';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAY_KEYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export type DayHours = { open: string; close: string; active: boolean };

export function HorariosCard({
  hours,
  setHours,
}: {
  hours: Record<string, DayHours>;
  setHours: (updater: (prev: Record<string, DayHours>) => Record<string, DayHours>) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-brand-primary"  variant="Outline" />
        <h3 className="font-bold text-gray-900">Horários de Funcionamento</h3>
      </div>
      <div className="space-y-2">
        {DAYS.map((day, i) => {
          const key = DAY_KEYS[i];
          const h = hours[key] || { open: '09:00', close: '18:00', active: false };
          return (
            <div key={day} className="flex items-center gap-3">
              <div className="w-20 text-sm text-gray-700 font-medium flex-shrink-0">{day}</div>
              <Input value={h.open} onChange={e=>setHours(p=>({...p,[key]:{...p[key],open:e.target.value}}))} disabled={!h.active} placeholder="09:00" className="h-9 w-20 rounded-lg border-gray-200 text-sm" />
              <span className="text-gray-400 text-sm">–</span>
              <Input value={h.close} onChange={e=>setHours(p=>({...p,[key]:{...p[key],close:e.target.value}}))} disabled={!h.active} placeholder="18:00" className="h-9 w-20 rounded-lg border-gray-200 text-sm" />
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                <input type="checkbox" checked={h.active} onChange={e=>setHours(p=>({...p,[key]:{...p[key],active:e.target.checked}}))} className="rounded" />
                Aberto
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
