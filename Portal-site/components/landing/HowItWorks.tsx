import { UserAdd, Setting2, CalendarTick } from 'iconsax-react';

const steps = [
  {
    icon: UserAdd,
    num: '01',
    title: 'Crie sua conta gratuitamente',
    description: 'Crie sua conta sem informar cartão de crédito e configure os dados iniciais do estabelecimento.',
  },
  {
    icon: Setting2,
    num: '02',
    title: 'Configure seu estabelecimento',
    description: 'Adicione seus serviços, equipe, horários de funcionamento e personalize do seu jeito.',
  },
  {
    icon: CalendarTick,
    num: '03',
    title: 'Comece a agendar e gerenciar',
    description: 'Receba agendamentos online, gerencie clientes e acompanhe seu financeiro em tempo real.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">
            Como funciona
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Comece em minutos e transforme a gestão do seu negócio de beleza.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 relative">
          {/* Connector */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gray-100 z-0" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative text-center">
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-5 mx-auto">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-[#6666cc] font-bold text-xs uppercase tracking-widest mb-2">{step.num}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
