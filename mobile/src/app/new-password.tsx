import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Lock, TickCircle, ShieldCross } from 'iconsax-react-native';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { supabase } from '@/lib/supabase';

export default function NewPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event that Supabase fires
    // when the deep link with the recovery token is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
      if (event === 'SIGNED_IN' && session) {
        setReady(true);
      }
    });

    // Fallback: check if session is already active (token already processed by _layout deep link handler)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // Timeout: if no auth event fires in 5s, the link likely expired
    const timeout = setTimeout(() => {
      setTokenError(true);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async () => {
    setError('');

    if (!password || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError('Erro ao atualizar a senha. ' + updateError.message);
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AuthLayout>
          <View className="flex-1 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-6">
              <TickCircle size={32} color="#10B981" variant="Outline" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Senha atualizada!
            </Text>
            <Text className="text-gray-500 text-center text-base mb-8 leading-6">
              Sua senha foi alterada com sucesso. Faça login com sua nova senha.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/login')}
              className="bg-appbello-primary h-14 rounded-2xl items-center justify-center w-full"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Ir para o Login</Text>
            </TouchableOpacity>
          </View>
        </AuthLayout>
      </>
    );
  }

  // Token error / expired link state
  if (tokenError && !ready) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AuthLayout>
          <View className="flex-1 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-orange-400/20 items-center justify-center mb-6">
              <ShieldCross size={32} color="#FB923C" variant="Outline" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Link expirado
            </Text>
            <Text className="text-gray-500 text-center text-base mb-8 leading-6">
              Este link de recuperação expirou ou já foi utilizado. Solicite um novo link.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/reset-password')}
              className="bg-appbello-primary h-14 rounded-2xl items-center justify-center w-full mb-4"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Solicitar novo link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/login')}
              activeOpacity={0.8}
            >
              <Text className="text-appbello-primary font-bold text-base">Voltar ao Login</Text>
            </TouchableOpacity>
          </View>
        </AuthLayout>
      </>
    );
  }

  // Loading / waiting for token state
  if (!ready) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AuthLayout>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6666cc" />
            <Text className="text-gray-500 text-base mt-4">
              Verificando link de recuperação...
            </Text>
          </View>
        </AuthLayout>
      </>
    );
  }

  // Main form - enter new password
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthLayout showBackButton onBackPress={() => router.replace('/login')}>
        <View className="mb-10 mt-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            Nova Senha
          </Text>
          <Text className="text-gray-500 text-lg">
            Defina sua nova senha de acesso.
          </Text>
        </View>

        {error ? (
          <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <Text className="text-red-400 font-medium text-center">{error}</Text>
          </View>
        ) : null}

        <View className="space-y-4">
          <Input
            label="Nova Senha"
            placeholder="Mín. 8 caracteres"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry
            icon={<Lock color="#94A3B8" size={20} variant="Outline" />}
            className="mb-4"
          />

          <Input
            label="Confirmar Nova Senha"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
            secureTextEntry
            icon={<Lock color="#94A3B8" size={20} variant="Outline" />}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`h-14 mt-8 rounded-2xl items-center justify-center ${isLoading ? 'bg-appbello-primary/70' : 'bg-appbello-primary'}`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-bold text-lg">Salvar nova senha</Text>
            )}
          </TouchableOpacity>
        </View>
      </AuthLayout>
    </>
  );
}
