'use client';

import { Add, ArrowLeft2, ArrowRight2, User, Link2 } from 'iconsax-react';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fmt, MONTHS } from '@/lib/agenda-format';

export type AgendaView = 'dia' | 'semana' | 'mes' | 'ano';

type Employee = { id: string; name: string; avatar_url?: string };

export function AgendaControls({
  view,
  setView,
  currentDate,
  setCurrentDate,
  weekDays,
  navigate,
  onlineCount,
  onOpenOnline,
  onOpenBlock,
  onOpenNewApt,
  employees,
  selectedEmployee,
  setSelectedEmployee,
}: {
  view: AgendaView;
  setView: (v: AgendaView) => void;
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  weekDays: Date[];
  navigate: (dir: number) => void;
  onlineCount: number;
  onOpenOnline: () => void;
  onOpenBlock: () => void;
  onOpenNewApt: () => void;
  employees: Employee[];
  selectedEmployee: string;
  setSelectedEmployee: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-50 text-gray-600">
            <ArrowLeft2 className="w-5 h-5" variant="Outline" />
          </button>
          <h2 className="font-bold text-gray-900 min-w-44 text-center text-sm">
            {view === 'ano'
              ? `${currentDate.getFullYear()}`
              : view === 'mes'
              ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : view === 'semana'
              ? `${fmt(weekDays[0])} — ${fmt(weekDays[6])}`
              : fmt(currentDate)}
          </h2>
          <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-gray-50 text-gray-600">
            <ArrowRight2 className="w-5 h-5" variant="Outline" />
          </button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="rounded-xl text-xs">Hoje</Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['dia', 'semana', 'mes', 'ano'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${view === v ? 'bg-white shadow text-[#6666cc]' : 'text-gray-500'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <button onClick={onOpenOnline}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6666cc]/10 text-[#6666cc] text-xs font-semibold hover:bg-[#6666cc]/20 transition-colors">
            <Link2 className="w-3.5 h-3.5" variant="Outline" />
            Online
            {onlineCount > 0 && (
              <span className="bg-[#6666cc] text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {onlineCount}
              </span>
            )}
          </button>

          <Button onClick={onOpenBlock} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-100 rounded-xl h-9 text-sm">
            <Ban className="w-4 h-4 mr-1" /> Bloquear
          </Button>

          <Button onClick={onOpenNewApt} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-9 text-sm">
            <Add className="w-4 h-4 mr-1" variant="Outline" /> Novo
          </Button>
        </div>
      </div>

      {employees.length > 0 && view !== 'ano' && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-50">
          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <User className="w-3.5 h-3.5" variant="Outline" /> Profissional:
          </span>
          <button onClick={() => setSelectedEmployee('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${selectedEmployee === 'all' ? 'bg-[#6666cc] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Todos
          </button>
          {employees.map(emp => (
            <button key={emp.id} onClick={() => setSelectedEmployee(emp.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${selectedEmployee === emp.id ? 'bg-[#6666cc] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {emp.avatar_url ? (
                <img src={emp.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedEmployee === emp.id ? 'bg-white/20 text-white' : 'bg-[#6666cc] text-white'}`}>
                  {emp.name.charAt(0).toUpperCase()}
                </span>
              )}
              {emp.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
