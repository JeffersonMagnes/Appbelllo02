'use client';

import { useEffect, useRef, useState } from 'react';
import { FeatureGate } from '@/components/dashboard/FeatureGate';
import { Add, Edit2, UserTick, DollarCircle, Shield, Calendar, Profile2User, Chart, Box1, Receipt, Camera, Trash } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';
import type { Employee } from '@/lib/supabase/types';

type Tab = 'equipe' | 'permissoes';

type PermissionKey = 'viewAgenda' | 'editAgenda' | 'viewClients' | 'editClients' | 'viewFinancial' | 'viewReports' | 'viewProducts' | 'viewComandas';

const DEFAULT_PERMISSIONS: Record<PermissionKey, boolean> = {
  viewAgenda: true, editAgenda: false,
  viewClients: true, editClients: false,
  viewFinancial: false, viewReports: false,
  viewProducts: false, viewComandas: true,
};

const PERMISSION_GROUPS = [
  { label: 'Agenda',     color: 'text-[#5ab0b6]', bg: 'bg-[#5ab0b6]/10', keys: ['viewAgenda', 'editAgenda'] as PermissionKey[], Icon: Calendar },
  { label: 'Clientes',   color: 'text-[#6666cc]', bg: 'bg-[#6666cc]/10', keys: ['viewClients', 'editClients'] as PermissionKey[], Icon: Profile2User },
  { label: 'Financeiro', color: 'text-green-600',  bg: 'bg-green-50',     keys: ['viewFinancial'] as PermissionKey[], Icon: DollarCircle },
  { label: 'Relatórios', color: 'text-amber-600',  bg: 'bg-amber-50',     keys: ['viewReports'] as PermissionKey[], Icon: Chart },
  { label: 'Produtos',   color: 'text-red-500',    bg: 'bg-red-50',       keys: ['viewProducts'] as PermissionKey[], Icon: Box1 },
  { label: 'Comandas',   color: 'text-blue-600',   bg: 'bg-blue-50',      keys: ['viewComandas'] as PermissionKey[], Icon: Receipt },
];

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  viewAgenda: 'Ver agenda', editAgenda: 'Editar agenda',
  viewClients: 'Ver clientes', editClients: 'Editar clientes',
  viewFinancial: 'Ver financeiro', viewReports: 'Ver relatórios',
  viewProducts: 'Ver produtos', viewComandas: 'Ver comandas',
};

const roles: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-[#6666cc]/10 text-[#6666cc]' },
  receptionist: { label: 'Recepcionista', color: 'bg-blue-100 text-blue-700' },
  professional: { label: 'Profissional', color: 'bg-green-100 text-green-700' },
};

type EmpWithPerms = Employee & { permissions?: Record<PermissionKey, boolean> };

export default function EquipePage() {
  const [tab, setTab]             = useState<Tab>('equipe');
  const [employees, setEmployees] = useState<EmpWithPerms[]>([]);
  const [loading, setLoading]     = useState(true);
  const [estId, setEstId]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editEmp, setEditEmp]     = useState<EmpWithPerms | null>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ name: '', role: 'professional', specialty: '', commission_type: 'percentage', commission_value: '', pin: '', email: '', phone: '' });
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [savingPerms, setSavingPerms] = useState(false);
  const [perms, setPerms]         = useState<Record<PermissionKey, boolean>>(DEFAULT_PERMISSIONS);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: estRaw } = await supabase.from('establishments').select('id').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string } | null;
    if (!est) return;
    setEstId(est.id);
    const { data } = await supabase.from('employees').select('*').eq('establishment_id', est.id).order('name');
    setEmployees((data || []) as EmpWithPerms[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const selectedEmp = employees.find(e => e.id === selectedEmpId) ?? null;

  useEffect(() => {
    if (selectedEmp) {
      setPerms({ ...DEFAULT_PERMISSIONS, ...(selectedEmp.permissions ?? {}) });
    }
  }, [selectedEmpId]);

  const openNew  = () => { setEditEmp(null); setForm({ name: '', role: 'professional', specialty: '', commission_type: 'percentage', commission_value: '', pin: '', email: '', phone: '' }); setAvatarFile(null); setAvatarPreview(''); setShowForm(true); };
  const openEdit = (e: EmpWithPerms) => { setEditEmp(e); setForm({ name: e.name, role: e.role, specialty: e.specialty || '', commission_type: e.commission_type || 'percentage', commission_value: e.commission_value?.toString() || '', pin: e.pin || '', email: (e as any).email || '', phone: (e as any).phone || '' }); setAvatarFile(null); setAvatarPreview((e as any).avatar_url || ''); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    let avatarUrl = (editEmp as any)?.avatar_url || '';
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `uploads/${Date.now()}-avatar-${estId}.${ext}`;
      const { data: uploaded } = await supabase.storage.from('establishments').upload(path, avatarFile, { upsert: true });
      if (uploaded) {
        const { data: { publicUrl } } = supabase.storage.from('establishments').getPublicUrl(path);
        avatarUrl = publicUrl;
      }
    }
    const payload = { name: form.name, role: form.role, specialty: form.specialty || null, commission_type: form.commission_type || null, commission_value: form.commission_value ? parseFloat(form.commission_value) : null, pin: form.pin || null, avatar_url: avatarUrl || null, email: form.email || null, phone: form.phone || null };
    let result;
    if (editEmp) {
      result = await (supabase as any).from('employees').update(payload).eq('id', editEmp.id);
    } else {
      result = await (supabase as any).from('employees').insert({ ...payload, establishment_id: estId, active: true, permissions: DEFAULT_PERMISSIONS });
    }
    if (result.error) {
      alert('Erro ao salvar funcionário: ' + result.error.message);
      setSaving(false);
      return;
    }
    setSaving(false); setShowForm(false); load();
  };

  const handleDeleteEmployee = async (empId: string, empName: string) => {
    if (!confirm(`Deseja realmente excluir o funcionário "${empName}"?`)) return;
    const supabase = createClient();
    await (supabase as any).from('employees').delete().eq('id', empId);
    load();
  };

  const handleSavePerms = async () => {
    if (!selectedEmpId) return;
    setSavingPerms(true);
    const supabase = createClient();
    await (supabase as any).from('employees').update({ permissions: perms }).eq('id', selectedEmpId);
    setSavingPerms(false);
    setEmployees(prev => prev.map(e => e.id === selectedEmpId ? { ...e, permissions: perms } : e));
  };

  return (
    <FeatureGate featureKey="equipe">
    <div className="flex flex-col min-h-screen">
      <Header title="Equipe" />
      <main className="flex-1 p-4 sm:p-6 space-y-4">

        {/* Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5">
            {([
              { id: 'equipe',     label: 'Funcionários' },
              { id: 'permissoes', label: 'Permissões' },
            ] as { id: Tab; label: string }[]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'equipe' && (
            <Button onClick={openNew} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-10">
              <Add className="w-4 h-4 mr-1.5" variant="Outline" /> Novo funcionário
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-[#6666cc] animate-spin" /></div>
        ) : tab === 'equipe' ? (
          employees.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
              <UserTick className="w-12 h-12 mx-auto mb-3 opacity-30" variant="Outline" />
              <p className="font-medium">Nenhum funcionário cadastrado</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {employees.map(emp => {
                const roleInfo = roles[emp.role] || { label: emp.role, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={emp.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
                        {(emp as any).avatar_url
                          ? <img src={(emp as any).avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-[#6666cc] flex items-center justify-center text-white font-bold text-lg">{emp.name.charAt(0).toUpperCase()}</div>
                        }
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>
                    </div>
                    <div className="font-bold text-gray-900 mb-1">{emp.name}</div>
                    {emp.specialty && <div className="text-sm text-gray-500 mb-3">{emp.specialty}</div>}
                    <div className="space-y-1.5 text-sm">
                      {emp.commission_value && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarCircle className="w-3.5 h-3.5 text-green-500" variant="Outline" />
                          Comissão: {emp.commission_value}{emp.commission_type === 'percentage' ? '%' : ' fixo'}
                        </div>
                      )}
                      {emp.pin && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Shield className="w-3.5 h-3.5 text-blue-500" variant="Outline" />
                          PIN: {emp.pin.replace(/./g, '•')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <button onClick={() => openEdit(emp)} className="flex items-center gap-1.5 text-sm text-[#6666cc] font-medium hover:underline">
                        <Edit2 className="w-3.5 h-3.5" variant="Outline" /> Editar
                      </button>
                      <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="flex items-center gap-1.5 text-sm text-red-500 font-medium hover:underline">
                        <Trash className="w-3.5 h-3.5" variant="Outline" /> Excluir
                      </button>
                      <button onClick={() => { setSelectedEmpId(emp.id); setTab('permissoes'); }} className="flex items-center gap-1.5 text-sm text-gray-500 font-medium hover:underline ml-auto">
                        <Shield className="w-3.5 h-3.5" variant="Outline" /> Permissões
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // ── Permissões ────────────────────────────────────────────────────
          <div className="grid md:grid-cols-3 gap-4">
            {/* Lista de funcionários */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Selecione o funcionário</p>
              </div>
              <div className="divide-y divide-gray-100">
                {employees.map(emp => (
                  <button key={emp.id} onClick={() => setSelectedEmpId(emp.id)}
                    className={`w-full flex items-center gap-3 p-3.5 text-left hover:bg-gray-50 transition-colors ${selectedEmpId === emp.id ? 'bg-gray-50' : ''}`}>
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                      {(emp as any).avatar_url
                        ? <img src={(emp as any).avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">{emp.name.charAt(0)}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${selectedEmpId === emp.id ? 'text-gray-900' : 'text-gray-700'}`}>{emp.name}</p>
                      <p className="text-xs text-gray-400">{roles[emp.role]?.label ?? emp.role}</p>
                    </div>
                    {selectedEmpId === emp.id && (
                      <div className="w-2 h-2 rounded-full bg-[#6666cc] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissões do funcionário selecionado */}
            <div className="md:col-span-2">
              {!selectedEmp ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
                  <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" variant="Outline" />
                  <p className="text-sm">Selecione um funcionário para configurar as permissões</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedEmp.name}</h3>
                      <p className="text-xs text-gray-400">{roles[selectedEmp.role]?.label ?? selectedEmp.role} · {Object.values(perms).filter(Boolean).length}/8 permissões</p>
                    </div>
                    <Button onClick={handleSavePerms} disabled={savingPerms} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-9 text-sm">
                      {savingPerms ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                    </Button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {PERMISSION_GROUPS.flatMap(g => g.keys).map(key => (
                      <div key={key} className="flex items-center justify-between px-5 py-3.5">
                        <span className="text-sm text-gray-700">{PERMISSION_LABELS[key]}</span>
                        <button
                          onClick={() => setPerms(p => ({ ...p, [key]: !p[key] }))}
                          className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${perms[key] ? 'bg-[#6666cc]' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${perms[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal funcionário */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-xl">{editEmp ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
              <div className="space-y-3">
                {/* Avatar upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-[#6666cc] transition-colors"
                    >
                      {avatarPreview
                        ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-gray-400" variant="Outline" />
                          </div>
                      }
                    </div>
                    <div onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 w-6 h-6 bg-[#6666cc] rounded-full flex items-center justify-center cursor-pointer">
                      <Camera className="w-3 h-3 text-white" variant="Outline" />
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                    }} />
                  </div>
                </div>
                <div><Label className="text-gray-700 font-medium text-sm">Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-gray-700 font-medium text-sm">E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                  <div><Label className="text-gray-700 font-medium text-sm">Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                </div>
                <div>
                  <Label className="text-gray-700 font-medium text-sm">Cargo</Label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
                    <option value="admin">Admin</option>
                    <option value="receptionist">Recepcionista</option>
                    <option value="professional">Profissional</option>
                  </select>
                </div>
                <div><Label className="text-gray-700 font-medium text-sm">Especialidade</Label><Input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Colorista, Manicure..." className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-700 font-medium text-sm">Tipo de comissão</Label>
                    <select value={form.commission_type} onChange={e => setForm({ ...form, commission_type: e.target.value })} className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-[#6666cc]">
                      <option value="percentage">Percentual</option>
                      <option value="fixed">Valor fixo</option>
                    </select>
                  </div>
                  <div><Label className="text-gray-700 font-medium text-sm">Valor</Label><Input type="number" step="0.01" min="0" value={form.commission_value} onChange={e => setForm({ ...form, commission_value: e.target.value })} placeholder={form.commission_type === 'percentage' ? '30' : '50.00'} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                </div>
                <div><Label className="text-gray-700 font-medium text-sm">PIN de acesso</Label><Input value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} placeholder="4 dígitos" maxLength={4} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </FeatureGate>
  );
}
