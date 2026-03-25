import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

const TAB_BAR_BACKGROUND = '#090909';
const ACTIVE_COLOR = '#FFFFFF';
const INACTIVE_COLOR = '#7D7D7D';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BACKGROUND,
          borderTopColor: '#151515',
          height: 62 + insets.bottom,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      }}>
      <Tabs.Screen
        name="challenge"
        options={{
          title: 'Reto diario',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="flame.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rapear',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.micTabIcon, focused && styles.micTabIconFocused]}>
              <View style={styles.micTabGlowLeft} />
              <View style={styles.micTabGlowRight} />
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
    width: 38,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  micTabIconFocused: {
    backgroundColor: '#1A1A1A',
    borderColor: '#3A3A3A',
  },
  micTabGlowLeft: {
    position: 'absolute',
    left: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#25F4EE',
    opacity: 0.55,
  },
  micTabGlowRight: {
    position: 'absolute',
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FE2C55',
    opacity: 0.55,
  },
});
