import { ArrowUpRight } from 'lucide-react';

const tips = [
  { number: '01', title: 'Prepare sua agenda', summary: 'Comece pelos serviços, profissionais e horários de atendimento.', detail: 'Cadastre a duração e o valor de cada serviço, organize sua equipe e confira a disponibilidade antes de compartilhar o link de agendamento.' },
  { number: '02', title: 'Conheça quem volta', summary: 'Use as informações dos clientes para dar continuidade ao atendimento.', detail: 'Mantenha os contatos atualizados e consulte as listas de retornos e aniversariantes. O histórico ajuda a preparar a próxima visita.' },
  { number: '03', title: 'Feche o dia com clareza', summary: 'Transforme o registro dos recebimentos em um hábito.', detail: 'Confira comandas, entradas e despesas. Revise as formas de recebimento e use os relatórios para acompanhar a evolução da operação.' },
];
export default function Blog() {
  return <section id="gestao" className="bg-[#fafafd] py-16">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Pequenos hábitos. Uma gestão melhor.</h2>
      <div className="grid gap-5 md:grid-cols-3">{tips.map(tip =>
        <article key={tip.number} className="rounded-xl border border-gray-200 bg-white p-6">
          <span className="text-xs font-semibold text-[#5959b5]">{tip.number}</span>
          <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900">{tip.title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{tip.summary}</p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-medium text-[#5959b5]">Como colocar em prática<ArrowUpRight size={14} className="ml-1 inline" aria-hidden="true" />
            </summary>
            <p className="mt-3 leading-relaxed text-gray-600">{tip.detail}</p>
          </details>
        </article>)}</div>
    </div>
  </section>;
}
