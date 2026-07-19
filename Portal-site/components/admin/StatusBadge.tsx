interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'plan';
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; cls: string }> = {
  trial:     { label: 'Trial',     dot: 'bg-amber-400',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ativo:     { label: 'Ativo',     dot: 'bg-emerald-400', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  expirado:  { label: 'Expirado',  dot: 'bg-red-400',     cls: 'bg-red-50 text-red-600 border-red-200' },
  cancelado: { label: 'Cancelado', dot: 'bg-gray-300',    cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  bloqueado: { label: 'Bloqueado', dot: 'bg-red-500',     cls: 'bg-red-50 text-red-600 border-red-200' },
  draft:     { label: 'Rascunho',  dot: 'bg-gray-300',    cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  paused:    { label: 'Pausado',   dot: 'bg-amber-400',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  pago:      { label: 'Pago',      dot: 'bg-emerald-400', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pendente:  { label: 'Pendente',  dot: 'bg-amber-400',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  falhou:    { label: 'Falhou',    dot: 'bg-red-400',     cls: 'bg-red-50 text-red-600 border-red-200' },
  scheduled: { label: 'Agendado',  dot: 'bg-blue-400',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  active:    { label: 'Ativo',     dot: 'bg-emerald-400', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive:  { label: 'Inativo',   dot: 'bg-gray-300',    cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const PLAN_CONFIG: Record<string, { label: string; cls: string }> = {
  starter:  { label: 'Starter',   cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  pro:      { label: 'Pro',       cls: 'bg-[#7C6EFA]/10 text-[#7C6EFA] border-[#7C6EFA]/20' },
  premium:  { label: 'Premium',   cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  trial:    { label: 'Trial',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  all:      { label: 'Todos',     cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  paying:   { label: 'Pagantes',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  expiring: { label: 'Expirando', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function StatusBadge({ status, type = 'status' }: StatusBadgeProps) {
  if (type === 'plan') {
    const p = PLAN_CONFIG[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold border ${p.cls}`}>
        {p.label}
      </span>
    );
  }
  const s = STATUS_CONFIG[status] ?? { label: status, dot: 'bg-gray-300', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}
