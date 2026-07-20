import Link from 'next/link';
import { TickSquare } from 'iconsax-react';

const plans = [
  {
    name: 'Teste gratuito',
    price: 'R$ 0',
    period: 'por 30 dias',
    description: 'Conheça o Appbello antes de escolher um plano',
    highlight: false,
    features: [
      'Sem cobrança durante o teste',
      'Agenda ilimitada',
      'Gestão de clientes',
      'Controle financeiro',
    ],
  },
  {
    name: 'Starter',
    price: 'R$ 49',
    period: '/mês',
    description: 'Para negócios em crescimento',
    highlight: true,
    badge: 'Mais popular',
    features: [
      'Agendamentos ilimitados',
      'Até 5 profissionais',
      'Controle financeiro completo',
      'Relatórios',
      'Controle de estoque',
      'Comissões automáticas',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Pro',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para salões em crescimento',
    highlight: false,
    features: [
      'Tudo do Starter',
      'Profissionais ilimitados',
      'Assistente IA',
      'Link de agendamento premium',
      'Suporte prioritário',
    ],
  },
];

export default function Pricing() {
  return (
    <section id="precos" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">Planos e preços</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Escolha o plano ideal para o seu negócio. Cancele quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl p-8 flex flex-col transition-all duration-300 ${
                plan.highlight
                  ? 'border-2 border-[#6666cc] shadow-xl shadow-[#6666cc]/10'
                  : 'border border-gray-100 hover:shadow-md'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 gradient-primary text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-500 mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 font-medium text-sm">{plan.period}</span>
                </div>
                <p className="text-gray-500 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.highlight ? 'bg-[#6666cc]' : 'bg-gray-100'
                    }`}>
                      <TickSquare className={`w-2.5 h-2.5 ${plan.highlight ? 'text-white' : 'text-gray-500'}`}  variant="Outline" />
                    </div>
                    <span className="text-gray-700 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/cadastro">
                <button
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    plan.highlight
                      ? 'gradient-primary text-white hover:opacity-90 shadow-md shadow-[#6666cc]/20'
                      : 'bg-gray-50 text-gray-800 border border-gray-200 hover:border-[#6666cc] hover:text-[#6666cc]'
                  }`}
                >
                  {plan.name === 'Teste gratuito' ? 'Começar teste gratuito' : `Conhecer ${plan.name}`}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
