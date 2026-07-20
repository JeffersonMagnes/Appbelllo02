'use client';

import { MONTHS_SHORT } from '@/lib/agenda-format';
import type { Appointment } from '@/lib/supabase/types';

export function YearView({
  currentDate,
  getAptsForMonth,
  onSelectMonth,
}: {
  currentDate: Date;
  getAptsForMonth: (year: number, month: number) => Appointment[];
  onSelectMonth: (date: Date) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-5">
      {Array.from({ length: 12 }, (_, m) => {
        const apts = getAptsForMonth(currentDate.getFullYear(), m);
        const isCurrent = m === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
        return (
          <button key={m} onClick={() => onSelectMonth(new Date(currentDate.getFullYear(), m, 1))}
            className={`rounded-2xl p-4 text-center transition-all hover:shadow-md ${isCurrent ? 'border-2 border-[#6666cc] bg-[#6666cc]/5' : 'border border-gray-100 bg-white hover:border-gray-200'}`}>
            <p className={`font-bold text-sm ${isCurrent ? 'text-[#6666cc]' : 'text-gray-900'}`}>{MONTHS_SHORT[m]}</p>
            <p className={`text-2xl font-extrabold mt-1 ${apts.length > 0 ? (isCurrent ? 'text-[#6666cc]' : 'text-gray-700') : 'text-gray-300'}`}>{apts.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">agendamento{apts.length !== 1 ? 's' : ''}</p>
          </button>
        );
      })}
    </div>
  );
}
