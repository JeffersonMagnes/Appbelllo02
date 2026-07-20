'use client';

import { statusColors, statusLabels } from '@/lib/agenda-format';

export function AgendaLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs font-medium">
      {Object.entries(statusLabels).map(([k, v]) => (
        <div key={k} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-full ${statusColors[k]}`} />
          <span className="text-gray-600">{v}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-gray-300 border border-gray-400"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)' }} />
        <span className="text-gray-600">Bloqueado</span>
      </div>
    </div>
  );
}
