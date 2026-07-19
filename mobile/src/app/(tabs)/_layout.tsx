import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Home2, Element4, Note, User } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'opacity-100' : 'opacity-70'}>
              <Home2 size={22} color={color} variant={focused ? 'Bold' : 'Outline'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'opacity-100' : 'opacity-70'}>
              <Element4 size={22} color={color} variant={focused ? 'Bold' : 'Outline'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'opacity-100' : 'opacity-70'}>
              <Note size={22} color={color} variant={focused ? 'Bold' : 'Outline'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'opacity-100' : 'opacity-70'}>
              <User size={22} color={color} variant={focused ? 'Bold' : 'Outline'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
