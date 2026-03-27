import { useMemo } from 'react';

import { useAppTheme } from '@/context/app-theme-context';

export function useAppThemeColors() {
  const { effectiveColorScheme } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';

  return useMemo(
    () => ({
      isDark,
      screen: isDark ? '#0D0A1A' : '#F5F2FF',
      card: isDark ? '#121212' : '#FFFFFF',
      border: isDark ? '#2A2A2A' : '#DFE3E8',
      sectionBorder: isDark ? '#5E5E5E' : '#C7A5FF',
      textPrimary: isDark ? '#FFFFFF' : '#111111',
      textSecondary: isDark ? '#AFAFAF' : '#667085',
      inputBg: isDark ? '#131313' : '#F4F5F7',
      overlay: isDark ? '#000000A8' : '#00000066',
      iconChip: isDark ? '#171717' : '#FFFFFF',
      mutedBg: isDark ? '#141414' : '#F8FAFC',
      purple: '#6B46FF',
      yellowFlag: '#FACC15',
    }),
    [isDark]
  );
}
