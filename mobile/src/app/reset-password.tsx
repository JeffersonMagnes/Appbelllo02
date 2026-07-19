import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Sms, TickCircle } from 'iconsax-react-native';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Por favor, insira seu e-mail');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Build the deep link redirect URL so the reset email links back into the app
      const redirectUrl = Linking.createURL('new-password');

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        if (resetError.status === 429) {
          setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
        } else {
          setError(resetError.message || 'Erro ao enviar e-mail de recuperação');
        }
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout showBackButton onBackPress={() => router.replace('/login')}>
      <View className="mb-10 mt-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Recuperar Senha</Text>
        <Text className="text-gray-500 text-lg">
          Digite seu e-mail para receber um link de redefinição de senha.
        </Text>
      </View>

      {error ? (
        <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <Text className="text-red-400 font-medium text-center">{error}</Text>
        </View>
      ) : null}

      {isSuccess ? (
        <View className="items-center bg-white/5 rounded-2xl p-8 border border-white/10 mt-4">
          <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-6">
            <TickCircle size={32} color="#10B981"  variant="Outline" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-3 text-center">E-mail Enviado!</Text>
          <Text className="text-gray-500 text-center text-base mb-8 leading-6">
            Verifique sua caixa de entrada (e pasta de spam) e siga as instruções para criar uma nova senha.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/login')}
            className="bg-appbello-primary h-12 px-8 rounded-full items-center justify-center w-full"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="space-y-4">
          <Input
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Sms color="#94A3B8" size={20}  variant="Outline" />}
          />

          <TouchableOpacity
            onPress={handleReset}
            disabled={isLoading}
            className={`h-14 mt-6 rounded-2xl items-center justify-center ${isLoading ? 'bg-appbello-primary/70' : 'bg-appbello-primary'}`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-bold text-lg">Enviar Link</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </AuthLayout>
  );
}
