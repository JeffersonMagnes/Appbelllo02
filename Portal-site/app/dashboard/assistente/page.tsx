'use client';

import { useState, useRef, useEffect } from 'react';
import { FeatureGate } from '@/components/dashboard/FeatureGate';
import { MagicStar, Send2, ArrowLeft2, RotateLeft, User } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'Como fidelizar mais clientes?',
  'Dicas para aumentar o ticket médio',
  'Como organizar a agenda da equipe?',
  'Estratégias de marketing para salão',
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const sendMessage = async (text: string) => {
    const userText = text.trim();
    if (!userText || isStreaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' };

    const nextMessages = [...messages, userMsg, assistantMsg];
    setMessages(nextMessages);
    setInput('');
    setIsStreaming(true);

    try {
      const history = nextMessages
        .filter((m) => m.id !== assistantId)
        .map((m) => ({ role: m.role, content: m.content }));

      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok || !response.body) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const rawData = line.slice(5).trim();
            if (!rawData) continue;
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + parsed.text } : m
                  )
                );
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: 'Desculpe, ocorreu um erro. Tente novamente.' } : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <FeatureGate featureKey="assistente_ia">
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-gray-50 -m-4 sm:-m-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft2 className="w-5 h-5" variant="Outline" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <MagicStar className="w-5 h-5 text-brand-primary" variant="Outline" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Assistente IA</h1>
            <p className="text-xs text-gray-500">Especialista em Gestão de Salões</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={() => setMessages([])} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            title="Limpar conversa"
          >
            <RotateLeft className="w-5 h-5" variant="Outline" />
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center mb-6">
              <MagicStar className="w-8 h-8 text-brand-primary" variant="Outline" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Como posso ajudar?</h2>
            <p className="text-gray-500 mb-8">
              Sou a inteligência artificial do Appbello. Posso te ajudar a criar estratégias de marketing, textos para redes sociais ou dicas de gestão.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 w-full">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="p-4 rounded-xl bg-white border border-gray-200 text-left text-sm text-gray-700 hover:border-brand-primary hover:shadow-sm transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-brand-primary'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-gray-600" variant="Outline" /> : <MagicStar className="w-4 h-4 text-white" variant="Outline" />}
                </div>
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div 
                    className={`px-5 py-3.5 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-brand-primary text-white rounded-tr-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-500">Pensando...</span>
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                        {msg.role === 'assistant' && isStreaming && msg.content !== '' && (
                          <span className="inline-block w-1.5 h-4 ml-1 bg-brand-primary animate-pulse" />
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary/20 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="w-full max-h-32 min-h-[44px] bg-transparent resize-none py-2 text-sm sm:text-base focus:outline-none"
              rows={1}
            />
          </div>
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="w-12 h-12 rounded-2xl flex-shrink-0 gradient-primary text-white p-0"
          >
            <Send2 className="w-5 h-5" variant="Outline" />
          </Button>
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}
