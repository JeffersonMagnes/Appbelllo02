'use client';

import { useState } from 'react';
import { Calendar, Profile2User, Clock, Book1 } from 'iconsax-react';
import { Headphones as HeadphonesIcon, Users, BookOpen } from 'lucide-react';

const tabs = [
  {
    id: 'vantagens',
    label: 'Vantagens',
    icon: Calendar,
    heading: 'Mais agendamentos, menos cancelamentos',
    description:
      'Com o Appbello, seus clientes podem solicitar agendamentos online a qualquer hora. Você acompanha e organiza os atendimentos na agenda do estabelecimento.',
    image: 'https://images.pexels.com/photos/3738338/pexels-photo-3738338.jpeg?auto=compress&cs=tinysrgb&w=800',
    points: [
      'Agendamento online disponível 24h',
      'Registro centralizado de agendamentos',
      'Acompanhamento do status do atendimento',
      'Histórico completo de atendimentos',
    ],
  },
  {
    id: 'comunidade',
    label: 'Comunidade',
    icon: Users,
    heading: 'Gestão compartilhada com sua equipe',
    description:
      'Cadastre profissionais, organize permissões e mantenha as informações essenciais do estabelecimento centralizadas.',
    image: 'https://images.pexels.com/photos/3993304/pexels-photo-3993304.jpeg?auto=compress&cs=tinysrgb&w=800',
    points: [
      'Cadastro de profissionais',
      'Permissões por integrante',
      'Agenda por profissional',
      'Dados centralizados',
    ],
  },
  {
    id: 'suporte',
    label: 'Suporte',
    icon: HeadphonesIcon,
    heading: 'Suporte humano quando você mais precisa',
    description:
      'Entre em contato pelo canal oficial de e-mail para dúvidas sobre cadastro, configuração e uso da plataforma.',
    image: 'https://images.pexels.com/photos/3771807/pexels-photo-3771807.jpeg?auto=compress&cs=tinysrgb&w=800',
    points: [
      'Atendimento por e-mail',
      'Orientações de configuração',
      'Ajuda sobre os fluxos do produto',
      'Canal oficial identificado',
    ],
  },
  {
    id: 'disponibilidade',
    label: 'Disponibilidade',
    icon: Clock,
    heading: 'Acesso pela web e pelo aplicativo',
    description:
      'A plataforma utiliza serviços de infraestrutura em nuvem. Indicadores formais de disponibilidade e recuperação serão publicados quando houver SLA contratado.',
    image: 'https://images.pexels.com/photos/3973330/pexels-photo-3973330.jpeg?auto=compress&cs=tinysrgb&w=800',
    points: [
      'Infraestrutura em nuvem',
      'Acesso Web e Mobile',
      'Monitoramento em evolução',
      'Política de disponibilidade transparente',
    ],
  },
  {
    id: 'treinamento',
    label: 'Treinamento',
    icon: BookOpen,
    heading: 'Configure o AppBello no seu ritmo',
    description:
      'O onboarding do produto orienta o cadastro das informações essenciais para iniciar a operação.',
    image: 'https://images.pexels.com/photos/3769747/pexels-photo-3769747.jpeg?auto=compress&cs=tinysrgb&w=800',
    points: [
      'Cadastro guiado',
      'Configuração do estabelecimento',
      'Inclusão de serviços e equipe',
      'Acompanhamento do progresso inicial',
    ],
  },
];

export default function BenefitsTabs() {
  const [active, setActive] = useState('vantagens');
  const tab = tabs.find((t) => t.id === active)!;
  const Icon = tab.icon;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[#6666cc] font-semibold text-sm uppercase tracking-widest mb-3">Por que escolher o Appbello</p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Outros{' '}
            <span className="gradient-text">benefícios</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Mais do que um sistema, uma parceria para o crescimento do seu negócio.
          </p>
        </div>

        {/* Tab nav */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((t) => {
            const TabIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all duration-200 ${
                  active === t.id
                    ? 'gradient-primary text-white shadow-lg shadow-[#6666cc]/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900 leading-tight">{tab.heading}</h3>
            <p className="text-gray-600 text-lg leading-relaxed">{tab.description}</p>
            <ul className="space-y-3">
              {tab.points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-[#6666cc]/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#6666cc]" />
                  </div>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl h-96 lg:h-[480px]">
            <img
              key={tab.id}
              src={tab.image}
              alt={tab.heading}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
