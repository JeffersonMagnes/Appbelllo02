'use client';

import { useState } from 'react';
import { Add, Sms, Eye, Send2, Trash, Edit2 as Edit, CloseCircle } from 'iconsax-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/admin/StatusBadge';

const initialEmails = [
  { id: 'e1', subject: 'Bem-vindo ao AppBello!', template: 'Boas-vindas', recipient: 'Novos cadastros', sentCount: 312, openRate: 68.2, clickRate: 34.1, sentAt: '21/04/2026', status: 'sent' },
  { id: 'e2', subject: 'Seu trial expira em 3 dias', template: 'Trial Expiring', recipient: 'Trial (< 3 dias)', sentCount: 84, openRate: 72.6, clickRate: 48.8, sentAt: '20/04/2026', status: 'sent' },
  { id: 'e3', subject: 'Novidades: Agendamento Online', template: 'Feature Update', recipient: 'Todos os usuários', sentCount: 3840, openRate: 41.3, clickRate: 18.7, sentAt: '18/04/2026', status: 'sent' },
  { id: 'e4', subject: 'Oferta exclusiva de parceiro', template: 'Partner Offer', recipient: 'Plano Pro', sentCount: 0, openRate: 0, clickRate: 0, sentAt: '—', status: 'draft' },
  { id: 'e5', subject: 'Relatório mensal — Abril 2026', template: 'Monthly Report', recipient: 'Todos os usuários', sentCount: 0, openRate: 0, clickRate: 0, sentAt: '30/04/2026', status: 'scheduled' },
];

type EmailCampaign = typeof initialEmails[0];

const TEMPLATES = ['Boas-vindas', 'Trial Expiring', 'Feature Update', 'Partner Offer', 'Monthly Report', 'Reengagement', 'Custom'];
const statusMap: Record<string, string> = { sent: 'ativo', draft: 'draft', scheduled: 'pendente' };

export default function EmailPage() {
  const [emails, setEmails] = useState(initialEmails);
  const [showModal, setShowModal] = useState(false);
  const [editEmail, setEditEmail] = useState<EmailCampaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [template, setTemplate] = useState('Custom');
  const [subject, setSubject] = useState('');
  const [recipient, setRecipient] = useState('Todos os usuários');

  const openCreate = () => {
    setEditEmail(null);
    setTemplate('Custom');
    setSubject('');
    setRecipient('Todos os usuários');
    setShowModal(true);
  };

  const openEdit = (e: EmailCampaign) => {
    setEditEmail(e);
    setTemplate(e.template);
    setSubject(e.subject);
    setRecipient(e.recipient);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!subject.trim()) return;
    const today = new Date().toLocaleDateString('pt-BR');
    if (editEmail) {
      setEmails(prev => prev.map(e => e.id === editEmail.id ? { ...e, subject, template, recipient } : e));
    } else {
      setEmails(prev => [...prev, {
        id: `e${Date.now()}`, subject, template, recipient, sentCount: 0,
        openRate: 0, clickRate: 0, sentAt: '—', status: 'draft',
      }]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    setEmails(prev => prev.filter(e => e.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Notificações', 'E-mail']} />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Campanhas de E-mail</h1><p className="text-sm text-gray-500 mt-0.5">Envie e-mails segmentados para seus usuários</p></div>
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white"><Add className="w-4 h-4"  variant="Outline" /> Nova campanha</Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center gap-2 mb-2"><Sms className="w-4 h-4 text-[#6666cc]"  variant="Outline" /><p className="text-xs font-medium text-gray-500">Enviados (mês)</p></div><p className="text-2xl font-bold text-gray-900">4.236</p></div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center gap-2 mb-2"><Eye className="w-4 h-4 text-blue-500"  variant="Outline" /><p className="text-xs font-medium text-gray-500">Taxa de abertura</p></div><p className="text-2xl font-bold text-gray-900">54.3%</p><p className="text-xs text-emerald-600 font-medium mt-1">+3.2% vs. mês anterior</p></div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center gap-2 mb-2"><Send2 className="w-4 h-4 text-emerald-500"  variant="Outline" /><p className="text-xs font-medium text-gray-500">Taxa de clique</p></div><p className="text-2xl font-bold text-gray-900">27.8%</p></div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center gap-2 mb-2"><Sms className="w-4 h-4 text-amber-500"  variant="Outline" /><p className="text-xs font-medium text-gray-500">Agendados</p></div><p className="text-2xl font-bold text-gray-900">{emails.filter(e => e.status === 'scheduled').length}</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><p className="font-bold text-gray-900">Campanhas</p></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100"><tr className="text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-semibold">Assunto</th>
                <th className="text-left px-4 py-3 font-semibold">Template</th>
                <th className="text-left px-4 py-3 font-semibold">Enviados</th>
                <th className="text-left px-4 py-3 font-semibold">Abertura</th>
                <th className="text-left px-4 py-3 font-semibold">Clique</th>
                <th className="text-left px-4 py-3 font-semibold">Data</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {emails.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5"><p className="text-sm font-semibold text-gray-900">{e.subject}</p><p className="text-xs text-gray-400">{e.recipient}</p></td>
                    <td className="px-4 py-3.5"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{e.template}</span></td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{e.sentCount.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-[#6666cc]">{e.openRate > 0 ? `${e.openRate}%` : '—'}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-[#5ab0b6]">{e.clickRate > 0 ? `${e.clickRate}%` : '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{e.sentAt}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={statusMap[e.status] || 'draft'} /></td>
                    <td className="px-5 py-3.5"><div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(e)} title="Editar" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(e.id)} title="Excluir" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash className="w-4 h-4"  variant="Outline" /></button>
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
              <h2 className="text-lg font-bold text-gray-900">{editEmail ? 'Editar Campanha' : 'Nova Campanha'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><CloseCircle className="w-5 h-5"  variant="Outline" /></button>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Assunto</label><Input value={subject} onChange={e => setSubject(e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="Assunto do e-mail" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Destinatários</label><Input value={recipient} onChange={e => setRecipient(e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="Ex: Todos os usuários" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-2 block">Template</label>
              <div className="grid grid-cols-2 gap-2">{TEMPLATES.map(t => <button key={t} onClick={() => setTemplate(t)} className={`text-left px-3 py-2 rounded-xl border text-xs transition-colors ${template === t ? 'border-[#6666cc] bg-[#6666cc]/5 text-[#6666cc] font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{t}</button>)}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white">{editEmail ? 'Salvar' : 'Criar campanha'}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Excluir campanha</h2>
            <p className="text-sm text-gray-500 mb-6">Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.</p>
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
