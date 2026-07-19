'use client';

import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const sections = [
  {
    title: '1. Aceitação dos Termos',
    content: `Ao acessar ou utilizar o aplicativo AppBello, o usuário declara ter lido, compreendido e concordado com estes Termos de Uso e com a Política de Privacidade.`,
  },
  {
    title: '2. Sobre o Aplicativo',
    content: `O AppBello é uma plataforma destinada ao gerenciamento de agendamentos, cadastro de clientes, serviços, profissionais, vendas e relacionamento entre estabelecimentos e seus clientes.`,
  },
  {
    title: '3. Cadastro',
    content: `Para utilizar determinadas funcionalidades, o usuário deverá fornecer informações verdadeiras, completas e atualizadas. O usuário é responsável pela guarda de suas credenciais de acesso.`,
  },
  {
    title: '4. Responsabilidades do Usuário',
    content: `O usuário compromete-se a:\n\n• Não utilizar o aplicativo para atividades ilegais;\n• Não tentar acessar informações de terceiros sem autorização;\n• Não utilizar o sistema para envio de spam ou conteúdo malicioso;\n• Manter seus dados cadastrais atualizados.`,
  },
  {
    title: '5. Planos e Assinaturas',
    content: `Algumas funcionalidades poderão estar disponíveis apenas mediante contratação de planos pagos. Os valores, funcionalidades e condições dos planos poderão ser alterados mediante aviso prévio.`,
  },
  {
    title: '6. Cancelamento',
    content: `O usuário poderá solicitar o cancelamento de sua conta a qualquer momento através dos canais de atendimento disponibilizados pelo AppBello.`,
  },
  {
    title: '7. Propriedade Intelectual',
    content: `Todo o conteúdo do aplicativo (Marca, Logotipo, Layout, Funcionalidades, Código-fonte, Materiais gráficos) são de propriedade exclusiva da AppBello e protegidos pela legislação aplicável.`,
  },
  {
    title: '8. Limitação de Responsabilidade',
    content: `O AppBello atua como plataforma tecnológica e não se responsabiliza por:\n\n• Serviços prestados pelos estabelecimentos;\n• Cancelamentos de agendamentos;\n• Problemas decorrentes da relação comercial entre clientes e estabelecimentos.`,
  },
  {
    title: '9. Alterações',
    content: `Estes Termos poderão ser alterados a qualquer momento, sendo a versão atualizada disponibilizada no aplicativo.`,
  },
  {
    title: '10. Foro',
    content: `Fica eleito o foro da Comarca de Mesquita, Estado do Rio de Janeiro, para dirimir quaisquer controvérsias relacionadas a estes Termos.`,
  },
];

export default function TermosPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              Documentação Legal
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              TERMOS DE USO – APPBELLO
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Leia atentamente os termos e condições que regem o uso da plataforma AppBello.
            </p>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400">
              <span>Última atualização: 24 de junho de 2026</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
              <span>Versão 3.0</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 px-8 py-6">
              <p className="text-sm font-semibold text-blue-700 mb-3">Índice de seções</p>
              <div className="grid sm:grid-cols-2 gap-1">
                {sections.map((s) => (
                  <a
                    key={s.title}
                    href={`#${s.title.replace(/\s+/g, '-').toLowerCase()}`}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline py-0.5 transition-colors"
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

          <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-1">Dúvidas sobre os Termos?</h3>
              <p className="text-sm text-gray-500">
                Entre em contato com nossa equipe jurídica pelo e-mail{' '}
                <a href="mailto:legal@appbello.com.br" className="text-blue-600 hover:underline font-medium">
                  legal@appbello.com.br
                </a>
              </p>
            </div>
            <Link
              href="/privacidade"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700 font-semibold text-sm px-5 py-2.5 rounded-xl border border-gray-200">
              Ver Política de Privacidade
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
