'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeSlash } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        if (err.message.toLowerCase().includes('email not confirmed')) {
          setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (ou spam).');
        } else {
          setError('E-mail ou senha inválidos. Verifique seus dados.');
        }
      } else if (authData.user) {
        const uid = authData.user.id;
        const userName = (authData.user.user_metadata?.name as string) || email.split('@')[0];
        const { data: est } = await (supabase as any).from('establishments').select('id').eq('owner_id', uid).maybeSingle();
        if (est) {
          const { data: emps } = await (supabase as any).from('employees').select('id').eq('establishment_id', est.id).limit(1);
          if (!emps || emps.length === 0) {
            await (supabase as any).from('employees').insert({
              establishment_id: est.id, name: userName, email,
              role: 'professional', specialty: 'Proprietário',
              commission_type: 'percentage', commission_value: 0, active: true,
            });
          }
        }
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full h-[50px] px-4 rounded-xl border bg-gray-50 text-gray-900 text-sm font-medium
    placeholder:text-gray-400 placeholder:font-normal
    focus:outline-none focus:ring-2 focus:ring-[#5333ED]/20 focus:border-[#5333ED] focus:bg-white
    transition-all duration-150`;

  return (
    <AuthLayout title="Bem-vindo de volta!" subtitle="Entre na sua conta para continuar.">
      <form onSubmit={handleSubmit} className="space-y-4">

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <span className="mt-0.5 flex-shrink-0">⚠️</span>
            {error}
          </div>
        )}

        {/* E-mail */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">E-mail</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputCls}
          />
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">Senha</label>
            <Link href="/recuperar-senha" className="text-xs text-[#5333ED] hover:underline font-semibold">
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPw
                ? <EyeSlash className="w-5 h-5" variant="Outline" />
                : <Eye className="w-5 h-5" variant="Outline" />}
            </button>
          </div>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[50px] rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 mt-2
            transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #5333ED 0%, #0BBDB6 100%)' }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
        </button>

        {/* Divider */}
        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Register link */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-[#5333ED] font-bold hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </div>

        <div className="text-center mt-2">
          <Link href="/employee-login" className="text-xs text-gray-400 hover:text-[#5333ED] hover:underline transition-colors">
            Sou funcionário — entrar com PIN
          </Link>
        </div>

      </form>
    </AuthLayout>
  );
}
