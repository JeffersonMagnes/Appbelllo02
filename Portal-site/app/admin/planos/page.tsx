'use client';

import { useEffect, useState } from 'react';
import {
  Add, Trash, Star1, TickSquare, CloseCircle,
  Calendar, Profile2User, DollarCircle, Chart, Box,
  Setting2, MagicStar, Note, Wallet, Scissor, UserTick,
  Link2, ClipboardText, Printer, Gift,
} from 'iconsax-react';
import { Loader2, Package } from 'lucide-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ─── Catálogo completo de funcionalidades reais do app ─────────────────────
type FeatureDef = {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
  type: 'boolean' | 'limit';
  unit?: string;
};

type FeatureGroup = {
  category: string;
  items: FeatureDef[];
};

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    category: 'Agenda',
    items: [
      { key: 'agenda_basica',      label: 'Agenda (dia / semana / mês)',  desc: 'Visualização completa da agenda com 3 modos de exibição', icon: Calendar, type: 'boolean' },
      { key: 'agendamento_online', label: 'Agendamentos online',           desc: 'Link público para clientes agendarem sozinhos',           icon: Link2,    type: 'boolean' },
      { key: 'filtro_profissional',label: 'Filtro por profissional',       desc: 'Filtra a agenda por funcionário específico',              icon: Calendar, type: 'boolean' },
    ],
  },
  {
    category: 'Clientes',
    items: [
      { key: 'clientes',           label: 'Gestão de clientes',           desc: 'Cadastro, edição e histórico de clientes',                icon: Profile2User, type: 'boolean' },
      { key: 'clientes_retornos',  label: 'Aba Retornos',                 desc: 'Identifica clientes que voltaram mais de uma vez',        icon: Profile2User, type: 'boolean' },
      { key: 'clientes_sumidos',   label: 'Aba Sumidos',                  desc: 'Clientes sem visita há mais de 30 dias',                  icon: Profile2User, type: 'boolean' },
      { key: 'clientes_aniversarios', label: 'Aba Aniversários',          desc: 'Aniversariantes do mês para ações de marketing',          icon: Profile2User, type: 'boolean' },
      { key: 'max_clients',        label: 'Limite de clientes',           desc: 'Máximo de clientes cadastrados (0 = ilimitado)',          icon: Profile2User, type: 'limit', unit: 'clientes' },
    ],
  },
  {
    category: 'Serviços',
    items: [
      { key: 'servicos',           label: 'Gestão de serviços',           desc: 'Cadastro de serviços com preço e duração',               icon: Scissor,  type: 'boolean' },
      { key: 'pacotes',            label: 'Pacotes de serviços',          desc: 'Pacotes com sessões, validade e desconto',               icon: Scissor,  type: 'boolean' },
      { key: 'max_services',       label: 'Limite de serviços',           desc: 'Máximo de serviços ativos (0 = ilimitado)',              icon: Scissor,  type: 'limit', unit: 'serviços' },
    ],
  },
  {
    category: 'Equipe',
    items: [
      { key: 'equipe',             label: 'Gestão de funcionários',       desc: 'Cadastro de profissionais com cargo e comissão',         icon: UserTick, type: 'boolean' },
      { key: 'permissoes_equipe',  label: 'Permissões por funcionário',   desc: 'Controle granular do que cada funcionário pode acessar', icon: UserTick, type: 'boolean' },
      { key: 'dashboard_funcionario', label: 'Dashboard do funcionário',  desc: 'Visão individual de agenda e comissões por profissional', icon: UserTick, type: 'boolean' },
      { key: 'max_professionals',  label: 'Limite de profissionais',      desc: 'Máximo de funcionários cadastrados (0 = ilimitado)',     icon: UserTick, type: 'limit', unit: 'profissionais' },
    ],
  },
  {
    category: 'Financeiro',
    items: [
      { key: 'caixa',              label: 'Caixa (entradas/saídas)',      desc: 'Registro diário de movimentações financeiras',           icon: Wallet,   type: 'boolean' },
      { key: 'financeiro',         label: 'Extrato financeiro',           desc: 'Histórico completo com filtros e gráficos',              icon: DollarCircle, type: 'boolean' },
      { key: 'comandas',           label: 'Comandas',                     desc: 'Ordens de serviço vinculadas a atendimentos',            icon: Note,     type: 'boolean' },
      { key: 'comissoes',          label: 'Comissões de profissionais',   desc: 'Cálculo automático de comissão por serviço',            icon: DollarCircle, type: 'boolean' },
    ],
  },
  {
    category: 'Relatórios',
    items: [
      { key: 'relatorios_basicos', label: 'Relatórios básicos',          desc: 'Resumo de agendamentos e faturamento',                   icon: Chart, type: 'boolean' },
      { key: 'relatorios_avancados', label: 'Relatórios avançados',      desc: 'Performance por profissional, top serviços, fluxo de caixa', icon: Chart, type: 'boolean' },
    ],
  },
  {
    category: 'Recursos extras',
    items: [
      { key: 'estoque',            label: 'Estoque de produtos',         desc: 'Controle de produtos com alertas de estoque baixo',      icon: Box,          type: 'boolean' },
      { key: 'anamnese',           label: 'Fichas de anamnese',          desc: 'Templates de formulários e visualização de respostas',   icon: ClipboardText, type: 'boolean' },
      { key: 'anamnese_publica',   label: 'Anamnese pública',            desc: 'Link para clientes preencherem antes do atendimento',    icon: ClipboardText, type: 'boolean' },
      { key: 'assistente_ia',      label: 'Assistente IA',               desc: 'Chat inteligente para dúvidas e sugestões de negócio',   icon: MagicStar,    type: 'boolean' },
      { key: 'ofertas',            label: 'Ofertas e promoções',         desc: 'Criação e gestão de ofertas com desconto',               icon: Gift,         type: 'boolean' },
      { key: 'impressao_termica',  label: 'Impressão térmica Bluetooth', desc: 'Impressão de comprovantes via impressora Bluetooth',     icon: Printer,      type: 'boolean' },
      { key: 'relatorio_semanal',  label: 'Relatório semanal automático',desc: 'Notificação push com resumo semanal toda segunda-feira', icon: Chart,        type: 'boolean' },
    ],
  },
];

const ALL_FEATURE_KEYS = FEATURE_GROUPS.flatMap(g => g.items.map(i => i.key));

type FeatureValues = Record<string, boolean | number>;

type Plan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  color: string;
  featured: boolean;
  active: boolean;
  features: FeatureValues;
  sort_order: number;
};

const COLOR_OPTIONS = [
  { label: 'Cinza',    value: '#64748B' },
  { label: 'Roxo',     value: '#6666cc' },
  { label: 'Teal',     value: '#5ab0b6' },
  { label: 'Verde',    value: '#10B981' },
  { label: 'Laranja',  value: '#F59E0B' },
  { label: 'Rosa',     value: '#EC4899' },
];

function parseFeatures(raw: unknown): FeatureValues {
  if (!raw) return {};
  // Backward compat: se ainda for array de strings, ignora
  if (Array.isArray(raw)) return {};
  if (typeof raw === 'object') return raw as FeatureValues;
  try { return JSON.parse(String(raw)); } catch { return {}; }
}

function countEnabled(features: FeatureValues): number {
  return ALL_FEATURE_KEYS.filter(k => {
    const def = FEATURE_GROUPS.flatMap(g => g.items).find(i => i.key === k);
    if (!def || def.type !== 'boolean') return false;
    return features[k] === true;
  }).length;
}

export default function PlanosPage() {
  const [plans, setPlans]     = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId,  setSavedId]  = useState<string | null>(null);
  const [error, setError]     = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', slug: '', price: '', color: '#6666cc' });
  const [creating, setCreating] = useState(false);
  // Qual plano está com o painel de features expandido
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/plans');
    const data = await res.json();
    if (!res.ok) setError('Erro ao carregar planos: ' + (data.error ?? res.statusText));
    else setPlans((data || []).map((p: any) => ({ ...p, features: parseFeatures(p.features) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const savePlan = async (plan: Plan) => {
    setSavingId(plan.id);
    setError('');
    const res = await fetch('/api/admin/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plan.id, name: plan.name, price: plan.price, color: plan.color, featured: plan.featured, active: plan.active, features: plan.features }),
    });
    setSavingId(null);
    if (!res.ok) { const d = await res.json(); setError('Erro ao salvar: ' + (d.error ?? res.statusText)); return; }
    setSavedId(plan.id);
    setTimeout(() => setSavedId(null), 2500);
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Excluir este plano?')) return;
    await fetch(`/api/admin/plans?id=${id}`, { method: 'DELETE' });
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const createPlan = async () => {
    if (!newPlan.name.trim() || !newPlan.slug.trim() || !newPlan.price) return;
    setCreating(true);
    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPlan.name.trim(), slug: newPlan.slug.trim().toLowerCase().replace(/\s+/g, '-'), price: parseFloat(newPlan.price), color: newPlan.color, features: {}, featured: false, active: true, sort_order: plans.length + 1 }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError('Erro ao criar: ' + (data.error ?? res.statusText)); return; }
    setPlans(prev => [...prev, { ...data, features: {} }]);
    setNewPlan({ name: '', slug: '', price: '', color: '#6666cc' });
    setShowNew(false);
  };

  const update = (id: string, field: keyof Plan, value: unknown) =>
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const setFeatured = (id: string) =>
    setPlans(prev => prev.map(p => ({ ...p, featured: p.id === id })));

  const toggleFeature = (planId: string, key: string) =>
    setPlans(prev => prev.map(p => p.id !== planId ? p : {
      ...p,
      features: { ...p.features, [key]: !p.features[key] },
    }));

  const setLimit = (planId: string, key: string, val: string) =>
    setPlans(prev => prev.map(p => p.id !== planId ? p : {
      ...p,
      features: { ...p.features, [key]: parseInt(val) || 0 },
    }));

  const enableAll = (planId: string) =>
    setPlans(prev => prev.map(p => p.id !== planId ? p : {
      ...p,
      features: Object.fromEntries(
        FEATURE_GROUPS.flatMap(g => g.items).map(f => [
          f.key,
          f.type === 'boolean' ? true : (p.features[f.key] ?? 0),
        ])
      ),
    }));

  const disableAll = (planId: string) =>
    setPlans(prev => prev.map(p => p.id !== planId ? p : {
      ...p,
      features: Object.fromEntries(
        FEATURE_GROUPS.flatMap(g => g.items).map(f => [
          f.key,
          f.type === 'boolean' ? false : (p.features[f.key] ?? 0),
        ])
      ),
    }));

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Planos & Financeiro', 'Planos']} />
      <main className="flex-1 p-6 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planos de Assinatura</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure preços e funcionalidades reais de cada plano</p>
          </div>
          <Button onClick={() => setShowNew(true)} className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white">
            <Add className="w-4 h-4" variant="Outline" /> Novo plano
          </Button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#6666cc]" /></div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">Nenhum plano cadastrado.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-5 items-start">
            {plans.map(plan => {
              const isExpanded = expandedPlan === plan.id;
              const enabledCount = countEnabled(plan.features);

              return (
                <div key={plan.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col ${plan.featured ? 'border-[#6666cc] ring-2 ring-[#6666cc]/20' : 'border-gray-100'}`}>

                  {/* Header */}
                  <div className="p-5 border-b border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <Input value={plan.name} onChange={e => update(plan.id, 'name', e.target.value)} className="h-8 rounded-lg border-gray-200 font-bold text-gray-900 w-28 text-sm" />
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setFeatured(plan.id)} title="Destacar"
                          className={`p-1.5 rounded-lg transition-colors ${plan.featured ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400'}`}>
                          <Star1 className="w-4 h-4" variant={plan.featured ? 'Bold' : 'Outline'} />
                        </button>
                        <button onClick={() => update(plan.id, 'active', !plan.active)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${plan.active ? 'bg-[#6666cc]' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${plan.active ? 'translate-x-5' : ''}`} />
                        </button>
                        <button onClick={() => deletePlan(plan.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400">
                          <Trash className="w-4 h-4" variant="Outline" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 font-medium">R$</span>
                      <Input type="number" value={plan.price} onChange={e => update(plan.id, 'price', parseFloat(e.target.value) || 0)}
                        className="h-10 rounded-xl border-gray-200 text-2xl font-black text-gray-900 w-32" step="0.01" min="0" />
                      <span className="text-sm text-gray-400">/mês</span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-2">Cor</p>
                      <div className="flex gap-2 flex-wrap">
                        {COLOR_OPTIONS.map(c => (
                          <button key={c.value} onClick={() => update(plan.id, 'color', c.value)} title={c.label}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${plan.color === c.value ? 'border-gray-800 scale-125' : 'border-transparent'}`}
                            style={{ backgroundColor: c.value }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resumo de funcionalidades */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      <span className="font-bold text-gray-900">{enabledCount}</span> de {ALL_FEATURE_KEYS.filter(k => FEATURE_GROUPS.flatMap(g => g.items).find(i => i.key === k)?.type === 'boolean').length} funcionalidades ativas
                    </span>
                    <button onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                      className="text-xs text-[#6666cc] font-semibold hover:underline">
                      {isExpanded ? 'Ocultar' : 'Configurar'}
                    </button>
                  </div>

                  {/* Lista de funcionalidades (expandível) */}
                  {isExpanded && (
                    <div className="p-4 border-b border-gray-100 space-y-4 max-h-[60vh] overflow-y-auto">
                      {/* Ações rápidas */}
                      <div className="flex gap-2">
                        <button onClick={() => enableAll(plan.id)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[#6666cc]/10 text-[#6666cc] hover:bg-[#6666cc]/20 transition-colors">
                          Habilitar tudo
                        </button>
                        <button onClick={() => disableAll(plan.id)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                          Desabilitar tudo
                        </button>
                      </div>

                      {FEATURE_GROUPS.map(group => (
                        <div key={group.category}>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{group.category}</p>
                          <div className="space-y-1.5">
                            {group.items.map(feat => {
                              const Icon = feat.icon;
                              const isOn = feat.type === 'boolean' ? plan.features[feat.key] === true : true;
                              return (
                                <div key={feat.key} className={`rounded-xl p-3 border transition-all ${feat.type === 'boolean' && isOn ? 'border-[#6666cc]/20 bg-[#6666cc]/5' : 'border-gray-100 bg-white'}`}>
                                  <div className="flex items-start gap-2.5">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${feat.type === 'boolean' && isOn ? 'bg-[#6666cc]/10' : 'bg-gray-100'}`}>
                                      <Icon className={`w-4 h-4 ${feat.type === 'boolean' && isOn ? 'text-[#6666cc]' : 'text-gray-400'}`} variant="Outline" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-semibold ${feat.type === 'boolean' && isOn ? 'text-gray-900' : 'text-gray-500'}`}>{feat.label}</p>
                                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{feat.desc}</p>
                                      {feat.type === 'limit' && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <Input
                                            type="number" min="0"
                                            value={typeof plan.features[feat.key] === 'number' ? plan.features[feat.key] as number : 0}
                                            onChange={e => setLimit(plan.id, feat.key, e.target.value)}
                                            className="h-7 w-20 rounded-lg border-gray-200 text-sm text-center"
                                          />
                                          <span className="text-xs text-gray-400">{feat.unit} (0 = ilimitado)</span>
                                        </div>
                                      )}
                                    </div>
                                    {feat.type === 'boolean' && (
                                      <button onClick={() => toggleFeature(plan.id, feat.key)}
                                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-1 ${isOn ? 'bg-[#6666cc]' : 'bg-gray-200'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-5' : ''}`} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview das funcionalidades ativas (quando collapsed) */}
                  {!isExpanded && enabledCount > 0 && (
                    <div className="px-5 py-3 flex-1">
                      <div className="space-y-1.5">
                        {FEATURE_GROUPS.flatMap(g => g.items)
                          .filter(f => f.type === 'boolean' && plan.features[f.key] === true)
                          .slice(0, 5)
                          .map(f => {
                            const Icon = f.icon;
                            return (
                              <div key={f.key} className="flex items-center gap-2 text-xs text-gray-600">
                                <Icon className="w-3.5 h-3.5 text-[#6666cc] flex-shrink-0" variant="Outline" />
                                <span>{f.label}</span>
                              </div>
                            );
                          })}
                        {enabledCount > 5 && (
                          <p className="text-xs text-gray-400 pl-5">+{enabledCount - 5} mais...</p>
                        )}
                      </div>
                    </div>
                  )}

                  {!isExpanded && enabledCount === 0 && (
                    <div className="px-5 py-4 text-center flex-1">
                      <p className="text-xs text-gray-400">Nenhuma funcionalidade configurada.</p>
                      <button onClick={() => setExpandedPlan(plan.id)} className="text-xs text-[#6666cc] font-semibold mt-1 hover:underline">
                        Configurar agora →
                      </button>
                    </div>
                  )}

                  {/* Salvar */}
                  <div className="px-5 pb-5 pt-3">
                    <Button onClick={() => savePlan(plan)} disabled={savingId === plan.id}
                      className={`w-full rounded-xl gap-2 text-white transition-all ${savedId === plan.id ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-[#6666cc] hover:bg-[#5555aa]'}`}>
                      {savingId === plan.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : savedId === plan.id
                          ? <><TickSquare className="w-4 h-4" variant="Outline" /> Salvo!</>
                          : 'Salvar plano'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal novo plano */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Novo plano</h3>
              <button onClick={() => setShowNew(false)}><CloseCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nome *</label>
                <Input value={newPlan.name} onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Pro" className="rounded-xl border-gray-200 h-10" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Slug *</label>
                <Input value={newPlan.slug} onChange={e => setNewPlan(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="ex: pro" className="rounded-xl border-gray-200 h-10" />
                <p className="text-xs text-gray-400 mt-1">Só minúsculas e hífens</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Preço mensal (R$) *</label>
                <Input type="number" value={newPlan.price} onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))} placeholder="0.00" className="rounded-xl border-gray-200 h-10" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Cor</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.value} onClick={() => setNewPlan(p => ({ ...p, color: c.value }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${newPlan.color === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowNew(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={createPlan} disabled={creating || !newPlan.name || !newPlan.slug || !newPlan.price}
                className="flex-1 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar plano'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
