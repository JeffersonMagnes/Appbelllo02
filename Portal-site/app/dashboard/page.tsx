'use client';

import { useEffect, useState } from 'react';
import {
  Calendar, Profile2User, DollarCircle, Scissor, Clock, Crown, TrendUp,
  Chart, ClipboardText, MagicStar, ShoppingBag, ProfileCircle, Box,
  Link2, Warning2, ArrowRight2, Award,
} from 'iconsax-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { createClient } from '@/lib/supabase/client';
import type { Appointment } from '@/lib/supabase/types';
import Link from 'next/link';
import Image from 'next/image';
import DemoDataDialog from '@/components/DemoDataDialog';

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700', confirmado: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700', pendente: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700', cancelado: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700', concluido: 'bg-blue-100 text-blue-700',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado', confirmado: 'Confirmado',
  pending: 'Pendente', pendente: 'Pendente',
  cancelled: 'Cancelado', cancelado: 'Cancelado',
  completed: 'Concluído', concluido: 'Concluído',
};

type ChartDay = { day: string; receita: number };

const QUICK_ACTIONS = [
  { label: 'Agendar', href: '/dashboard/agenda', icon: Calendar, color: '#5333ED' },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Profile2User, color: '#5333ED' },
  { label: 'Comandas', href: '/dashboard/comandas', icon: ClipboardText, color: '#5333ED' },
  { label: 'Financeiro', href: '/dashboard/financeiro', icon: DollarCircle, color: '#5333ED' },
  { label: 'Relatórios', href: '/dashboard/relatorios', icon: Chart, color: '#5333ED' },
  { label: 'Assistente IA', href: '/dashboard/assistente', icon: MagicStar, color: '#7C3AED' },
  { label: 'Catálogo', href: '/dashboard/pedidos', icon: ShoppingBag, color: '#0BBDB6' },
  { label: 'Link & Perfil', href: '/dashboard/link-agendamento', icon: ProfileCircle, color: '#5333ED' },
];

const GESTAO_ITEMS = [
  { label: 'Agenda', href: '/dashboard/agenda', icon: Calendar, color: '#5333ED' },
  { label: 'Financeiro', href: '/dashboard/financeiro', icon: DollarCircle, color: '#5333ED' },
  { label: 'Comandas', href: '/dashboard/comandas', icon: ClipboardText, color: '#5333ED' },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Profile2User, color: '#5333ED' },
  { label: 'Produtos', href: '/dashboard/produtos', icon: Box, color: '#5333ED' },
  { label: 'Equipe', href: '/dashboard/equipe', icon: ProfileCircle, color: '#5333ED' },
  { label: 'Link', href: '/dashboard/link-agendamento', icon: Link2, color: '#5333ED' },
  { label: 'Assistente IA', href: '/dashboard/assistente', icon: MagicStar, color: '#7C3AED' },
];

const RELATORIOS_ITEMS = [
  { label: 'Performance', href: '/dashboard/relatorios', icon: Chart, color: '#5333ED' },
  { label: 'Top Clientes', href: '/dashboard/top-clientes', icon: Award, color: '#5333ED' },
];

type AptWithDetails = Appointment & { client_name?: string; service_name?: string; employee_name?: string };

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<AptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, clients: 0, revenue: 0, services: 0, professionals: 0, expenses: 0, pendingOrders: 0, lowStock: 0 });
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [estName, setEstName] = useState('');
  const [estLogoUrl, setEstLogoUrl] = useState('');
  const [setupProgress, setSetupProgress] = useState<{ hasName: boolean; hasAddress: boolean; hasLogo: boolean; hasHours: boolean; hasProfessional: boolean; hasService: boolean } | null>(null);
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [birthdayClients, setBirthdayClients] = useState<{ name: string }[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<{ name: string; date: string }[]>([]);
  const [estId, setEstId] = useState('');

  useEffect(() => {
    setSetupDismissed(sessionStorage.getItem('setup_dismissed') === 'true');
  }, []);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: estRaw } = await supabase
        .from('establishments')
        .select('id, name, address, logo_url, hours_json, monthly_goal, trial_started_at, extra_trial_days')
        .eq('owner_id', user.id)
        .maybeSingle();
      const est = estRaw as { id: string; name?: string; address?: string; logo_url?: string; hours_json?: any; monthly_goal?: number; trial_started_at?: string; extra_trial_days?: number } | null;
      if (!est) { setLoading(false); return; }
      setEstId(est.id);
      setEstName(est.name || '');
      setEstLogoUrl(est.logo_url || '');

      const demoKey = `demo_modal_shown_${est.id}`;
      if (!localStorage.getItem(demoKey)) {
        setTimeout(() => setShowDemoDialog(true), 1200);
        localStorage.setItem(demoKey, 'true');
      }
      if (est.monthly_goal) setMonthlyGoal(est.monthly_goal);
      if (est.trial_started_at) {
        const totalTrialDays = 30 + (est.extra_trial_days ?? 0);
        const trialStart = new Date(est.trial_started_at);
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + totalTrialDays);
        const diffMs = trialEnd.getTime() - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        setTrialDaysLeft(Math.max(0, diffDays));
      }

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const [aptsRes, clientsRes, servicesRes, txRes, employeesRes, productsRes, ordersRes] = await Promise.all([
        supabase.from('appointments').select('*').eq('establishment_id', est.id).eq('date', todayStr).order('time'),
        (supabase as any).from('clients').select('id, name, birth_date').eq('establishment_id', est.id),
        supabase.from('services').select('id, name', { count: 'exact' }).eq('establishment_id', est.id).eq('active', true),
        (supabase as any).from('transactions').select('amount, date, type').eq('establishment_id', est.id).gte('date', firstOfMonth),
        supabase.from('employees').select('id, name', { count: 'exact' }).eq('establishment_id', est.id).eq('active', true),
        (supabase as any).from('products').select('id, stock, min_stock').eq('establishment_id', est.id),
        (supabase as any).from('online_orders').select('id', { count: 'exact' }).eq('establishment_id', est.id).eq('status', 'pending'),
      ]);

      const allTx = txRes.data || [];
      const isIncome = (t: any) => t.type === 'receita' || t.type === 'income';
      const isExpense = (t: any) => t.type === 'despesa' || t.type === 'expense';
      const monthRevenue = allTx.filter(isIncome).reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
      const monthExpenses = allTx.filter(isExpense).reduce((s: number, t: any) => s + parseFloat(t.amount || 0), 0);
      const lowStockCount = (productsRes.data || []).filter((p: any) => p.stock != null && p.min_stock != null && p.stock <= p.min_stock).length;

      const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weekMap: Record<string, number> = {};
      allTx.filter(isIncome).filter((t: any) => t.date >= last7[0]).forEach((t: any) => {
        weekMap[t.date] = (weekMap[t.date] || 0) + parseFloat(t.amount || 0);
      });
      const chart = last7.map(d => {
        const date = new Date(d + 'T12:00:00');
        return { day: dayLabels[date.getDay()], receita: Math.round(weekMap[d] || 0) };
      });
      const wTotal = chart.reduce((s, c) => s + c.receita, 0);

      const allClients = clientsRes.data || [];
      const allEmployees = employeesRes.data || [];
      const allServices = servicesRes.data || [];
      const clientMap = Object.fromEntries(allClients.map((c: any) => [c.id, c.name]));
      const serviceMap = Object.fromEntries(allServices.map((s: any) => [s.id, s.name]));
      const employeeMap = Object.fromEntries(allEmployees.map((e: any) => [e.id, e.name]));

      const rawApts = aptsRes.data || [];
      const resolvedApts: AptWithDetails[] = rawApts.map((apt: any) => ({
        ...apt,
        client_name: clientMap[apt.client_id] || apt.client_name || undefined,
        service_name: serviceMap[apt.service_id] || undefined,
        employee_name: employeeMap[apt.employee_id] || undefined,
      }));

      setAppointments(resolvedApts);
      setChartData(chart);
      setWeekTotal(wTotal);
      setStats({
        total: rawApts.length,
        clients: allClients.length,
        revenue: monthRevenue,
        services: servicesRes.count || allServices.length,
        professionals: employeesRes.count || allEmployees.length,
        expenses: monthExpenses,
        pendingOrders: ordersRes.count || 0,
        lowStock: lowStockCount,
      });

      setSetupProgress({
        hasName: !!est.name,
        hasAddress: !!est.address,
        hasLogo: !!est.logo_url,
        hasHours: !!est.hours_json,
        hasProfessional: allEmployees.length > 0,
        hasService: allServices.length > 0,
      });

      const now = new Date();
      const todayBirthdays = allClients.filter((c: any) => {
        if (!c.birth_date) return false;
        const bd = new Date(c.birth_date + 'T12:00:00');
        return bd.getDate() === now.getDate() && bd.getMonth() === now.getMonth();
      });
      setBirthdayClients(todayBirthdays.map((c: any) => ({ name: c.name })));
      const upcoming = allClients.filter((c: any) => {
        if (!c.birth_date) return false;
        const bd = new Date(c.birth_date + 'T12:00:00');
        const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        const diff = Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 && diff <= 7;
      });
      setUpcomingBirthdays(upcoming.map((c: any) => ({ name: c.name, date: c.birth_date })));

      setLoading(false);
    };
    load();
  }, []);

  const todayRevenue = chartData.length > 0 ? chartData[chartData.length - 1].receita : 0;
  const yesterdayRevenue = chartData.length > 1 ? chartData[chartData.length - 2].receita : 0;
  const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;
  const netProfit = stats.revenue - stats.expenses;

  const setupSteps = setupProgress ? [
    { label: 'Dados do negócio', done: setupProgress.hasName, href: '/dashboard/configuracoes' },
    { label: 'Endereço', done: setupProgress.hasAddress, href: '/dashboard/configuracoes' },
    { label: 'Logo & Cores', done: setupProgress.hasLogo, href: '/dashboard/link-agendamento' },
    { label: 'Horários', done: setupProgress.hasHours, href: '/dashboard/configuracoes' },
    { label: 'Profissional', done: setupProgress.hasProfessional, href: '/dashboard/equipe' },
    { label: 'Serviços', done: setupProgress.hasService, href: '/dashboard/servicos' },
  ] : [];
  const setupComplete = setupSteps.every(s => s.done);
  const setupPercent = setupSteps.length > 0 ? Math.round((setupSteps.filter(s => s.done).length / setupSteps.length) * 100) : 0;

  const dismissSetup = () => {
    setSetupDismissed(true);
    sessionStorage.setItem('setup_dismissed', 'true');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <Header title="Início" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Início" />

      {/* Welcome section */}
      {estName && (
        <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-5">
          {estLogoUrl ? (
            <Image
              src={estLogoUrl}
              alt={estName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-gray-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {estName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{estName}</p>
            <p className="text-xs text-gray-400">Bem-vindo de volta</p>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 space-y-6">

        {/* Trial banner */}
        {trialDaysLeft !== null && trialDaysLeft === 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-3 border bg-red-50 border-red-200">
            <Crown className="w-5 h-5 flex-shrink-0 text-red-500" variant="Outline" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Seu período gratuito expirou!</p>
              <p className="text-xs text-red-600 mt-0.5">Assine um plano para continuar usando todas as funcionalidades.</p>
            </div>
            <Link href="/dashboard/assinatura" className="text-xs font-bold px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">
              Assinar agora
            </Link>
          </div>
        )}
        {trialDaysLeft !== null && trialDaysLeft > 0 && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 border ${trialDaysLeft <= 7 ? 'bg-amber-50 border-amber-200' : 'bg-brand-primary/5 border-brand-primary/20'}`}>
            <Crown className={`w-5 h-5 flex-shrink-0 ${trialDaysLeft <= 7 ? 'text-amber-500' : 'text-brand-primary'}`} variant="Outline" />
            <div className="flex-1">
              <p className={`text-sm font-bold ${trialDaysLeft <= 7 ? 'text-amber-800' : 'text-brand-primary'}`}>
                {trialDaysLeft <= 7 ? `Trial expira em ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''}!` : `Teste gratuito · ${trialDaysLeft} dias restantes`}
              </p>
              <div className="h-1.5 bg-white rounded-full mt-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${trialDaysLeft <= 7 ? 'bg-amber-400' : 'bg-brand-primary'}`} style={{ width: `${Math.min(100, ((30 - Math.min(trialDaysLeft, 30)) / 30) * 100)}%` }} />
              </div>
            </div>
            <Link href="/dashboard/assinatura" className={`text-xs font-bold px-3 py-1.5 rounded-xl ${trialDaysLeft <= 7 ? 'bg-amber-500 text-white' : 'bg-brand-primary text-white'}`}>
              Assinar
            </Link>
          </div>
        )}

        {/* Birthday Alerts */}
        {birthdayClients.length > 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-3 border bg-pink-50 border-pink-200">
            <span className="text-2xl">🎂</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-pink-800">
                Aniversariante{birthdayClients.length > 1 ? 's' : ''} de hoje!
              </p>
              <p className="text-xs text-pink-600 mt-0.5">
                {birthdayClients.map(c => c.name).join(', ')}
              </p>
            </div>
            <Link href="/dashboard/clientes" className="text-xs font-bold px-3 py-1.5 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-colors">
              Ver clientes
            </Link>
          </div>
        )}
        {upcomingBirthdays.length > 0 && birthdayClients.length === 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-3 border bg-gray-50 border-gray-200">
            <span className="text-xl">🎂</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">
                {upcomingBirthdays.length} aniversário{upcomingBirthdays.length > 1 ? 's' : ''} nos próximos 7 dias
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {upcomingBirthdays.map(c => c.name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Setup Progress Banner */}
        {setupProgress && !setupComplete && !setupDismissed && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Configure seu negócio</h3>
                <p className="text-xs text-gray-500">{setupPercent}% concluído</p>
              </div>
              <button onClick={dismissSetup} className="text-gray-400 hover:text-gray-600 text-xs font-medium">Dispensar</button>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${setupPercent}%`, background: 'linear-gradient(90deg,#5333ED,#0BBDB6)' }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {setupSteps.map(step => (
                <Link key={step.label} href={step.href}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${step.done ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-brand-primary hover:text-brand-primary'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${step.done ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}`}>
                    {step.done ? '✓' : '·'}
                  </span>
                  {step.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards — mobile style */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Receita de Hoje */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <TrendUp className="w-4 h-4 text-brand-primary" variant="Outline" />
                <span className="text-xs text-gray-500">Hoje</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${revenueGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
              </span>
            </div>
            <div className="text-2xl font-extrabold text-brand-primary">{fmt(todayRevenue)}</div>
            <div className="h-14 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={8}>
                  <Bar dataKey="receita" radius={[2, 2, 0, 0]} fill="#5333ED40" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lucro Mensal */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Chart className="w-4 h-4 text-brand-primary" />
              <span className="text-xs text-gray-500">Lucro Mês</span>
            </div>
            <div className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(netProfit)}</div>
            {monthlyGoal > 0 && (
              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">Meta: {fmt(monthlyGoal)}</span>
                  <span className="text-xs text-gray-400">{Math.max(0, Math.round((stats.revenue / monthlyGoal) * 100))}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (stats.revenue / monthlyGoal) * 100)}%`, background: 'linear-gradient(90deg,#5333ED,#0BBDB6)' }} />
                </div>
              </div>
            )}
            {monthlyGoal <= 0 && (
              <p className="text-xs text-gray-400 mt-3">
                Receita: {fmt(stats.revenue)} · Despesas: {fmt(stats.expenses)}
              </p>
            )}
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { icon: Calendar, value: stats.total, label: 'Agendamentos', color: '#5333ED' },
            { icon: Profile2User, value: stats.clients, label: 'Clientes', color: '#0BBDB6' },
            { icon: ProfileCircle, value: stats.professionals, label: 'Profissionais', color: '#7C3AED' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: s.color + '15' }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} variant="Outline" />
                </div>
                <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500 font-semibold text-center">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions Grid */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 relative" style={{ backgroundColor: action.color }}>
                    <Icon className="w-5 h-5 text-white" variant="Outline" />
                    {action.label === 'Catálogo' && stats.pendingOrders > 0 && (
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center min-w-[18px] h-[18px]">
                        {stats.pendingOrders}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-700 font-semibold text-center leading-tight">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900">Receita da Semana</h3>
                <p className="text-sm text-gray-500">Últimos 7 dias</p>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-extrabold gradient-text">R$ {weekTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6666cc" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6666cc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, 'Receita']} />
                <Area type="monotone" dataKey="receita" stroke="#6666cc" strokeWidth={2} fill="url(#colorReceita)" dot={{ r: 4, fill: '#6666cc' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Today's appointments */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Próximos Agendamentos</h3>
              <Link href="/dashboard/agenda" className="text-xs text-brand-primary font-semibold hover:underline">Ver todos</Link>
            </div>
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" variant="Outline" />
                <p className="text-sm font-medium">Nenhum agendamento hoje</p>
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 3).map(apt => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 hover:border-gray-200 hover:bg-gray-50 transition-all">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4.5 h-4.5 text-brand-primary" variant="Outline" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{apt.service_name || 'Serviço'}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {apt.time}{apt.employee_name ? ` · ${apt.employee_name}` : ''}{apt.client_name ? ` · ${apt.client_name}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[apt.status] || apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        {stats.lowStock > 0 && (
          <Link href="/dashboard/produtos"
            className="flex items-center gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Warning2 className="w-5 h-5 text-amber-500" variant="Outline" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Estoque Baixo</p>
              <p className="text-xs text-gray-600">{stats.lowStock} produto(s) precisam de reposição</p>
            </div>
            <ArrowRight2 className="w-4 h-4 text-amber-400" variant="Outline" />
          </Link>
        )}

        {/* Gestão Section */}
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Gestão</p>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {GESTAO_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: item.color }}>
                    <Icon className="w-5 h-5 text-white" variant="Outline" />
                  </div>
                  <span className="text-xs text-gray-700 font-semibold text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Relatórios Section */}
        <div className="pb-6">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Relatórios</p>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {RELATORIOS_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: item.color }}>
                    <Icon className="w-5 h-5 text-white" variant="Outline" />
                  </div>
                  <span className="text-xs text-gray-700 font-semibold text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <DemoDataDialog
        open={showDemoDialog}
        onOpenChange={setShowDemoDialog}
        onSeedComplete={() => { setShowDemoDialog(false); window.location.reload(); }}
        establishmentId={estId}
      />
    </div>
  );
}
