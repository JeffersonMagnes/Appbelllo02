import { cn } from '@/lib/utils';

/** Shared visual treatment for appointments; scheduling rules stay in DayColumn. */
export function AppointmentTile({ time, client, service, color, compact = false, showService = true, singleLine = false }: {
  time: string;
  client: string;
  service: string;
  color: string;
  compact?: boolean;
  singleLine?: boolean;
  showService?: boolean;
}) {
  return (
    <div className={cn(color, 'h-full overflow-hidden rounded-lg px-2 py-1 text-left text-white transition-opacity duration-200 hover:opacity-90', singleLine && 'flex items-center gap-1.5')}>
      <div className={cn('shrink-0 truncate font-semibold tabular-nums leading-tight', compact ? 'text-[11px]' : 'text-xs')}>{time}</div>
      <div className={cn('min-w-0 truncate font-medium leading-tight', compact ? 'text-[11px]' : 'text-xs')}>{client}</div>
      {showService && !singleLine && <div className="truncate text-[11px] leading-tight text-white">{service}</div>}
    </div>
  );
}
