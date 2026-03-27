import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAppTheme } from '@/context/app-theme-context';

const WEEK_DAYS = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'] as const;
const CURRENT_PROGRESS_DAY = 0;
const STREAK_DAYS = 3;

export default function DailyChallengeOverlayScreen() {
  const { effectiveColorScheme } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);

  const colors = useMemo(
    () => ({
      screen: isDark ? '#060606' : '#F2F4F7',
      card: isDark ? '#0E0E0E' : '#FFFFFF',
      border: isDark ? '#202020' : '#DFE3E8',
      textPrimary: isDark ? '#FFFFFF' : '#111111',
      textSecondary: isDark ? '#9C9C9C' : '#667085',
      purple: '#6B46FF',
      yellowFlag: '#FACC15',
      disabled: isDark ? '#1A1A1A' : '#F3F4F6',
      disabledText: isDark ? '#666666' : '#98A2B3',
      pill: isDark ? '#1F1A38' : '#ECE7FF',
    }),
    [isDark]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.backdrop, { backgroundColor: colors.screen }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#FFFFFF' : '#111111'} />}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Aprender a rapear</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>Aprende las nociones básicas para empezar a rapear y formar tus primeros versos improvisados.</Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.purple }]}>
            <Text style={styles.primaryButtonText}>Empezar ahora</Text>
          </Pressable>
        </View>

        <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.sectionHeaderInline}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Rapea con gente</Text>
            <View style={[styles.soonPill, { backgroundColor: colors.pill }]}>
              <Text style={[styles.soonPillText, { color: colors.purple }]}>Próximamente</Text>
            </View>
          </View>

          <View style={[styles.disabledAction, { backgroundColor: colors.disabled, borderColor: colors.border }]}>
            <Text style={[styles.disabledActionText, { color: colors.disabledText }]}>Buscar enfrentamiento</Text>
          </View>

          <View style={[styles.disabledAction, { backgroundColor: colors.disabled, borderColor: colors.border }]}>
            <Text style={[styles.disabledActionText, { color: colors.disabledText }]}>Rapear como dupla</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.sectionHeaderInline}>
            <View style={styles.flagTitleWrap}>
              <MaterialIcons name="flag" size={20} color={colors.yellowFlag} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Retos diarios</Text>
            </View>
            <View style={[styles.streakPill, { backgroundColor: colors.pill }]}> 
              <MaterialIcons name="local-fire-department" size={14} color={colors.purple} />
              <Text style={[styles.streakText, { color: colors.purple }]}>{STREAK_DAYS} días de racha</Text>
            </View>
          </View>

          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>Completa los retos diarios, mejora tu freestyle y demuestra todo lo aprendido.</Text>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.purple }]}
            onPress={() => setChallengeModalVisible(true)}>
            <Text style={styles.primaryButtonText}>Ver reto diario</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal animationType="slide" visible={challengeModalVisible} transparent onRequestClose={() => setChallengeModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reto diario</Text>
              <Pressable onPress={() => setChallengeModalVisible(false)} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>Supera un nivel por día para completar la semana completa.</Text>

            <View style={styles.progressGrid}>
              {WEEK_DAYS.map((day, index) => {
                const isCurrentDay = index === CURRENT_PROGRESS_DAY;
                const isFirstDay = index === 0;
                return (
                  <View
                    key={day}
                    style={[
                      styles.dayNode,
                      {
                        borderColor: isCurrentDay ? colors.yellowFlag : colors.border,
                        backgroundColor: isCurrentDay ? 'rgba(250, 204, 21, 0.15)' : isDark ? '#121212' : '#F8FAFC',
                      },
                    ]}>
                    <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day}</Text>
                    <Text style={[styles.dayValue, { color: isCurrentDay ? colors.yellowFlag : colors.textPrimary }]}>{isFirstDay ? 'Easy Mode' : '?'}</Text>
                  </View>
                );
              })}
            </View>

            <Pressable style={[styles.primaryButton, { backgroundColor: colors.purple }]} onPress={() => setChallengeModalVisible(false)}>
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 14,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionHeaderInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  flagTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  soonPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  soonPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  disabledAction: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  disabledActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 14,
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressGrid: {
    marginTop: 8,
    gap: 10,
  },
  dayNode: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
