'use client';

import { useEffect, useState } from 'react';
import { Add, ClipboardText, Edit2, Trash, ExportSquare, CloseCircle, TickSquare, Eye, DocumentText1 } from 'iconsax-react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';

type FieldType = 'text' | 'yesno' | 'select';
type AnamneseField = { id: string; label: string; type: FieldType; required: boolean; options?: string[] };
type Template = { id: string; title: string; description: string | null; fields: AnamneseField[]; active: boolean; created_at: string };
type Submission = { id: string; template_id: string; client_name: string | null; data: Record<string, string>; created_at: string };

type Tab = 'templates' | 'respostas';

const FIELD_TYPE_LABELS: Record<FieldType, string> = { text: 'Texto livre', yesno: 'Sim / Não', select: 'Múltipla escolha' };
function generateId() { return Math.random().toString(36).slice(2); }

export default function AnamnesePage() {
  const [tab, setTab]             = useState<Tab>('templates');
  const [loading, setLoading]     = useState(true);
  const [estId, setEstId]         = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showEditor, setShowEditor]   = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [saving, setSaving]       = useState(false);
  const [copied, setCopied]       = useState<string | null>(null);
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc,  setFormDesc]  = useState('');
  const [formFields, setFormFields] = useState<AnamneseField[]>([]);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: estRaw } = await supabase.from('establishments').select('id').eq('owner_id', user.id).maybeSingle();
    const est = estRaw as { id: string } | null;
    if (!est) { setLoading(false); return; }
    setEstId(est.id);

    const [tplRes, subRes] = await Promise.all([
      (supabase as any).from('anamnesis_templates').select('*').eq('establishment_id', est.id).order('created_at', { ascending: false }),
      (supabase as any).from('anamnesis_submissions').select('*').eq('establishment_id', est.id).order('created_at', { ascending: false }),
    ]);

    let tplData = tplRes.data || [];

    if (tplData.length === 0) {
      const defaultTemplates = [
        { title: 'Micropigmentação', description: 'Ficha completa para procedimentos de micropigmentação', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Data de nascimento', type: 'text', required: true },
          { id: '3', label: 'Telefone', type: 'text', required: true },
          { id: '4', label: 'Está gestante ou amamentando?', type: 'yesno', required: true },
          { id: '5', label: 'Possui diabetes?', type: 'yesno', required: true },
          { id: '6', label: 'Possui hipertensão?', type: 'yesno', required: true },
          { id: '7', label: 'Possui hemofilia ou problemas de coagulação?', type: 'yesno', required: true },
          { id: '8', label: 'Tem histórico de herpes labial?', type: 'yesno', required: true },
          { id: '9', label: 'Tem alergia a anestésicos?', type: 'yesno', required: true },
          { id: '10', label: 'Tem tendência a queloides?', type: 'yesno', required: true },
          { id: '11', label: 'Usa algum medicamento? Qual?', type: 'text', required: false },
          { id: '12', label: 'Área a ser pigmentada', type: 'select', required: true, options: ['Sobrancelhas', 'Lábios', 'Olhos (delineado)', 'Outro'] },
          { id: '13', label: 'Já fez micropigmentação antes?', type: 'yesno', required: true },
          { id: '14', label: 'Expectativas com o procedimento', type: 'text', required: false },
        ]},
        { title: 'Design de Sobrancelhas', description: 'Ficha para design e modelagem de sobrancelhas', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Telefone', type: 'text', required: true },
          { id: '3', label: 'É a primeira vez fazendo design?', type: 'yesno', required: true },
          { id: '4', label: 'Tipo de pele', type: 'select', required: true, options: ['Normal', 'Oleosa', 'Seca', 'Mista', 'Sensível'] },
          { id: '5', label: 'Possui alguma alergia?', type: 'yesno', required: true },
          { id: '6', label: 'Se sim, qual?', type: 'text', required: false },
          { id: '7', label: 'Usa ácidos ou retinoides?', type: 'yesno', required: true },
          { id: '8', label: 'Formato desejado', type: 'select', required: false, options: ['Natural', 'Arqueada', 'Reta', 'A definir'] },
          { id: '9', label: 'Observações', type: 'text', required: false },
        ]},
        { title: 'Alongamento de Cílios', description: 'Ficha para extensão e alongamento de cílios', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Telefone', type: 'text', required: true },
          { id: '3', label: 'Data de nascimento', type: 'text', required: true },
          { id: '4', label: 'Usa lentes de contato?', type: 'yesno', required: true },
          { id: '5', label: 'Tem alergia a colas/adesivos?', type: 'select', required: true, options: ['Sim', 'Não', 'Não sei'] },
          { id: '6', label: 'Possui algum problema ocular?', type: 'yesno', required: true },
          { id: '7', label: 'Se sim, qual?', type: 'text', required: false },
          { id: '8', label: 'Fez cirurgia ocular recente?', type: 'yesno', required: true },
          { id: '9', label: 'Está gestante?', type: 'yesno', required: true },
          { id: '10', label: 'Tipo de alongamento', type: 'select', required: true, options: ['Fio a fio clássico', 'Volume russo', 'Volume brasileiro', 'Híbrido', 'Mega volume'] },
          { id: '11', label: 'Curvatura preferida', type: 'select', required: false, options: ['C', 'CC', 'D', 'DD', 'A definir'] },
        ]},
        { title: 'Alongamento de Unhas', description: 'Ficha para extensão e alongamento de unhas', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Telefone', type: 'text', required: true },
          { id: '3', label: 'Possui ou já teve micose nas unhas?', type: 'yesno', required: true },
          { id: '4', label: 'Tem alergia a esmaltes ou produtos químicos?', type: 'yesno', required: true },
          { id: '5', label: 'Possui diabetes?', type: 'yesno', required: true },
          { id: '6', label: 'Usa algum medicamento?', type: 'text', required: false },
          { id: '7', label: 'Tipo de alongamento', type: 'select', required: true, options: ['Gel', 'Fibra de vidro', 'Acrílico', 'Polygel'] },
          { id: '8', label: 'Formato desejado', type: 'select', required: true, options: ['Quadrado', 'Redondo', 'Stiletto', 'Bailarina', 'Amendoado'] },
          { id: '9', label: 'Comprimento', type: 'select', required: true, options: ['Curto', 'Médio', 'Longo', 'Extra longo'] },
        ]},
        { title: 'Depilação', description: 'Ficha para procedimentos de depilação', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Telefone', type: 'text', required: true },
          { id: '3', label: 'Está gestante?', type: 'yesno', required: true },
          { id: '4', label: 'Usa medicamentos com ácidos?', type: 'yesno', required: true },
          { id: '5', label: 'Tem alergia a cera ou produtos depiladores?', type: 'yesno', required: true },
          { id: '6', label: 'Possui varizes na região?', type: 'yesno', required: true },
          { id: '7', label: 'Área a ser depilada', type: 'select', required: true, options: ['Pernas', 'Axilas', 'Virilha', 'Buço', 'Braços', 'Costas', 'Outra'] },
          { id: '8', label: 'Método preferido', type: 'select', required: false, options: ['Cera quente', 'Cera fria', 'Linha', 'Laser', 'Outro'] },
        ]},
        { title: 'Capilar', description: 'Ficha para tratamentos capilares', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Telefone', type: 'text', required: true },
          { id: '3', label: 'Tipo de cabelo', type: 'select', required: true, options: ['Liso', 'Ondulado', 'Cacheado', 'Crespo'] },
          { id: '4', label: 'Já fez química recentemente?', type: 'yesno', required: true },
          { id: '5', label: 'Qual química?', type: 'text', required: false },
          { id: '6', label: 'Tem alergia a produtos capilares?', type: 'yesno', required: true },
          { id: '7', label: 'Possui queda de cabelo?', type: 'yesno', required: false },
          { id: '8', label: 'Procedimento desejado', type: 'select', required: true, options: ['Coloração', 'Mechas', 'Progressiva', 'Botox capilar', 'Hidratação', 'Corte', 'Outro'] },
          { id: '9', label: 'Observações', type: 'text', required: false },
        ]},
        { title: 'Massoterapia', description: 'Ficha para sessões de massagem', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Telefone', type: 'text', required: true },
          { id: '3', label: 'Possui problemas cardíacos?', type: 'yesno', required: true },
          { id: '4', label: 'Possui hipertensão?', type: 'yesno', required: true },
          { id: '5', label: 'Está gestante?', type: 'yesno', required: true },
          { id: '6', label: 'Possui hérnia de disco ou problemas na coluna?', type: 'yesno', required: true },
          { id: '7', label: 'Fez cirurgia recente?', type: 'yesno', required: true },
          { id: '8', label: 'Região com dor ou tensão', type: 'text', required: false },
          { id: '9', label: 'Tipo de massagem', type: 'select', required: true, options: ['Relaxante', 'Desportiva', 'Modeladora', 'Drenagem linfática', 'Pedras quentes', 'Outra'] },
        ]},
        { title: 'Facial / Estética', description: 'Ficha para procedimentos faciais e estéticos', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Telefone', type: 'text', required: true },
          { id: '3', label: 'Tipo de pele', type: 'select', required: true, options: ['Normal', 'Oleosa', 'Seca', 'Mista', 'Sensível'] },
          { id: '4', label: 'Usa ácidos ou retinoides?', type: 'yesno', required: true },
          { id: '5', label: 'Possui alguma alergia de pele?', type: 'yesno', required: true },
          { id: '6', label: 'Se sim, qual?', type: 'text', required: false },
          { id: '7', label: 'Está gestante ou amamentando?', type: 'yesno', required: true },
          { id: '8', label: 'Possui herpes?', type: 'yesno', required: true },
          { id: '9', label: 'Procedimento desejado', type: 'select', required: true, options: ['Limpeza de pele', 'Peeling', 'Microagulhamento', 'Radiofrequência', 'LED', 'Outro'] },
        ]},
        { title: 'Podologia', description: 'Ficha para procedimentos podológicos', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Telefone', type: 'text', required: true },
          { id: '3', label: 'Possui diabetes?', type: 'yesno', required: true },
          { id: '4', label: 'Possui problemas circulatórios?', type: 'yesno', required: true },
          { id: '5', label: 'Tem unha encravada?', type: 'yesno', required: true },
          { id: '6', label: 'Possui micose nas unhas?', type: 'yesno', required: true },
          { id: '7', label: 'Sente dor ao caminhar?', type: 'yesno', required: false },
          { id: '8', label: 'Usa algum medicamento?', type: 'text', required: false },
          { id: '9', label: 'Queixa principal', type: 'text', required: true },
        ]},
        { title: 'Barbearia', description: 'Ficha para serviços de barbearia', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Telefone', type: 'text', required: true },
          { id: '3', label: 'Tipo de pele', type: 'select', required: true, options: ['Normal', 'Oleosa', 'Seca', 'Sensível'] },
          { id: '4', label: 'Tem alergia a produtos de barbear?', type: 'yesno', required: true },
          { id: '5', label: 'Possui foliculite?', type: 'yesno', required: true },
          { id: '6', label: 'Tipo de corte preferido', type: 'text', required: false },
          { id: '7', label: 'Observações', type: 'text', required: false },
        ]},
        { title: 'Geral', description: 'Ficha de anamnese geral para qualquer procedimento', fields: [
          { id: '1', label: 'Nome completo', type: 'text', required: true },
          { id: '2', label: 'Data de nascimento', type: 'text', required: true },
          { id: '3', label: 'Telefone', type: 'text', required: true },
          { id: '4', label: 'Possui alguma alergia?', type: 'yesno', required: true },
          { id: '5', label: 'Se sim, qual?', type: 'text', required: false },
          { id: '6', label: 'Usa algum medicamento?', type: 'yesno', required: false },
          { id: '7', label: 'Se sim, qual?', type: 'text', required: false },
          { id: '8', label: 'Está gestante?', type: 'yesno', required: false },
          { id: '9', label: 'Possui alguma doença crônica?', type: 'yesno', required: false },
          { id: '10', label: 'Observações adicionais', type: 'text', required: false },
        ]},
      ];
      const inserts = defaultTemplates.map(t => ({ ...t, establishment_id: est.id, active: true }));
      const { data: seeded } = await (supabase as any).from('anamnesis_templates').insert(inserts).select();
      tplData = seeded || [];
    }

    setTemplates(tplData);
    setSubmissions(subRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditTemplate(null);
    setFormTitle('');
    setFormDesc('');
    setFormFields([
      { id: generateId(), label: 'Nome completo', type: 'text', required: true },
      { id: generateId(), label: 'Tem alergia a algum produto?', type: 'yesno', required: false },
    ]);
    setShowEditor(true);
  };

  const openEdit = (t: Template) => {
    setEditTemplate(t);
    setFormTitle(t.title);
    setFormDesc(t.description || '');
    setFormFields(t.fields || []);
    setShowEditor(true);
  };

  const addField = () => setFormFields(prev => [...prev, { id: generateId(), label: '', type: 'text', required: false }]);
  const updateField = (id: string, u: Partial<AnamneseField>) => setFormFields(prev => prev.map(f => f.id === id ? { ...f, ...u } : f));
  const removeField = (id: string) => setFormFields(prev => prev.filter(f => f.id !== id));

  const handleSave = async () => {
    if (!formTitle.trim() || formFields.length === 0) return;
    setSaving(true);
    const supabase = createClient();
    const payload = { establishment_id: estId, title: formTitle, description: formDesc || null, fields: formFields, active: true };
    if (editTemplate) {
      await (supabase as any).from('anamnesis_templates').update(payload).eq('id', editTemplate.id);
    } else {
      await (supabase as any).from('anamnesis_templates').insert(payload);
    }
    setSaving(false); setShowEditor(false); load();
  };

  const handleToggle = async (id: string, active: boolean) => {
    const supabase = createClient();
    await (supabase as any).from('anamnesis_templates').update({ active: !active }).eq('id', id);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !active } : t));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este template?')) return;
    const supabase = createClient();
    await (supabase as any).from('anamnesis_templates').delete().eq('id', id);
    load();
  };

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/anamnese/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getTemplateName = (id: string) => templates.find(t => t.id === id)?.title ?? 'Template';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Anamnese" />
      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-5">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fichas de Anamnese</h1>
            <p className="text-sm text-gray-400 mt-0.5">Templates e respostas dos seus clientes</p>
          </div>
          {tab === 'templates' && (
            <Button onClick={openNew} className="bg-[#6666cc] hover:bg-[#5555aa] text-white rounded-xl h-10 px-4">
              <Add className="w-4 h-4 mr-1" variant="Outline" /> Novo template
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5">
          {([
            { id: 'templates', label: 'Templates',  count: templates.length },
            { id: 'respostas', label: 'Respostas',  count: submissions.length },
          ] as { id: Tab; label: string; count: number }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex-1 justify-center ${tab === t.id ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#6666cc]" /></div>
        ) : tab === 'templates' ? (
          templates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardText className="w-12 h-12 mx-auto mb-3 opacity-30" variant="Outline" />
              <p className="font-medium">Nenhum template criado</p>
              <p className="text-sm mt-1">Crie templates para coletar informações dos seus clientes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(t => (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{t.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {t.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      {t.description && <p className="text-sm text-gray-500 mb-2 truncate">{t.description}</p>}
                      <p className="text-xs text-gray-400">
                        {(t.fields || []).length} campo(s) · {submissions.filter(s => s.template_id === t.id).length} respostas · Criado em {new Date(t.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button onClick={() => handleCopyLink(t.id)}
                      className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold border transition-all ${copied === t.id ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {copied === t.id ? <><TickSquare className="w-3.5 h-3.5" /> Copiado</> : <><ExportSquare className="w-3.5 h-3.5" variant="Outline" /> Copiar link</>}
                    </button>
                    <a href={`/anamnese/${t.id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold border border-[#6666cc]/30 text-[#6666cc] hover:bg-[#6666cc]/5 transition-all">
                      <ExportSquare className="w-3.5 h-3.5" variant="Outline" /> Visualizar
                    </a>
                    <button onClick={() => { setTab('respostas'); }}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-all">
                      <Eye className="w-3.5 h-3.5" variant="Outline" /> {submissions.filter(s => s.template_id === t.id).length} respostas
                    </button>
                    <button onClick={() => handleToggle(t.id, t.active)}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-all">
                      {t.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => openEdit(t)} className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-all">
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                      <Trash className="w-3.5 h-3.5" variant="Outline" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // ── Respostas ─────────────────────────────────────────────────────
          submissions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <DocumentText1 className="w-12 h-12 mx-auto mb-3 opacity-30" variant="Outline" />
              <p className="font-medium">Nenhuma resposta recebida</p>
              <p className="text-sm mt-1">As respostas dos clientes aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-[#6666cc]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DocumentText1 className="w-5 h-5 text-[#6666cc]" variant="Outline" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{s.client_name ?? 'Cliente anônimo'}</p>
                    <p className="text-xs text-gray-400">
                      {getTemplateName(s.template_id)} · {new Date(s.created_at).toLocaleDateString('pt-BR')} às {new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewSubmission(s)}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold border border-[#6666cc]/30 text-[#6666cc] hover:bg-[#6666cc]/5 transition-all flex-shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" variant="Outline" /> Ver ficha
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* ── Editor de template ── */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editTemplate ? 'Editar template' : 'Novo template'}</h3>
              <button onClick={() => setShowEditor(false)}><CloseCircle className="w-5 h-5 text-gray-400" variant="Outline" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Título *</Label>
                  <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Anamnese Capilar" className="mt-1 rounded-xl border-gray-200 h-10" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Descrição</Label>
                  <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Breve explicação para o cliente" className="mt-1 rounded-xl border-gray-200 h-10" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-700">Campos</Label>
                  <button onClick={addField} className="text-xs text-[#6666cc] font-semibold flex items-center gap-1 hover:opacity-70">
                    <Add className="w-3.5 h-3.5" /> Adicionar campo
                  </button>
                </div>
                <div className="space-y-3">
                  {formFields.map((field, i) => (
                    <div key={field.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                        <Input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} placeholder="Pergunta / Label" className="flex-1 h-8 rounded-lg border-gray-200 text-sm" />
                        <button onClick={() => removeField(field.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                          <CloseCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 pl-7">
                        <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                          className="h-7 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-600 focus:outline-none">
                          {(Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                          <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="rounded accent-[#6666cc]" />
                          Obrigatório
                        </label>
                      </div>
                      {field.type === 'select' && (
                        <div className="pl-7">
                          <Input value={(field.options || []).join(',')} onChange={e => updateField(field.id, { options: e.target.value.split(',') })} placeholder="Opção 1,Opção 2,Opção 3" className="h-7 rounded-lg border-gray-200 text-xs" />
                          <p className="text-xs text-gray-400 mt-0.5">Separe por vírgula</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEditor(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving || !formTitle.trim() || formFields.length === 0} className="flex-1 bg-[#6666cc] hover:bg-[#5555aa] text-white rounded-xl font-bold">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editTemplate ? 'Salvar' : 'Criar template')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Visualizar resposta ── */}
      {viewSubmission && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{viewSubmission.client_name ?? 'Resposta'}</h3>
                <p className="text-xs text-gray-400">{getTemplateName(viewSubmission.template_id)} · {new Date(viewSubmission.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <button onClick={() => setViewSubmission(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {(() => {
                const tpl = templates.find(t => t.id === viewSubmission.template_id);
                const fields = tpl?.fields ?? [];
                if (!fields.length) {
                  return Object.entries(viewSubmission.data).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{k}</p>
                      <p className="text-sm text-gray-900 font-medium">{v || '—'}</p>
                    </div>
                  ));
                }
                return fields.map(f => (
                  <div key={f.id} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</p>
                    <p className="text-sm text-gray-900 font-medium">{viewSubmission.data[f.id] || viewSubmission.data[f.label] || '—'}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
