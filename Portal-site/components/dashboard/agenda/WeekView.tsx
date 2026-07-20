'use client';

import { DAYS, HOUR_PX } from '@/lib/agenda-format';
import { DayColumn } from './DayColumn';
import type { Appointment } from '@/lib/supabase/types';

export function WeekView({
  weekDays,
  hours,
  openHour,
  getAptsForDay,
  getBlocksForDay,
  getServiceDuration,
  getClientName,
  getServiceName,
  onSelectAppointment,
  onDeleteBlock,
  onSlotClick,
}: {
  weekDays: Date[];
  hours: string[];
  openHour: number;
  getAptsForDay: (date: Date) => Appointment[];
  getBlocksForDay: (date: Date) => any[];
  getServiceDuration: (apt: Appointment) => number;
  getClientName: (apt: Appointment) => string;
  getServiceName: (apt: Appointment) => string;
  onSelectAppointment: (apt: Appointment) => void;
  onDeleteBlock: (blockId: string) => void;
  onSlotClick: (date: Date, time: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-8 border-b border-gray-100">
        <div className="p-3 text-xs text-gray-400 font-medium" />
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === new Date().toDateString();
          const count = getAptsForDay(d).length;
          return (
            <div key={i} className={`p-3 text-center border-l border-gray-50 ${isToday ? 'bg-[#6666cc]/5' : ''}`}>
              <div className="text-xs text-gray-500 font-medium">{DAYS[d.getDay()]}</div>
              <div className={`text-lg font-bold mt-0.5 ${isToday ? 'text-[#6666cc]' : 'text-gray-700'}`}>{d.getDate()}</div>
              {count > 0 && <div className="text-xs text-[#6666cc] font-semibold">{count} apt</div>}
            </div>
          );
        })}
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-8">
          <div className="relative" style={{ height: hours.length * HOUR_PX }}>
            {hours.map((hour, idx) => (
              <div key={hour} className="absolute right-0 pr-3 text-xs text-gray-400 font-medium" style={{ top: idx * HOUR_PX + 4 }}>
                {hour}
              </div>
            ))}
          </div>
          {weekDays.map((d, i) => (
            <DayColumn
              key={i}
              date={d}
              narrow
              hoursCount={hours.length}
              openHour={openHour}
              getAptsForDay={getAptsForDay}
              getBlocksForDay={getBlocksForDay}
              getServiceDuration={getServiceDuration}
              getClientName={getClientName}
              getServiceName={getServiceName}
              onSelectAppointment={onSelectAppointment}
              onDeleteBlock={onDeleteBlock}
              onSlotClick={onSlotClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
