'use client';

import { useState } from 'react';
import { ArrowRight2, ArrowLeft2, TickSquare, Eye } from 'iconsax-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = ['Produtos capilares', 'Cosméticos e maquiagem', 'Equipamentos profissionais', 'Cursos e treinamentos', 'Softwares e ferramentas', 'Seguros e benefícios', 'Financeiro e crédito', 'Outros'];
const BUSINESS_TYPES = [
  { id: 'barbershop', label: 'Barbearia' },
  { id: 'salon', label: 'Salão de Beleza' },
  { id: 'clinic', label: 'Clínica Estética' },
];
const STEPS = ['Parceiro', 'Anúncio', 'Segmentação', 'Período', 'Revisão'];

export default function NovoAnuncioPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    partnerName: '', category: '', website: '', contactEmail: '',
    title: '', badgeText: '', ctaText: 'Comprar agora', destinationUrl: '',
    description: '', fullDescription: '', price: '', originalPrice: '', discount: '', imageUrl: '',
    benefits: '',
    specKeys: ['', '', ''] as string[],
    specValues: ['', '', ''] as string[],
    businessTypes: ['barbershop', 'salon', 'clinic'] as string[],
    priority: 5, startDate: '', endDate: '', status: 'active',
  });

  const update = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));
  const toggleBusinessType = (type: string) =>
    update('businessTypes', form.businessTypes.includes(type)
      ? form.businessTypes.filter(x => x !== type)
      : [...form.businessTypes, type]);

  const handlePublish = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const benefits = form.benefits
        ? form.benefits.split('\n').map(b => b.trim()).filter(Boolean)
        : null;
      const specs: Record<string, string> = {};
      form.specKeys.forEach((k, i) => { if (k.trim() && form.specValues[i]?.trim()) specs[k.trim()] = form.specValues[i].trim(); });

      const { error } = await supabase.from('partner_ads').insert({
        partner_name: form.partnerName,
        product_name: form.title,
        description: form.description || null,
        full_description: form.fullDescription || null,
        price: form.price ? parseFloat(form.price) : 0,
        original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
        image_url: form.imageUrl || null,
        discount: form.discount ? parseInt(form.discount) : null,
        tag: form.badgeText || null,
        url: form.destinationUrl || form.website,
        business_types: form.businessTypes,
        status: form.status,
        priority: form.priority,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        category: form.category || null,
        benefits: benefits && benefits.length > 0 ? benefits : null,
        specs: Object.keys(specs).length > 0 ? specs : null,
      } as any);

      if (error) throw error;
      router.push('/admin/parceiros');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Anúncios & Parceiros', 'Criar Anúncio']} />
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => i < step && setStep(i)}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < step ? 'bg-[#6666cc] text-white' : i === step ? 'bg-[#6666cc] text-white ring-4 ring-[#6666cc]/20' : 'bg-gray-100 text-gray-400'}`}>
                    {i < step ? <TickSquare className="w-3.5 h-3.5"  variant="Outline" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-[#6666cc]' : i < step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${i < step ? 'bg-[#6666cc]' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            {step === 0 && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Informações do Parceiro</h2>
                <div className="space-y-4">
                  <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome da empresa *</label><Input value={form.partnerName} onChange={(e) => update('partnerName', e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="Ex: Mandallon" /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-2 block">Categoria *</label>
                    <div className="grid grid-cols-2 gap-2">{CATEGORIES.map((c) => <button key={c} onClick={() => update('category', c)} className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${form.category === c ? 'border-[#6666cc] bg-[#6666cc]/5 text-[#6666cc] font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{c}</button>)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Site</label><Input value={form.website} onChange={(e) => update('website', e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="https://..." /></div>
                    <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Email contato</label><Input type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} className="h-10 rounded-xl border-gray-200" /></div>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Criação do Anúncio</h2>
                <div className="space-y-4">
                  <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome do produto/oferta *</label><Input value={form.title} onChange={(e) => update('title', e.target.value.slice(0, 60))} className="h-10 rounded-xl border-gray-200" placeholder="Ex: Kit Profissional Premium" /><p className="text-xs text-gray-400 mt-1">{form.title.length}/60</p></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Descrição curta</label><Input value={form.description} onChange={(e) => update('description', e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="Ex: Linha completa para salões e barbearias" /></div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Descrição completa</label>
                    <textarea value={form.fullDescription} onChange={(e) => update('fullDescription', e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6666cc]/20 resize-none" placeholder="Descreva detalhadamente o produto..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Benefícios (um por linha)</label>
                    <textarea value={form.benefits} onChange={(e) => update('benefits', e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6666cc]/20 resize-none" placeholder={"Fixação forte e duradoura\nAcabamento matte natural\nFácil de remover com água"} />
                    <p className="text-xs text-gray-400 mt-1">Cada linha vira um item de benefício no app.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Especificações</label>
                    <div className="space-y-2">
                      {form.specKeys.map((k, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <Input value={k} onChange={(e) => { const keys = [...form.specKeys]; keys[i] = e.target.value; update('specKeys', keys); }} className="h-9 rounded-xl border-gray-200 text-sm" placeholder={`Chave (ex: Peso)`} />
                          <Input value={form.specValues[i] || ''} onChange={(e) => { const vals = [...form.specValues]; vals[i] = e.target.value; update('specValues', vals); }} className="h-9 rounded-xl border-gray-200 text-sm" placeholder={`Valor (ex: 120g)`} />
                        </div>
                      ))}
                      <button type="button" onClick={() => { update('specKeys', [...form.specKeys, '']); update('specValues', [...form.specValues, '']); }} className="text-xs text-[#6666cc] hover:underline">+ Adicionar especificação</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Preço (R$) *</label><Input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="199,90" /></div>
                    <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Preço original</label><Input type="number" value={form.originalPrice} onChange={(e) => update('originalPrice', e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="249,90" /></div>
                    <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Desconto (%)</label><Input type="number" value={form.discount} onChange={(e) => update('discount', e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="20" /></div>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">URL da imagem</label><Input value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="https://..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Badge (ex: Novo, 20% OFF)</label><Input value={form.badgeText} onChange={(e) => update('badgeText', e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="Parceiro oficial" /></div>
                    <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Texto do botão</label><Input value={form.ctaText} onChange={(e) => update('ctaText', e.target.value)} className="h-10 rounded-xl border-gray-200" /></div>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">URL de destino (link do parceiro) *</label><Input value={form.destinationUrl} onChange={(e) => update('destinationUrl', e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="https://..." /></div>
                  {form.title && form.imageUrl && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5"><Eye className="w-4 h-4"  variant="Outline" /> Preview</p>
                      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                        <img src={form.imageUrl} alt="preview" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div className="p-4">
                          {form.badgeText && <span className="inline-block bg-[#6666cc] text-white text-xs font-bold px-2.5 py-1 rounded-full mb-2">{form.badgeText}</span>}
                          <p className="font-bold text-gray-900">{form.title}</p>
                          {form.description && <p className="text-xs text-gray-400 mt-0.5">{form.description}</p>}
                          {form.price && <p className="text-lg font-bold text-[#5ab0b6] mt-1">R$ {parseFloat(form.price).toFixed(2).replace('.', ',')}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Segmentação</h2>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Tipos de negócio</label>
                    <div className="flex gap-2">
                      {BUSINESS_TYPES.map((t) => (
                        <button key={t.id} onClick={() => toggleBusinessType(t.id)} className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${form.businessTypes.includes(t.id) ? 'bg-[#6666cc] text-white border-[#6666cc]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Período e Prioridade</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Data de início</label><Input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className="h-10 rounded-xl border-gray-200" /></div>
                    <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Data de término</label><Input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} className="h-10 rounded-xl border-gray-200" /></div>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Prioridade (1–10)</label>
                    <div className="flex items-center gap-4"><input type="range" min={1} max={10} value={form.priority} onChange={(e) => update('priority', +e.target.value)} className="flex-1 accent-[#6666cc]" /><span className="w-8 text-center text-lg font-bold text-[#6666cc]">{form.priority}</span></div>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700 mb-2 block">Status inicial</label>
                    <div className="flex gap-2">
                      {[{ id: 'active', label: 'Publicar agora' }, { id: 'scheduled', label: 'Agendado' }, { id: 'draft', label: 'Rascunho' }].map((s) => (
                        <button key={s.id} onClick={() => update('status', s.id)} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.status === s.id ? 'bg-[#6666cc] text-white border-[#6666cc]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Revisão</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Parceiro', value: form.partnerName || '—' },
                    { label: 'Produto', value: form.title || '—' },
                    { label: 'Categoria', value: form.category || '—' },
                    { label: 'Preço', value: form.price ? `R$ ${parseFloat(form.price).toFixed(2).replace('.', ',')}` : '—' },
                    { label: 'Desconto', value: form.discount ? `${form.discount}%` : '—' },
                    { label: 'URL destino', value: form.destinationUrl || form.website || '—' },
                    { label: 'Tipos de negócio', value: form.businessTypes.join(', ') || 'Todos' },
                    { label: 'Prioridade', value: String(form.priority) },
                    { label: 'Status', value: form.status },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-medium text-gray-900 text-right max-w-xs truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="gap-2 rounded-xl border-gray-200 disabled:opacity-40"><ArrowLeft2 className="w-4 h-4"  variant="Outline" /> Anterior</Button>
              {step < STEPS.length - 1
                ? <Button onClick={() => setStep(s => s + 1)} className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white">Próximo <ArrowRight2 className="w-4 h-4"  variant="Outline" /></Button>
                : <Button onClick={handlePublish} disabled={saving} className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white px-6 disabled:opacity-60"><TickSquare className="w-4 h-4"  variant="Outline" /> {saving ? 'Salvando...' : 'Publicar'}</Button>
              }
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
