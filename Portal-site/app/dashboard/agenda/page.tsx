'use client';

import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';
import type { Appointment } from '@/lib/supabase/types';
import { DEFAULT_HOURS, toLocalDateStr } from '@/lib/agenda-format';

import { AgendaControls, type AgendaView } from '@/components/dashboard/agenda/AgendaControls';
import { AgendaLegend } from '@/components/dashboard/agenda/AgendaLegend';
import { WeekView } from '@/components/dashboard/agenda/WeekView';
import { DayView } from '@/components/dashboard/agenda/DayView';
import { MonthView } from '@/components/dashboard/agenda/MonthView';
import { YearView } from '@/components/dashboard/agenda/YearView';
import { NewAppointmentModal, type AptForm } from '@/components/dashboard/agenda/NewAppointmentModal';
import { BlockSlotModal } from '@/components/dashboard/agenda/BlockSlotModal';
import { AppointmentDetailModal } from '@/components/dashboard/agenda/AppointmentDetailModal';
import { DocumentModal, type DocModalState } from '@/components/dashboard/agenda/DocumentModal';
import { OnlineAppointmentsModal } from '@/components/dashboard/agenda/OnlineAppointmentsModal';

type Employee = { id: string; name: string; avatar_url?: string };
type Service = { id: string; name: string; price?: number; duration?: number };
type Client = { id: string; name: string };

export default function AgendaPage() {
  const [view, setView] = useState<AgendaView>('semana');
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
  const [aptForm, setAptForm] = useState<AptForm>({ client_id: '', service_id: '', employee_id: '', date: '', time: '', notes: '' });
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  // Invoice/Receipt document modal
  const [docModal, setDocModal] = useState<DocModalState | null>(null);

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

  const onlineCount = appointments.filter(a => (a as any).source === 'online' || (a as any).client_name).length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Agenda" />
      <main className="flex-1 p-4 sm:p-6 space-y-4">

        <AgendaControls
          view={view}
          setView={setView}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          weekDays={weekDays}
          navigate={navigate}
          onlineCount={onlineCount}
          onOpenOnline={() => setShowOnlineModal(true)}
          onOpenBlock={openBlockModal}
          onOpenNewApt={openNewApt}
          employees={employees}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
        />

        {/* Calendar body */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#6666cc] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {view === 'semana' && (
              <WeekView
                weekDays={weekDays}
                hours={HOURS}
                openHour={openHour}
                getAptsForDay={getAptsForDay}
                getBlocksForDay={getBlocksForDay}
                getServiceDuration={getServiceDuration}
                getClientName={getClientName}
                getServiceName={getServiceName}
                onSelectAppointment={openDetail}
                onDeleteBlock={handleDeleteBlock}
                onSlotClick={openNewAptAt}
              />
            )}

            {view === 'dia' && (
              <DayView
                currentDate={currentDate}
                hours={HOURS}
                openHour={openHour}
                getAptsForDay={getAptsForDay}
                getBlocksForDay={getBlocksForDay}
                getServiceDuration={getServiceDuration}
                getClientName={getClientName}
                getServiceName={getServiceName}
                onSelectAppointment={openDetail}
                onDeleteBlock={handleDeleteBlock}
                onSlotClick={openNewAptAt}
              />
            )}

            {view === 'mes' && (
              <MonthView
                currentDate={currentDate}
                getAptsForDay={getAptsForDay}
                getClientName={getClientName}
                onSelectAppointment={openDetail}
              />
            )}

            {view === 'ano' && (
              <YearView
                currentDate={currentDate}
                getAptsForMonth={getAptsForMonth}
                onSelectMonth={(date) => { setCurrentDate(date); setView('mes'); }}
              />
            )}
          </div>
        )}

        {/* Legenda */}
        {view !== 'ano' && <AgendaLegend />}
      </main>

      <NewAppointmentModal
        visible={showNewApt}
        onClose={() => setShowNewApt(false)}
        clients={clients}
        services={services}
        employees={employees}
        aptForm={aptForm}
        setAptForm={setAptForm}
        showNewClient={showNewClient}
        setShowNewClient={setShowNewClient}
        newClientName={newClientName}
        setNewClientName={setNewClientName}
        newClientPhone={newClientPhone}
        setNewClientPhone={setNewClientPhone}
        creatingClient={creatingClient}
        onCreateInlineClient={handleCreateInlineClient}
        savingApt={savingApt}
        onSubmit={handleCreateApt}
      />

      <BlockSlotModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        blockDate={blockDate}
        setBlockDate={setBlockDate}
        blockStartTime={blockStartTime}
        setBlockStartTime={setBlockStartTime}
        blockEndTime={blockEndTime}
        setBlockEndTime={setBlockEndTime}
        blockReason={blockReason}
        setBlockReason={setBlockReason}
        blockEmployeeId={blockEmployeeId}
        setBlockEmployeeId={setBlockEmployeeId}
        employees={employees}
        savingBlock={savingBlock}
        onSubmit={handleCreateBlock}
      />

      <AppointmentDetailModal
        apt={detailApt}
        onClose={() => setDetailApt(null)}
        getServiceName={getServiceName}
        getClientName={getClientName}
        getEmployeeName={getEmployeeName}
        getServicePrice={getServicePrice}
        getServiceDuration={getServiceDuration}
        editingDateTime={editingDateTime}
        setEditingDateTime={setEditingDateTime}
        editDate={editDate}
        setEditDate={setEditDate}
        editTime={editTime}
        setEditTime={setEditTime}
        savingDateTime={savingDateTime}
        onSaveDateTime={handleSaveDateTime}
        onCancelEditDateTime={() => {
          if (!detailApt) return;
          setEditingDateTime(false);
          setEditDate(detailApt.date);
          setEditTime(detailApt.time);
        }}
        updatingStatus={updatingStatus}
        onUpdateStatus={updateStatus}
        payMethod={payMethod}
        setPayMethod={setPayMethod}
        onOpenDoc={(type) => { if (detailApt) openDoc(type, detailApt); }}
      />

      <DocumentModal
        docModal={docModal}
        onClose={() => setDocModal(null)}
        estName={estName}
        payMethod={payMethod}
        getClientName={getClientName}
        getServiceName={getServiceName}
        getServicePrice={getServicePrice}
        getEmployeeName={getEmployeeName}
        onPrint={printDoc}
      />

      <OnlineAppointmentsModal
        visible={showOnlineModal}
        onClose={() => setShowOnlineModal(false)}
        onlineSearch={onlineSearch}
        setOnlineSearch={setOnlineSearch}
        onlinePeriod={onlinePeriod}
        setOnlinePeriod={setOnlinePeriod}
        onlineApts={onlineApts}
        onlineTotal={onlineTotal}
        services={services}
        getClientName={getClientName}
      />
    </div>
  );
}
