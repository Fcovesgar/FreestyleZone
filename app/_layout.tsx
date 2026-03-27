import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppThemeProvider, useAppTheme } from '@/context/app-theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

void SplashScreen.preventAutoHideAsync();

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
      await SplashScreen.hideAsync();
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
        <AppNavigator />
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
