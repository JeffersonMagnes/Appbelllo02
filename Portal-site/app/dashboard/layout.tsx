'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import NotificationBanners from '@/components/dashboard/NotificationBanners';
import PWAInstallBanner from '@/components/dashboard/PWAInstallBanner';
import WebPushSetup from '@/components/dashboard/WebPushSetup';

export const MobileMenuContext = React.createContext<{ toggle: () => void }>({ toggle: () => {} });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MobileMenuContext.Provider value={{ toggle: () => setMobileOpen(prev => !prev) }}>
      <div className="flex h-screen bg-gray-50 font-outfit overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          onCollapse={setCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          <NotificationBanners />
          {children}
        </div>
        <PWAInstallBanner />
        <WebPushSetup />
      </div>
    </MobileMenuContext.Provider>
  );
}
