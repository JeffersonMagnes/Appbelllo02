'use client';

import { useEffect, useState, useRef } from 'react';
import { Add, Edit2, Tag, Clock, DollarCircle, Scissor, Box1, Trash, Camera } from 'iconsax-react';
import { Loader2, Package, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';
import type { Service } from '@/lib/supabase/types';

type Tab = 'servicos' | 'pacotes';

type ServicePackage = {
  id: string;
  name: string;
  description?: string;
  price: number;
  sessions: number;
  validity_days?: number;
  discount_percent: number;
  service_ids: string[];
  active: boolean;
};

export default function ServicosPage() {
  const [tab, setTab] = useState<Tab>('servicos');
  const [services, setServices]   = useState<Service[]>([]);
  const [packages, setPackages]   = useState<ServicePackage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [estId, setEstId]         = useState('');

  // Serviços form
  const [showSvcForm, setShowSvcForm]   = useState(false);
  const [editService, setEditService]   = useState<Service | null>(null);
  const [savingSvc, setSavingSvc]       = useState(false);
  const [svcForm, setSvcForm]           = useState({ name: '', price: '', duration: '', category: '', description: '' });
  const [svcImageFile, setSvcImageFile] = useState<File | null>(null);
  const [svcImagePreview, setSvcImagePreview] = useState<string | null>(null);
  const svcImageRef = useRef<HTMLInputElement>(null);

  // Pacotes form
  const [showPkgForm, setShowPkgForm]   = useState(false);
  const [editPkg, setEditPkg]           = useState<ServicePackage | null>(null);
  const [savingPkg, setSavingPkg]       = useState(false);
  const [pkgForm, setPkgForm]           = useState({ name: '', description: '', price: '', sessions: '1', validity_days: '', discount_percent: '0', service_ids: [] as string[] });

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: estRaw } = await supabase.from('establishments').select('id').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string } | null;
    if (!est) { setLoading(false); return; }
    setEstId(est.id);

    const [svcRes, pkgRes] = await Promise.all([
      supabase.from('services').select('*').eq('establishment_id', est.id).order('name'),
      (supabase as any).from('service_packages').select('*').eq('establishment_id', est.id).order('name'),
    ]);
    setServices(svcRes.data || []);
    setPackages((pkgRes.data || []).map((p: any) => ({ ...p, service_ids: p.service_ids ?? [] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Serviços ──────────────────────────────────────────────────────────────
  const openNewSvc  = () => { setEditService(null); setSvcForm({ name: '', price: '', duration: '', category: '', description: '' }); setSvcImageFile(null); setSvcImagePreview(null); setShowSvcForm(true); };
  const openEditSvc = (s: Service) => { setEditService(s); setSvcForm({ name: s.name, price: s.price.toString(), duration: s.duration.toString(), category: s.category || '', description: (s as any).description || '' }); setSvcImageFile(null); setSvcImagePreview((s as any).image_url || null); setShowSvcForm(true); };

  const handleSvcImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSvcImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSvcImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveSvc = async () => {
    if (!svcForm.name.trim() || !svcForm.price || !svcForm.duration) return;
    setSavingSvc(true);
    const supabase = createClient();

    let imageUrl: string | null = svcImagePreview && !svcImageFile ? svcImagePreview : null;
    if (svcImageFile) {
      const ext = svcImageFile.name.split('.').pop();
      const path = `uploads/${Date.now()}-service.${ext}`;
      const { data: uploaded } = await supabase.storage.from('establishments').upload(path, svcImageFile, { upsert: true });
      if (uploaded) {
        const { data: { publicUrl } } = supabase.storage.from('establishments').getPublicUrl(path);
        imageUrl = publicUrl;
      }
    }

    const payload: any = { name: svcForm.name, price: parseFloat(svcForm.price), duration: parseInt(svcForm.duration), category: svcForm.category || null, description: svcForm.description || null };
    if (imageUrl !== null) payload.image_url = imageUrl;

    if (editService) {
      await (supabase as any).from('services').update(payload).eq('id', editService.id);
    } else {
      await (supabase as any).from('services').insert({ ...payload, establishment_id: estId, active: true });
    }
    setSavingSvc(false); setShowSvcForm(false); setSvcImageFile(null); setSvcImagePreview(null); load();
  };

  const toggleActive = async (s: Service) => {
    const supabase = createClient();
    await (supabase as any).from('services').update({ active: !s.active }).eq('id', s.id);
    load();
  };

  // ── Pacotes ───────────────────────────────────────────────────────────────
  const openNewPkg  = () => { setEditPkg(null); setPkgForm({ name: '', description: '', price: '', sessions: '1', validity_days: '', discount_percent: '0', service_ids: [] }); setShowPkgForm(true); };
  const openEditPkg = (p: ServicePackage) => {
    setEditPkg(p);
    setPkgForm({ name: p.name, description: p.description || '', price: p.price.toString(), sessions: p.sessions.toString(), validity_days: p.validity_days?.toString() || '', discount_percent: p.discount_percent.toString(), service_ids: p.service_ids });
    setShowPkgForm(true);
  };

  const handleSavePkg = async () => {
    if (!pkgForm.name.trim() || !pkgForm.price) return;
    setSavingPkg(true);
    const supabase = createClient();
    const payload = {
      name: pkgForm.name,
      description: pkgForm.description || null,
      price: parseFloat(pkgForm.price),
      sessions: parseInt(pkgForm.sessions) || 1,
      validity_days: pkgForm.validity_days ? parseInt(pkgForm.validity_days) : null,
      discount_percent: parseFloat(pkgForm.discount_percent) || 0,
      service_ids: pkgForm.service_ids,
      active: true,
    };
    if (editPkg) {
      await (supabase as any).from('service_packages').update(payload).eq('id', editPkg.id);
    } else {
      await (supabase as any).from('service_packages').insert({ ...payload, establishment_id: estId });
    }
    setSavingPkg(false); setShowPkgForm(false); load();
  };

  const handleDeleteSvc = async (s: Service) => {
    if (!confirm(`Excluir o serviço "${s.name}"?`)) return;
    const supabase = createClient();
    await (supabase as any).from('services').delete().eq('id', s.id);
    load();
  };

  const handleDeletePkg = async (id: string) => {
    if (!confirm('Excluir este pacote?')) return;
    const supabase = createClient();
    await (supabase as any).from('service_packages').delete().eq('id', id);
    load();
  };

  const togglePkgService = (id: string) => {
    setPkgForm(f => ({
      ...f,
      service_ids: f.service_ids.includes(id)
        ? f.service_ids.filter(s => s !== id)
        : [...f.service_ids, id],
    }));
  };

  const getServiceNames = (ids: string[]) => ids.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ');

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Serviços" />
      <main className="flex-1 p-4 sm:p-6 space-y-4">

        {/* Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5">
            {([
              { id: 'servicos', label: 'Serviços', count: services.filter(s => s.active).length },
              { id: 'pacotes',  label: 'Pacotes',  count: packages.length },
            ] as { id: Tab; label: string; count: number }[]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
              </button>
            ))}
          </div>
          {tab === 'servicos'
            ? <Button onClick={openNewSvc} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-10"><Add className="w-4 h-4 mr-1.5" variant="Outline" /> Novo serviço</Button>
            : <Button onClick={openNewPkg} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-10"><Add className="w-4 h-4 mr-1.5" variant="Outline" /> Novo pacote</Button>
          }
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#6666cc] animate-spin" /></div>
        ) : tab === 'servicos' ? (
          services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
              <Scissor className="w-12 h-12 mx-auto mb-3 opacity-30" variant="Outline" />
              <p className="font-medium">Nenhum serviço cadastrado</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {services.map(s => (
                <div key={s.id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${s.active ? 'border-gray-100 hover:border-[#6666cc]/30 hover:shadow-md' : 'border-gray-100 opacity-60'}`}>
                  {(s as any).image_url && (
                    <div className="w-full h-32 overflow-hidden">
                      <img src={(s as any).image_url} alt={s.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    {!(s as any).image_url ? (
                      <div className="w-10 h-10 bg-[#6666cc]/10 rounded-xl flex items-center justify-center">
                        <Scissor className="w-5 h-5 text-[#6666cc]" variant="Outline" />
                      </div>
                    ) : <div />}
                    <button onClick={() => toggleActive(s)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${s.active ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'}`}>
                      {s.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">{s.name}</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><DollarCircle className="w-4 h-4 text-green-500" variant="Outline" />R$ {s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4 text-blue-500" variant="Outline" />{s.duration >= 60 ? `${Math.floor(s.duration / 60)}h${s.duration % 60 ? ` ${s.duration % 60}min` : ''}` : `${s.duration} min`}</div>
                    {s.category && <div className="flex items-center gap-2 text-sm text-gray-600"><Tag className="w-4 h-4 text-purple-500" variant="Outline" />{s.category}</div>}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={() => openEditSvc(s)} className="flex items-center gap-1.5 text-sm text-[#6666cc] font-medium hover:underline">
                      <Edit2 className="w-3.5 h-3.5" variant="Outline" /> Editar
                    </button>
                    <button onClick={() => handleDeleteSvc(s)} className="flex items-center gap-1.5 text-sm text-red-400 font-medium hover:underline ml-auto">
                      <Trash className="w-3.5 h-3.5" variant="Outline" /> Excluir
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // ── Pacotes ──
          packages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum pacote cadastrado</p>
              <p className="text-sm mt-1">Crie pacotes com desconto para fidelizar seus clientes.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {packages.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border-2 border-gray-100 hover:border-[#6666cc]/30 hover:shadow-md p-5 shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-[#6666cc]/10 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#6666cc]" />
                    </div>
                    {p.discount_percent > 0 && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">-{p.discount_percent}%</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
                  {p.description && <p className="text-xs text-gray-400 mb-3">{p.description}</p>}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><DollarCircle className="w-4 h-4 text-green-500" variant="Outline" />R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Box1 className="w-4 h-4 text-blue-500" variant="Outline" />{p.sessions} sessão{p.sessions !== 1 ? 'ões' : ''}</div>
                    {p.validity_days && <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4 text-amber-500" variant="Outline" />Válido por {p.validity_days} dias</div>}
                    {p.service_ids?.length > 0 && <div className="text-xs text-gray-400 mt-1 truncate">{getServiceNames(p.service_ids)}</div>}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={() => openEditPkg(p)} className="flex items-center gap-1.5 text-sm text-[#6666cc] font-medium hover:underline">
                      <Edit2 className="w-3.5 h-3.5" variant="Outline" /> Editar
                    </button>
                    <button onClick={() => handleDeletePkg(p.id)} className="flex items-center gap-1.5 text-sm text-red-400 font-medium hover:underline ml-auto">
                      <Trash className="w-3.5 h-3.5" variant="Outline" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Modal Serviço ── */}
        {showSvcForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-gray-900 text-xl">{editService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
              <div className="space-y-3">
                {/* Image Upload */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Foto do serviço</Label>
                  <input ref={svcImageRef} type="file" accept="image/*" onChange={handleSvcImageChange} className="hidden" />
                  <button
                    type="button"
                    onClick={() => svcImageRef.current?.click()}
                    className="mt-1 w-full rounded-xl border-2 border-dashed border-gray-200 hover:border-[#6666cc]/50 transition-colors overflow-hidden flex items-center justify-center"
                    style={{ height: 120, ...(svcImagePreview ? { borderStyle: 'solid', borderColor: '#6666cc' } : {}) }}
                  >
                    {svcImagePreview ? (
                      <div className="relative w-full h-full">
                        <img src={svcImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1.5">
                          <Camera className="w-3.5 h-3.5 text-white" variant="Outline" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs">Adicionar foto</span>
                      </div>
                    )}
                  </button>
                </div>
                <div><Label className="text-sm font-medium text-gray-700">Nome *</Label><Input value={svcForm.name} onChange={e => setSvcForm({ ...svcForm, name: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div><Label className="text-sm font-medium text-gray-700">Descrição</Label><textarea value={svcForm.description} onChange={e => setSvcForm({ ...svcForm, description: e.target.value })} rows={2} placeholder="Descreva o serviço..." className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:border-[#6666cc]" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-sm font-medium text-gray-700">Preço (R$) *</Label><Input type="number" step="0.01" min="0" value={svcForm.price} onChange={e => setSvcForm({ ...svcForm, price: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                  <div><Label className="text-sm font-medium text-gray-700">Duração *</Label>
                    <select value={svcForm.duration} onChange={e => setSvcForm({ ...svcForm, duration: e.target.value })}
                      className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
                      <option value="">Selecione</option>
                      <option value="15">15 minutos</option>
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="90">1h 30min</option>
                      <option value="120">2 horas</option>
                      <option value="150">2h 30min</option>
                      <option value="180">3 horas</option>
                      <option value="240">4 horas</option>
                    </select>
                  </div>
                </div>
                <div><Label className="text-sm font-medium text-gray-700">Categoria</Label><Input value={svcForm.category} onChange={e => setSvcForm({ ...svcForm, category: e.target.value })} placeholder="Ex: Cabelo, Estética..." className="mt-1 rounded-xl border-gray-200 h-10" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowSvcForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button onClick={handleSaveSvc} disabled={savingSvc} className="flex-1 bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl">
                  {savingSvc ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Pacote ── */}
        {showPkgForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-bold text-gray-900 text-xl">{editPkg ? 'Editar Pacote' : 'Novo Pacote'}</h3>
              <div className="space-y-3">
                <div><Label className="text-sm font-medium text-gray-700">Nome *</Label><Input value={pkgForm.name} onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div><Label className="text-sm font-medium text-gray-700">Descrição</Label><Input value={pkgForm.description} onChange={e => setPkgForm({ ...pkgForm, description: e.target.value })} placeholder="Ex: Ideal para noivas..." className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-sm font-medium text-gray-700">Preço (R$) *</Label><Input type="number" step="0.01" min="0" value={pkgForm.price} onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                  <div><Label className="text-sm font-medium text-gray-700">Sessões</Label><Input type="number" min="1" value={pkgForm.sessions} onChange={e => setPkgForm({ ...pkgForm, sessions: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-sm font-medium text-gray-700">Validade (dias)</Label><Input type="number" min="1" value={pkgForm.validity_days} onChange={e => setPkgForm({ ...pkgForm, validity_days: e.target.value })} placeholder="Ex: 30" className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                  <div><Label className="text-sm font-medium text-gray-700">Desconto (%)</Label><Input type="number" min="0" max="100" step="0.1" value={pkgForm.discount_percent} onChange={e => setPkgForm({ ...pkgForm, discount_percent: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                </div>
                {services.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Serviços incluídos</Label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2">
                      {services.filter(s => s.active).map(s => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-50">
                          <input type="checkbox" checked={pkgForm.service_ids.includes(s.id)} onChange={() => togglePkgService(s.id)} className="accent-[#6666cc]" />
                          <span className="text-sm text-gray-700">{s.name}</span>
                          <span className="ml-auto text-xs text-gray-400">R$ {s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowPkgForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button onClick={handleSavePkg} disabled={savingPkg} className="flex-1 bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl">
                  {savingPkg ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
