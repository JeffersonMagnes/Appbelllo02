'use client';

import { useState } from 'react';
import { Lock, ArrowRight2 } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

export default function EmployeeLoginPage() {
  const [pin, setPin] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!ownerEmail.trim()) { setError('Informe o e-mail do estabelecimento.'); return; }
    if (!pin.trim() || pin.length < 4) { setError('Informe um PIN válido (mínimo 4 dígitos).'); return; }

    setLoading(true);
    try {
      const response = await fetch('/api/employee/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ownerEmail, pin }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'E-mail ou PIN inválido.');
        return;
      }
      window.location.href = '/employee-dashboard';
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full h-[50px] px-4 rounded-xl border bg-gray-50 text-gray-900 text-sm font-medium
    placeholder:text-gray-400 placeholder:font-normal
    focus:outline-none focus:ring-2 focus:ring-[#5333ED]/20 focus:border-[#5333ED] focus:bg-white
    transition-all duration-150`;

  return (
    <AuthLayout title="Acesso Funcionário" subtitle="Entre com o PIN fornecido pelo seu gestor.">
      <form onSubmit={handleSubmit} className="space-y-4">

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <span className="mt-0.5 flex-shrink-0">⚠️</span>
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">E-mail do Estabelecimento</label>
          <input
            type="email"
            value={ownerEmail}
            onChange={e => setOwnerEmail(e.target.value)}
            placeholder="email@do-gestor.com"
            className={inputCls}
            required
          />
          <p className="text-xs text-gray-400">O e-mail do dono/gestor do estabelecimento.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">PIN de Acesso</label>
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className={inputCls}
              maxLength={6}
              required
            />
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" variant="Outline" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[50px] rounded-xl gradient-primary text-white font-bold text-[15px]
            flex items-center justify-center gap-2 transition-all
            disabled:opacity-60 disabled:cursor-not-allowed
            hover:shadow-lg hover:shadow-[#5333ED]/25 active:scale-[0.98]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4" variant="Outline" /> Entrar</>}
        </button>

        <div className="text-center mt-6">
          <a href="/login" className="text-sm text-[#5333ED] font-semibold hover:underline flex items-center justify-center gap-1">
            Sou gestor/dono <ArrowRight2 className="w-3.5 h-3.5" />
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}
