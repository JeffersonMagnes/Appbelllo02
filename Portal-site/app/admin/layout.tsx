import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { getAdminUser } from '@/lib/api-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAdminUser();
  if (!user) redirect('/admin-login');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}
