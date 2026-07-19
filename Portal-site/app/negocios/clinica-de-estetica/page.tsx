'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { ArrowRight, Add, Minus, Calendar, DollarCircle, Profile2User, DocumentText, Card } from 'iconsax-react';
import { Megaphone } from 'lucide-react';

const TABS = [
  { id: 'agenda', label: 'Agenda online', Icon: Calendar, title: 'Agenda inteligente para clínicas de estética', subtitle: 'Múltiplos profissionais, uma agenda só.', body: 'Gerencie as agendas de todos os seus profissionais sem conflitos. Seus pacientes agendam online e recebem confirmação automática. Controle total de salas e equipamentos.', image: 'https://images.pexels.com/photos/3997990/pexels-photo-3997990.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'prontuario', label: 'Prontuário digital', Icon: DocumentText, title: 'Organize o histórico de atendimento', subtitle: 'Informações do paciente reunidas em um só fluxo.', body: 'Registre procedimentos, alergias e observações com acesso vinculado aos usuários autorizados do estabelecimento.', image: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'financeiro', label: 'Otimização financeira', Icon: DollarCircle, title: 'Financeiro da clínica sob controle', subtitle: 'Saiba exatamente quanto cada procedimento gera.', body: 'Acompanhe receitas, custos por procedimento, ticket médio e taxa de retorno. Relatórios detalhados para tomada de decisão mais rápida e inteligente.', image: 'https://images.pexels.com/photos/3943882/pexels-photo-3943882.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'clientes', label: 'Gestão de pacientes', Icon: Profile2User, title: 'Fidelize seus pacientes com facilidade', subtitle: 'Acompanhe a evolução de cada tratamento.', body: 'Visualize o histórico completo, frequência de retorno e estágio de cada tratamento. Envie mensagens personalizadas de acompanhamento pós-procedimento.', image: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'marketing', label: 'Comunicação e marketing', Icon: Megaphone, title: 'Comunique-se com seus pacientes automaticamente', subtitle: 'Lembretes pré e pós-procedimento no automático.', body: 'Envie lembretes de preparo antes dos procedimentos, cuidados pós-tratamento e mensagens de reativação para pacientes que não retornam há algum tempo.', image: 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'pagamentos', label: 'Pagamentos', Icon: Card, title: 'Registre formas de recebimento', subtitle: 'Organize os recebimentos informados pela clínica.', body: 'O processamento integrado de Pix, cartão e parcelamento ainda está em implantação.', image: 'https://images.pexels.com/photos/3764537/pexels-photo-3764537.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

const BENEFITS = ['Atendimento por e-mail', 'Acesso controlado', 'Recursos para direitos do titular', 'Cadastro guiado', 'Gestão de atendimentos', 'Atualizações da plataforma'];

const FAQS = [
  { q: 'O Appbello é adequado para clínicas com múltiplos profissionais?', a: 'Sim! Você pode cadastrar todos os seus profissionais, cada um com agenda, especialidade e sala independentes.' },
  { q: 'Como o AppBello trata dados pessoais?', a: 'A plataforma aplica controles de acesso e disponibiliza uma Política de Privacidade. A clínica continua responsável por suas obrigações legais como agente de tratamento.' },
  { q: 'Posso registrar fotos antes e depois dos procedimentos?', a: 'Sim, o prontuário digital suporta upload de imagens e permite comparar a evolução do tratamento ao longo do tempo.' },
  { q: 'O sistema funciona para clínicas de qualquer especialidade estética?', a: 'Sim, o Appbello é flexível e se adapta a qualquer especialidade: estética facial, corporal, laser, depilação, entre outras.' },
];

export default function ClinicaEsteticaPage() {
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
                Os recursos que a sua <span className="text-emerald-500">clínica de estética</span> precisa?<br />Está tudo aqui
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
                Gerencie prontuários, agenda de múltiplos profissionais e finanças da sua clínica de estética em um único sistema. Organizado, seguro e fácil de usar.
              </p>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
                CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
              </Link>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative">
                <div className="absolute -left-8 top-8 w-48 h-48 bg-emerald-100 rounded-full -z-10" />
                <div className="absolute -right-4 bottom-8 w-32 h-32 bg-teal-200 rounded-full -z-10" />
                <div className="relative overflow-hidden shadow-2xl" style={{ borderRadius: '50% 50% 55% 45% / 55% 45% 55% 45%', width: '420px', height: '480px' }}>
                  <img src="https://images.pexels.com/photos/3997990/pexels-photo-3997990.jpeg?auto=compress&cs=tinysrgb&w=900" alt="Clínica de estética" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-16 -right-4 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
                  <div>Beatriz Lima</div>
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
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-100 rounded-full -z-10" />
              <img src="https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Sistema para clínica" className="rounded-3xl shadow-2xl w-full object-cover" style={{ aspectRatio: '4/3' }} />
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                <span className="text-emerald-500">Controle sua clínica</span> e ofereça uma experiência premium aos seus pacientes
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Com o Appbello, sua clínica tem prontuário digital, agenda inteligente e gestão financeira completa. Libere sua equipe das tarefas manuais e foque no que importa: resultados para os seus pacientes.
              </p>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
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
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <TabIcon className="w-4 h-4 flex-shrink-0" />{tab.label}
                  </button>
                );
              })}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 flex flex-col justify-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <ActiveIcon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">{active.title}</h3>
                  <p className="font-semibold text-gray-700 italic">{active.subtitle}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{active.body}</p>
                  <Link href="/cadastro" className="inline-flex items-center gap-1.5 text-emerald-500 font-bold text-sm">Saiba mais <ArrowRight className="w-3.5 h-3.5"  variant="Outline" /></Link>
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
                <span className="text-emerald-500">Mais benefícios exclusivos</span> para você
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {BENEFITS.map(b => (
                  <div key={b} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 bg-white rounded-full" /></div>
                    <span className="text-sm text-gray-700 font-medium">{b}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors">
                CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
              </Link>
            </div>
            <div>
              <img src="https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Clínica" className="rounded-3xl shadow-xl w-full object-cover" style={{ aspectRatio: '3/4' }} />
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
                  {openFaq === i ? <Minus className="w-5 h-5 text-emerald-500 flex-shrink-0"  variant="Outline" /> : <Add className="w-5 h-5 text-gray-400 flex-shrink-0"  variant="Outline" />}
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
            <img src="https://images.pexels.com/photos/3997990/pexels-photo-3997990.jpeg?auto=compress&cs=tinysrgb&w=900" alt="CTA" className="w-full h-full object-cover" style={{ minHeight: '300px' }} />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="bg-emerald-500 flex flex-col justify-center px-10 py-14 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">Você relaxa<br /><span className="font-normal">e seu negócio não para</span></h2>
            <p className="text-emerald-100">Organize sua operação com mais agilidade.</p>
            <p className="text-white font-bold">Você tá esperando o quê?</p>
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-white text-emerald-600 font-bold text-sm px-8 py-4 rounded-full hover:bg-emerald-50 transition-colors w-fit">
              CRIAR CONTA DE AVALIAÇÃO <ArrowRight className="w-4 h-4"  variant="Outline" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
