import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppThemeProvider, useAppTheme } from '@/context/app-theme-context';
import { AuthEntryModal, AuthProvider } from '@/context/auth-context';


if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync().catch(() => {
    // no-op: avoid crash when native splash is not registered in this runtime
  });
}

async function loadCoreAssets() {
  await Asset.loadAsync([
    require('../assets/images/icon.png'),
    require('../assets/images/splash-icon.png'),
    require('../assets/images/android-icon-foreground.png'),
  ]);
}

function waitForMinimumLaunchTime(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function AppNavigator() {
  const { effectiveColorScheme } = useAppTheme();

  return (
    <ThemeProvider value={effectiveColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
      <StatusBar style={effectiveColorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthEntryModal />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const prepare = async () => {
      await Promise.all([loadCoreAssets(), waitForMinimumLaunchTime(1500)]);

      if (!mounted) {
        return;
      }

      setAppReady(true);

      if (Platform.OS !== 'web') {
        await SplashScreen.hideAsync().catch(() => {
          // no-op: avoid crash when splash is already hidden / unavailable
        });
      }
    };

    void prepare();

    return () => {
      mounted = false;
    };
  }, []);

  if (!appReady) {
    return (
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SafeAreaView style={styles.launchScreen} edges={['top', 'bottom']}>
          <Text style={styles.launchTitle}>FreestyleZone</Text>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <AppThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  launchScreen: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
