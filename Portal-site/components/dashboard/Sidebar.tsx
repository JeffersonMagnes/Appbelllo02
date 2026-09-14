'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, Profile2User, Scissor, UserTick, DollarCircle, Box, Setting2, ArrowLeft2, ArrowRight2, MagicStar, Crown, Gift, Note, Wallet, Chart, Link2, ClipboardText, Printer, ShoppingBag, ProfileCircle } from 'iconsax-react';
import { LayoutDashboard, LogOut, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/link-agendamento', label: 'Link & Perfil', icon: ProfileCircle },
  { href: '/dashboard/agenda', label: 'Agenda', icon: Calendar },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Profile2User },
  { href: '/dashboard/anamnese', label: 'Anamnese', icon: ClipboardText },
  { href: '/dashboard/comandas', label: 'Comandas', icon: Note },
  { href: '/dashboard/caixa', label: 'Caixa', icon: Wallet },
  { href: '/dashboard/servicos', label: 'Serviços', icon: Scissor },
  { href: '/dashboard/equipe', label: 'Equipe', icon: UserTick },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: DollarCircle },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: Chart },
  { href: '/dashboard/produtos', label: 'Estoque', icon: Box },
  { href: '/dashboard/assinatura', label: 'Planos', icon: Crown },
  { href: '/dashboard/indique', label: 'Indique e Ganhe', icon: Gift },
  { href: '/dashboard/pedidos', label: 'Catálogo Online', icon: ShoppingBag },
  { href: '/dashboard/impressao', label: 'Impressão', icon: Printer },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Setting2 },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (val: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed = false, onCollapse, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const sidebarContent = (mobile: boolean) => (
    <>
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-gray-100 flex-shrink-0 px-3',
        mobile ? 'justify-between h-[72px]' : (collapsed ? 'flex-col justify-center gap-1.5 h-16' : 'justify-between h-[72px]')
      )}>
        <Link href="/dashboard" className={cn(!mobile && collapsed && 'mx-auto')} onClick={mobile ? onMobileClose : undefined}>
          {!mobile && collapsed ? (
            <Image src="/logo.png" alt="AppBello" width={36} height={15} className="object-contain" />
          ) : (
            <Image src="/logo.png" alt="AppBello" width={130} height={53} className="object-contain" />
          )}
        </Link>
        {mobile ? (
          <button
            onClick={onMobileClose}
            aria-label="Fechar menu"
            className="p-2.5 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={() => onCollapse?.(!collapsed)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            {collapsed ? <ArrowRight2 className="w-4 h-4" variant="Outline" /> : <ArrowLeft2 className="w-4 h-4" variant="Outline" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Navegação principal" className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              onClick={mobile ? onMobileClose : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 group',
                active
                  ? 'bg-[#eeeef9] text-[#4d4d9c] font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={!mobile && collapsed ? item.label : undefined}>
              <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-[#5959b5]' : 'text-gray-500 group-hover:text-gray-700')} variant="Outline" />
              {(mobile || !collapsed) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full group"
          title={!mobile && collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(mobile || !collapsed) && <span>Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-white border-r border-gray-100 h-[100dvh] sticky top-0 shrink-0 transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebarContent(false)}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={(open) => { if (!open) onMobileClose?.(); }}>
        <SheetContent side="left" className="w-72 max-w-[calc(100vw-3rem)] p-0 flex flex-col [&>button]:hidden">
          <SheetTitle className="sr-only">Menu principal</SheetTitle>
          <SheetDescription className="sr-only">Navegue pelas áreas do AppBello.</SheetDescription>
          {sidebarContent(true)}
        </SheetContent>
      </Sheet>
    </>
  );
}
