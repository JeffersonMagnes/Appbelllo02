import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput as RNTextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Sms, Lock, Key, ArrowRight2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/state/auth-store';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function EmployeeLoginScreen() {
  const router = useRouter();
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const setEstablishmentId = useAuthStore((s) => s.setEstablishmentId);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!ownerEmail.trim()) {
      setError('Informe o e-mail do estabelecimento.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setError('Informe um PIN válido (mínimo 4 dígitos).');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        // Demo mode: simulate employee login
        setCurrentUser({
          id: 'employee-demo',
          name: 'Funcionário Demo',
          email: ownerEmail,
          role: 'employee',
          employeeId: 'emp-demo',
          permissions: {
            viewAgenda: true,
            viewClients: true,
            viewFinancial: false,
            viewReports: false,
            viewProducts: false,
            viewComandas: false,
            editAgenda: true,
            editClients: false,
          },
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
        return;
      }

      // Step 1: Find the owner's profile by email
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('email', ownerEmail.trim().toLowerCase())
        .maybeSingle();

      if (!profile) {
        setError('Estabelecimento não encontrado. Verifique o e-mail.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      // Step 2: Find the establishment by owner_id
      const { data: establishment } = await (supabase as any)
        .from('establishments')
        .select('id, name, owner_id')
        .eq('owner_id', profile.id)
        .maybeSingle();

      if (!establishment) {
        setError('Estabelecimento não encontrado.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      // Step 3: Find the employee by establishment_id + PIN
      const { data: employee } = await (supabase as any)
        .from('employees')
        .select('*')
        .eq('establishment_id', establishment.id)
        .eq('pin', pin)
        .eq('active', true)
        .maybeSingle();

      if (!employee) {
        setError('PIN inválido ou acesso desativado.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      // Step 4: Set the employee session
      setEstablishmentId(establishment.id);
      setCurrentUser({
        id: employee.id,
        name: employee.name,
        email: ownerEmail,
        avatar: employee.avatar_url,
        role: 'employee',
        employeeId: employee.id,
        permissions: employee.permissions ?? {
          viewAgenda: true,
          viewClients: false,
          viewFinancial: false,
          viewReports: false,
          viewProducts: false,
          viewComandas: false,
          editAgenda: true,
          editClients: false,
        },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError('Erro ao fazer login. Tente novamente.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthLayout showBackButton onBackPress={() => router.replace('/login')}>
        <View className="mb-8 mt-2">
          <View className="w-16 h-16 bg-appbello-primary/10 rounded-2xl items-center justify-center mb-5">
            <Key color="#6666cc" size={32} variant="Outline" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Acesso Funcionário</Text>
          <Text className="text-gray-500 text-base">Entre com o PIN fornecido pelo seu gestor.</Text>
        </View>

        {error ? (
          <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <Text className="text-red-400 font-medium text-center">{error}</Text>
          </View>
        ) : null}

        <View className="space-y-4">
          <Input
            label="E-mail do Estabelecimento"
            placeholder="email@do-gestor.com"
            value={ownerEmail}
            onChangeText={(t) => { setOwnerEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Sms color="#94A3B8" size={20} variant="Outline" />}
            helper="O e-mail do dono/gestor do estabelecimento."
            className="mb-4"
          />

          <Input
            label="PIN de Acesso"
            placeholder="••••"
            value={pin}
            onChangeText={(t) => { setPin(t.replace(/\D/g, '')); setError(''); }}
            keyboardType="numeric"
            secureTextEntry
            icon={<Lock color="#94A3B8" size={20} variant="Outline" />}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`h-14 mt-8 rounded-2xl items-center justify-center flex-row ${isLoading ? 'bg-appbello-primary/70' : 'bg-appbello-primary'}`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Lock color="#FFF" size={18} variant="Outline" />
                <Text className="text-white font-bold text-lg ml-2">Entrar</Text>
              </>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-10">
            <TouchableOpacity
              onPress={() => router.replace('/login')}
              className="flex-row items-center"
            >
              <Text className="text-appbello-primary font-bold text-base">Sou gestor/dono</Text>
              <ArrowRight2 color="#6666cc" size={16} variant="Outline" />
            </TouchableOpacity>
          </View>
        </View>
      </AuthLayout>
    </>
  );
}
