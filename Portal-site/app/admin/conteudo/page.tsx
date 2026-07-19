'use client';

import { useState } from 'react';
import { Add, Edit2 as Edit, Trash, ArrowDown2, ArrowRight2, SearchNormal1, CloseCircle } from 'iconsax-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/admin/StatusBadge';

const initialFAQs = [
  { id: 'f1', question: 'Como faço para adicionar um colaborador?', answer: 'Acesse Configurações > Equipe e clique em "Adicionar colaborador". Preencha o nome e e-mail e defina o nível de acesso.', category: 'Equipe', status: 'published', updatedAt: '18/04/2026' },
  { id: 'f2', question: 'Como configurar a agenda online?', answer: 'Vá em Agenda > Configurações e ative o link público de agendamento. Personalize os horários disponíveis e serviços oferecidos.', category: 'Agenda', status: 'published', updatedAt: '17/04/2026' },
  { id: 'f3', question: 'Posso cancelar minha assinatura a qualquer momento?', answer: 'Sim. Acesse Configurações > Plano e selecione "Cancelar assinatura". O acesso permanece até o final do período já pago.', category: 'Planos', status: 'published', updatedAt: '15/04/2026' },
  { id: 'f4', question: 'Como emitir relatórios financeiros?', answer: 'Acesse o menu Financeiro e selecione o período desejado. Clique em "Exportar" para baixar em PDF ou CSV.', category: 'Financeiro', status: 'published', updatedAt: '12/04/2026' },
  { id: 'f5', question: 'O que acontece quando o trial termina?', answer: 'Após o período de trial você precisará escolher um plano para continuar usando o app. Seus dados ficam salvos por 30 dias.', category: 'Planos', status: 'draft', updatedAt: '10/04/2026' },
];

type FAQ = typeof initialFAQs[0];

const CATEGORIES = ['Todos', 'Agenda', 'Equipe', 'Planos', 'Financeiro', 'Configurações'];

export default function ConteudoPage() {
  const [faqs, setFaqs] = useState(initialFAQs);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editFaq, setEditFaq] = useState<FAQ | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('Agenda');

  const filtered = faqs.filter(f =>
    (category === 'Todos' || f.category === category) && f.question.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditFaq(null);
    setQuestion('');
    setAnswer('');
    setFaqCategory('Agenda');
    setShowModal(true);
  };

  const openEdit = (f: FAQ) => {
    setEditFaq(f);
    setQuestion(f.question);
    setAnswer(f.answer);
    setFaqCategory(f.category);
    setShowModal(true);
  };

  const handleSave = (status: 'published' | 'draft') => {
    if (!question.trim()) return;
    const today = new Date().toLocaleDateString('pt-BR');
    if (editFaq) {
      setFaqs(prev => prev.map(f => f.id === editFaq.id ? { ...f, question, answer, category: faqCategory, status, updatedAt: today } : f));
    } else {
      setFaqs(prev => [...prev, { id: `f${Date.now()}`, question, answer, category: faqCategory, status, updatedAt: today }]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    setFaqs(prev => prev.filter(f => f.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Conteúdo & FAQ']} />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Conteúdo & FAQ</h1><p className="text-sm text-gray-500 mt-0.5">Gerencie perguntas frequentes e conteúdo do app</p></div>
          <Button onClick={openCreate} className="gap-2 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white"><Add className="w-4 h-4"  variant="Outline" /> Nova pergunta</Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"><p className="text-3xl font-bold text-gray-900">{faqs.length}</p><p className="text-sm text-gray-500 mt-1">Total de FAQs</p></div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"><p className="text-3xl font-bold text-[#6666cc]">{faqs.filter(f => f.status === 'published').length}</p><p className="text-sm text-gray-500 mt-1">Publicadas</p></div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"><p className="text-3xl font-bold text-amber-500">{faqs.filter(f => f.status === 'draft').length}</p><p className="text-sm text-gray-500 mt-1">Rascunhos</p></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">{CATEGORIES.map(c => <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${category === c ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{c}</button>)}</div>
            <div className="relative ml-auto w-56"><SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"  variant="Outline" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 h-9 rounded-xl border-gray-200 text-sm" /></div>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map(f => (
              <div key={f.id} className="px-5 py-4 hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpandedFaq(expandedFaq === f.id ? null : f.id)} className="p-1 text-gray-400 hover:text-gray-600">{expandedFaq === f.id ? <ArrowDown2 className="w-4 h-4"  variant="Outline" /> : <ArrowRight2 className="w-4 h-4"  variant="Outline" />}</button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{f.question}</p>
                    <div className="flex items-center gap-2 mt-1"><span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{f.category}</span><span className="text-xs text-gray-400">Atualizado em {f.updatedAt}</span></div>
                  </div>
                  <StatusBadge status={f.status === 'published' ? 'ativo' : 'draft'} />
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(f)} title="Editar" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(f.id)} title="Excluir" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash className="w-4 h-4"  variant="Outline" /></button>
                  </div>
                </div>
                {expandedFaq === f.id && <div className="mt-3 ml-8 p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-600">{f.answer || 'Sem resposta ainda. Clique em editar para adicionar o conteúdo.'}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editFaq ? 'Editar Pergunta' : 'Nova Pergunta Frequente'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><CloseCircle className="w-5 h-5"  variant="Outline" /></button>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Pergunta</label><Input value={question} onChange={e => setQuestion(e.target.value)} className="h-10 rounded-xl border-gray-200" placeholder="Ex: Como faço para..." /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Resposta</label><textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4} className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6666cc]/20 resize-none" placeholder="Descreva a resposta..." /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-2 block">Categoria</label><div className="flex flex-wrap gap-2">{CATEGORIES.filter(c => c !== 'Todos').map(c => <button key={c} onClick={() => setFaqCategory(c)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${faqCategory === c ? 'bg-[#6666cc] text-white border-[#6666cc]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{c}</button>)}</div></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button variant="outline" onClick={() => handleSave('draft')} className="flex-1 rounded-xl border-gray-200">Salvar rascunho</Button>
              <Button onClick={() => handleSave('published')} className="flex-1 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white">Publicar</Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Excluir pergunta</h2>
            <p className="text-sm text-gray-500 mb-6">Tem certeza que deseja excluir esta FAQ? Esta ação não pode ser desfeita.</p>
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
