import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Sms, Lock, User } from 'iconsax-react-native';
import { useAuthStore } from '@/lib/state/auth-store';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/ui/AuthLayout';

export default function RegisterScreen() {
  const router = useRouter();
  const signUpOwner = useAuthStore((s) => s.signUpOwner);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await signUpOwner(email, password, name);
      if (res.needsEmailConfirmation) {
        setEmailSent(true);
      } else if (res.success) {
        router.replace('/(tabs)');
      } else {
        setError(res.error || 'Erro ao criar conta');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AuthLayout>
          <View className="flex-1 items-center justify-center px-4">
            <View className="w-20 h-20 bg-appbello-primary/10 rounded-full items-center justify-center mb-6">
              <Sms color="#6666cc" size={36}  variant="Outline" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">Confirme seu e-mail</Text>
            <Text className="text-gray-500 text-base text-center leading-relaxed mb-2">
              Enviamos um link de confirmação para:
            </Text>
            <Text className="text-appbello-primary font-semibold text-base text-center mb-6">{email}</Text>
            <Text className="text-gray-400 text-sm text-center leading-relaxed mb-10">
              Verifique sua caixa de entrada (e o spam) e clique no link para ativar sua conta.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/login')}
              className="h-14 w-full rounded-2xl items-center justify-center bg-appbello-primary"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Ir para o Login</Text>
            </TouchableOpacity>
          </View>
        </AuthLayout>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthLayout showBackButton onBackPress={() => router.replace('/login')}>
      <View className="mb-8 mt-2">
        <Text className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Criar Conta</Text>
        <Text className="text-gray-500 text-lg">Cadastre-se para gerenciar seu salão</Text>
      </View>

      {error ? (
        <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <Text className="text-red-400 font-medium text-center">{error}</Text>
        </View>
      ) : null}

      <View className="space-y-4">
        <Input
          label="Nome Completo"
          placeholder="Seu nome"
          value={name}
          onChangeText={(t) => { setName(t); setError(''); }}
          autoCapitalize="words"
          icon={<User color="#94A3B8" size={20}  variant="Outline" />}
          className="mb-4"
        />

        <Input
          label="E-mail"
          placeholder="seu@email.com"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Sms color="#94A3B8" size={20}  variant="Outline" />}
          className="mb-4"
        />

        <Input
          label="Senha"
          placeholder="Crie uma senha forte"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
          secureTextEntry
          icon={<Lock color="#94A3B8" size={20}  variant="Outline" />}
          className="mb-4"
        />

        <Input
          label="Confirmar Senha"
          placeholder="Repita sua senha"
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
          secureTextEntry
          icon={<Lock color="#94A3B8" size={20}  variant="Outline" />}
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={isLoading}
          className={`h-14 mt-8 rounded-2xl items-center justify-center ${isLoading ? 'bg-appbello-primary/70' : 'bg-appbello-primary'}`}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-white font-bold text-lg">Criar Minha Conta</Text>
          )}
        </TouchableOpacity>
      </View>
    </AuthLayout>
    </>
  );
}
