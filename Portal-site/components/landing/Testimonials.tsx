import { CalendarCheck, ClipboardList, ChartNoAxesCombined } from 'lucide-react';

const benefits = [
  { icon: CalendarCheck, title: 'Mais clareza para atender', text: 'Horários, profissionais e clientes reunidos em uma agenda que acompanha sua rotina.' },
  { icon: ClipboardList, title: 'Menos informação espalhada', text: 'Serviços, comandas e produtos organizados para consultar quando precisar.' },
  { icon: ChartNoAxesCombined, title: 'Mais contexto para decidir', text: 'Entradas, despesas e relatórios para entender o movimento do seu negócio.' },
];

export default function Testimonials() {
  return <section id="beneficios" className="border-y border-[#e8e8f1] bg-[#f5f5fb] py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="mb-10 max-w-xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#5959b5]">Na prática</p>
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Uma gestão que abre espaço para o seu talento.</h2>
      </div>
      <div className="grid gap-8 md:grid-cols-3">{benefits.map(({ icon: Icon, title, text }) =>
        <div key={title} className="border-l-2 border-[#d4d4eb] pl-5">
          <Icon size={22} className="mb-4 text-[#5959b5]" aria-hidden="true" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{text}</p>
        </div>)}</div>
    </div>
  </section>;
}
