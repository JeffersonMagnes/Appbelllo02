'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmployeeSession = {
  employeeId: string;
  employeeName: string;
  establishmentId: string;
  establishmentName: string;
  role: string;
  permissions: Record<string, boolean>;
  avatarUrl?: string;
};

const allNavItems = [
  { href: '/employee-dashboard', label: 'Minha Agenda', icon: Calendar, exact: true, permission: 'viewAgenda' },
  { href: '/employee-dashboard/clientes', label: 'Clientes', icon: Users, permission: 'viewClients' },
];

export default function EmployeeDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<EmployeeSession | null>(null);

  useEffect(() => {
    fetch('/api/employee/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Unauthorized');
        setSession(await response.json());
      })
      .catch(() => router.push('/employee-login'));
  }, [router]);

  if (!session) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#5333ED] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const navItems = allNavItems.filter(item => {
    if (session.role === 'admin') return true;
    return session.permissions[item.permission] !== false;
  });

  const handleLogout = async () => {
    await fetch('/api/employee/session', { method: 'DELETE', credentials: 'same-origin' });
    router.push('/employee-login');
  };

  const isActive = (item: typeof allNavItems[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const initials = session.employeeName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');

  return (
    <div className="flex h-screen bg-gray-50 font-outfit overflow-hidden">
      <aside className="hidden md:flex flex-col bg-white border-r border-gray-100 h-screen sticky top-0 w-60">
        <div className="flex items-center justify-between h-[72px] px-4 border-b border-gray-100">
          <Link href="/employee-dashboard">
            <Image src="/logo.png" alt="AppBello" width={130} height={53} className="object-contain" />
          </Link>
        </div>

        <div className="px-3 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5333ED] to-[#0BBDB6] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{session.employeeName}</p>
              <p className="text-xs text-gray-400 truncate">{session.establishmentName}</p>
            </div>
          </div>
          <div className="mt-2 px-2 py-1 rounded-lg bg-purple-50 text-center">
            <span className="text-xs font-semibold text-[#5333ED] capitalize">{session.role}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.map(item => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-[#5333ED] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full h-10 px-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}
