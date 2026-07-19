'use client';

import { useState } from 'react';
import { Message, Send2, SearchNormal1, ArrowRight2 } from 'iconsax-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const mockConversations = [
  { id: 'c1', user: 'Ana Lima', establishment: 'Salão da Ana', lastMessage: 'Não consigo acessar o relatório financeiro.', time: '10:42', unread: 2, avatar: 'AL', userId: 'u1' },
  { id: 'c2', user: 'Carlos Mendes', establishment: 'Barbearia Mendes', lastMessage: 'Ok, obrigado pelo suporte!', time: '09:18', unread: 0, avatar: 'CM', userId: 'u2' },
  { id: 'c3', user: 'Fernanda Torres', establishment: 'Studio FT Beauty', lastMessage: 'Como adiciono um colaborador?', time: 'Ontem', unread: 1, avatar: 'FT', userId: 'u3' },
  { id: 'c4', user: 'João Silva', establishment: 'Clínica JS', lastMessage: 'Preciso cancelar minha assinatura.', time: 'Ontem', unread: 0, avatar: 'JS', userId: 'u4' },
];

const initialMessages: Record<string, Array<{ id: string; text: string; from: 'user' | 'admin'; time: string }>> = {
  c1: [
    { id: 'm1', text: 'Olá! Não consigo acessar o relatório financeiro.', from: 'user', time: '10:40' },
    { id: 'm2', text: 'Oi Ana! Pode me informar qual erro aparece?', from: 'admin', time: '10:41' },
    { id: 'm3', text: 'Aparece "Sem permissão de acesso".', from: 'user', time: '10:42' },
  ],
  c2: [
    { id: 'm1', text: 'Boa tarde! Dúvida sobre a agenda online.', from: 'user', time: '09:00' },
    { id: 'm2', text: 'Olá Carlos! Pode descrever o problema?', from: 'admin', time: '09:05' },
    { id: 'm3', text: 'Ok, obrigado pelo suporte!', from: 'user', time: '09:18' },
  ],
  c3: [
    { id: 'm1', text: 'Como adiciono um colaborador?', from: 'user', time: 'Ontem' },
  ],
  c4: [
    { id: 'm1', text: 'Preciso cancelar minha assinatura.', from: 'user', time: 'Ontem' },
  ],
};

export default function MensagensPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('c1');
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState(initialMessages);

  const conv = mockConversations.find(c => c.id === selected);
  const currentMessages = messages[selected] || [];
  const filtered = mockConversations.filter(c =>
    c.user.toLowerCase().includes(search.toLowerCase()) || c.establishment.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (!reply.trim()) return;
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => ({
      ...prev,
      [selected]: [...(prev[selected] || []), { id: `m${Date.now()}`, text: reply.trim(), from: 'admin', time: now }],
    }));
    setReply('');
  };

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Notificações', 'Mensagens']} />
      <main className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="w-80 border-r border-gray-100 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative"><SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"  variant="Outline" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversa..." className="pl-9 h-9 rounded-xl border-gray-200 text-sm" /></div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected === c.id ? 'bg-[#6666cc]/5 border-l-2 border-l-[#6666cc]' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#6666cc]/15 text-[#6666cc] text-xs font-bold flex items-center justify-center shrink-0">{c.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5"><p className="text-sm font-semibold text-gray-900 truncate">{c.user}</p><span className="text-[10px] text-gray-400 shrink-0 ml-2">{c.time}</span></div>
                    <p className="text-xs text-gray-400 truncate">{c.establishment}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage}</p>
                  </div>
                  {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-[#6666cc] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{c.unread}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-[#F8F9FC]">
          {conv ? (
            <>
              <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#6666cc]/15 text-[#6666cc] text-xs font-bold flex items-center justify-center">{conv.avatar}</div>
                  <div><p className="text-sm font-bold text-gray-900">{conv.user}</p><p className="text-xs text-gray-400">{conv.establishment}</p></div>
                </div>
                <button onClick={() => router.push(`/admin/usuarios`)} className="text-xs text-[#6666cc] font-medium flex items-center gap-1 hover:underline">Ver perfil <ArrowRight2 className="w-3.5 h-3.5"  variant="Outline" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {currentMessages.map(m => (
                  <div key={m.id} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${m.from === 'admin' ? 'bg-[#6666cc] text-white rounded-br-sm' : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'}`}>
                      <p>{m.text}</p>
                      <p className={`text-[10px] mt-1 ${m.from === 'admin' ? 'text-white/60' : 'text-gray-400'}`}>{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white border-t border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <Message className="w-4 h-4 text-gray-400 shrink-0"  variant="Outline" />
                  <Input value={reply} onChange={e => setReply(e.target.value)} placeholder="Digite sua resposta..." className="flex-1 h-10 rounded-xl border-gray-200 text-sm" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                  <Button onClick={handleSend} className="h-10 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white px-4"><Send2 className="w-4 h-4"  variant="Outline" /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400"><div className="text-center"><Message className="w-10 h-10 mx-auto mb-3 opacity-30"  variant="Outline" /><p className="text-sm">Selecione uma conversa</p></div></div>
          )}
        </div>
      </main>
    </>
  );
}
