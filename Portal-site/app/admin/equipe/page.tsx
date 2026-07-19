'use client';

import { useState } from 'react';
import { Add, Edit2 as Edit, Trash, Shield, User, CloseCircle } from 'iconsax-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/admin/StatusBadge';

const ROLES = [
  { id: 'super_admin', label: 'Super Admin', desc: 'Acesso total ao portal', color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'admin', label: 'Admin', desc: 'Acesso a todas as seções', color: 'text-[#6666cc]', bg: 'bg-[#6666cc]/10' },
  { id: 'financeiro', label: 'Financeiro', desc: 'Acesso a planos e relatórios', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'suporte', label: 'Suporte', desc: 'Gerenciar usuários e mensagens', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'marketing', label: 'Marketing', desc: 'Gerir parceiros e notificações', color: 'text-amber-600', bg: 'bg-amber-50' },
];

const initialTeam = [
  { id: 't1', name: 'Rafael Souza', email: 'rafael@appbello.com.br', role: 'super_admin', lastLogin: 'Hoje, 09:12', status: 'ativo', avatar: 'RS' },
  { id: 't2', name: 'Camila Rocha', email: 'camila@appbello.com.br', role: 'admin', lastLogin: 'Hoje, 08:45', status: 'ativo', avatar: 'CR' },
  { id: 't3', name: 'Bruno Lima', email: 'bruno@appbello.com.br', role: 'financeiro', lastLogin: 'Ontem, 17:30', status: 'ativo', avatar: 'BL' },
  { id: 't4', name: 'Tatiane Ferreira', email: 'tatiane@appbello.com.br', role: 'suporte', lastLogin: 'Ontem, 14:20', status: 'ativo', avatar: 'TF' },
  { id: 't5', name: 'Eduardo Nunes', email: 'eduardo@appbello.com.br', role: 'marketing', lastLogin: '18/04/2026', status: 'ativo', avatar: 'EN' },
  { id: 't6', name: 'Patricia Costa', email: 'patricia@appbello.com.br', role: 'suporte', lastLogin: '—', status: 'cancelado', avatar: 'PC' },
];

type Member = typeof initialTeam[0];

export default function EquipePage() {
  const [team, setTeam] = useState(initialTeam);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('suporte');

  const getRoleConfig = (roleId: string) => ROLES.find(r => r.id === roleId) || ROLES[3];

  const openCreate = () => {
    setEditMember(null);
    setName('');
    setEmail('');
    setRole('suporte');
    setShowModal(true);
  };

  const openEdit = (m: Member) => {
    setEditMember(m);
    setName(m.name);
    setEmail(m.email);
    setRole(m.role);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim() || !email.trim()) return;
    if (editMember) {
      setTeam(prev => prev.map(m => m.id === editMember.id ? { ...m, name, email, role } : m));
    } else {
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      setTeam(prev => [...prev, { id: `t${Date.now()}`, name, email, role, lastLogin: '—', status: 'ativo', avatar: initials }]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    setTeam(prev => prev.filter(m => m.id !== deleteId));
    setDeleteId(null);
  };

  const deleteMember = team.find(m => m.id === deleteId);

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Equipe & Permissões']} />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Equipe & Permissões</h1><p className="text-sm text-gray-500 mt-0.5">Gerencie o acesso dos administradores ao portal</p></div>
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white"><Add className="w-4 h-4"  variant="Outline" /> Convidar membro</Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {ROLES.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className={`w-9 h-9 rounded-xl ${r.bg} flex items-center justify-center mb-3`}><Shield className={`w-4 h-4 ${r.color}`}  variant="Outline" /></div>
              <p className={`text-sm font-bold ${r.color}`}>{r.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
              <p className="text-xs font-semibold text-gray-900 mt-2">{team.filter(m => m.role === r.id).length} membro(s)</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><p className="font-bold text-gray-900">Membros da equipe</p></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100"><tr className="text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-semibold">Membro</th>
                <th className="text-left px-4 py-3 font-semibold">Cargo</th>
                <th className="text-left px-4 py-3 font-semibold">Último acesso</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {team.map(m => { const rc = getRoleConfig(m.role); return (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-full ${rc.bg} ${rc.color} text-xs font-bold flex items-center justify-center`}>{m.avatar}</div><div><p className="text-sm font-semibold text-gray-900">{m.name}</p><p className="text-xs text-gray-400">{m.email}</p></div></div></td>
                    <td className="px-4 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${rc.bg} ${rc.color}`}>{rc.label}</span></td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{m.lastLogin}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={m.status} /></td>
                    <td className="px-5 py-3.5"><div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(m)} title="Editar" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(m.id)} title="Remover" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash className="w-4 h-4"  variant="Outline" /></button>
                    </div></td>
                  </tr> ); })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editMember ? 'Editar Membro' : 'Convidar Membro'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><CloseCircle className="w-5 h-5"  variant="Outline" /></button>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome completo</label><Input value={name} onChange={e => setName(e.target.value)} className="h-10 rounded-xl border-gray-200" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">E-mail</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-10 rounded-xl border-gray-200" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-2 block">Cargo</label>
              <div className="space-y-2">{ROLES.map(r => <button key={r.id} onClick={() => setRole(r.id)} className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${role === r.id ? 'border-[#6666cc] bg-[#6666cc]/5' : 'border-gray-200 hover:border-gray-300'}`}><div className={`w-8 h-8 rounded-lg ${r.bg} flex items-center justify-center shrink-0`}><User className={`w-4 h-4 ${r.color}`}  variant="Outline" /></div><div><p className={`text-sm font-semibold ${role === r.id ? 'text-[#6666cc]' : 'text-gray-900'}`}>{r.label}</p><p className="text-xs text-gray-400">{r.desc}</p></div></button>)}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white">{editMember ? 'Salvar' : 'Enviar convite'}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Remover membro</h2>
            <p className="text-sm text-gray-500 mb-6">Deseja remover <strong>{deleteMember?.name}</strong> da equipe? O acesso ao portal será revogado.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Remover</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
