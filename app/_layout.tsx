import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

async function restoreSessionState() {
  /**
   * Punto de extensión:
   * aquí se puede hidratar sesión real (token/perfil) cuando exista
   * infraestructura de autenticación persistente.
   */
  return Promise.resolve();
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
      await Promise.all([loadCoreAssets(), restoreSessionState()]);

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
      <SafeAreaView style={styles.launchScreen} edges={['top', 'bottom']}>
        <View style={styles.logoWrap}>
          <MaterialIcons name="mic" size={44} color="#FFFFFF" />
        </View>
        <Text style={styles.launchTitle}>FreestyleZone</Text>
        <Text style={styles.launchSubtitle}>Cargando recursos y sesión...</Text>
        <ActivityIndicator size="small" color="#7C5CFF" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <AppThemeProvider>
      <AppNavigator />
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  launchScreen: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#101010',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchTitle: {
    marginTop: 18,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loader: {
    marginTop: 12,
  },
  launchSubtitle: {
    marginTop: 8,
    color: '#9B9B9B',
    fontSize: 13,
  },
});
