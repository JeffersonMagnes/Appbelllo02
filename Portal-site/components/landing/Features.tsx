import Link from 'next/link';
import { ArrowRight, Calendar, DollarCircle, Message, TrendUp } from 'iconsax-react';

const solutions = [
  {
    icon: Calendar,
    label: 'Agenda e clientes',
    title: 'O essencial',
    items: [
      'Agenda online com link exclusivo',
      'Histórico completo de clientes',
      'Cadastro de serviços e preços',
      'Gestão de equipe e comissões',
      'App para Android e iOS',
    ],
  },
  {
    icon: DollarCircle,
    label: 'Controle financeiro',
    title: 'Simplifique finanças',
    items: [
      'Registro de fluxo de caixa',
      'Controle de despesas e receitas',
      'Relatórios detalhados',
      'Registro de formas de recebimento',
      'Fechamento de caixa diário',
    ],
  },
  {
    icon: Message,
    label: 'Engaje seus clientes',
    title: 'Comunicação',
    items: [
      'Histórico de clientes',
      'Informações para contato com clientes',
      'Avaliações pós-atendimento',
      'Aniversariantes do dia',
      'Mensagens de reativação',
    ],
  },
  {
    icon: TrendUp,
    label: 'Crescimento acelerado',
    title: 'Para expandir',
    items: [
      'Gestão de equipe',
      'Relatórios operacionais',
      'Ranking de profissionais',
      'Metas e indicadores de desempenho',
      'Acompanhamento de indicadores',
    ],
  },
];

export default function Features() {
  return (
    <section id="recursos" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">
            Benefícios e Soluções
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Tudo que você precisa para gerenciar, crescer e encantar seus clientes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {solutions.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="bg-white rounded-2xl p-6 flex flex-col border border-gray-100 hover:border-[#6666cc]/30 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 bg-[#6666cc]/8 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#6666cc]" />
                </div>
                <div className="text-xs font-semibold text-[#6666cc] uppercase tracking-wider mb-1">{s.label}</div>
                <h3 className="text-base font-bold text-gray-900 mb-4">{s.title}</h3>

                <ul className="space-y-2 flex-1 mb-5">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-[#6666cc] text-xs mt-1 leading-none">—</span>
                      <span className="text-gray-600 text-sm leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-1.5 text-[#6666cc] font-semibold text-sm hover:gap-2.5 transition-all">
                  Saiba mais <ArrowRight className="w-3.5 h-3.5"  variant="Outline" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
