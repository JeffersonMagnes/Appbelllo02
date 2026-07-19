'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeSlash, TickCircle as CheckCircle2, ShieldCross } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/auth/AuthLayout';
import { createClient } from '@/lib/supabase/client';

export default function NovaSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Supabase v2: detecta o token de recovery no hash da URL automaticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
      if (event === 'SIGNED_IN' && session) {
        setReady(true);
      }
    });

    // Fallback: verificar se já há sessão ativa (token já processado)
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: unknown } }) => {
      if (session) setReady(true);
    });

    // Timeout: se não receber evento em 5s, provavelmente o link expirou
    const timeout = setTimeout(() => {
      if (!ready) setTokenError(true);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError('Erro ao atualizar a senha. ' + error.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Senha atualizada!" subtitle="Redirecionando para o login...">
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Sua senha foi alterada com sucesso.</p>
        </div>
      </AuthLayout>
    );
  }

  if (tokenError && !ready) {
    return (
      <AuthLayout title="Link expirado" subtitle="Solicite um novo link de recuperação.">
        <div className="text-center py-8">
          <ShieldCross className="w-16 h-16 text-orange-400 mx-auto mb-4"  variant="Outline" />
          <p className="text-gray-600 mb-6">Este link de recuperação expirou ou já foi utilizado.</p>
          <Button onClick={() => router.push('/recuperar-senha')} className="w-full h-12 rounded-xl">
            Solicitar novo link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (!ready) {
    return (
      <AuthLayout title="Nova senha" subtitle="Verificando link de recuperação...">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#6666cc]" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nova senha" subtitle="Defina sua nova senha de acesso.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Nova senha</Label>
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              placeholder="Mín. 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-xl border-gray-200 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPw ? <EyeSlash className="w-4 h-4"  variant="Outline" /> : <Eye className="w-4 h-4"  variant="Outline" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Confirmar nova senha</Label>
          <Input
            type="password"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-12 rounded-xl border-gray-200"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 text-white border-0 hover:opacity-90 font-semibold rounded-xl"
          style={{ backgroundColor: '#6666cc' }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthLayout>
  );
}
