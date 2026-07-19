'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Notification, SearchNormal1, HambergerMenu } from 'iconsax-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { MobileMenuContext } from '@/app/dashboard/layout';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

const mockNotifications = [
  { id: '1', title: 'Novo agendamento', body: 'Carlos Silva agendou Corte Masculino para hoje às 14h', time: '5 min', unread: true, route: '/dashboard/agenda' },
  { id: '2', title: 'Estoque baixo', body: 'Shampoo Anti-Caspa está com apenas 2 unidades', time: '1h', unread: true, route: '/dashboard/produtos' },
  { id: '3', title: 'Pagamento recebido', body: 'Comanda de Ana Oliveira foi paga — R$ 85,00', time: '2h', unread: false, route: '/dashboard/financeiro' },
  { id: '4', title: 'Agendamento cancelado', body: 'Pedro Martins cancelou o agendamento de amanhã', time: '3h', unread: false, route: '/dashboard/agenda' },
];

export default function Header({ title, onMenuClick }: HeaderProps) {
  const mobileMenu = useContext(MobileMenuContext);
  const router = useRouter();
  const [initial, setInitial] = useState('?');
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = onMenuClick || mobileMenu.toggle;

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: est } = await supabase
        .from('establishments')
        .select('name')
        .eq('owner_id', user.id)
        .single() as { data: { name: string } | null };
      const name = est?.name || user.email || '';
      setInitial(name.charAt(0).toUpperCase());
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-40">
      <button
        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50"
        onClick={handleMenuClick}
      >
        <HambergerMenu className="w-5 h-5" variant="Outline" />
      </button>

      <h1 className="font-bold text-gray-900 text-lg hidden sm:block">{title}</h1>

      <div className="flex-1 max-w-md hidden lg:block">
        <div className="relative">
          <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" variant="Outline" />
          <Input
            placeholder="Buscar..."
            className="pl-9 h-9 bg-gray-50 border-gray-100 rounded-xl text-sm"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2" ref={dropdownRef}>
        {/* Notification bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-gray-500 hover:text-gray-700 relative"
            onClick={() => setOpen(prev => !prev)}
          >
            <Notification className="w-5 h-5" variant="Outline" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
            )}
          </Button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-bold text-gray-900 text-sm">Notificações</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${notif.unread ? 'bg-violet-50/40' : ''}`}
                    onClick={() => {
                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                      setOpen(false);
                      router.push(notif.route);
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Notification size={16} color="#7C6EFA" variant="Outline" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{notif.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.time} atrás</p>
                    </div>
                    {notif.unread && (
                      <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center text-white text-sm font-bold cursor-pointer select-none">
          {initial}
        </div>
      </div>
    </header>
  );
}
