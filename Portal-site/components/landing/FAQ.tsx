import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const questions = [
  ['O que posso organizar com o AppBello?', 'Agenda, clientes, serviços, profissionais, comandas, financeiro e estoque. Você também encontra relatórios e um link público para receber solicitações de agendamento. Os recursos disponíveis variam conforme o plano.'],
  ['Meus clientes podem agendar online?', 'Sim. Compartilhe o link de agendamento do estabelecimento para que seus clientes consultem os serviços e solicitem um horário. Você acompanha as solicitações na agenda.'],
  ['Posso usar pelo celular?', 'Sim. O portal se adapta ao celular, tablet e computador, para você consultar e organizar sua operação em diferentes tamanhos de tela.'],
  ['Como começo a configurar meu negócio?', 'Crie sua conta e siga o cadastro guiado. Informe os dados do estabelecimento, inclua seus serviços e profissionais e configure os horários de atendimento.'],
  ['Onde encontro ajuda?', 'Entre em contato pelo e-mail suporte@appbello.com.br para dúvidas sobre configuração e uso. Você também encontra informações sobre o uso dos seus dados na Política de Privacidade.'],
];
export default function FAQ() {
  return <section id="duvidas" className="bg-white py-16 sm:py-20">
    <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#5959b5]">Antes de começar</p>
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Dúvidas simples.<br />Respostas claras.</h2>
        <p className="mt-4 max-w-sm text-gray-600">Conheça o básico para trazer sua rotina para o AppBello.</p>
      </div>
      <Accordion type="single" collapsible>{questions.map(([question, answer], i) =>
        <AccordionItem key={question} value={`faq-${i}`}>
          <AccordionTrigger className="text-left text-base font-medium">{question}</AccordionTrigger>
          <AccordionContent className="leading-relaxed text-gray-600">{answer}</AccordionContent>
        </AccordionItem>)}</Accordion>
    </div>
  </section>;
}
