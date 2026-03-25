import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme as useSystemColorScheme } from 'react-native';

type ThemePreference = 'light' | 'dark';

type AppThemeContextValue = {
  effectiveColorScheme: NonNullable<ColorSchemeName>;
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>('dark');

  const effectiveColorScheme = themePreference ?? systemColorScheme ?? 'dark';

  const value = useMemo(
    () => ({
      effectiveColorScheme,
      themePreference,
      setThemePreference,
    }),
    [effectiveColorScheme, themePreference]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }

  return context;
}
