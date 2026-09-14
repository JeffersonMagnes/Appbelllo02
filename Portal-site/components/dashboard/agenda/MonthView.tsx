'use client';

import { DAYS, statusColors } from '@/lib/agenda-format';
import type { Appointment } from '@/lib/supabase/types';

export function MonthView({
  currentDate,
  getAptsForDay,
  getClientName,
  onSelectAppointment,
}: {
  currentDate: Date;
  getAptsForDay: (date: Date) => Appointment[];
  getClientName: (apt: Appointment) => string;
  onSelectAppointment: (apt: Appointment) => void;
}) {
  const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let i = 1; i <= last.getDate(); i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map(d => <div key={d} className="p-3 text-center text-xs font-semibold text-gray-500">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="p-2 border-r border-b border-gray-50 min-h-20" />;
          const isToday = d.toDateString() === new Date().toDateString();
          const apts = getAptsForDay(d);
          return (
            <div key={i} className={`p-2 border-r border-b border-gray-50 min-h-20 ${isToday ? 'bg-[#6666cc]/5' : 'hover:bg-gray-50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${isToday ? 'bg-[#6666cc] text-white' : 'text-gray-700'}`}>
                {d.getDate()}
              </div>
              {apts.slice(0, 2).map(apt => (
                <div key={apt.id} onClick={() => onSelectAppointment(apt)}
                  className={`${statusColors[apt.status] || 'bg-gray-400'} text-white text-xs rounded px-1.5 py-0.5 mb-0.5 truncate cursor-pointer hover:opacity-80`}>
                  {apt.time} {getClientName(apt)}
                </div>
              ))}
              {apts.length > 2 && <div className="text-xs text-gray-400">+{apts.length - 2} mais</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
