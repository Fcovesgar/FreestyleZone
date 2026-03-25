import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
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
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
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
        name="challenge"
        options={{
          title: 'Reto diario',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="flag.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rapear',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.micTabIcon, focused && styles.micTabIconFocused, !isDark && styles.micTabIconLight]}>
              <View style={styles.micTabAccent} />
              <IconSymbol size={20} name="mic.fill" color="#FFFFFF" />
            </View>
          ),
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

const styles = StyleSheet.create({
  micTabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#101014',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272E',
  },
  micTabIconLight: {
    backgroundColor: '#17171D',
    borderColor: '#393943',
  },
  micTabIconFocused: {
    borderColor: '#6B46FF',
    shadowColor: '#6B46FF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  micTabAccent: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 10,
    borderColor: '#6B46FF55',
  },
});
