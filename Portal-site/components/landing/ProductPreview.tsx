import { CalendarDays, Users, Scissors, Wallet, Package, LayoutDashboard, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { AppointmentTile } from '@/components/dashboard/agenda/AppointmentTile';

const navigation = [LayoutDashboard, CalendarDays, Users, Scissors, Wallet, Package];

/** Illustrative data, using the same appointment tile as the real agenda. */
export default function ProductPreview() {
  return (
    <figure className="product-preview m-0 min-w-0">
      <div className="overflow-hidden rounded-2xl border border-[#dedeea] bg-white shadow-[0_16px_48px_-24px_rgba(40,40,85,0.3)]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <span className="text-sm font-bold tracking-tight text-[#5959b5]">AppBello <span className="ml-2 font-normal text-gray-500">/ Agenda</span>
          </span>
          <span className="rounded-full bg-[#f0f0fa] px-2.5 py-1 text-[10px] font-semibold text-[#5555aa]">Visão do dia</span>
        </div>
        <div className="flex">
          <div className="hidden w-12 shrink-0 flex-col items-center gap-5 border-r border-gray-100 py-5 sm:flex" aria-hidden="true">
            {navigation.map((Icon, i) => <div key={i} className={i === 1 ? 'rounded-lg bg-[#eeeef9] p-2 text-[#5959b5]' : 'p-2 text-gray-400'}>
              <Icon size={16} />
            </div>)}
          </div>
          <div className="min-w-0 flex-1 bg-[#fafafd] p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-gray-900">Sua agenda, organizada.</p>
                <p className="mt-0.5 text-[11px] text-gray-500">Quarta-feira, 16 de setembro</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-lg bg-[#5959b5] p-2 text-xs font-medium text-white">
                <Plus size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Novo</span>
              </span>
            </div>
            <div className="mb-4 grid grid-cols-3 divide-x divide-gray-200 rounded-xl border border-gray-200 bg-white py-3">
              {[['06', 'Agendamentos'], ['04', 'Confirmados'], ['02', 'Profissionais']].map(([value, label]) => <div key={label} className="min-w-0 px-2 sm:px-3">
                <p className="text-lg font-semibold tabular-nums text-gray-900">{value}</p>
                <p className="text-[10px] text-gray-600">{label}</p>
              </div>)}
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 text-xs text-gray-600">
                <span className="flex items-center gap-2">
                  <ChevronLeft size={12} aria-hidden="true" />16 de setembro<ChevronRight size={12} aria-hidden="true" />
                </span>
                <span className="font-medium text-[#5959b5]">Dia</span>
              </div>
              <div className="grid grid-cols-[38px_1fr_1fr] text-center text-[11px] font-medium text-gray-600">
                <span />
                <span className="border-l border-gray-100 py-2">Ana · Cabelo</span>
                <span className="border-l border-gray-100 py-2">Beatriz · Estética</span>
              </div>
              {[
                ['09:00', 'Marina Oliveira', 'Corte + escova', 'Camila Santos', 'Limpeza de pele'],
                ['10:00', 'Juliana Costa', 'Coloração', 'Fernanda Lima', 'Design de sobrancelhas'],
                ['11:00', 'Luiza Martins', 'Hidratação', 'Clara Souza', 'Massagem facial'],
              ].map(([time, client, service, client2, service2], i) => (
                <div key={time} className="grid grid-cols-[38px_1fr_1fr] border-t border-gray-100">
                  <span className="pt-3 text-center text-[10px] tabular-nums text-gray-500">{time}</span>
                  <div className="h-[78px] min-w-0 border-l border-gray-100 p-1.5">
                    <AppointmentTile time={time} client={client} service={service} color={i === 2 ? 'bg-[#7474bc]' : 'bg-[#5959b5]'} />
                  </div>
                  <div className="h-[78px] min-w-0 border-l border-gray-100 p-1.5">
                    <AppointmentTile time={time} client={client2} service={service2} color="bg-[#287a78]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5959b5]" />Agenda por profissional</span>
              <span>Clientes e serviços no mesmo lugar</span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[11px] text-gray-500">Prévia ilustrativa com dados fictícios e componentes da agenda AppBello.</figcaption>
    </figure>
  );
}
