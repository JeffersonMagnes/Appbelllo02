'use client';

import { useState } from 'react';
import { Add, Edit2 as Edit, Eye, CloseCircle, Trash, Pause, Play } from 'iconsax-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/admin/StatusBadge';

const initialPartners = [
  { id: 'p1', name: 'Schwarzkopf', category: 'Produtos capilares', activeAds: 2, impressions: 28400, clicks: 2100, status: 'active' },
  { id: 'p2', name: "L'Oréal Professionnel", category: 'Produtos capilares', activeAds: 1, impressions: 17200, clicks: 1340, status: 'active' },
  { id: 'p3', name: 'Academia Beauty', category: 'Cursos e treinamentos', activeAds: 1, impressions: 5180, clicks: 398, status: 'active' },
  { id: 'p4', name: 'MobiliSalão', category: 'Equipamentos profissionais', activeAds: 2, impressions: 9100, clicks: 670, status: 'active' },
  { id: 'p5', name: 'SeguroBrasil', category: 'Seguros e benefícios', activeAds: 0, impressions: 3200, clicks: 198, status: 'inactive' },
];

const allAds = [
  { id: 'a1', title: 'Schwarzkopf 20% OFF', partner: 'Schwarzkopf', starts: '01/04', ends: '30/04', impressions: 8420, clicks: 642, status: 'active' },
  { id: 'a2', title: 'Schwarzkopf BLONDME', partner: 'Schwarzkopf', starts: '10/04', ends: '10/05', impressions: 19980, clicks: 1458, status: 'active' },
  { id: 'a3', title: 'Loreal -15%', partner: "L'Oréal Professionnel", starts: '01/04', ends: '30/04', impressions: 7210, clicks: 520, status: 'paused' },
  { id: 'a4', title: 'Loreal Serie Expert', partner: "L'Oréal Professionnel", starts: '15/04', ends: '15/05', impressions: 9990, clicks: 820, status: 'active' },
  { id: 'a5', title: 'Curso de Colorimetria', partner: 'Academia Beauty', starts: '15/04', ends: '15/05', impressions: 5180, clicks: 398, status: 'active' },
  { id: 'a6', title: 'Cadeira Reclinável Pro', partner: 'MobiliSalão', starts: '10/04', ends: '10/05', impressions: 4290, clicks: 310, status: 'active' },
  { id: 'a7', title: 'Kit Pedicure MobiliSalão', partner: 'MobiliSalão', starts: '01/04', ends: '30/04', impressions: 4810, clicks: 360, status: 'active' },
];

type Partner = typeof initialPartners[0];

const CATEGORIES = ['Produtos capilares', 'Cursos e treinamentos', 'Equipamentos profissionais', 'Seguros e benefícios', 'Outro'];

export default function EmpresasPage() {
  const [partners, setPartners] = useState(initialPartners);
  const [showModal, setShowModal] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adsPartner, setAdsPartner] = useState<Partner | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  const openCreate = () => {
    setEditPartner(null);
    setName('');
    setCategory(CATEGORIES[0]);
    setShowModal(true);
  };

  const openEdit = (p: Partner) => {
    setEditPartner(p);
    setName(p.name);
    setCategory(p.category);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editPartner) {
      setPartners(prev => prev.map(p => p.id === editPartner.id ? { ...p, name, category } : p));
    } else {
      setPartners(prev => [...prev, { id: `p${Date.now()}`, name, category, activeAds: 0, impressions: 0, clicks: 0, status: 'active' }]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    setPartners(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
  };

  const deletePartner = partners.find(p => p.id === deleteId);
  const partnerAds = adsPartner ? allAds.filter(a => a.partner === adsPartner.name) : [];

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Anúncios & Parceiros', 'Empresas Parceiras']} />
      <main className="flex-1 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Empresas Parceiras</h1><p className="text-sm text-gray-500 mt-0.5">{partners.length} parceiros cadastrados</p></div>
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white"><Add className="w-4 h-4"  variant="Outline" /> Novo parceiro</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-[#6666cc]/10 flex items-center justify-center text-[#6666cc] font-bold text-lg">{p.name[0]}</div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={p.status === 'active' ? 'ativo' : 'cancelado'} />
                  <button onClick={() => setDeleteId(p.id)} title="Excluir" className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"><Trash className="w-3.5 h-3.5"  variant="Outline" /></button>
                </div>
              </div>
              <p className="font-bold text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-400 mb-3">{p.category}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center"><p className="text-lg font-bold text-gray-900">{p.activeAds}</p><p className="text-[10px] text-gray-400">Ativos</p></div>
                <div className="text-center border-x border-gray-100"><p className="text-lg font-bold text-gray-900">{(p.impressions / 1000).toFixed(1)}k</p><p className="text-[10px] text-gray-400">Impressões</p></div>
                <div className="text-center"><p className="text-lg font-bold text-gray-900">{p.clicks}</p><p className="text-[10px] text-gray-400">Cliques</p></div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdsPartner(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium h-8 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5"  variant="Outline" /> Ver anúncios
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium h-8 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal: Anúncios do Parceiro */}
      {adsPartner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAdsPartner(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Anúncios — {adsPartner.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{partnerAds.length} anúncio(s) encontrado(s)</p>
              </div>
              <button onClick={() => setAdsPartner(null)} className="text-gray-400 hover:text-gray-600"><CloseCircle className="w-5 h-5"  variant="Outline" /></button>
            </div>
            {partnerAds.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Eye className="w-8 h-8 mx-auto mb-3 opacity-30"  variant="Outline" />
                <p className="text-sm">Nenhum anúncio encontrado para este parceiro.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {partnerAds.map(a => (
                  <div key={a.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.starts} – {a.ends}</p>
                    </div>
                    <div className="flex items-center gap-4 text-center shrink-0">
                      <div><p className="text-sm font-bold text-gray-900">{a.impressions.toLocaleString('pt-BR')}</p><p className="text-[10px] text-gray-400">Impressões</p></div>
                      <div><p className="text-sm font-bold text-gray-900">{a.clicks.toLocaleString('pt-BR')}</p><p className="text-[10px] text-gray-400">Cliques</p></div>
                      <div><p className="text-sm font-bold text-[#5ab0b6]">{((a.clicks / a.impressions) * 100).toFixed(1)}%</p><p className="text-[10px] text-gray-400">CTR</p></div>
                      <StatusBadge status={a.status === 'active' ? 'ativo' : 'paused'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setAdsPartner(null)} className="mt-5 w-full h-11 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white font-semibold text-sm transition-colors">Fechar</button>
          </div>
        </div>
      )}

      {/* Modal: Editar / Criar Parceiro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editPartner ? 'Editar Parceiro' : 'Novo Parceiro'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><CloseCircle className="w-5 h-5"  variant="Outline" /></button>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome</label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl border-gray-200" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-2 block">Categoria</label>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map(c => <button key={c} onClick={() => setCategory(c)} className={`text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${category === c ? 'border-[#6666cc] bg-[#6666cc]/5 text-[#6666cc]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{c}</button>)}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white">{editPartner ? 'Salvar' : 'Cadastrar'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar exclusão */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Excluir parceiro</h2>
            <p className="text-sm text-gray-500 mb-6">Deseja excluir <strong>{deletePartner?.name}</strong>? Todos os anúncios vinculados serão desativados.</p>
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
