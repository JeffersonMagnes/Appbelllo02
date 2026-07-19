'use client';

import Link from 'next/link';
import { Shield, Lock, Eye, Data, Notification, Sms, DocumentText } from 'iconsax-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const highlights = [
  {
    icon: Shield,
    title: 'Dados protegidos',
    desc: 'Controles de acesso e proteção de dados aplicados à plataforma.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Lock,
    title: 'Acesso controlado',
    desc: 'Somente você e sua equipe autorizada acessam seus dados.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Eye,
    title: 'Sem venda de dados',
    desc: 'Nunca vendemos ou compartilhamos seus dados com terceiros para fins comerciais.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Data,
    title: 'Infraestrutura em nuvem',
    desc: 'Dados armazenados por provedores de infraestrutura contratados pelo AppBello.',
    color: 'bg-pink-50 text-pink-600',
  },
];

const sections = [
  {
    title: '1. Introdução',
    content: `Esta Política de Privacidade explica como o AppBello coleta, utiliza, armazena e protege dados pessoais, além dos direitos previstos na Lei nº 13.709/2018 (LGPD).`,
  },
  {
    title: '2. Dados Coletados',
    content: `Dados de Cadastro:\n• Nome completo\n• E-mail\n• Telefone\n• CPF (quando necessário)\n• Endereço\n\nDados de Uso:\n• Data e hora de acesso\n• Endereço IP\n• Dispositivo utilizado\n• Informações de navegação\n\nDados de Agendamento:\n• Histórico de agendamentos\n• Serviços contratados\n• Preferências de atendimento`,
  },
  {
    title: '3. Finalidade do Tratamento',
    content: `Os dados pessoais são tratados para as seguintes finalidades:\n\n• Criar e manter contas de usuários;\n• Realizar agendamentos;\n• Enviar notificações;\n• Melhorar a experiência do usuário;\n• Cumprir obrigações legais;\n• Prevenir fraudes.`,
  },
  {
    title: '4. Compartilhamento de Dados',
    content: `Os dados pessoais poderão ser compartilhados com:\n\n• Estabelecimentos cadastrados na plataforma;\n• Prestadores de serviços tecnológicos;\n• Autoridades competentes quando exigido por lei.\n\nO AppBello não vende dados pessoais.`,
  },
  {
    title: '5. Armazenamento e Segurança',
    content: `Adotamos medidas técnicas e administrativas para proteger os dados pessoais contra acessos não autorizados, perda, alteração ou divulgação indevida.`,
  },
  {
    title: '6. Direitos do Titular',
    content: `Nos termos da LGPD, o titular dos dados tem direito a:\n\n• Confirmação da existência de tratamento;\n• Acesso aos dados;\n• Correção de dados incorretos;\n• Exclusão dos dados;\n• Portabilidade dos dados;\n• Revogação do consentimento.`,
  },
  {
    title: '7. Cookies e Tecnologias Semelhantes',
    content: `O aplicativo poderá utilizar cookies e tecnologias similares para melhorar a experiência do usuário e coletar informações estatísticas.`,
  },
  {
    title: '8. Exclusão da Conta',
    content: `O usuário poderá solicitar a exclusão de sua conta através dos canais oficiais de atendimento. Dados necessários para cumprimento de obrigações legais poderão ser mantidos pelo período exigido pela legislação.`,
  },
  {
    title: '9. Contato do Encarregado de Dados (DPO)',
    content: `Para dúvidas, solicitações ou reclamações relacionadas ao tratamento de dados pessoais, entre em contato com o Encarregado de Dados:\n\nE-mail: privacidade@appbello.com.br`,
  },
  {
    title: '10. Alterações desta Política',
    content: `Esta Política poderá ser atualizada periodicamente para refletir melhorias no serviço ou alterações legais.`,
  },
];

export default function PrivacidadePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              Documentação Legal
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              POLÍTICA DE PRIVACIDADE – APPBELLO
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Saiba como coletamos, utilizamos e protegemos seus dados pessoais em conformidade com a LGPD.
            </p>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400">
              <span>Última atualização: 24 de junho de 2026</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
              <span>Versão 3.0</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${h.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">{h.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{h.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-6">
              <p className="text-sm font-semibold text-emerald-700 mb-3">Índice de seções</p>
              <div className="grid sm:grid-cols-2 gap-1">
                {sections.map((s) => (
                  <a
                    key={s.title}
                    href={`#${s.title.replace(/\s+/g, '-').toLowerCase()}`}
                    className="text-sm text-emerald-600 hover:text-emerald-800 hover:underline py-0.5 transition-colors"
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {sections.map((s) => (
                <div
                  key={s.title}
                  id={s.title.replace(/\s+/g, '-').toLowerCase()}
                  className="px-8 py-8"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h2>
                  <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{s.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <DocumentText className="w-4 h-4 text-emerald-600"  variant="Outline" />
                </div>
                <p className="font-bold text-gray-900 text-sm">Exercer meus direitos (LGPD)</p>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Para solicitar acesso, correção, portabilidade ou exclusão dos seus dados pessoais.
              </p>
              <a
                href="mailto:privacidade@appbello.com.br"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
              >
                <Sms className="w-4 h-4"  variant="Outline" />
                privacidade@appbello.com.br
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Notification className="w-4 h-4 text-blue-600"  variant="Outline" />
                </div>
                <p className="font-bold text-gray-900 text-sm">Falar com o DPO</p>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Nosso Encarregado de Proteção de Dados está disponível para esclarecer dúvidas.
              </p>
              <a
                href="mailto:privacidade@appbello.com.br"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
              >
                <Sms className="w-4 h-4"  variant="Outline" />
                privacidade@appbello.com.br
              </a>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 mb-1">Quer revisar os Termos de Uso?</p>
              <p className="text-xs text-gray-500">Conheça as regras e condições de uso da plataforma AppBello.</p>
            </div>
            <Link
              href="/termos"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700 font-semibold text-sm px-5 py-2.5 rounded-xl border border-gray-200">
              Ver Termos de Uso
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
