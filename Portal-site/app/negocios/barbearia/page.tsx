'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { ArrowRight, Add, Minus, Calendar, DollarCircle, Profile2User, Box, Card } from 'iconsax-react';
import { Megaphone } from 'lucide-react';

const TABS = [
  { id: 'agenda', label: 'Agenda online', Icon: Calendar, title: 'Fila digital e agendamento para barbearias', subtitle: 'Chega de ligações e confusão na agenda.', body: 'Seus clientes entram na fila pelo celular ou agendam com antecedência. Você controla tudo em tempo real e ainda pode gerenciar a agenda de cada barbeiro de forma independente.', image: 'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'comissoes', label: 'Controle de comissões', Icon: DollarCircle, title: 'Comissões calculadas automaticamente', subtitle: 'Sem planilhas, sem erros, sem discussão.', body: 'Defina as regras de comissão de cada barbeiro e o sistema calcula tudo automaticamente. Relatórios detalhados por profissional e por período.', image: 'https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'clientes', label: 'Gestão de clientes', Icon: Profile2User, title: 'Conheça cada cliente pelo nome', subtitle: 'Histórico completo de cada visita.', body: 'Registre preferências de corte, produtos usados e frequência de cada cliente. Surpreenda com um atendimento personalizado que faz as pessoas voltarem sempre.', image: 'https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'estoque', label: 'Controle de estoque', Icon: Box, title: 'Nunca mais fique sem produto', subtitle: 'Alertas automáticos de estoque baixo.', body: 'Controle o consumo de produtos por serviço, receba alertas e saiba exatamente o que precisa repor. Integrado ao financeiro para controle de custos.', image: 'https://images.pexels.com/photos/3993444/pexels-photo-3993444.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'marketing', label: 'Comunicação', Icon: Megaphone, title: 'Organize o contato com seus clientes', subtitle: 'Use os dados cadastrados para acompanhar o relacionamento.', body: 'O envio automatizado de campanhas por WhatsApp ainda não faz parte do fluxo comercial disponível.', image: 'https://images.pexels.com/photos/3738338/pexels-photo-3738338.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'pagamentos', label: 'Recebimentos', Icon: Card, title: 'Registre as formas de recebimento', subtitle: 'Pix, cartão e dinheiro como informações do caixa.', body: 'O AppBello registra a forma informada pelo estabelecimento; não processa Pix ou cartão integrado neste momento.', image: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

const BENEFITS = ['Atendimento por e-mail', 'Cadastro guiado', 'Sem cartão para criar a conta', 'Agenda online', 'Gestão de equipe', 'Atualizações da plataforma'];

const FAQS = [
  { q: 'O sistema funciona para barbearias com vários barbeiros?', a: 'Sim! Você pode cadastrar toda sua equipe com agendas, metas e comissões independentes para cada profissional.' },
  { q: 'Como funciona o agendamento digital?', a: 'O cliente acessa o link da barbearia, escolhe serviço, profissional e horário e envia a solicitação de agendamento.' },
  { q: 'Consigo ver o ranking de desempenho dos barbeiros?', a: 'Sim! O painel mostra o desempenho de cada barbeiro com métricas de atendimentos, receita gerada e avaliações dos clientes.' },
  { q: 'É possível usar o sistema no celular?', a: 'Sim, o Appbello funciona perfeitamente em smartphones, tablets e computadores, de qualquer lugar.' },
];

export default function BarbeariaPage() {
  const [activeTab, setActiveTab] = useState('agenda');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const active = TABS.find(t => t.id === activeTab)!;
  const ActiveIcon = active.Icon;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-24 pb-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Os recursos que a sua <span className="text-blue-500">barbearia</span> precisa?<br />Está tudo aqui
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
                Organize sua agenda, gerencie sua equipe e venda mais com o sistema para barbearia que conta com: fila digital, controle de comissões automático, gestão financeira completa e muito mais.
              </p>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
                CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
              </Link>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative">
                <div className="absolute -left-8 top-8 w-48 h-48 bg-blue-100 rounded-full -z-10" />
                <div className="absolute -right-4 bottom-8 w-32 h-32 bg-cyan-200 rounded-full -z-10" />
                <div className="relative overflow-hidden shadow-2xl" style={{ borderRadius: '55% 45% 60% 40% / 45% 55% 45% 55%', width: '420px', height: '480px' }}>
                  <img src="https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=900" alt="Barbearia" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-16 -right-4 bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
                  <div>Pedro Alves</div>
                  <div className="font-normal opacity-80">Cliente Appbello</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-100 rounded-full -z-10" />
              <img src="https://images.pexels.com/photos/3998391/pexels-photo-3998391.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Barbearia sistema" className="rounded-3xl shadow-2xl w-full object-cover" style={{ aspectRatio: '4/3' }} />
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                <span className="text-blue-500">Controle sua barbearia</span> e dê autonomia para seus barbeiros
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Com o Appbello, você tem tudo para fazer sua barbearia crescer: fila digital, agendamento online, controle financeiro e ranking de desempenho da equipe. Chega de perder tempo com planilhas e ligações.
              </p>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
                CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 h-fit">
              {TABS.map((tab) => {
                const TabIcon = tab.Icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <TabIcon className="w-4 h-4 flex-shrink-0" />{tab.label}
                  </button>
                );
              })}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 flex flex-col justify-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <ActiveIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">{active.title}</h3>
                  <p className="font-semibold text-gray-700 italic">{active.subtitle}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{active.body}</p>
                  <Link href="/cadastro" className="inline-flex items-center gap-1.5 text-blue-500 font-bold text-sm">Saiba mais <ArrowRight className="w-3.5 h-3.5"  variant="Outline" /></Link>
                </div>
                <div className="relative overflow-hidden" style={{ minHeight: '300px' }}>
                  <img src={active.image} alt={active.title} className="w-full h-full object-cover absolute inset-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
                <span className="text-blue-500">Mais benefícios exclusivos</span> para você
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {BENEFITS.map(b => (
                  <div key={b} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 bg-white rounded-full" /></div>
                    <span className="text-sm text-gray-700 font-medium">{b}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
                CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
              </Link>
            </div>
            <div>
              <img src="https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Barbearia" className="rounded-3xl shadow-xl w-full object-cover" style={{ aspectRatio: '3/4' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">Tire todas as suas dúvidas</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                  {openFaq === i ? <Minus className="w-5 h-5 text-blue-500 flex-shrink-0"  variant="Outline" /> : <Add className="w-5 h-5 text-gray-400 flex-shrink-0"  variant="Outline" />}
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="grid lg:grid-cols-2 min-h-[300px]">
          <div className="relative">
            <img src="https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=900" alt="CTA" className="w-full h-full object-cover" style={{ minHeight: '300px' }} />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="bg-blue-500 flex flex-col justify-center px-10 py-14 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">Você relaxa<br /><span className="font-normal">e seu negócio não para</span></h2>
            <p className="text-blue-100">Organize sua operação com mais agilidade.</p>
            <p className="text-white font-bold">Você tá esperando o quê?</p>
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold text-sm px-8 py-4 rounded-full hover:bg-blue-50 transition-colors w-fit">
              CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
