'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Profile2User, Call, Sms } from 'iconsax-react';

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  notes: string | null;
};

export default function EmployeeClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/employee/clients', { credentials: 'same-origin', cache: 'no-store' });
      setClients(response.ok ? await response.json() : []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <h1 className="text-xl font-black text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500">Lista de clientes do estabelecimento</p>
      </div>

      <main className="flex-1 p-4 sm:p-6 max-w-3xl space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#5333ED] focus:ring-2 focus:ring-[#5333ED]/10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#5333ED]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Profile2User className="w-10 h-10 text-gray-300 mx-auto mb-2" variant="Outline" />
            <p className="text-sm text-gray-400">{search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {filtered.map(client => {
              const initials = client.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
              return (
                <div key={client.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5333ED]/20 to-[#0BBDB6]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#5333ED]">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{client.name}</p>
                    {client.email && <p className="text-xs text-gray-400 truncate">{client.email}</p>}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={`tel:${client.phone}`} className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                        <Call className="w-4 h-4" variant="Outline" />
                      </a>
                      <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors">
                        <Sms className="w-4 h-4" variant="Outline" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
