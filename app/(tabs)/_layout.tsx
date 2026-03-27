import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme } from '@/context/app-theme-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { effectiveColorScheme } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';

  return (
    <Tabs
      initialRouteName="challenge"
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarButton: HapticTab,
        tabBarActiveTintColor: isDark ? '#FFFFFF' : '#111111',
        tabBarInactiveTintColor: isDark ? '#7D7D7D' : '#777777',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#090909' : '#FFFFFF',
          borderTopColor: isDark ? '#151515' : '#E5E5E5',
          height: 62 + insets.bottom,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rapear',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="mic.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="challenge"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mi perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
