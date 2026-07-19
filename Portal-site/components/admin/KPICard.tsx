import { TrendUp as TrendingUp, TrendDown as TrendingDown } from 'iconsax-react';

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
}

export default function KPICard({ title, value, change, changeLabel, icon: Icon, iconColor = 'text-gray-600', iconBg = 'bg-gray-100', loading }: KPICardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-5 hover:-translate-y-1 hover:shadow-md hover:shadow-slate-200 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500 tracking-tight">{title}</p>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-24" />
      ) : (
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      )}
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${change >= 0 ? 'text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-md' : 'text-rose-600 bg-rose-50 w-fit px-2 py-0.5 rounded-md'}`}>
          {change >= 0 ? <TrendingUp className="w-3.5 h-3.5"  variant="Outline" /> : <TrendingDown className="w-3.5 h-3.5"  variant="Outline" />}
          <span>{change >= 0 ? '+' : ''}{change}% {changeLabel || 'vs. mês anterior'}</span>
        </div>
      )}
    </div>
  );
}
