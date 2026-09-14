'use client';

import { X } from 'lucide-react';
import { statusColors, HOUR_PX } from '@/lib/agenda-format';
import { layoutItems } from '@/lib/agenda-timeline-layout';
import type { Appointment } from '@/lib/supabase/types';

export function DayColumn({
  date,
  narrow = false,
  hoursCount,
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
  date: Date;
  narrow?: boolean;
  hoursCount: number;
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
  const apts = getAptsForDay(date);
  const blocks = getBlocksForDay(date);
  const positioned = layoutItems(apts, blocks, getServiceDuration);
  const isToday = date.toDateString() === new Date().toDateString();
  const gridHeight = hoursCount * HOUR_PX;

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutesFromOpen = Math.max(0, Math.min(hoursCount * 60 - 30, (y / HOUR_PX) * 60));
    const snapped = Math.floor(minutesFromOpen / 30) * 30;
    const hour = openHour + Math.floor(snapped / 60);
    const min = snapped % 60;
    onSlotClick(date, `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  };

  return (
    <div
      onClick={handleColumnClick}
      className={`relative border-l border-gray-50 cursor-pointer ${isToday ? 'bg-[#6666cc]/5' : 'hover:bg-gray-50/50'}`}
      style={{ height: gridHeight }}
    >
      {Array.from({ length: hoursCount }).map((_, idx) => (
        <div key={idx} className="absolute left-0 right-0 border-t border-gray-50" style={{ top: idx * HOUR_PX }} />
      ))}

      {positioned.map((item) => {
        const top = ((item.start - openHour * 60) / 60) * HOUR_PX;
        const height = Math.max(((item.end - item.start) / 60) * HOUR_PX - 2, narrow ? 24 : 32);
        const widthPct = 100 / item.cols;
        const leftPct = item.col * widthPct;
        const style: React.CSSProperties = {
          position: 'absolute', top, height,
          left: `${leftPct}%`, width: `${widthPct}%`,
          padding: '0 2px 2px',
        };

        if (item.kind === 'block') {
          const block = item.data;
          return (
            <div key={`block-${block.id}`} style={style} onClick={(e) => e.stopPropagation()}>
              <div
                className="relative h-full bg-gray-200 text-gray-600 rounded-lg p-1 border border-gray-300 overflow-hidden"
                style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)' }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-[10px] truncate">{block.start_time?.slice(0, 5)}-{block.end_time?.slice(0, 5)}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }} className="p-0.5 rounded hover:bg-gray-300 flex-shrink-0">
                    <X className="w-2.5 h-2.5 text-gray-500" />
                  </button>
                </div>
                {height > 36 && <div className="text-gray-500 text-[9px] truncate">Bloqueado</div>}
              </div>
            </div>
          );
        }

        const apt = item.data as Appointment;
        return (
          <div key={apt.id} style={style} onClick={(e) => { e.stopPropagation(); onSelectAppointment(apt); }}>
            <div className={`${statusColors[apt.status] || 'bg-gray-400'} h-full text-white rounded-lg p-1 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden`}>
              <div className="font-bold text-[10px] leading-tight truncate">{apt.time}</div>
              <div className="text-white/90 text-[9px] leading-tight truncate font-medium">{getClientName(apt).split(' ')[0]}</div>
              {height > 36 && <div className="text-white/70 text-[8px] leading-tight truncate">{getServiceName(apt)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
