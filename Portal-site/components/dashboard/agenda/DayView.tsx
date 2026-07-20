'use client';

import { HOUR_PX } from '@/lib/agenda-format';
import { DayColumn } from './DayColumn';
import type { Appointment } from '@/lib/supabase/types';

export function DayView({
  currentDate,
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
  currentDate: Date;
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
    <div className="flex overflow-y-auto max-h-[650px]">
      <div className="relative w-16 flex-shrink-0" style={{ height: hours.length * HOUR_PX }}>
        {hours.map((hour, idx) => (
          <div key={hour} className="absolute right-0 pr-3 text-xs text-gray-400 font-medium" style={{ top: idx * HOUR_PX + 4 }}>
            {hour}
          </div>
        ))}
      </div>
      <div className="flex-1">
        <DayColumn
          date={currentDate}
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
      </div>
    </div>
  );
}
