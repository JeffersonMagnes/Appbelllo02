import Link from 'next/link';
import Image from 'next/image';

const columns = [
  { title: 'Produto', links: [['Funcionalidades', '/#recursos'], ['Conheça as telas', '/#produto'], ['Planos e preços', '/#precos'], ['Entrar na minha conta', '/login']] },
  { title: 'Seu negócio', links: [['Salão de beleza', '/negocios/salao-de-beleza'], ['Barbearia', '/negocios/barbearia'], ['Clínica de estética', '/negocios/clinica-de-estetica'], ['Studios', '/negocios/studios']] },
  { title: 'Vamos ajudar', links: [['Dúvidas frequentes', '/#duvidas'], ['Fale com o suporte', 'mailto:suporte@appbello.com.br'], ['Privacidade', '/privacidade'], ['Termos de uso', '/termos']] },
];
export default function Footer() {
  return <footer id="sobre" className="border-t border-gray-200 bg-[#fafafd]">
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" aria-label="AppBello — início">
            <Image src="/logo.png" alt="AppBello" width={144} height={59} className="h-auto w-36" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">Tecnologia para cuidar da gestão de quem cuida da beleza. Agenda, clientes e operação em um só lugar.</p>
          <p className="mt-5 text-xs text-gray-500">No computador, tablet e celular.</p>
        </div>{columns.map(column =>
          <div key={column.title}>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">{column.title}</h3>
            <ul className="space-y-3">{column.links.map(([label, href]) =>
              <li key={href}>
                <Link href={href} className="inline-block py-1 text-sm text-gray-600 transition-colors hover:text-[#5959b5]">{label}</Link>
              </li>)}</ul>
          </div>)}</div>
      <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 text-xs text-gray-500 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} AppBello. Todos os direitos reservados.</span>
        <span>Zeruslab · Feito no Brasil</span>
      </div>
    </div>
  </footer>;
}
