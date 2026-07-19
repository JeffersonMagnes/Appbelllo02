'use client';

import { useState } from 'react';
import { Add, Copy, Trash, Edit2 as Edit, Refresh2, TickSquare, CloseCircle } from 'iconsax-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import StatusBadge from '@/components/admin/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const initialCoupons = [
  { id: 'c1', code: 'BEMVINDO30', type: 'percentage', value: 30, maxUses: 100, currentUses: 47, expiresAt: '30/06/2026', plans: ['starter', 'pro'], active: true },
  { id: 'c2', code: 'PRO50OFF', type: 'fixed', value: 50, maxUses: 50, currentUses: 50, expiresAt: '01/05/2026', plans: ['pro'], active: false },
  { id: 'c3', code: 'ANUAL20', type: 'percentage', value: 20, maxUses: -1, currentUses: 134, expiresAt: '31/12/2026', plans: ['starter', 'pro', 'premium'], active: true },
];

type Coupon = typeof initialCoupons[0];

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(10);
  const [selectedPlans, setSelectedPlans] = useState<string[]>(['starter', 'pro', 'premium']);

  const togglePlan = (p: string) => setSelectedPlans(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const openCreate = () => {
    setEditCoupon(null);
    setCode('');
    setType('percentage');
    setValue(10);
    setSelectedPlans(['starter', 'pro', 'premium']);
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setCode(c.code);
    setType(c.type as 'percentage' | 'fixed');
    setValue(c.value);
    setSelectedPlans([...c.plans]);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!code.trim()) return;
    if (editCoupon) {
      setCoupons(prev => prev.map(c => c.id === editCoupon.id ? { ...c, code, type, value, plans: selectedPlans } : c));
    } else {
      setCoupons(prev => [...prev, {
        id: `c${Date.now()}`, code, type, value, maxUses: -1, currentUses: 0,
        expiresAt: '31/12/2026', plans: selectedPlans, active: true,
      }]);
    }
    setShowModal(false);
  };

  const handleCopy = (c: Coupon) => {
    navigator.clipboard.writeText(c.code).catch(() => {});
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = () => {
    setCoupons(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Planos & Financeiro', 'Cupons']} />
      <main className="flex-1 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Cupons e Descontos</h1><p className="text-sm text-gray-500 mt-0.5">{coupons.length} cupons cadastrados</p></div>
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white"><Add className="w-4 h-4"  variant="Outline" /> Criar cupom</Button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100"><tr className="text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-semibold">Código</th>
                <th className="text-left px-4 py-3 font-semibold">Desconto</th>
                <th className="text-left px-4 py-3 font-semibold">Usos</th>
                <th className="text-left px-4 py-3 font-semibold">Planos</th>
                <th className="text-left px-4 py-3 font-semibold">Validade</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">{c.code}</span>
                        <button onClick={() => handleCopy(c)} title="Copiar código" className="text-gray-400 hover:text-gray-600 transition-colors">
                          {copiedId === c.id ? <TickSquare className="w-3.5 h-3.5 text-emerald-500"  variant="Outline" /> : <Copy className="w-3.5 h-3.5"  variant="Outline" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-[#6666cc]">{c.type === 'percentage' ? `${c.value}%` : `R$ ${c.value}`}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-gray-900">{c.currentUses}</span><span className="text-sm text-gray-400">/{c.maxUses === -1 ? '∞' : c.maxUses}</span>
                      {c.maxUses > 0 && <div className="h-1 bg-gray-100 rounded-full mt-1 w-20"><div className="h-full bg-[#6666cc] rounded-full" style={{ width: `${Math.min(100, (c.currentUses / c.maxUses) * 100)}%` }} /></div>}
                    </td>
                    <td className="px-4 py-3.5"><div className="flex flex-wrap gap-1">{c.plans.map((p) => <StatusBadge key={p} status={p} type="plan" />)}</div></td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{c.expiresAt}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={c.active ? 'ativo' : 'cancelado'} /></td>
                    <td className="px-5 py-3.5"><div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} title="Editar" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(c.id)} title="Excluir" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash className="w-4 h-4"  variant="Outline" /></button>
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
              <h2 className="text-lg font-bold text-gray-900">{editCoupon ? 'Editar Cupom' : 'Criar Cupom'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><CloseCircle className="w-5 h-5"  variant="Outline" /></button>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Código</label>
              <div className="flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="h-9 rounded-xl border-gray-200 text-sm font-mono flex-1" placeholder="DESCONTO30" />
                <Button variant="outline" size="sm" onClick={() => setCode(generateCode())} className="h-9 rounded-xl gap-1.5"><Refresh2 className="w-3.5 h-3.5"  variant="Outline" /> Gerar</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  {(['percentage', 'fixed'] as const).map((t) => <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 text-xs font-semibold transition-colors ${type === t ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{t === 'percentage' ? '%' : 'R$'}</button>)}
                </div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor</label><Input type="number" value={value} onChange={(e) => setValue(+e.target.value)} className="h-9 rounded-xl border-gray-200 text-sm" /></div>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-2 block">Planos</label>
              <div className="flex gap-2">
                {['starter', 'pro', 'premium'].map((p) => <button key={p} onClick={() => togglePlan(p)} className={`flex-1 py-2 rounded-xl border text-xs font-semibold capitalize transition-colors ${selectedPlans.includes(p) ? 'bg-[#6666cc] text-white border-[#6666cc]' : 'border-gray-200 text-gray-500'}`}>{p}</button>)}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border-gray-200">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white">{editCoupon ? 'Salvar' : 'Criar'}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Excluir cupom</h2>
            <p className="text-sm text-gray-500 mb-6">Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.</p>
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
