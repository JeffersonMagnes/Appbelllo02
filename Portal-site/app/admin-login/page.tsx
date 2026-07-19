'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeSlash, Lock } from 'iconsax-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: 'https://appbello-portal.netlify.app/nova-senha',
    });
    setResetSent(true);
    setResetLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
      return;
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (!adminUser) {
      await supabase.auth.signOut();
      setError('Acesso não autorizado para este portal.');
      setLoading(false);
      return;
    }

    router.push('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #6666cc 0%, #5ab0b6 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white"  variant="Outline" />
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Admin</h1>
          <p className="text-white/70 text-sm mt-1">AppBello — Acesso restrito</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-2xl p-7 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@appbello.com.br"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6666cc]/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6666cc]/20"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeSlash className="w-4 h-4"  variant="Outline" /> : <Eye className="w-4 h-4"  variant="Outline" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Autenticando...' : 'Entrar no portal'}
          </button>

          <button
            type="button"
            onClick={() => setResetMode(true)}
            className="w-full text-xs text-[#6666cc] hover:underline pt-1"
          >
            Esqueci minha senha
          </button>
        </form>

        {/* Modal reset de senha */}
        {resetMode && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              {resetSent ? (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">E-mail enviado!</h3>
                  <p className="text-sm text-gray-500 mb-4">Verifique sua caixa de entrada para redefinir a senha.</p>
                  <button onClick={() => { setResetMode(false); setResetSent(false); }} className="w-full h-10 rounded-xl bg-[#6666cc] text-white text-sm font-semibold">Fechar</button>
                </div>
              ) : (
                <form onSubmit={handleReset}>
                  <h3 className="font-bold text-gray-900 mb-1">Redefinir senha</h3>
                  <p className="text-xs text-gray-500 mb-4">Digite o e-mail do admin para receber o link.</p>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="admin@appbello.com.br"
                    required
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#6666cc]/20"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setResetMode(false)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button type="submit" disabled={resetLoading} className="flex-1 h-10 rounded-xl bg-[#6666cc] hover:bg-[#5555aa] text-white text-sm font-semibold disabled:opacity-60">
                      {resetLoading ? 'Enviando...' : 'Enviar link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
