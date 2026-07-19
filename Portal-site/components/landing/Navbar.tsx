'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HambergerMenu, CloseCircle, ArrowDown2, MagicStar, Tree, Star1, Scissor } from 'iconsax-react';

const businessItems = [
  {
    title: 'Salão de Beleza',
    slug: '/negocios/salao-de-beleza',
    desc: 'Agendamento, equipe e fidelização',
    icon: Scissor,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    title: 'Barbearia',
    slug: '/negocios/barbearia',
    desc: 'Fila digital e controle de comissões',
    icon: Star1,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Clínica de Estética',
    slug: '/negocios/clinica-de-estetica',
    desc: 'Prontuário digital e relatórios',
    icon: Tree,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    title: 'Studios',
    slug: '/negocios/studios',
    desc: 'Turmas, mensalidades e check-in',
    icon: MagicStar,
    color: 'bg-amber-100 text-amber-600',
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileNegociosOpen, setMobileNegociosOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${scrolled ? 'shadow-sm border-b border-gray-100' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center group">
            <Image src="/logo.png" alt="Appbello" width={180} height={60} className="h-14 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {/* Negócios dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1 font-medium text-sm transition-colors ${dropdownOpen ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
              >
                Negócios
                <ArrowDown2 className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}  variant="Outline" />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                  <div className="px-3 pt-2 pb-1 mb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Tipos de negócio</p>
                  </div>
                  {businessItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.slug}
                        href={item.slug}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {[['Soluções', '#recursos'], ['Planos', '#precos'], ['A Appbello', '#sobre']].map(([label, href]) => (
              <a key={label} href={href} className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-gray-700 hover:text-blue-600 font-semibold text-sm transition-colors px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-400">
              Já sou cliente
            </Link>
            <Link href="/cadastro" className="gradient-primary text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm">
              Teste grátis
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-700" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <CloseCircle className="w-5 h-5"  variant="Outline" /> : <HambergerMenu className="w-5 h-5"  variant="Outline" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 flex flex-col gap-1">
            {/* Negócios expandable */}
            <button
              onClick={() => setMobileNegociosOpen(!mobileNegociosOpen)}
              className="flex items-center justify-between text-gray-700 font-medium py-2.5 text-sm"
            >
              Negócios
              <ArrowDown2 className={`w-4 h-4 transition-transform duration-200 ${mobileNegociosOpen ? 'rotate-180' : ''}`}  variant="Outline" />
            </button>
            {mobileNegociosOpen && (
              <div className="pl-2 mb-1 flex flex-col gap-1">
                {businessItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.slug}
                      href={item.slug}
                      onClick={() => { setOpen(false); setMobileNegociosOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {[['Soluções', '#recursos'], ['Planos', '#precos'], ['A Appbello', '#sobre']].map(([label, href]) => (
              <a key={label} href={href} className="text-gray-700 font-medium py-2.5 text-sm" onClick={() => setOpen(false)}>{label}</a>
            ))}

            <div className="pt-3 mt-1 border-t border-gray-100 flex flex-col gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className="text-center py-2.5 border border-gray-200 rounded-lg font-semibold text-gray-700 text-sm">Já sou cliente</Link>
              <Link href="/cadastro" onClick={() => setOpen(false)} className="text-center py-2.5 gradient-primary text-white rounded-lg font-bold text-sm">Teste grátis</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
