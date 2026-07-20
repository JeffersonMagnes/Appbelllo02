import { timeToMinutes } from '@/lib/agenda-format';
import type { Appointment } from '@/lib/supabase/types';

export type TimelineItem =
  | { kind: 'apt'; data: Appointment; start: number; end: number }
  | { kind: 'block'; data: any; start: number; end: number };

export type PositionedTimelineItem = TimelineItem & { col: number; cols: number };

/**
 * Groups appointments + blocked slots into transitively-overlapping clusters and
 * assigns each a column, so overlapping items sit side-by-side instead of stacking.
 */
export function layoutItems(
  apts: Appointment[],
  blocks: any[],
  getServiceDuration: (apt: Appointment) => number,
): PositionedTimelineItem[] {
  const items: TimelineItem[] = [
    ...apts.map((a) => ({ kind: 'apt' as const, data: a, start: timeToMinutes(a.time), end: timeToMinutes(a.time) + getServiceDuration(a) })),
    ...blocks.map((b) => ({ kind: 'block' as const, data: b, start: timeToMinutes(b.start_time || '00:00'), end: timeToMinutes(b.end_time || '00:00') })),
  ];
  items.sort((a, b) => a.start - b.start || a.end - b.end);

  const positioned: PositionedTimelineItem[] = [];
  let cluster: TimelineItem[] = [];
  let clusterEnd = -1;
  const flush = () => {
    if (cluster.length === 0) return;
    const colEnds: number[] = [];
    const withCol = cluster.map((item) => {
      let col = colEnds.findIndex((end) => end <= item.start);
      if (col === -1) { col = colEnds.length; colEnds.push(item.end); } else { colEnds[col] = item.end; }
      return { ...item, col };
    });
    const cols = colEnds.length;
    withCol.forEach((it) => positioned.push({ ...it, cols }));
    cluster = [];
    clusterEnd = -1;
  };
  for (const item of items) {
    if (cluster.length === 0 || item.start < clusterEnd) {
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.end);
    } else {
      flush();
      cluster.push(item);
      clusterEnd = item.end;
    }
  }
  flush();
  return positioned;
}
