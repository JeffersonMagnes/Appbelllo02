import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Youtube, Messages3 } from 'iconsax-react';

const columns = [
  {
    heading: 'Institucional',
    links: ['Sobre o Appbello', 'Blog', 'Carreiras', 'Imprensa', 'Contato'],
  },
  {
    heading: 'Conheça',
    links: ['Salão de Beleza', 'Barbearia', 'Clínica Estética', 'Spa', 'Studio'],
  },
  {
    heading: 'Produto',
    links: ['Funcionalidades', 'Preços', 'Changelog', 'Integrações', 'Status'],
  },
  {
    heading: 'Suporte',
    links: ['Central de Ajuda', 'Tutoriais', 'Comunidade', 'Privacidade', 'Termos'],
  },
];

const socials = [
  { icon: Instagram, label: 'Instagram' },
  { icon: Facebook, label: 'Facebook' },
  { icon: Youtube, label: 'YouTube' },
  { icon: Messages3, label: 'Twitter' },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-6 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-5">
            <Link href="/">
              <Image src="/logo.png" alt="Appbello" width={180} height={60} className="h-16 w-auto" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              A plataforma completa de gestão para salões de beleza, barbearias e clínicas estéticas.
            </p>

            <div className="flex items-center gap-2">
              {socials.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-[#6666cc] hover:text-white transition-colors group"
                >
                  <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <a href="#" className="flex items-center gap-4 bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl px-5 py-3.5 w-fit shadow-md">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <div className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold leading-none mb-1">Baixe na</div>
                  <div className="text-white text-base font-bold leading-none">App Store</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-4 bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl px-5 py-3.5 w-fit shadow-md">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.65.19.96.08L14.76 12 3.06.16C2.77.05 2.43.07 2.13.24 1.53.58 1.17 1.23 1.17 2v19.48c0 .78.36 1.43.96 1.76l.05.52zM19.34 9.32l-2.61-1.51-3.48 3.49 3.48 3.48 2.64-1.52c.75-.44 1.2-1.17 1.2-1.96s-.45-1.53-1.23-1.98zM4.44 1.32L15.97 12 4.43 22.68C4.3 22.56 4.17 22.4 4.17 22V2c0-.38.12-.55.27-.68z" />
                </svg>
                <div className="text-left">
                  <div className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold leading-none mb-1">Disponível no</div>
                  <div className="text-white text-base font-bold leading-none">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <div className="text-gray-900 font-bold text-sm mb-5">{col.heading}</div>
              <ul className="space-y-3">
                {col.links.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-500 hover:text-[#6666cc] transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-6 text-sm text-gray-400 grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-center md:text-left">
          <span className="md:justify-self-start">© {new Date().getFullYear()} Appbello. Todos os direitos reservados.</span>
          <span className="md:justify-self-center font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">Zeruslab</span>
          <span className="flex items-center justify-center md:justify-self-end gap-1">Feito com <span className="text-[#6666cc]">♥</span> no Brasil</span>
        </div>
      </div>
    </footer>
  );
}
