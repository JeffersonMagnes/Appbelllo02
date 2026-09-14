'use client';

import Image from 'next/image';
import { CalendarDays, Users, Wallet, Package, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const views = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays, title: 'Cada horário no seu lugar.', description: 'Visualize o dia, a semana ou o mês. Consulte os atendimentos, filtre por profissional e acompanhe cada status sem perder o contexto.', points: ['Visões de dia, semana, mês e ano', 'Filtros por profissional', 'Solicitações do agendamento online'], image: '/product/agenda.webp' },
  { id: 'clientes', label: 'Clientes', icon: Users, title: 'Um atendimento começa antes da visita.', description: 'Reúna contatos e informações dos seus clientes. Encontre quem está voltando, os aniversariantes e quem faz tempo que não aparece.', points: ['Busca por nome, e-mail ou telefone', 'Histórico e informações centralizadas', 'Listas de retornos e aniversariantes'], image: '/product/clientes.webp' },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet, title: 'Entenda o movimento do seu negócio.', description: 'Acompanhe entradas, despesas e resultado por período. Consulte o histórico de transações e a distribuição por forma de recebimento.', points: ['Receitas, despesas e saldo em destaque', 'Histórico de transações', 'Comparação entre períodos'], image: '/product/financeiro.webp' },
  { id: 'produtos', label: 'Estoque', icon: Package, title: 'Seus produtos também fazem parte da gestão.', description: 'Consulte produtos, quantidades e valores em uma lista organizada. Tenha as informações necessárias para planejar suas reposições.', points: ['Cadastro de produtos', 'Quantidades e estoque mínimo', 'Preços e custos para consulta'], image: '/product/produtos.webp' },
];
export default function BenefitsTabs() {
  return <section id="produto" className="bg-white py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#5959b5]">Por dentro do AppBello</p>
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Menos ferramentas soltas.<br />Mais visão do todo.</h2>
        <p className="mt-4 leading-relaxed text-gray-600">Explore as telas que ajudam a organizar sua operação, do atendimento ao fechamento.</p>
      </div>
      <Tabs defaultValue="agenda">
        <TabsList className="mb-8 h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-[#f3f3f9] p-1 sm:w-auto">{views.map(({ id, label, icon: Icon }) =>
          <TabsTrigger key={id} value={id} className="gap-2 rounded-lg px-3 py-2.5 sm:px-5">
            <Icon size={16} aria-hidden="true" />{label}</TabsTrigger>)}</TabsList>{views.map(view =>
              <TabsContent key={view.id} value={view.id} className="ui-fade mt-0">
                <div className="grid items-center gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
                  <div>
                    <h3 className="text-2xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-3xl">{view.title}</h3>
                    <p className="mt-4 leading-relaxed text-gray-600">{view.description}</p>
                    <ul className="mt-6 space-y-3">{view.points.map(point =>
                      <li key={point} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check size={16} className="mt-0.5 shrink-0 text-[#287a78]" aria-hidden="true" />{point}</li>)}</ul>
                  </div>
                  <figure className="min-w-0">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#f7f8fb]">
                      <Image src={view.image} alt={`Tela de ${view.label.toLowerCase()} do AppBello com dados fictícios de demonstração`} width={1440} height={950} sizes="(max-width: 1023px) 100vw, 720px" className="h-auto w-full object-contain" />
                    </div>
                    <figcaption className="mt-3 text-xs text-gray-500">Tela do AppBello renderizada com dados fictícios para demonstração.</figcaption>
                  </figure>
                </div>
              </TabsContent>)}</Tabs>
    </div>
  </section>;
}
