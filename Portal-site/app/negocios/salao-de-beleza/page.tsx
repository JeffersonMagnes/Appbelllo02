'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { ArrowRight, Add, Minus, Calendar, DollarCircle, Profile2User, Box, Card } from 'iconsax-react';
import { Megaphone } from 'lucide-react';

const TABS = [
  { id: 'agenda', label: 'Agenda online', Icon: Calendar, title: 'Controle de agenda online para salões de beleza', subtitle: 'Você não precisa mais se preocupar em encaixar horários.', body: 'Simplifique o agendamento de serviços com um programa para salão de beleza online e fácil de usar. Você disponibiliza seus horários, seus clientes marcam o atendimento e você ainda tem total controle do salão.', image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'financeiro', label: 'Otimização financeira', Icon: DollarCircle, title: 'Gestão financeira completa para o seu salão', subtitle: 'Saiba exatamente para onde vai cada centavo do seu negócio.', body: 'Acompanhe receitas, despesas, comissões e lucro em tempo real. Relatórios visuais que facilitam a tomada de decisão.', image: 'https://images.pexels.com/photos/3943882/pexels-photo-3943882.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'clientes', label: 'Gestão de clientes', Icon: Profile2User, title: 'Fidelize seus clientes com facilidade', subtitle: 'Tenha o histórico completo de cada cliente na palma da mão.', body: 'Veja o histórico de serviços, preferências e frequência de cada cliente. Crie programas de fidelidade e mantenha seus melhores clientes sempre voltando.', image: 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'estoque', label: 'Controle de estoque', Icon: Box, title: 'Nunca mais fique sem produto no momento errado', subtitle: 'Controle total dos seus produtos e insumos.', body: 'Gerencie entradas e saídas, receba alertas de estoque baixo e acompanhe o custo dos produtos utilizados em cada serviço.', image: 'https://images.pexels.com/photos/3997993/pexels-photo-3997993.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'marketing', label: 'Comunicação', Icon: Megaphone, title: 'Organize o relacionamento com clientes', subtitle: 'Histórico e informações reunidos para apoiar o atendimento.', body: 'Campanhas automáticas por WhatsApp e SMS ainda não estão disponíveis como serviço integrado.', image: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'pagamentos', label: 'Recebimentos', Icon: Card, title: 'Registre as formas de recebimento', subtitle: 'Pix, cartão e dinheiro informados no controle financeiro.', body: 'O sistema registra recebimentos; o processamento integrado por gateway ainda está em implantação.', image: 'https://images.pexels.com/photos/3764537/pexels-photo-3764537.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

const BENEFITS = ['Atendimento por e-mail', 'Cadastro guiado', 'Sem cartão para criar a conta', 'Agenda online', 'Gestão de clientes', 'Atualizações da plataforma'];

const FAQS = [
  { q: 'O Appbello é só para salões grandes ou também atende salões pequenos?', a: 'O Appbello atende salões de todos os tamanhos, desde profissionais autônomos até redes com múltiplas unidades.' },
  { q: 'Como funciona o agendamento online para os meus clientes?', a: 'Seus clientes recebem um link personalizado do seu salão, escolhem o serviço, o profissional e o horário. Tudo sem você precisar atender ligações.' },
  { q: 'Posso gerenciar mais de um profissional na mesma conta?', a: 'Sim! Você pode cadastrar toda sua equipe, com agendas independentes e controle de comissões automático.' },
  { q: 'O sistema funciona no celular?', a: 'Sim, o Appbello funciona perfeitamente no celular, tablet e computador. Você gerencia seu salão de qualquer lugar.' },
];

export default function SalaoBelezaPage() {
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
                Os recursos que o seu <span className="text-pink-500">salão de beleza</span> precisa?<br />Está tudo aqui
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
                Dê autonomia para os seus profissionais organizarem suas agendas e ganhe tempo para atrair mais clientes com controle fácil de agendamentos, gestão financeira completa e muito mais.
              </p>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
                CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
              </Link>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative">
                <div className="absolute -left-8 top-8 w-48 h-48 bg-pink-100 rounded-full -z-10" />
                <div className="absolute -right-4 bottom-8 w-32 h-32 bg-rose-200 rounded-full -z-10" />
                <div className="relative overflow-hidden shadow-2xl" style={{ borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%', width: '420px', height: '480px' }}>
                  <img src="https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=900" alt="Salão de beleza" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-16 -right-4 bg-pink-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
                  <div>Maria Souza</div>
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
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-pink-100 rounded-full -z-10" />
              <img src="https://images.pexels.com/photos/3997990/pexels-photo-3997990.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Sistema Appbello" className="rounded-3xl shadow-2xl w-full object-cover" style={{ aspectRatio: '4/3' }} />
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                <span className="text-pink-500">Controle a sua gestão de salão</span> e dê autonomia para os seus profissionais
              </h2>
              <p className="text-gray-600 leading-relaxed">
                A gente sabe que fazer o controle de salão de beleza é intenso, mas com o Appbello, você conta com um software para salão completo que otimiza tudo, do agendamento ao controle financeiro.
              </p>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
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
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-pink-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <TabIcon className="w-4 h-4 flex-shrink-0" />{tab.label}
                  </button>
                );
              })}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 flex flex-col justify-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center">
                    <ActiveIcon className="w-6 h-6 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">{active.title}</h3>
                  <p className="font-semibold text-gray-700 italic">{active.subtitle}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{active.body}</p>
                  <Link href="/cadastro" className="inline-flex items-center gap-1.5 text-pink-500 font-bold text-sm">Saiba mais <ArrowRight className="w-3.5 h-3.5"  variant="Outline" /></Link>
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
                <span className="text-pink-500">Mais benefícios exclusivos</span> para você
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {BENEFITS.map(b => (
                  <div key={b} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 bg-white rounded-full" /></div>
                    <span className="text-sm text-gray-700 font-medium">{b}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
                CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
              </Link>
            </div>
            <div>
              <img src="https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Profissional" className="rounded-3xl shadow-xl w-full object-cover" style={{ aspectRatio: '3/4' }} />
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
                  {openFaq === i ? <Minus className="w-5 h-5 text-pink-500 flex-shrink-0"  variant="Outline" /> : <Add className="w-5 h-5 text-gray-400 flex-shrink-0"  variant="Outline" />}
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
            <img src="https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=900" alt="CTA" className="w-full h-full object-cover" style={{ minHeight: '300px' }} />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="bg-pink-500 flex flex-col justify-center px-10 py-14 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">Você relaxa<br /><span className="font-normal">e seu negócio não para</span></h2>
            <p className="text-pink-100">Organize sua operação com mais agilidade.</p>
            <p className="text-white font-bold">Você tá esperando o quê?</p>
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-white text-pink-600 font-bold text-sm px-8 py-4 rounded-full hover:bg-pink-50 transition-colors w-fit">
              CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
