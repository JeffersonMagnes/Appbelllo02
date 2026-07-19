'use client';

import { useState } from 'react';
import { Add, Send2, Notification, Profile2User, Eye, Trash, CloseCircle } from 'iconsax-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/admin/StatusBadge';

const initialNotifications = [
  { id: 'n1', title: 'Seu trial expira em 3 dias!', body: 'Não perca o acesso. Assine o plano Pro.', segment: 'trial', sent: 1420, opened: 682, sentAt: '20/04/2026 09:30', status: 'sent' },
  { id: 'n2', title: 'Nova funcionalidade: Agenda Online', body: 'Agendamentos pelo link direto já disponíveis.', segment: 'all', sent: 3840, opened: 1923, sentAt: '18/04/2026 14:00', status: 'sent' },
  { id: 'n3', title: 'Oferta exclusiva Schwarzkopf', body: '20% OFF em produtos selecionados.', segment: 'paying', sent: 2100, opened: 1050, sentAt: '15/04/2026 10:00', status: 'sent' },
  { id: 'n4', title: 'Lembrete: configure seu perfil', body: 'Adicione seu horário de funcionamento.', segment: 'all', sent: 0, opened: 0, sentAt: '—', status: 'draft' },
];

type Notification = typeof initialNotifications[0];

const SEGMENTS = [
  { id: 'all', label: 'Todos os usuários' }, { id: 'trial', label: 'Em período de trial' },
  { id: 'paying', label: 'Assinantes pagantes' }, { id: 'expiring', label: 'Expirando (< 7 dias)' },
  { id: 'starter', label: 'Plano Starter' }, { id: 'pro', label: 'Plano Pro' }, { id: 'premium', label: 'Plano Premium' },
];

export default function PushPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('all');
  const [schedule, setSchedule] = useState('now');

  const handleSend = () => {
    if (!title.trim()) return;
    const now = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const status = schedule === 'draft' ? 'draft' : 'sent';
    setNotifications(prev => [{
      id: `n${Date.now()}`, title, body, segment, sent: status === 'sent' ? Math.floor(Math.random() * 2000) + 500 : 0,
      opened: 0, sentAt: status === 'sent' ? now : '—', status,
    }, ...prev]);
    setShowModal(false);
    setTitle('');
    setBody('');
    setSegment('all');
    setSchedule('now');
  };

  const sendDraft = (n: Notification) => {
    const now = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, status: 'sent', sent: Math.floor(Math.random() * 2000) + 500, sentAt: now } : item));
  };

  const confirmDelete = () => {
    setNotifications(prev => prev.filter(n => n.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Notificações', 'Push']} />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Notificações Push</h1><p className="text-sm text-gray-500 mt-0.5">Envie alertas e atualizações diretamente no dispositivo</p></div>
          <Button onClick={() => setShowModal(true)} className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white"><Add className="w-4 h-4"  variant="Outline" /> Nova notificação</Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center gap-2 mb-2"><Notification className="w-4 h-4 text-[#6666cc]"  variant="Outline" /><p className="text-xs font-medium text-gray-500">Enviadas (mês)</p></div><p className="text-2xl font-bold text-gray-900">7.360</p></div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center gap-2 mb-2"><Eye className="w-4 h-4 text-emerald-500"  variant="Outline" /><p className="text-xs font-medium text-gray-500">Abertas</p></div><p className="text-2xl font-bold text-gray-900">3.655</p><p className="text-xs text-emerald-600 font-medium mt-1">Taxa 49.7%</p></div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center gap-2 mb-2"><Profile2User className="w-4 h-4 text-blue-500"  variant="Outline" /><p className="text-xs font-medium text-gray-500">Usuários alcançados</p></div><p className="text-2xl font-bold text-gray-900">3.840</p></div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center gap-2 mb-2"><Send2 className="w-4 h-4 text-amber-500"  variant="Outline" /><p className="text-xs font-medium text-gray-500">Rascunhos</p></div><p className="text-2xl font-bold text-gray-900">{notifications.filter(n => n.status === 'draft').length}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><p className="font-bold text-gray-900">Histórico de notificações</p></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100"><tr className="text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-semibold">Notificação</th>
                <th className="text-left px-4 py-3 font-semibold">Segmento</th>
                <th className="text-left px-4 py-3 font-semibold">Enviadas</th>
                <th className="text-left px-4 py-3 font-semibold">Abertas</th>
                <th className="text-left px-4 py-3 font-semibold">Data</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5"><p className="text-sm font-semibold text-gray-900">{n.title}</p><p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{n.body}</p></td>
                    <td className="px-4 py-3.5"><StatusBadge status={n.segment} type="plan" /></td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{n.sent.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3.5"><span className="text-sm text-gray-700">{n.opened.toLocaleString('pt-BR')}</span>{n.sent > 0 && <span className="text-xs text-gray-400 ml-1">({((n.opened / n.sent) * 100).toFixed(0)}%)</span>}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{n.sentAt}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={n.status === 'sent' ? 'ativo' : 'draft'} /></td>
                    <td className="px-5 py-3.5"><div className="flex items-center justify-end gap-1">
                      {n.status === 'draft' && <button onClick={() => sendDraft(n)} title="Enviar agora" className="p-1.5 rounded-lg text-gray-400 hover:text-[#6666cc] hover:bg-[#6666cc]/10 transition-colors"><Send2 className="w-4 h-4"  variant="Outline" /></button>}
                      <button onClick={() => setDeleteId(n.id)} title="Excluir" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash className="w-4 h-4"  variant="Outline" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nova Notificação Push</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><CloseCircle className="w-5 h-5"  variant="Outline" /></button>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Título</label><Input value={title} onChange={e => setTitle(e.target.value.slice(0, 65))} className="h-10 rounded-xl border-gray-200" placeholder="Título da notificação" /><p className="text-xs text-gray-400 mt-1">{title.length}/65</p></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Mensagem</label>
              <textarea value={body} onChange={e => setBody(e.target.value.slice(0, 180))} rows={3} className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6666cc]/20 resize-none" placeholder="Corpo da notificação..." />
              <p className="text-xs text-gray-400">{body.length}/180</p>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-2 block">Segmento</label>
              <div className="grid grid-cols-2 gap-2">{SEGMENTS.map(s => <button key={s.id} onClick={() => setSegment(s.id)} className={`text-left px-3 py-2 rounded-xl border text-xs transition-colors ${segment === s.id ? 'border-[#6666cc] bg-[#6666cc]/5 text-[#6666cc] font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{s.label}</button>)}</div>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-2 block">Envio</label>
              <div className="flex gap-2">{[{ id: 'now', label: 'Agora' }, { id: 'scheduled', label: 'Agendar' }, { id: 'draft', label: 'Rascunho' }].map(s => <button key={s.id} onClick={() => setSchedule(s.id)} className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors ${schedule === s.id ? 'bg-[#6666cc] text-white border-[#6666cc]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{s.label}</button>)}</div>
            </div>
            {title && (
              <div className="bg-gray-900 rounded-2xl p-4 text-white">
                <p className="text-xs text-gray-400 mb-1.5">Preview no dispositivo</p>
                <div className="bg-white/10 rounded-xl p-3"><p className="text-sm font-bold">{title}</p><p className="text-xs text-gray-300 mt-0.5">{body || '...'}</p></div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handleSend} className="flex-1 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white gap-1.5"><Send2 className="w-4 h-4"  variant="Outline" /> {schedule === 'draft' ? 'Salvar rascunho' : 'Enviar'}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Excluir notificação</h2>
            <p className="text-sm text-gray-500 mb-6">Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
