'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Card, Notification, Setting2, DocumentText, ArrowDown2, Mobile, Receipt } from 'iconsax-react';
import { LayoutDashboard, Megaphone, BarChart2, UserCog, PanelLeftClose, PanelLeftOpen, LogOut, Users, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { label: 'Dashboard',           href: '/admin',                    icon: LayoutDashboard },
  { label: 'Usuários',            href: '/admin/usuarios',           icon: Users },
  { label: 'Assinaturas',         href: '/admin/assinaturas',        icon: Receipt },
  {
    label: 'Planos & Financeiro', icon: CreditCard, children: [
      { label: 'Planos',       href: '/admin/planos' },
      { label: 'Financeiro',   href: '/admin/planos/financeiro' },
      { label: 'Cupons',       href: '/admin/planos/cupons' },
    ],
  },
  {
    label: 'Anúncios & Parceiros', icon: Megaphone, children: [
      { label: 'Dashboard',    href: '/admin/parceiros' },
      { label: 'Criar anúncio',href: '/admin/parceiros/novo' },
      { label: 'Empresas',     href: '/admin/parceiros/empresas' },
      { label: 'Relatórios',   href: '/admin/parceiros/relatorios' },
    ],
  },

  {
    label: 'Notificações', icon: Notification, children: [
      { label: 'Push',         href: '/admin/notificacoes/push' },
      { label: 'E-mail',       href: '/admin/notificacoes/email' },
      { label: 'Mensagens',    href: '/admin/notificacoes/mensagens' },
    ],
  },
  { label: 'Analytics',           href: '/admin/analytics',          icon: BarChart2 },
  { label: 'Config. do App',      href: '/admin/configuracoes-app',  icon: Mobile },
  { label: 'Conteúdo & FAQ',      href: '/admin/conteudo',           icon: DocumentText },
  { label: 'Equipe',              href: '/admin/equipe',             icon: UserCog },
  { label: 'Configurações',       href: '/admin/configuracoes',      icon: Setting2 },
];

export default function AdminSidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['Planos & Financeiro']);

  const toggleGroup = (label: string) =>
    setOpenGroups(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <aside className={`flex flex-col bg-[#0F0E17] border-r border-white/[0.06] transition-all duration-300 ${collapsed ? 'w-[64px]' : 'w-[220px]'} shrink-0 min-h-screen`}>

      {/* Logo */}
      <div className="flex items-center justify-between border-b border-white/[0.06] h-16 px-3">
        <div className="relative" style={{ width: collapsed ? 36 : 140, height: 36 }}>
          <Image src="/Appbello-white.svg" alt="Appbello" fill className="object-contain object-left" />
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-white/25 hover:text-white/60 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="text-white/25 hover:text-white/60 transition-colors">
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-0.5">
        {NAV.map(item => {
          if (item.children) {
            const isOpen   = openGroups.includes(item.label);
            const anyActive = item.children.some(c => pathname.startsWith(c.href));
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <button
                  onClick={() => !collapsed && toggleGroup(item.label)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all
                    ${anyActive ? 'text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ArrowDown2 className={`w-3 h-3 transition-transform ${isOpen ? '' : '-rotate-90'}`}  variant="Outline" />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="ml-[26px] mt-0.5 space-y-0.5 border-l border-white/[0.08] pl-3">
                    {item.children.map(child => (
                      <Link key={child.href} href={child.href}
                        className={`block px-2 py-1.5 rounded-lg text-xs transition-all
                          ${isActive(child.href)
                            ? 'text-[#A89DF7] bg-[#7C6EFA]/15 font-semibold'
                            : 'text-white/70 hover:text-white hover:bg-white/[0.06]'}`}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon!;
          const active = isActive(item.href!);
          return (
            <Link key={item.href} href={item.href!} title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all
                ${active
                  ? 'bg-[#7C6EFA]/15 text-[#A89DF7] border border-[#7C6EFA]/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7C6EFA]" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/[0.06]">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
