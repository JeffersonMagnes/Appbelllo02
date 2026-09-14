'use client';

import { useEffect, useState, useMemo } from 'react';
import { Add, SearchNormal1, Call, Sms, Edit2, Trash, User, Heart, Clock, Note1, Calendar } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';
import type { Client } from '@/lib/supabase/types';

type Tab = 'todos' | 'retornos' | 'sumidos' | 'aniversarios' | 'fichas';

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'todos',        label: 'Todos',        icon: User },
  { id: 'retornos',     label: 'Retornos',     icon: Heart },
  { id: 'sumidos',      label: 'Sumidos',      icon: Clock },
  { id: 'aniversarios', label: 'Aniversários', icon: Calendar },
  { id: 'fichas',       label: 'Fichas',       icon: Note1 },
];

type AptRow = { client_id: string | null; date: string };
type AnamnesisRow = { client_id: string | null };

export default function ClientesPage() {
  const [tab, setTab]         = useState<Tab>('todos');
  const [clients, setClients] = useState<Client[]>([]);
  const [apts, setApts]       = useState<AptRow[]>([]);
  const [anamRows, setAnamRows] = useState<AnamnesisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [estId, setEstId]     = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name: '', email: '', phone: '', birth_date: '', notes: '' });
  const [sumidosDays, setSumidosDays] = useState(30);
  const [retornosDays, setRetornosDays] = useState(30);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: estRaw } = await supabase.from('establishments').select('id').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string } | null;
    if (!est) { setLoading(false); return; }
    setEstId(est.id);

    const [cliRes, aptsRes, anamRes] = await Promise.all([
      supabase.from('clients').select('*').eq('establishment_id', est.id).order('name'),
      (supabase as any).from('appointments').select('client_id, date').eq('establishment_id', est.id),
      (supabase as any).from('anamnesis_submissions').select('client_id').eq('establishment_id', est.id),
    ]);

    setClients(cliRes.data || []);
    setApts(aptsRes.data || []);
    setAnamRows(anamRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const cutoffSumidos = new Date(today); cutoffSumidos.setDate(today.getDate() - sumidosDays);
  const cutoffSumidosStr = cutoffSumidos.toISOString().split('T')[0];
  const cutoffRetornos = new Date(today); cutoffRetornos.setDate(today.getDate() - retornosDays);
  const cutoffRetornosStr = cutoffRetornos.toISOString().split('T')[0];
  const thisMonth = today.getMonth() + 1;

  // Mapas auxiliares
  const aptsByClient = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const a of apts) {
      if (!a.client_id) continue;
      map[a.client_id] = map[a.client_id] ?? [];
      map[a.client_id].push(a.date);
    }
    return map;
  }, [apts]);

  const anamClients = useMemo(() => new Set(anamRows.map(r => r.client_id).filter(Boolean)), [anamRows]);

  const tabClients = useMemo(() => {
    let list = clients;
    switch (tab) {
      case 'retornos':
        list = clients.filter(c => {
          const dates = aptsByClient[c.id];
          if (!dates || dates.length < 2) return false;
          const last = [...dates].sort().at(-1)!;
          return last >= cutoffRetornosStr;
        });
        break;
      case 'sumidos':
        list = clients.filter(c => {
          const dates = aptsByClient[c.id];
          if (!dates?.length) return true;
          const last = [...dates].sort().at(-1)!;
          return last < cutoffSumidosStr;
        });
        break;
      case 'aniversarios':
        list = clients.filter(c => {
          if (!c.birth_date) return false;
          const month = Number(c.birth_date.split('-')[1]);
          return month === thisMonth;
        });
        break;
      case 'fichas':
        list = clients.filter(c => anamClients.has(c.id));
        break;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
      );
    }
    return list;
  }, [tab, clients, search, aptsByClient, anamClients, cutoffSumidosStr, cutoffRetornosStr, thisMonth]);

  const openEdit = (c: Client) => {
    setEditClient(c);
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', birth_date: c.birth_date || '', notes: c.notes || '' });
    setShowForm(true);
  };

  const openNew = () => {
    setEditClient(null);
    setForm({ name: '', email: '', phone: '', birth_date: '', notes: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    if (editClient) {
      await (supabase as any).from('clients').update({ ...form, birth_date: form.birth_date || null, email: form.email || null, phone: form.phone || null, notes: form.notes || null }).eq('id', editClient.id);
    } else {
      await (supabase as any).from('clients').insert({ ...form, establishment_id: estId, birth_date: form.birth_date || null, email: form.email || null, phone: form.phone || null, notes: form.notes || null });
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;
    const supabase = createClient();
    await supabase.from('clients').delete().eq('id', id);
    load();
  };

  const getBirthday = (c: Client) => {
    if (!c.birth_date) return null;
    const [, mm, dd] = c.birth_date.split('-');
    return `${dd}/${mm}`;
  };

  const getLastVisit = (c: Client) => {
    const dates = aptsByClient[c.id];
    if (!dates?.length) return 'Nunca';
    const last = dates.sort().at(-1)!;
    const [y, m, d] = last.split('-');
    return `${d}/${m}/${y}`;
  };

  const getAge = (birthDate: string) => {
    const [y, m, d] = birthDate.split('-').map(Number);
    const birth = new Date(y, m - 1, d);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const tabCounts = useMemo(() => ({
    todos:        clients.length,
    retornos:     clients.filter(c => { const dates = aptsByClient[c.id]; if (!dates || dates.length < 2) return false; return [...dates].sort().at(-1)! >= cutoffRetornosStr; }).length,
    sumidos:      clients.filter(c => { const dates = aptsByClient[c.id]; if (!dates?.length) return true; return [...dates].sort().at(-1)! < cutoffSumidosStr; }).length,
    aniversarios: clients.filter(c => { if (!c.birth_date) return false; return Number(c.birth_date.split('-')[1]) === thisMonth; }).length,
    fichas:       clients.filter(c => anamClients.has(c.id)).length,
  }), [clients, aptsByClient, anamClients, cutoffSumidosStr, cutoffRetornosStr, thisMonth]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Clientes" />
      <main className="flex-1 p-4 sm:p-6 space-y-4">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" variant="Outline" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone..." className="pl-9 h-10 rounded-xl border-gray-200" />
          </div>
          <Button onClick={openNew} className="bg-[#6666cc] hover:bg-[#5555aa] text-white border-0 rounded-xl h-10">
            <Add className="w-4 h-4 mr-1.5" variant="Outline" /> Novo cliente
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            const count = tabCounts[t.id];
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${tab === t.id ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Icon className="w-3.5 h-3.5" variant="Outline" />
                {t.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold leading-none ${tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Descrição da aba */}
        {tab === 'sumidos' && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-amber-700 font-medium">Clientes sem visita — boa hora para entrar em contato!</span>
            <select value={sumidosDays} onChange={e => setSumidosDays(Number(e.target.value))}
              className="text-xs font-semibold bg-white border border-amber-200 rounded-lg px-2 py-1 text-amber-700 outline-none">
              <option value={30}>há 30+ dias</option>
              <option value={60}>há 60+ dias</option>
              <option value={90}>há 90+ dias</option>
              <option value={120}>há 120+ dias</option>
            </select>
          </div>
        )}
        {tab === 'retornos' && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-green-700 font-medium">Clientes que retornaram no período</span>
            <select value={retornosDays} onChange={e => setRetornosDays(Number(e.target.value))}
              className="text-xs font-semibold bg-white border border-green-200 rounded-lg px-2 py-1 text-green-700 outline-none">
              <option value={15}>Últimos 15 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </div>
        )}
        {tab === 'aniversarios' && (
          <div className="bg-pink-50 border border-pink-100 rounded-xl px-4 py-2.5 text-xs text-pink-700 font-medium">
            Aniversariantes de {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(today)} — que tal enviar um cupom especial?
          </div>
        )}

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#6666cc] animate-spin" />
            </div>
          ) : tabClients.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" variant="Outline" />
              <p className="font-medium">Nenhum cliente nesta aba</p>
              <p className="text-sm mt-1">
                {tab === 'retornos' && 'Clientes que vieram mais de uma vez aparecerão aqui.'}
                {tab === 'sumidos' && 'Nenhum cliente sumido — ótimo!'}
                {tab === 'aniversarios' && 'Nenhum aniversariante este mês.'}
                {tab === 'fichas' && 'Clientes com ficha de anamnese preenchida aparecerão aqui.'}
                {tab === 'todos' && 'Cadastre seu primeiro cliente.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tabClients.map(c => (
                <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-[#6666cc] rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{c.name}</span>
                      {tab === 'aniversarios' && c.birth_date && (
                        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-semibold">
                          🎂 {getBirthday(c)} · {getAge(c.birth_date)} anos
                        </span>
                      )}
                      {anamClients.has(c.id) && tab !== 'aniversarios' && (
                        <span className="text-xs bg-[#6666cc]/10 text-[#6666cc] px-2 py-0.5 rounded-full font-semibold">ficha</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      {c.phone && <span className="flex items-center gap-1 text-xs text-gray-500"><Call className="w-3 h-3" variant="Outline" />{c.phone}</span>}
                      {c.email && <span className="flex items-center gap-1 text-xs text-gray-500"><Sms className="w-3 h-3" variant="Outline" />{c.email}</span>}
                      {(tab === 'sumidos' || tab === 'retornos') && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" variant="Outline" />
                          Última visita: {getLastVisit(c)}
                        </span>
                      )}
                      {tab === 'retornos' && (
                        <span className="text-xs text-green-600 font-semibold">
                          {aptsByClient[c.id]?.length ?? 0} visitas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-xl text-gray-400 hover:text-[#6666cc] hover:bg-[#6666cc]/10 transition-colors">
                      <Edit2 className="w-4 h-4" variant="Outline" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash className="w-4 h-4" variant="Outline" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-xl">{editClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <div className="space-y-3">
                <div><Label className="text-gray-700 font-medium text-sm">Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div><Label className="text-gray-700 font-medium text-sm">E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div><Label className="text-gray-700 font-medium text-sm">Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div><Label className="text-gray-700 font-medium text-sm">Data de Nascimento</Label><Input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} className="mt-1 rounded-xl border-gray-200 h-10" /></div>
                <div><Label className="text-gray-700 font-medium text-sm">Observações</Label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:border-[#6666cc]" /></div>
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
  );
}
