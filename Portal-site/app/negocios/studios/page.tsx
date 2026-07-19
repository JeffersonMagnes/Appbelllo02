'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { ArrowRight, Add, Minus, Calendar, DollarCircle, Profile2User, Box, Card } from 'iconsax-react';
import { Megaphone } from 'lucide-react';

const TABS = [
  { id: 'agenda', label: 'Grade de horários', Icon: Calendar, title: 'Monte sua grade de aulas com facilidade', subtitle: 'Turmas, instrutores e salas no mesmo lugar.', body: 'Crie sua grade semanal de aulas com diferentes modalidades, instrutores e salas. Controle o número de vagas e a lista de espera automaticamente.', image: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'mensalidades', label: 'Pacotes e mensalidades', Icon: Card, title: 'Organize pacotes e mensalidades', subtitle: 'Registre informações comerciais em um só lugar.', body: 'A integração de cobranças automáticas por gateway ainda está em implantação e não realiza pagamentos neste momento.', image: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'checkin', label: 'Check-in digital', Icon: Profile2User, title: 'Check-in dos alunos pelo celular', subtitle: 'Sem fila na recepção, sem papel.', body: 'Os alunos fazem o check-in pelo app antes de entrar na aula. Controle de frequência automático por turma e relatórios de presença por aluno.', image: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'financeiro', label: 'Financeiro', Icon: DollarCircle, title: 'Controle financeiro completo do seu studio', subtitle: 'Receitas, despesas e inadimplência em um só lugar.', body: 'Acompanhe a receita por modalidade, taxa de ocupação das turmas e inadimplência. Tome decisões com base em dados reais e aumente a rentabilidade.', image: 'https://images.pexels.com/photos/3943882/pexels-photo-3943882.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'marketing', label: 'Comunicação', Icon: Megaphone, title: 'Comunique-se com seus alunos automaticamente', subtitle: 'Lembretes de aula e promoções no automático.', body: 'Envie lembretes de aula, comunique cancelamentos e promoções por WhatsApp. Reduza faltas e mantenha seus alunos sempre informados.', image: 'https://images.pexels.com/photos/3738338/pexels-photo-3738338.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'estoque', label: 'Controle de produtos', Icon: Box, title: 'Gerencie os produtos do seu studio', subtitle: 'Controle o que entra e o que sai.', body: 'Para studios que vendem suplementos, roupas ou produtos, o controle de estoque integrado ao sistema financeiro deixa tudo organizado e sem perdas.', image: 'https://images.pexels.com/photos/3997993/pexels-photo-3997993.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

const BENEFITS = ['Atendimento por e-mail', 'Cadastro guiado', 'Sem cartão para criar a conta', 'Agenda online', 'Gestão de equipe', 'Atualizações da plataforma'];

const FAQS = [
  { q: 'O Appbello funciona para studios de qualquer modalidade?', a: 'Sim! Pilates, yoga, dança, nail art, musculação, crossfit — o sistema é flexível e se adapta a qualquer tipo de studio.' },
  { q: 'Como funciona o controle de vagas nas aulas?', a: 'Você define o número máximo de alunos por aula. Quando as vagas esgotam, os interessados entram automaticamente na lista de espera.' },
  { q: 'Posso ter múltiplas modalidades e instrutores no mesmo sistema?', a: 'Sim! Cadastre quantos instrutores e modalidades precisar. Cada um tem sua própria agenda e os alunos escolhem ao se inscrever.' },
  { q: 'Como funciona a cobrança de mensalidades?', a: 'O gateway de cobranças ainda está em implantação. O AppBello não processa Pix, cartão ou boleto automaticamente neste momento.' },
];

const STUDIO_TYPES = [
  { name: 'Pilates', img: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { name: 'Yoga', img: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { name: 'Nail Art', img: 'https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { name: 'Dança', img: 'https://images.pexels.com/photos/1701202/pexels-photo-1701202.jpeg?auto=compress&cs=tinysrgb&w=400' },
];

export default function StudiosPage() {
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
                Os recursos que o seu <span className="text-amber-500">studio</span> precisa?<br />Está tudo aqui
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
                Do pilates ao nail art, gerencie turmas, mensalidades e check-in dos seus alunos em um único sistema simples e poderoso.
              </p>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
                CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
              </Link>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative">
                <div className="absolute -left-8 top-8 w-48 h-48 bg-amber-100 rounded-full -z-10" />
                <div className="absolute -right-4 bottom-8 w-32 h-32 bg-orange-200 rounded-full -z-10" />
                <div className="relative overflow-hidden shadow-2xl" style={{ borderRadius: '45% 55% 50% 50% / 50% 50% 60% 40%', width: '420px', height: '480px' }}>
                  <img src="https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=900" alt="Studio" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-16 -right-4 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
                  <div>Vanessa Corrêa</div>
                  <div className="font-normal opacity-80">Cliente Appbello</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Para todo tipo de studio</h2>
            <p className="text-gray-500 text-sm">De pilates a nail art, temos solução para o seu negócio.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STUDIO_TYPES.map((st) => (
              <div key={st.name} className="group rounded-2xl overflow-hidden relative" style={{ aspectRatio: '1' }}>
                <img src={st.img} alt={st.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3"><span className="text-white font-bold text-sm">{st.name}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-amber-100 rounded-full -z-10" />
              <img src="https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Studio sistema" className="rounded-3xl shadow-2xl w-full object-cover" style={{ aspectRatio: '4/3' }} />
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                <span className="text-amber-500">Controle seu studio</span> e dedique seu tempo ao que você ama fazer
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Com o Appbello, você automatiza cobranças, controla a frequência dos alunos e gerencia sua grade de aulas sem esforço. Chega de planilhas e cobranças manuais.
              </p>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
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
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-amber-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <TabIcon className="w-4 h-4 flex-shrink-0" />{tab.label}
                  </button>
                );
              })}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 flex flex-col justify-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <ActiveIcon className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">{active.title}</h3>
                  <p className="font-semibold text-gray-700 italic">{active.subtitle}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{active.body}</p>
                  <Link href="/cadastro" className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-sm">Saiba mais <ArrowRight className="w-3.5 h-3.5"  variant="Outline" /></Link>
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
                <span className="text-amber-500">Mais benefícios exclusivos</span> para você
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {BENEFITS.map(b => (
                  <div key={b} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 bg-white rounded-full" /></div>
                    <span className="text-sm text-gray-700 font-medium">{b}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
                CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
              </Link>
            </div>
            <div>
              <img src="https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Studio" className="rounded-3xl shadow-xl w-full object-cover" style={{ aspectRatio: '3/4' }} />
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
                  {openFaq === i ? <Minus className="w-5 h-5 text-amber-500 flex-shrink-0"  variant="Outline" /> : <Add className="w-5 h-5 text-gray-400 flex-shrink-0"  variant="Outline" />}
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
            <img src="https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=900" alt="CTA" className="w-full h-full object-cover" style={{ minHeight: '300px' }} />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="bg-amber-500 flex flex-col justify-center px-10 py-14 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">Você relaxa<br /><span className="font-normal">e seu negócio não para</span></h2>
            <p className="text-amber-100">Organize sua operação com mais agilidade.</p>
            <p className="text-white font-bold">Você tá esperando o quê?</p>
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-white text-amber-600 font-bold text-sm px-8 py-4 rounded-full hover:bg-amber-50 transition-colors w-fit">
              CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
