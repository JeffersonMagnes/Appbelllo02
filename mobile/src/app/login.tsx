import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Sms, Lock, InfoCircle } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useAuthStore } from '@/lib/state/auth-store';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/ui/AuthLayout';

export default function LoginScreen() {
  const router = useRouter();
  const loginAsOwner = useAuthStore((s) => s.loginAsOwner);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await loginAsOwner(email, password);
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        setError(res.error || 'Erro ao fazer login');
        Alert.alert('Erro', res.error || 'Erro ao fazer login');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View className="items-center mb-8 mt-6">
        <Image
          source={require('@/assets/images/IconKitchen-Output/android/play_store_512.png')}
          style={{ width: 80, height: 80, borderRadius: 20 }}
          resizeMode="contain"
        />
      </View>
      <View className="mb-10">
        <Text className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Bem-vindo(a) de volta</Text>
        <Text className="text-gray-500 text-lg">Faça login para acessar seu negócio</Text>
      </View>

      {error ? (
        <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 14, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <InfoCircle size={18} color="#DC2626" variant="Outline" />
          </View>
          <Text style={{ flex: 1, color: '#991B1B', fontSize: 13, fontWeight: '600', lineHeight: 18 }}>{error}</Text>
        </View>
      ) : null}

      <View className="space-y-4">
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
          placeholder="Sua senha"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
          secureTextEntry
          icon={<Lock color="#94A3B8" size={20}  variant="Outline" />}
        />

        <View className="flex-row justify-end mt-2 mb-8">
          <TouchableOpacity onPress={() => router.push('/reset-password')}>
            <Text className="text-appbello-primary font-medium text-sm">Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          className={`h-14 rounded-2xl items-center justify-center ${isLoading ? 'bg-appbello-primary/70' : 'bg-appbello-primary'}`}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-white font-bold text-lg">Entrar</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-10">
          <Text className="text-gray-500 text-base">Ainda não tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text className="text-appbello-primary font-bold text-base">Criar conta</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-4">
          <TouchableOpacity onPress={() => router.push('/employee-login')}>
            <Text className="text-gray-400 font-medium text-sm">Sou funcionário</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
}
