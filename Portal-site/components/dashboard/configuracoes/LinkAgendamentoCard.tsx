'use client';

import { Link as LinkIcon, Copy, TickSquare } from 'iconsax-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BASE_URL = 'appbello.com.br/p';

export interface EstablishmentForm {
  name: string;
  address: string;
  phone: string;
  slug: string;
  instagram: string;
  cnpj: string;
}

export function LinkAgendamentoCard({
  form,
  setForm,
  copied,
  onCopy,
}: {
  form: EstablishmentForm;
  setForm: (value: EstablishmentForm) => void;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-brand-primary/30 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <LinkIcon className="w-5 h-5 text-brand-primary" />
        <h3 className="font-bold text-gray-900">Link de Agendamento & QR Code</h3>
      </div>
      <p className="text-xs text-gray-500">Este é o link que seus clientes usam para agendar. Defina um identificador único abaixo.</p>
      <div>
        <Label className="text-gray-700 font-medium text-sm">Seu link personalizado</Label>
        <div className="flex mt-1">
          <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-xs text-gray-400 whitespace-nowrap">{BASE_URL}/</span>
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="meu-salao"
            className="rounded-l-none rounded-r-xl border-gray-200 h-10"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Só letras minúsculas, números e hífens. Ex: <strong>meu-salao</strong></p>
      </div>
      {form.slug && (
        <div className="bg-brand-primary/5 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <LinkIcon className="w-4 h-4 text-brand-primary flex-shrink-0" />
            <span className="text-sm text-brand-primary font-medium truncate">{BASE_URL}/{form.slug}</span>
          </div>
          <button onClick={onCopy} className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:opacity-70 transition-opacity flex-shrink-0">
            {copied ? <><TickSquare className="w-3.5 h-3.5"  variant="Outline" /> Copiado</> : <><Copy className="w-3.5 h-3.5"  variant="Outline" /> Copiar</>}
          </button>
        </div>
      )}
    </div>
  );
}
