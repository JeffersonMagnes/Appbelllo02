'use client';

import { Notification, SearchNormal1, ArrowRight2 } from 'iconsax-react';

interface AdminTopbarProps {
  breadcrumb: string[];
  actions?: React.ReactNode;
}

export default function AdminTopbar({ breadcrumb, actions }: AdminTopbarProps) {
  return (
    <header className="h-14 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center px-6 gap-4 shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 flex-1 min-w-0">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ArrowRight2 className="w-3 h-3 text-gray-300 shrink-0"  variant="Outline" />}
            <span className={`text-sm truncate ${i === breadcrumb.length - 1 ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Actions slot */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Search */}
      <div className="relative hidden md:block">
        <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"  variant="Outline" />
        <input
          placeholder="Buscar..."
          className="pl-8 pr-3 h-8 w-56 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6EFA]/20 focus:border-[#7C6EFA]/40 bg-gray-50 placeholder:text-gray-400 transition-all"
        />
      </div>

      {/* Bell */}
      <button className="relative p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
        <Notification className="w-4 h-4"  variant="Outline" />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
      </button>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C6EFA] to-[#5B4FD9] text-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm shadow-[#7C6EFA]/30">
        A
      </div>
    </header>
  );
}
