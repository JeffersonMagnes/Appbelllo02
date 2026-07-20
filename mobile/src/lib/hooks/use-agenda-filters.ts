import { useMemo } from 'react';
import { Appointment } from '@/lib/types';
import { type BlockedSlot } from '@/lib/hooks/use-blocked-slots';
import { toLocalDateStr, localDateFromStr } from '@/lib/utils/date';

export type AgendaViewMode = 'day' | 'month' | 'year';

export type AgendaItem =
  | { type: 'appointment'; data: Appointment }
  | { type: 'blocked'; data: BlockedSlot };

/**
 * Derives the filtered/merged/grid views of appointments + blocked slots consumed by the
 * agenda screen, given the raw lists and the current filter state (date, professional, view mode).
 */
export function useAgendaFilters(
  appointments: Appointment[],
  blockedSlots: BlockedSlot[],
  selectedDate: Date,
  selectedProfessional: string | null,
  viewMode: AgendaViewMode,
) {
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    if (selectedProfessional) {
      filtered = filtered.filter((a: Appointment) => a.professionalId === selectedProfessional);
    }

    if (viewMode === 'day') {
      const dateStr = toLocalDateStr(selectedDate);
      filtered = filtered.filter((a: Appointment) => a.date === dateStr);
    } else if (viewMode === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      filtered = filtered.filter((a: Appointment) => {
        const d = localDateFromStr(a.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    } else if (viewMode === 'year') {
      const year = selectedDate.getFullYear();
      filtered = filtered.filter((a: Appointment) => localDateFromStr(a.date).getFullYear() === year);
    }

    return filtered.sort((a: Appointment, b: Appointment) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  }, [appointments, selectedDate, selectedProfessional, viewMode]);

  const filteredBlockedSlots = useMemo(() => {
    let filtered = [...blockedSlots];

    if (selectedProfessional) {
      filtered = filtered.filter((s: BlockedSlot) => s.employeeId === selectedProfessional || s.employeeId === null);
    }

    if (viewMode === 'day') {
      const dateStr = toLocalDateStr(selectedDate);
      filtered = filtered.filter((s: BlockedSlot) => s.date === dateStr);
    } else if (viewMode === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      filtered = filtered.filter((s: BlockedSlot) => {
        const d = localDateFromStr(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    } else if (viewMode === 'year') {
      const year = selectedDate.getFullYear();
      filtered = filtered.filter((s: BlockedSlot) => localDateFromStr(s.date).getFullYear() === year);
    }

    return filtered.sort((a: BlockedSlot, b: BlockedSlot) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [blockedSlots, selectedDate, selectedProfessional, viewMode]);

  // Merge appointments + blocked slots into a unified sorted list for display
  const mergedItems: AgendaItem[] = useMemo(() => {
    const items: AgendaItem[] = [
      ...filteredAppointments.map((a) => ({ type: 'appointment' as const, data: a })),
      ...filteredBlockedSlots.map((s) => ({ type: 'blocked' as const, data: s })),
    ];
    return items.sort((a, b) => {
      const dateA = a.data.date;
      const dateB = b.data.date;
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.type === 'appointment' ? a.data.time : a.data.startTime;
      const timeB = b.type === 'appointment' ? b.data.time : b.data.startTime;
      return timeA.localeCompare(timeB);
    });
  }, [filteredAppointments, filteredBlockedSlots]);

  // Appointments + blocked slots for exactly the selected date, used by the timeline grid
  // (day and week modes show a single-day grid, regardless of the wider list filter above)
  const selectedDateStr = toLocalDateStr(selectedDate);

  const gridAppointments = useMemo(() => {
    return appointments.filter((a: Appointment) =>
      a.date === selectedDateStr && (!selectedProfessional || a.professionalId === selectedProfessional)
    );
  }, [appointments, selectedDateStr, selectedProfessional]);

  const gridBlockedSlots = useMemo(() => {
    return blockedSlots.filter((s: BlockedSlot) =>
      s.date === selectedDateStr && (!selectedProfessional || s.employeeId === selectedProfessional || s.employeeId === null)
    );
  }, [blockedSlots, selectedDateStr, selectedProfessional]);

  return { filteredAppointments, filteredBlockedSlots, mergedItems, gridAppointments, gridBlockedSlots };
}
