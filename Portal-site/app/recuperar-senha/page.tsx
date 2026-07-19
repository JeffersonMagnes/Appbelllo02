'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TickCircle as SmsTick } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/auth/AuthLayout';
import { createClient } from '@/lib/supabase/client';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
      });
      if (error) {
        if (error.status === 429) {
          setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
        } else {
          setError('Erro ao enviar e-mail. Verifique o endereço informado.');
        }
      } else {
        setSent(true);
      }
    } catch {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="E-mail enviado!" subtitle="Verifique sua caixa de entrada.">
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <SmsTick className="w-8 h-8 text-green-600"  variant="Outline" />
          </div>
          <p className="text-gray-600 leading-relaxed">
            Enviamos um link de recuperação para <strong>{email}</strong>. Verifique também a pasta de spam.
          </p>
          <Link href="/login">
            <Button variant="outline" className="mt-4 rounded-xl border-gray-200">
              Voltar ao login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe seu e-mail e enviaremos um link para redefinir sua senha."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">E-mail</Label>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-xl border-gray-200"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 gradient-primary text-white border-0 hover:opacity-90 shadow-lg shadow-brand-primary/30 font-semibold rounded-xl"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar link de recuperação'}
        </Button>

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="text-brand-primary font-semibold hover:underline">
            Voltar ao login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
