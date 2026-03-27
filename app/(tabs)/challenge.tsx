import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeableTabScreen } from '@/components/swipeable-tab-screen';
import { useAppTheme } from '@/context/app-theme-context';

export default function DailyChallengeOverlayScreen() {
  const { effectiveColorScheme } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.backdrop, { backgroundColor: isDark ? '#060606' : '#F2F4F7' }]} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#FFFFFF' : '#111111'} />}
          showsVerticalScrollIndicator={false}>
          <View
            style={[styles.overlayCard, { borderColor: isDark ? '#202020' : '#DFE3E8', backgroundColor: isDark ? '#0E0E0E' : '#FFFFFF' }]}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111111' }]}>Inicio</Text>
            <Text style={[styles.description, { color: isDark ? '#9C9C9C' : '#667085' }]}>Overlay pendiente de diseño.</Text>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  overlayCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
  },
});
