'use client';

import { Buildings2 } from 'iconsax-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type EstablishmentForm } from './LinkAgendamentoCard';

export function DadosEstabelecimentoCard({
  form,
  setForm,
}: {
  form: EstablishmentForm;
  setForm: (value: EstablishmentForm) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Buildings2 className="w-5 h-5 text-brand-primary"  variant="Outline" />
        <h3 className="font-bold text-gray-900">Dados do Estabelecimento</h3>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-gray-700 font-medium text-sm">Nome do estabelecimento *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Salão da Maria" className="mt-1 rounded-xl border-gray-200 h-10" />
        </div>
        <div>
          <Label className="text-gray-700 font-medium text-sm">Endereço</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, bairro, cidade" className="mt-1 rounded-xl border-gray-200 h-10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-700 font-medium text-sm">Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className="mt-1 rounded-xl border-gray-200 h-10" />
          </div>
          <div>
            <Label className="text-gray-700 font-medium text-sm">CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="mt-1 rounded-xl border-gray-200 h-10" />
          </div>
        </div>
        <div>
          <Label className="text-gray-700 font-medium text-sm">Instagram</Label>
          <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@meusalao" className="mt-1 rounded-xl border-gray-200 h-10" />
        </div>
      </div>
    </div>
  );
}
