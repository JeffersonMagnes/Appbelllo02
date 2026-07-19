'use client';

import { useEffect, useState, useMemo } from 'react';
import { Add, ArrowLeft2, ArrowRight2, User, Link2, SearchNormal1, CloseCircle, TickSquare, Money, Mobile, Card } from 'iconsax-react';
import { X, Loader2, FileText, Receipt, Printer, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';
import type { Appointment } from '@/lib/supabase/types';

const DEFAULT_HOURS = Array.from({ length: 14 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  completed: 'bg-blue-500',
  delayed: 'bg-orange-500',
  no_show: 'bg-gray-500',
};

const statusBadgeColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  delayed: 'bg-orange-100 text-orange-700',
  no_show: 'bg-gray-100 text-gray-700',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  delayed: 'Atrasado',
  no_show: 'Não Compareceu',
};

const PAY_METHODS = [
  { v: 'pix', l: 'PIX', Icon: Mobile, color: '#0BBDB6' },
  { v: 'credito', l: 'Crédito', Icon: Card, color: '#7C3AED' },
  { v: 'debito', l: 'Débito', Icon: Card, color: '#3B82F6' },
  { v: 'dinheiro', l: 'Dinheiro', Icon: Money, color: '#22C55E' },
  { v: 'cheque', l: 'Cheque', Icon: Card, color: '#F59E0B' },
  { v: 'cortesia', l: 'Cortesia', Icon: TickSquare, color: '#EC4899' },
];

function fmt(date: Date) {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}
function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

const HOUR_PX = 60;

type Employee = { id: string; name: string; avatar_url?: string };
type Service = { id: string; name: string; price?: number; duration?: number };
type Client = { id: string; name: string };

export default function AgendaPage() {
  const [view, setView] = useState<'dia' | 'semana' | 'mes' | 'ano'>('semana');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [estId, setEstId] = useState('');
  const [estName, setEstName] = useState('');
  const [businessHours, setBusinessHours] = useState<string[]>([]);
  const HOURS = businessHours.length > 0 ? businessHours : DEFAULT_HOURS;
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineSearch, setOnlineSearch] = useState('');
  const [onlinePeriod, setOnlinePeriod] = useState(30);

  // Detail modal
  const [detailApt, setDetailApt] = useState<Appointment | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [payMethod, setPayMethod] = useState('pix');
  const [editingDateTime, setEditingDateTime] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [savingDateTime, setSavingDateTime] = useState(false);

  // New appointment modal
  const [showNewApt, setShowNewApt] = useState(false);
  const [savingApt, setSavingApt] = useState(false);
  const [aptForm, setAptForm] = useState({ client_id: '', service_id: '', employee_id: '', date: '', time: '', notes: '' });
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  // Invoice/Receipt document modal
  const [docModal, setDocModal] = useState<{ type: 'cobranca' | 'recibo'; apt: Appointment } | null>(null);

  // Block slots
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockEmployeeId, setBlockEmployeeId] = useState('');
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [savingBlock, setSavingBlock] = useState(false);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: estRaw } = await supabase.from('establishments').select('id, name, hours_json').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string; name: string; hours_json?: any } | null;
    if (!est) { setLoading(false); return; }
    setEstId(est.id);
    setEstName(est.name ?? '');

    if (est.hours_json && typeof est.hours_json === 'object') {
      const days = Object.values(est.hours_json) as any[];
      const activeDays = days.filter((d: any) => d?.active);
      if (activeDays.length > 0) {
        const opens = activeDays.map((d: any) => parseInt((d.open || '07:00').split(':')[0]));
        const closes = activeDays.map((d: any) => parseInt((d.close || '20:00').split(':')[0]));
        const minOpen = Math.min(...opens);
        const maxClose = Math.max(...closes) + 1;
        const hrs = Array.from({ length: maxClose - minOpen }, (_, i) => `${(i + minOpen).toString().padStart(2, '0')}:00`);
        setBusinessHours(hrs);
      }
    }

    const [aptsRes, empRes, svcRes, cliRes] = await Promise.all([
      supabase.from('appointments').select('*').eq('establishment_id', est.id).order('date').order('time'),
      supabase.from('employees').select('id, name, avatar_url').eq('establishment_id', est.id).eq('active', true),
      supabase.from('services').select('id, name, price, duration').eq('establishment_id', est.id).eq('active', true),
      supabase.from('clients').select('id, name').eq('establishment_id', est.id),
    ]);

    setAppointments(aptsRes.data || []);
    setEmployees((empRes.data || []) as Employee[]);
    setServices((svcRes.data || []) as Service[]);
    setClients((cliRes.data || []) as Client[]);

    // Fetch blocked slots
    const { data: blocks } = await (supabase as any)
      .from('blocked_slots')
      .select('*')
      .eq('establishment_id', est.id)
      .order('date')
      .order('start_time');
    setBlockedSlots(blocks || []);

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredApts = useMemo(() => {
    if (selectedEmployee === 'all') return appointments;
    return appointments.filter(a => (a as any).employee_id === selectedEmployee);
  }, [appointments, selectedEmployee]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === 'dia') d.setDate(d.getDate() + dir);
    else if (view === 'semana') d.setDate(d.getDate() + dir * 7);
    else if (view === 'mes') d.setMonth(d.getMonth() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    setCurrentDate(d);
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); return d;
    });
  };

  const getAptsForDay = (date: Date) => {
    const iso = toLocalDateStr(date);
    return filteredApts.filter(a => a.date === iso);
  };

  const getAptsForMonth = (year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return filteredApts.filter(a => a.date.startsWith(prefix));
  };

  const getClientName = (apt: Appointment) => {
    const c = clients.find(c => c.id === (apt as any).client_id);
    return c?.name ?? (apt as any).client_name ?? '—';
  };

  const getServiceName = (apt: Appointment) => {
    const s = services.find(s => s.id === (apt as any).service_id);
    return s?.name ?? '—';
  };

  const getServicePrice = (apt: Appointment) => {
    const s = services.find(s => s.id === (apt as any).service_id);
    return s?.price ?? 0;
  };

  const getEmployeeName = (apt: Appointment) => {
    const e = employees.find(e => e.id === (apt as any).employee_id);
    return e?.name ?? '—';
  };

  // Blocked slots helpers
  const getBlocksForDay = (date: Date) => {
    const iso = toLocalDateStr(date);
    const filtered = blockedSlots.filter(b => b.date === iso);
    if (selectedEmployee === 'all') return filtered;
    return filtered.filter(b => !b.employee_id || b.employee_id === selectedEmployee);
  };

  const openBlockModal = () => {
    const todayStr = toLocalDateStr(new Date());
    setBlockDate(todayStr);
    setBlockStartTime('08:00');
    setBlockEndTime('09:00');
    setBlockReason('');
    setBlockEmployeeId('');
    setShowBlockModal(true);
  };

  const handleCreateBlock = async () => {
    if (!blockDate || !blockStartTime || !blockEndTime) return;
    setSavingBlock(true);
    const supabase = createClient();
    await (supabase as any).from('blocked_slots').insert({
      establishment_id: estId,
      employee_id: blockEmployeeId || null,
      date: blockDate,
      start_time: blockStartTime,
      end_time: blockEndTime,
      reason: blockReason || null,
    });
    setSavingBlock(false);
    setShowBlockModal(false);
    load();
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Tem certeza que deseja remover este bloqueio?')) return;
    const supabase = createClient();
    await (supabase as any).from('blocked_slots').delete().eq('id', blockId);
    load();
  };

  // Status update
  const updateStatus = async (status: string) => {
    if (!detailApt) return;
    setUpdatingStatus(true);
    const supabase = createClient();

    if (status === 'completed') {
      const price = getServicePrice(detailApt);
      if (price > 0) {
        await (supabase as any).from('transactions').insert({
          establishment_id: estId, type: 'income', category: 'service', amount: price, status: 'paid',
          description: `${getServiceName(detailApt)} - ${getClientName(detailApt)}`,
          payment_method: payMethod, date: detailApt.date,
        });
      }
    }

    await (supabase as any).from('appointments').update({ status }).eq('id', detailApt.id);
    setDetailApt({ ...detailApt, status } as any);
    setUpdatingStatus(false);
    load();
  };

  const openNewApt = () => {
    const todayStr = toLocalDateStr(new Date());
    setAptForm({ client_id: '', service_id: '', employee_id: '', date: todayStr, time: '09:00', notes: '' });
    setShowNewClient(false);
    setNewClientName('');
    setNewClientPhone('');
    setShowNewApt(true);
  };

  const openNewAptAt = (date: Date, time: string) => {
    const dateStr = toLocalDateStr(date);
    setAptForm({ client_id: '', service_id: '', employee_id: '', date: dateStr, time, notes: '' });
    setShowNewClient(false);
    setNewClientName('');
    setNewClientPhone('');
    setShowNewApt(true);
  };

  const handleCreateInlineClient = async () => {
    if (!newClientName.trim() || !estId) return;
    setCreatingClient(true);
    const supabase = createClient();
    const { data, error } = await (supabase as any).from('clients').insert({
      establishment_id: estId,
      name: newClientName.trim(),
      phone: newClientPhone.trim() || null,
    }).select('id, name').single();
    if (data) {
      setClients(prev => [...prev, data as Client]);
      setAptForm(prev => ({ ...prev, client_id: data.id }));
      setShowNewClient(false);
      setNewClientName('');
      setNewClientPhone('');
    }
    setCreatingClient(false);
  };

  const handleCreateApt = async () => {
    if (!aptForm.service_id || !aptForm.date || !aptForm.time) return;
    setSavingApt(true);
    try {
      const supabase = createClient();
      const clientName = aptForm.client_id
        ? (clients.find(c => c.id === aptForm.client_id)?.name ?? null)
        : null;
      const { error } = await (supabase as any).from('appointments').insert({
        establishment_id: estId,
        client_id: aptForm.client_id || null,
        client_name: clientName,
        service_id: aptForm.service_id,
        employee_id: aptForm.employee_id || null,
        date: aptForm.date,
        time: aptForm.time,
        status: 'pending',
        notes: aptForm.notes || null,
      });
      if (error) {
        console.error('Erro ao criar agendamento:', error);
        alert('Erro ao criar agendamento: ' + error.message);
      } else {
        setShowNewApt(false);
        load();
      }
    } catch (e: any) {
      alert('Erro: ' + (e.message || 'Não foi possível criar o agendamento'));
    } finally {
      setSavingApt(false);
    }
  };

  // Online appointments
  const onlineApts = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - onlinePeriod);
    const cutoffStr = toLocalDateStr(cutoff);
    return appointments
      .filter(a => (a as any).source === 'online' || (a as any).client_name)
      .filter(a => a.date >= cutoffStr)
      .filter(a => {
        if (!onlineSearch.trim()) return true;
        const name = getClientName(a).toLowerCase();
        return name.includes(onlineSearch.toLowerCase());
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [appointments, onlinePeriod, onlineSearch, clients]);

  const onlineTotal = onlineApts.reduce((sum, a) => {
    const s = services.find(s => s.id === (a as any).service_id);
    return sum + (s?.price ?? 0);
  }, 0);

  const weekDays = getWeekDays();

  const openDetail = (apt: Appointment) => {
    setDetailApt(apt);
    setPayMethod('pix');
    setEditingDateTime(false);
    setEditDate(apt.date);
    setEditTime(apt.time);
  };

  const handleSaveDateTime = async () => {
    if (!detailApt || !editDate || !editTime) return;
    setSavingDateTime(true);
    const supabase = createClient();
    const { error } = await (supabase as any).from('appointments').update({ date: editDate, time: editTime }).eq('id', detailApt.id);
    if (error) {
      alert('Erro ao reagendar: ' + error.message);
    } else {
      setDetailApt({ ...detailApt, date: editDate, time: editTime } as any);
      setEditingDateTime(false);
      load();
    }
    setSavingDateTime(false);
  };

  const openDoc = (type: 'cobranca' | 'recibo', apt: Appointment) => {
    setDocModal({ type, apt });
  };

  const printDoc = () => {
    const printArea = document.getElementById('doc-print-area');
    if (!printArea) return;
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Documento</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
      .doc-container { max-width: 600px; margin: 0 auto; }
      .doc-header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #6666cc; }
      .doc-header h1 { font-size: 22px; color: #6666cc; margin-bottom: 4px; }
      .doc-header p { font-size: 13px; color: #666; }
      .doc-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 12px; }
      .doc-badge-cobranca { background: #FEF3C7; color: #92400E; }
      .doc-badge-recibo { background: #D1FAE5; color: #065F46; }
      .doc-section { margin-bottom: 20px; }
      .doc-section-title { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600; }
      .doc-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
      .doc-row:last-child { border-bottom: none; }
      .doc-label { font-size: 13px; color: #666; }
      .doc-value { font-size: 13px; font-weight: 600; color: #1a1a1a; text-align: right; }
      .doc-total { background: #f8f7ff; border-radius: 12px; padding: 16px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; }
      .doc-total-label { font-size: 14px; font-weight: 600; color: #444; }
      .doc-total-value { font-size: 22px; font-weight: 800; color: #6666cc; }
      .doc-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
      @media print { body { padding: 20px; } }
    </style></head><body>${printArea.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  const getServiceDuration = (apt: Appointment) => {
    const s = services.find(s => s.id === (apt as any).service_id);
    return s?.duration ?? 30;
  };

  const openHour = parseInt((HOURS[0] || '07:00'), 10) || 7;

  // Groups appointments + blocked slots into transitively-overlapping clusters and
  // assigns each a column, so overlapping items sit side-by-side instead of stacking.
  type TimelineItem =
    | { kind: 'apt'; data: Appointment; start: number; end: number }
    | { kind: 'block'; data: any; start: number; end: number };

  const layoutItems = (apts: Appointment[], blocks: any[]) => {
    const items: TimelineItem[] = [
      ...apts.map((a) => ({ kind: 'apt' as const, data: a, start: timeToMinutes(a.time), end: timeToMinutes(a.time) + getServiceDuration(a) })),
      ...blocks.map((b) => ({ kind: 'block' as const, data: b, start: timeToMinutes(b.start_time || '00:00'), end: timeToMinutes(b.end_time || '00:00') })),
    ];
    items.sort((a, b) => a.start - b.start || a.end - b.end);

    const positioned: (TimelineItem & { col: number; cols: number })[] = [];
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
  };

  const handleColumnClick = (date: Date, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutesFromOpen = Math.max(0, Math.min(HOURS.length * 60 - 30, (y / HOUR_PX) * 60));
    const snapped = Math.floor(minutesFromOpen / 30) * 30;
    const hour = openHour + Math.floor(snapped / 60);
    const min = snapped % 60;
    openNewAptAt(date, `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  };

  const DayColumn = ({ date, narrow = false }: { date: Date; narrow?: boolean }) => {
    const apts = getAptsForDay(date);
    const blocks = getBlocksForDay(date);
    const positioned = layoutItems(apts, blocks);
    const isToday = date.toDateString() === new Date().toDateString();
    const gridHeight = HOURS.length * HOUR_PX;

    return (
      <div
        onClick={(e) => handleColumnClick(date, e)}
        className={`relative border-l border-gray-50 cursor-pointer ${isToday ? 'bg-[#6666cc]/5' : 'hover:bg-gray-50/50'}`}
        style={{ height: gridHeight }}
      >
        {HOURS.map((_, idx) => (
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
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }} className="p-0.5 rounded hover:bg-gray-300 flex-shrink-0">
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
            <div key={apt.id} style={style} onClick={(e) => { e.stopPropagation(); openDetail(apt); }}>
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
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Agenda" />
      <main className="flex-1 p-4 sm:p-6 space-y-4">

        {/* Controls */}
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

              <button onClick={() => setShowOnlineModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6666cc]/10 text-[#6666cc] text-xs font-semibold hover:bg-[#6666cc]/20 transition-colors">
                <Link2 className="w-3.5 h-3.5" variant="Outline" />
                Online
                {appointments.filter(a => (a as any).source === 'online' || (a as any).client_name).length > 0 && (
                  <span className="bg-[#6666cc] text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {appointments.filter(a => (a as any).source === 'online' || (a as any).client_name).length}
                  </span>
                )}
              </button>

              <Button onClick={openBlockModal} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-100 rounded-xl h-9 text-sm">
                <Ban className="w-4 h-4 mr-1" /> Bloquear
              </Button>

              <Button onClick={openNewApt} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-9 text-sm">
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

        {/* Calendar body */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#6666cc] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* SEMANA */}
            {view === 'semana' && (
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
                    <div className="relative" style={{ height: HOURS.length * HOUR_PX }}>
                      {HOURS.map((hour, idx) => (
                        <div key={hour} className="absolute right-0 pr-3 text-xs text-gray-400 font-medium" style={{ top: idx * HOUR_PX + 4 }}>
                          {hour}
                        </div>
                      ))}
                    </div>
                    {weekDays.map((d, i) => <DayColumn key={i} date={d} narrow />)}
                  </div>
                </div>
              </div>
            )}

            {/* DIA */}
            {view === 'dia' && (
              <div className="flex overflow-y-auto max-h-[650px]">
                <div className="relative w-16 flex-shrink-0" style={{ height: HOURS.length * HOUR_PX }}>
                  {HOURS.map((hour, idx) => (
                    <div key={hour} className="absolute right-0 pr-3 text-xs text-gray-400 font-medium" style={{ top: idx * HOUR_PX + 4 }}>
                      {hour}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <DayColumn date={currentDate} />
                </div>
              </div>
            )}

            {/* MÊS */}
            {view === 'mes' && (
              <div>
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {DAYS.map(d => <div key={d} className="p-3 text-center text-xs font-semibold text-gray-500">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {(() => {
                    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    const days: (Date | null)[] = [];
                    for (let i = 0; i < first.getDay(); i++) days.push(null);
                    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
                    return days.map((d, i) => {
                      if (!d) return <div key={`e-${i}`} className="p-2 border-r border-b border-gray-50 min-h-20" />;
                      const isToday = d.toDateString() === new Date().toDateString();
                      const apts = getAptsForDay(d);
                      return (
                        <div key={i} className={`p-2 border-r border-b border-gray-50 min-h-20 ${isToday ? 'bg-[#6666cc]/5' : 'hover:bg-gray-50'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${isToday ? 'bg-[#6666cc] text-white' : 'text-gray-700'}`}>
                            {d.getDate()}
                          </div>
                          {apts.slice(0, 2).map(apt => (
                            <div key={apt.id} onClick={() => openDetail(apt)}
                              className={`${statusColors[apt.status] || 'bg-gray-400'} text-white text-xs rounded px-1.5 py-0.5 mb-0.5 truncate cursor-pointer hover:opacity-80`}>
                              {apt.time} {getClientName(apt)}
                            </div>
                          ))}
                          {apts.length > 2 && <div className="text-xs text-gray-400">+{apts.length - 2} mais</div>}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* ANO */}
            {view === 'ano' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-5">
                {Array.from({ length: 12 }, (_, m) => {
                  const apts = getAptsForMonth(currentDate.getFullYear(), m);
                  const isCurrent = m === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                  return (
                    <button key={m} onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), m, 1)); setView('mes'); }}
                      className={`rounded-2xl p-4 text-center transition-all hover:shadow-md ${isCurrent ? 'border-2 border-[#6666cc] bg-[#6666cc]/5' : 'border border-gray-100 bg-white hover:border-gray-200'}`}>
                      <p className={`font-bold text-sm ${isCurrent ? 'text-[#6666cc]' : 'text-gray-900'}`}>{MONTHS_SHORT[m]}</p>
                      <p className={`text-2xl font-extrabold mt-1 ${apts.length > 0 ? (isCurrent ? 'text-[#6666cc]' : 'text-gray-700') : 'text-gray-300'}`}>{apts.length}</p>
                      <p className="text-xs text-gray-400 mt-0.5">agendamento{apts.length !== 1 ? 's' : ''}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Legenda */}
        {view !== 'ano' && (
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
        )}
      </main>

      {/* New Appointment Modal */}
      {showNewApt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Novo Agendamento</h3>
              <button onClick={() => setShowNewApt(false)}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">Cliente</Label>
                  <button type="button" onClick={() => setShowNewClient(!showNewClient)}
                    className="text-xs font-semibold text-[#6666cc] hover:underline flex items-center gap-1">
                    <Add className="w-3.5 h-3.5" /> Novo cliente
                  </button>
                </div>
                {showNewClient && (
                  <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                    <input value={newClientName} onChange={e => setNewClientName(e.target.value)}
                      placeholder="Nome do cliente *"
                      className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
                    <input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)}
                      placeholder="Telefone (opcional)"
                      className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
                    <Button onClick={handleCreateInlineClient} disabled={creatingClient || !newClientName.trim()}
                      className="w-full h-9 bg-[#0BBDB6] hover:bg-[#09a8a2] text-white text-sm rounded-lg border-0">
                      {creatingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar e Selecionar'}
                    </Button>
                  </div>
                )}
                <select value={aptForm.client_id} onChange={e => setAptForm({ ...aptForm, client_id: e.target.value })}
                  className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
                  <option value="">Selecione (opcional)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Serviço *</Label>
                <select value={aptForm.service_id} onChange={e => setAptForm({ ...aptForm, service_id: e.target.value })}
                  className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
                  <option value="">Selecione o serviço</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} {s.price ? `- R$ ${Number(s.price).toFixed(2)}` : ''}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Profissional</Label>
                <select value={aptForm.employee_id} onChange={e => setAptForm({ ...aptForm, employee_id: e.target.value })}
                  className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
                  <option value="">Selecione (opcional)</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Data *</Label>
                  <input type="date" value={aptForm.date} onChange={e => setAptForm({ ...aptForm, date: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Horário *</Label>
                  <input type="time" value={aptForm.time} onChange={e => setAptForm({ ...aptForm, time: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Observações</Label>
                <textarea value={aptForm.notes} onChange={e => setAptForm({ ...aptForm, notes: e.target.value })} rows={2}
                  placeholder="Observações opcionais..."
                  className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:border-[#6666cc]" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowNewApt(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button onClick={handleCreateApt} disabled={savingApt || !aptForm.service_id || !aptForm.date || !aptForm.time}
                  className="flex-1 bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl font-bold">
                  {savingApt ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agendar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Slot Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Ban className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="font-bold text-gray-900">Bloquear Horário</h3>
              </div>
              <button onClick={() => setShowBlockModal(false)}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Data *</Label>
                <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)}
                  className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Início *</Label>
                  <input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)}
                    className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fim *</Label>
                  <input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)}
                    className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Profissional</Label>
                <select value={blockEmployeeId} onChange={e => setBlockEmployeeId(e.target.value)}
                  className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
                  <option value="">Todos os profissionais</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Motivo</Label>
                <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                  placeholder="Ex: Almoço, Reunião, Manutenção..."
                  className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowBlockModal(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button onClick={handleCreateBlock} disabled={savingBlock || !blockDate || !blockStartTime || !blockEndTime}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white border-0 rounded-xl font-bold">
                  {savingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                    <Ban className="w-4 h-4 mr-1" /> Bloquear
                  </>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailApt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-lg text-gray-900">{getServiceName(detailApt)}</p>
                  <p className="text-gray-500 text-sm">{getClientName(detailApt)}</p>
                </div>
                <button onClick={() => setDetailApt(null)}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
              </div>
              <span className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadgeColors[detailApt.status] || 'bg-gray-100 text-gray-600'}`}>
                {statusLabels[detailApt.status] || detailApt.status}
              </span>
            </div>
            <div className="p-5 space-y-4">
              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setEditingDateTime(true)}>
                  <p className="text-xs text-gray-400 mb-0.5">Data {!editingDateTime && <span className="text-[10px]">✏️</span>}</p>
                  {editingDateTime ? (
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#6666cc]" />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">{new Date(detailApt.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setEditingDateTime(true)}>
                  <p className="text-xs text-gray-400 mb-0.5">Horário {!editingDateTime && <span className="text-[10px]">✏️</span>}</p>
                  {editingDateTime ? (
                    <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#6666cc]" />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">{detailApt.time}</p>
                  )}
                </div>
                {editingDateTime && (
                  <div className="col-span-2 flex gap-2">
                    <button onClick={() => { setEditingDateTime(false); setEditDate(detailApt.date); setEditTime(detailApt.time); }}
                      className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button onClick={handleSaveDateTime} disabled={savingDateTime}
                      className="flex-1 py-2 rounded-lg bg-[#6666cc] text-white text-xs font-bold hover:bg-[#5555aa] disabled:opacity-50">
                      {savingDateTime ? 'Salvando...' : 'Reagendar'}
                    </button>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Profissional</p>
                  <p className="text-sm font-semibold text-gray-900">{getEmployeeName(detailApt)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Valor</p>
                  <p className="text-sm font-semibold text-brand-primary">{fmtBRL(getServicePrice(detailApt))}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Duração</p>
                  <p className="text-sm font-semibold text-gray-900">{(() => { const d = getServiceDuration(detailApt); return d >= 60 ? `${Math.floor(d/60)}h${d%60 ? ` ${d%60}min` : ''}` : `${d} min`; })()}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <button key={k} onClick={() => { if (k !== 'completed') updateStatus(k); }}
                      disabled={updatingStatus || detailApt.status === k}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border-2 ${detailApt.status === k
                        ? `${statusBadgeColors[k]} border-current`
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      } ${k === 'completed' && (detailApt.status as string) !== 'completed' ? 'opacity-50 cursor-default' : ''}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method — shown when marking as completed */}
              {(detailApt.status as string) !== 'completed' && (detailApt.status as string) !== 'cancelled' && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Pagamento ao concluir</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAY_METHODS.map(m => (
                      <button key={m.v} onClick={() => setPayMethod(m.v)}
                        className={`p-2.5 rounded-xl border-2 text-xs font-semibold flex items-center gap-2 transition-all ${payMethod === m.v ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 text-gray-600'}`}>
                        <m.Icon className="w-4 h-4" variant="Outline" /> {m.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {(detailApt.status as string) !== 'completed' && (detailApt.status as string) !== 'cancelled' && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => updateStatus('cancelled')} disabled={updatingStatus}
                    className="flex-1 rounded-xl text-gray-500 border-gray-200 hover:bg-gray-50 text-sm">
                    Cancelar
                  </Button>
                  <Button onClick={() => updateStatus('completed')} disabled={updatingStatus}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm border-0">
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                      <TickSquare className="w-4 h-4 mr-1" variant="Outline" /> Concluir
                    </>}
                  </Button>
                </div>
              )}

              {(detailApt.status as string) === 'completed' && (
                <div className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-xl text-gray-600 text-sm font-semibold">
                  <TickSquare className="w-4 h-4" variant="Outline" /> Concluído
                </div>
              )}

              {/* Gerar Cobrança / Gerar Recibo */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => openDoc('cobranca', detailApt)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Cobrança
                </button>
                <button onClick={() => openDoc('recibo', detailApt)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">
                  <Receipt className="w-3.5 h-3.5" /> Recibo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice/Receipt Document Modal */}
      {docModal && (() => {
        const apt = docModal.apt;
        const isRecibo = docModal.type === 'recibo';
        const title = isRecibo ? 'RECIBO' : 'COBRANÇA';
        const clientName = getClientName(apt);
        const serviceName = getServiceName(apt);
        const price = getServicePrice(apt);
        const employeeName = getEmployeeName(apt);
        const dateFormatted = new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        const now = new Date();
        const emittedAt = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const payLabel = PAY_METHODS.find(m => m.v === payMethod)?.l ?? payMethod;

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Modal header */}
              <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100 z-10">
                <div className="flex items-center gap-2">
                  {isRecibo
                    ? <Receipt className="w-5 h-5 text-emerald-600" />
                    : <FileText className="w-5 h-5 text-amber-600" />
                  }
                  <h3 className="font-bold text-gray-900 text-sm">
                    {isRecibo ? 'Recibo de Pagamento' : 'Cobrança de Serviço'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={printDoc}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6666cc] text-white text-xs font-semibold hover:bg-[#5555aa] transition-colors">
                    <Printer className="w-3.5 h-3.5" /> Imprimir
                  </button>
                  <button onClick={() => setDocModal(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable document content */}
              <div id="doc-print-area" className="p-6">
                <div className="doc-container">
                  {/* Document header */}
                  <div className="doc-header" style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #6666cc' }}>
                    <h1 style={{ fontSize: 22, color: '#6666cc', marginBottom: 4, fontWeight: 800 }}>
                      {estName || 'Estabelecimento'}
                    </h1>
                    <p style={{ fontSize: 13, color: '#666' }}>Documento emitido em {emittedAt}</p>
                    <div style={{
                      display: 'inline-block', padding: '4px 16px', borderRadius: 20,
                      fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 12,
                      background: isRecibo ? '#D1FAE5' : '#FEF3C7',
                      color: isRecibo ? '#065F46' : '#92400E',
                    }}>
                      {title}
                    </div>
                  </div>

                  {/* Client info */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8, fontWeight: 600 }}>
                      Dados do Cliente
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>Nome</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{clientName}</span>
                    </div>
                  </div>

                  {/* Service info */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8, fontWeight: 600 }}>
                      Dados do Serviço
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>Serviço</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{serviceName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>Profissional</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{employeeName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>Data</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' as const }}>{dateFormatted}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>Horário</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{apt.time}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>Status</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{statusLabels[apt.status] ?? apt.status}</span>
                    </div>
                    {isRecibo && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: 13, color: '#666' }}>Forma de Pagamento</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{payLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div style={{ background: '#f8f7ff', borderRadius: 12, padding: 16, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#444' }}>
                      {isRecibo ? 'Valor Pago' : 'Valor a Pagar'}
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#6666cc' }}>{fmtBRL(price)}</span>
                  </div>

                  {/* Receipt confirmation text */}
                  {isRecibo && (
                    <div style={{ marginTop: 24, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                      <p style={{ fontSize: 13, color: '#166534', fontWeight: 600, marginBottom: 4 }}>Pagamento Confirmado</p>
                      <p style={{ fontSize: 12, color: '#15803d' }}>
                        Confirmamos o recebimento do valor de {fmtBRL(price)} referente ao serviço de {serviceName} realizado em {dateFormatted}.
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #eee', textAlign: 'center', fontSize: 11, color: '#999' }}>
                    <p>{estName || 'Estabelecimento'}</p>
                    <p style={{ marginTop: 4 }}>Documento gerado automaticamente pelo sistema</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Online Modal */}
      {showOnlineModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#6666cc]/10 flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-[#6666cc]" variant="Outline" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Agendamentos Online</h2>
                  <p className="text-xs text-gray-400">Feitos pelo link público</p>
                </div>
              </div>
              <button onClick={() => setShowOnlineModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-50 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <SearchNormal1 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" variant="Outline" />
                <input value={onlineSearch} onChange={e => setOnlineSearch(e.target.value)} placeholder="Buscar cliente..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6666cc]" />
              </div>
              <select value={onlinePeriod} onChange={e => setOnlinePeriod(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#6666cc] bg-white">
                <option value={15}>Últimos 15 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={60}>Últimos 60 dias</option>
                <option value={90}>Últimos 90 dias</option>
              </select>
            </div>

            <div className="px-5 py-2.5 bg-[#6666cc]/5 border-b border-[#6666cc]/10 flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">{onlineApts.length} agendamento{onlineApts.length !== 1 ? 's' : ''}</span>
              <span className="text-sm font-bold text-[#6666cc]">Total: {fmtBRL(onlineTotal)}</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {onlineApts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Link2 className="w-8 h-8 mb-2 opacity-30" variant="Outline" />
                  <p className="text-sm">Nenhum agendamento online no período</p>
                </div>
              ) : (
                onlineApts.map(apt => {
                  const svc = services.find(s => s.id === (apt as any).service_id);
                  return (
                    <div key={apt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[apt.status] || 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{getClientName(apt)}</p>
                        <p className="text-xs text-gray-400">{svc?.name ?? '—'} · {apt.date} às {apt.time}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-700">{svc?.price ? fmtBRL(svc.price) : '—'}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusColors[apt.status] || 'bg-gray-400'}`}>
                          {statusLabels[apt.status] ?? apt.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
