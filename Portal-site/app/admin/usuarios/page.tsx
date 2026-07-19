'use client';

import { useEffect, useState } from 'react';
import { SearchNormal1, Sms, Eye, CloseCircle, Copy, Clock, Profile2User, Buildings2, Calendar, Refresh2, Lock as LockIcon } from 'iconsax-react';
import { Ban, ExternalLink } from 'lucide-react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/admin/StatusBadge';
import { createClient } from '@/lib/supabase/client';

// ── Tipos ─────────────────────────────────────────────────────────────────────
type AdminUser = {
  id: string;
  owner_id: string;
  establishment_name: string;
  slug: string | null;
  logo_url: string | null;
  business_type: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
  created_at: string;
  owner_name: string;
  owner_email: string;
  professionals_count: number;
  extra_trial_days: number;
  // derivados
  daysUsing: number;
  timeUsingLabel: string;
  plan: string;
  status: string;
  trialDaysLeft: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function timeLabel(days: number): string {
  if (days < 1) return 'Hoje';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}m ${days % 30}d`;
  return `${Math.floor(days / 365)}a ${Math.floor((days % 365) / 30)}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function businessTypeLabel(bt: string | null): string {
  const map: Record<string, string> = { salon: 'Salão', barbershop: 'Barbearia', clinic: 'Clínica', estetica: 'Estética', barbearia: 'Barbearia', clinica: 'Clínica' };
  return map[bt ?? ''] ?? 'Estabelecimento';
}

function deriveStatus(u: { active: boolean; created_at: string }): string {
  if (!u.active) return 'bloqueado';
  const days = daysAgo(u.created_at);
  if (days <= 30) return 'trial';
  return 'ativo';
}

const PLAN_BY_DAYS: (days: number) => string = (days) => {
  if (days <= 30) return 'trial';
  return 'pro';
};

const STATUS_FILTERS = ['Todos', 'Trial', 'Ativo', 'Bloqueado'];
const BT_FILTERS = ['Todos', 'Salão', 'Barbearia', 'Clínica'];

// ── Componente Avatar ──────────────────────────────────────────────────────────
function UserAvatar({ logo, name, size = 40 }: { logo: string | null; name: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        width={size}
        height={size}
        className="rounded-xl object-cover border border-gray-100"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div
      className="rounded-xl bg-gradient-to-br from-[#6666cc] to-[#4444aa] text-white font-bold flex items-center justify-center text-sm flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {initials || '?'}
    </div>
  );
}

// ── Componente Principal ───────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [btFilter, setBtFilter] = useState('Todos');
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [banId, setBanId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [extendUserId, setExtendUserId] = useState<string | null>(null);
  const [extendUserName, setExtendUserName] = useState('');
  const [extendCurrentExtra, setExtendCurrentExtra] = useState(0);
  const [extendDays, setExtendDays] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkExtend, setBulkExtend] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.rpc('get_admin_establishments');
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const rows = (data as any[]) ?? [];
    const mapped: AdminUser[] = rows.map((row: any) => {
      const days = daysAgo(row.created_at);
      const extraDays = row.extra_trial_days ?? 0;
      const status = deriveStatus({ active: row.active, created_at: row.created_at });
      const trialDaysLeft = Math.max(0, 30 + extraDays - days);
      return {
        ...row,
        extra_trial_days: extraDays,
        daysUsing: days,
        timeUsingLabel: timeLabel(days),
        plan: PLAN_BY_DAYS(days),
        status,
        trialDaysLeft,
      };
    });
    setUsers(mapped);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.owner_name.toLowerCase().includes(q) ||
      u.owner_email.toLowerCase().includes(q) ||
      u.establishment_name.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'Todos' || u.status === statusFilter.toLowerCase();
    const btLabel = businessTypeLabel(u.business_type);
    const matchBt = btFilter === 'Todos' || btLabel === btFilter;
    return matchSearch && matchStatus && matchBt;
  });

  const confirmBan = async () => {
    if (!banId) return;
    const target = users.find(u => u.id === banId);
    if (!target) return;
    const supabase = createClient();
    await (supabase.from('establishments') as any).update({ active: !target.active }).eq('id', banId);
    setUsers(prev => prev.map(u => u.id === banId ? { ...u, active: !u.active, status: !target.active ? deriveStatus({ ...u, active: true }) : 'bloqueado' } : u));
    setBanId(null);
  };

  const handleExtendTrial = async () => {
    const days = parseInt(extendDays);
    if (!days || days <= 0) return;
    setExtendLoading(true);
    try {
      const supabase = createClient();
      if (bulkExtend) {
        await (supabase as any).rpc('admin_bulk_extend_trial', {
          est_ids: Array.from(selectedUsers),
          extra_days: days,
        });
      } else if (extendUserId) {
        await (supabase as any).rpc('admin_extend_trial', {
          est_id: extendUserId,
          extra_days: days,
        });
      }
      setExtendUserId(null);
      setBulkExtend(false);
      setSelectedUsers(new Set());
      setExtendDays('');
      fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setExtendLoading(false);
    }
  };

  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [resetSending, setResetSending] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetPassword = async (email: string) => {
    setResetSending(true);
    setResetSuccess(false);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://appbello.com.br/nova-senha',
    });
    setResetSending(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  const banUser = users.find(u => u.id === banId);

  // Estatísticas do topo
  const totalUsers = users.length;
  const trialUsers = users.filter(u => u.status === 'trial').length;
  const activeUsers = users.filter(u => u.status === 'ativo').length;
  const totalProfessionals = users.reduce((s, u) => s + u.professionals_count, 0);

  return (
    <>
      <AdminTopbar breadcrumb={['Admin', 'Usuários']} />
      <main className="flex-1 p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Carregando...' : `${totalUsers} estabelecimentos cadastrados`}
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Refresh2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}  variant="Outline" />
            Atualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: totalUsers, icon: <Buildings2 className="w-4 h-4 text-[#6666cc]"  variant="Outline" />, bg: 'bg-[#6666cc]/8' },
            { label: 'Em Trial', value: trialUsers, icon: <Clock className="w-4 h-4 text-amber-500"  variant="Outline" />, bg: 'bg-amber-50' },
            { label: 'Ativos', value: activeUsers, icon: <Calendar className="w-4 h-4 text-green-500"  variant="Outline" />, bg: 'bg-green-50' },
            { label: 'Profissionais', value: totalProfessionals, icon: <Profile2User className="w-4 h-4 text-blue-500"  variant="Outline" />, bg: 'bg-blue-50' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>{k.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"  variant="Outline" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, e-mail ou estabelecimento..." className="pl-9 h-10 rounded-xl border-gray-200 text-sm" />
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === f ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{f}</button>
            ))}
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {BT_FILTERS.map(f => (
              <button key={f} onClick={() => setBtFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${btFilter === f ? 'bg-[#6666cc] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            <strong>Erro ao carregar dados:</strong> {error}
            <br />
            <span className="text-xs text-red-400 mt-1 block">Execute a função <code>get_admin_establishments()</code> no Supabase SQL Editor.</span>
          </div>
        )}

        {/* Barra de ações em massa */}
        {selectedUsers.size > 0 && (
          <div className="bg-[#6666cc]/5 border border-[#6666cc]/20 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6666cc]">
              {selectedUsers.size} selecionado{selectedUsers.size !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setBulkExtend(true); setExtendDays(''); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6666cc] text-white text-sm font-semibold hover:bg-[#5555aa] transition-colors"
              >
                <Clock className="w-4 h-4" variant="Outline" />
                Estender Trial
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Refresh2 className="w-5 h-5 animate-spin mr-2"  variant="Outline" /> Carregando dados reais...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Buildings2 className="w-10 h-10 mb-3 opacity-30"  variant="Outline" />
              <p className="text-sm font-medium">Nenhum usuário encontrado</p>
              <p className="text-xs mt-1">Tente ajustar os filtros ou verificar a conexão com o Supabase</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500">
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-[#6666cc] focus:ring-[#6666cc]"
                        checked={filtered.length > 0 && selectedUsers.size === filtered.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filtered.map(u => u.id)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="text-left px-5 py-3 font-semibold">Estabelecimento</th>
                    <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold">
                      <div className="flex items-center gap-1"><Profile2User className="w-3.5 h-3.5"  variant="Outline" /> Profissionais</div>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"  variant="Outline" /> Cadastro</div>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"  variant="Outline" /> Usando há</div>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-right px-5 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Checkbox */}
                      <td className="px-3 py-3.5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-[#6666cc] focus:ring-[#6666cc]"
                          checked={selectedUsers.has(u.id)}
                          onChange={e => {
                            const next = new Set(selectedUsers);
                            if (e.target.checked) next.add(u.id);
                            else next.delete(u.id);
                            setSelectedUsers(next);
                          }}
                        />
                      </td>
                      {/* Estabelecimento + dono */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar logo={u.logo_url} name={u.establishment_name} size={40} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{u.establishment_name}</p>
                            <p className="text-xs text-gray-500">{u.owner_name || '—'}</p>
                            <p className="text-xs text-gray-400">{u.owner_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Tipo de negócio */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                          {businessTypeLabel(u.business_type)}
                        </span>
                      </td>

                      {/* Profissionais */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-bold ${u.professionals_count === 0 ? 'text-gray-300' : 'text-gray-800'}`}>
                            {u.professionals_count}
                          </span>
                          {u.professionals_count > 0 && (
                            <div className="flex -space-x-1">
                              {Array.from({ length: Math.min(u.professionals_count, 3) }).map((_, i) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-[#6666cc]/20 border border-white flex items-center justify-center">
                                  <Profile2User className="w-2.5 h-2.5 text-[#6666cc]"  variant="Outline" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Data de cadastro */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-gray-700 font-medium">{formatDate(u.created_at)}</p>
                      </td>

                      {/* Tempo de uso */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${u.daysUsing < 7 ? 'bg-green-400' : u.daysUsing < 30 ? 'bg-amber-400' : 'bg-blue-400'}`} />
                          <span className="text-sm font-semibold text-gray-700">{u.timeUsingLabel}</span>
                        </div>
                      </td>

                      {/* Status + trial days */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={u.status} />
                          {u.status === 'trial' && (
                            <div>
                              <div className="h-1 bg-gray-100 rounded-full w-20 mb-0.5">
                                <div
                                  className={`h-full rounded-full ${u.trialDaysLeft <= 5 ? 'bg-red-400' : 'bg-[#6666cc]'}`}
                                  style={{ width: `${(u.trialDaysLeft / (30 + u.extra_trial_days)) * 100}%` }}
                                />
                              </div>
                              <span className={`text-xs font-semibold ${u.trialDaysLeft <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                                {u.trialDaysLeft}d restantes{u.extra_trial_days > 0 ? ` (+${u.extra_trial_days})` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewUser(u)} title="Ver detalhes" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Eye className="w-4 h-4"  variant="Outline" />
                          </button>
                          <a href={`mailto:${u.owner_email}`} title="Enviar e-mail" className="p-1.5 rounded-lg text-gray-400 hover:text-[#6666cc] hover:bg-[#6666cc]/10 transition-colors">
                            <Sms className="w-4 h-4"  variant="Outline" />
                          </a>
                          <button onClick={() => setBanId(u.id)} title={u.active ? 'Bloquear' : 'Desbloquear'} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Ban className="w-4 h-4" />
                          </button>
                          {u.status === 'trial' && (
                            <button
                              onClick={() => {
                                setExtendUserId(u.id);
                                setExtendUserName(u.establishment_name);
                                setExtendCurrentExtra(u.extra_trial_days);
                                setExtendDays('');
                              }}
                              title="Estender Trial"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                            >
                              <Clock className="w-4 h-4" variant="Outline" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Última atualização */}
        {!loading && (
          <p className="text-xs text-gray-400 text-right">
            Dados do Supabase · Atualizado às {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        )}
      </main>

      {/* Modal: Detalhes do usuário */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

            {/* Header do modal com logo */}
            <div className="bg-gradient-to-br from-[#6666cc] to-[#4444aa] rounded-t-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Detalhes do Usuário</span>
                <button onClick={() => setViewUser(null)} className="text-white/60 hover:text-white transition-colors"><CloseCircle className="w-5 h-5"  variant="Outline" /></button>
              </div>
              <div className="flex items-center gap-4">
                <UserAvatar logo={viewUser.logo_url} name={viewUser.establishment_name} size={64} />
                <div>
                  <h2 className="text-xl font-bold text-white">{viewUser.establishment_name}</h2>
                  <p className="text-white/70 text-sm mt-0.5">{viewUser.owner_name}</p>
                  <p className="text-white/50 text-xs">{viewUser.owner_email}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Grid de infos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Buildings2 className="w-3 h-3"  variant="Outline" /> Tipo</p>
                  <p className="text-sm font-semibold text-gray-900">{businessTypeLabel(viewUser.business_type)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"  variant="Outline" /> Cadastro</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(viewUser.created_at)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"  variant="Outline" /> Usando há</p>
                  <p className="text-sm font-semibold text-gray-900">{viewUser.timeUsingLabel}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Profile2User className="w-3 h-3"  variant="Outline" /> Profissionais</p>
                  <p className="text-sm font-semibold text-gray-900">{viewUser.professionals_count} cadastrado{viewUser.professionals_count !== 1 ? 's' : ''}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <StatusBadge status={viewUser.status} />
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Telefone</p>
                  <p className="text-sm font-semibold text-gray-900">{viewUser.phone || '—'}</p>
                </div>
              </div>

              {/* Endereço */}
              {viewUser.address && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Endereço</p>
                  <p className="text-sm font-medium text-gray-700">{viewUser.address}</p>
                </div>
              )}

              {/* Link de agendamento */}
              {(() => {
                const slug = viewUser.slug ?? viewUser.establishment_name
                  .toLowerCase()
                  .normalize('NFD').replace(/[̀-ͯ]/g, '')
                  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const url = `https://appbello.com.br/agendar/${slug}`;
                return (
                  <div className="bg-[#6666cc]/5 border border-[#6666cc]/20 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Link de agendamento
                    </p>
                    <div className="flex items-center gap-2">
                      <a href={url} target="_blank" rel="noreferrer" className="flex-1 text-xs text-[#6666cc] font-medium truncate hover:underline">{url}</a>
                      <button onClick={() => navigator.clipboard.writeText(url)} className="p-1.5 rounded-lg hover:bg-[#6666cc]/10 transition-colors" title="Copiar">
                        <Copy className="w-3.5 h-3.5 text-[#6666cc]"  variant="Outline" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Reset de senha */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-semibold mb-2 flex items-center gap-1">
                  <LockIcon className="w-3.5 h-3.5"  variant="Outline" /> Redefinir senha do usuário
                </p>
                {resetSuccess ? (
                  <p className="text-xs text-green-600 font-semibold">✅ E-mail de redefinição enviado para {viewUser.owner_email}</p>
                ) : (
                  <button
                    onClick={() => handleResetPassword(viewUser.owner_email)}
                    disabled={resetSending}
                    className="w-full h-9 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {resetSending ? (
                      <span className="animate-spin w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full" />
                    ) : (
                      <LockIcon className="w-3.5 h-3.5"  variant="Outline" />
                    )}
                    {resetSending ? 'Enviando...' : 'Enviar link de redefinição'}
                  </button>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-1">
                <a href={`mailto:${viewUser.owner_email}`} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Sms className="w-4 h-4"  variant="Outline" /> E-mail
                </a>
                <button onClick={() => setViewUser(null)} className="flex-1 h-10 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white text-sm font-semibold transition-colors">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar bloqueio */}
      {banId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBanId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {banUser?.active ? 'Bloquear usuário' : 'Desbloquear usuário'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {banUser?.active
                ? `Deseja bloquear ${banUser.establishment_name}? O acesso ao app será suspenso.`
                : `Deseja desbloquear ${banUser?.establishment_name}? O acesso será restaurado.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBanId(null)} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={confirmBan} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                {banUser?.active ? 'Bloquear' : 'Desbloquear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Estender Trial */}
      {(extendUserId || bulkExtend) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setExtendUserId(null); setBulkExtend(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg text-gray-900 mb-1">Estender Trial</h2>
            <p className="text-sm text-gray-500 mb-4">
              {bulkExtend
                ? `Adicionar dias extras para ${selectedUsers.size} usuário(s)`
                : `Adicionar dias extras para ${extendUserName}`}
            </p>
            {!bulkExtend && (
              <p className="text-xs text-gray-400 mb-3">Dias extras atuais: {extendCurrentExtra}</p>
            )}
            <input
              type="number" min="1" max="365"
              value={extendDays}
              onChange={e => setExtendDays(e.target.value)}
              placeholder="Número de dias extras"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setExtendUserId(null); setBulkExtend(false); setSelectedUsers(new Set()); }}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExtendTrial}
                disabled={extendLoading || !extendDays}
                className="flex-1 h-11 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                {extendLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
