import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAppTheme } from '@/context/app-theme-context';

const WEEK_DAYS = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'] as const;
const CURRENT_PROGRESS_DAY = 0;
const STREAK_DAYS = 3;
const VIEW_TOP_OFFSET = 12;

const NOTIFICATIONS: { id: string; title: string; detail: string }[] = [];

const BOARD_NEWS = [
  {
    id: 'welcome-freestylezone',
    title: 'Bienvenido freestyler',
    detail:
      'Gracias por unirte: aquí podrás entrenar a tu ritmo, mejorar tus barras cada día y disfrutar del camino en el freestyle.',
  },
];

const UPCOMING_NEWS = [
  {
    id: 'metrics-ia',
    title: 'Descubre las métricas en tus versos',
    detail:
      'La IA se encargará de colorear tus versos para poder identificar las métricas internas de tus patrones.',
  },
];

export default function DailyChallengeOverlayScreen() {
  const { effectiveColorScheme } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';

  const [refreshing, setRefreshing] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [boardModalVisible, setBoardModalVisible] = useState(false);
  const [boardNews, setBoardNews] = useState(BOARD_NEWS);

  const colors = useMemo(
    () => ({
      screen: isDark ? '#0D0A1A' : '#F5F2FF',
      card: isDark ? '#121212' : '#FFFFFF',
      border: isDark ? '#2A2A2A' : '#DCCFFF',
      textPrimary: isDark ? '#FFFFFF' : '#111111',
      textSecondary: isDark ? '#B8B8B8' : '#667085',
      purple: '#6B46FF',
      yellowFlag: '#FACC15',
      sectionBorder: isDark ? '#5E5E5E' : '#C7A5FF',
      pill: isDark ? '#1A1A1A' : '#ECE7FF',
      iconChip: isDark ? '#171717' : '#FFFFFF',
      mutedBg: isDark ? '#141414' : '#F8FAFC',
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
        <View style={styles.topBar}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Inicio</Text>
          <View style={styles.topActions}>
            <Pressable style={[styles.iconButton, { backgroundColor: colors.iconChip, borderColor: colors.border }]} onPress={() => setBoardModalVisible(true)}>
              <MaterialIcons name="campaign" size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={[styles.iconButton, { backgroundColor: colors.iconChip, borderColor: colors.border }]} onPress={() => setNotificationsModalVisible(true)}>
              <MaterialIcons name="notifications" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.sectionCard, { borderColor: colors.sectionBorder, backgroundColor: colors.card }]}>
          <View style={styles.sectionTitleWithIcon}>
            <MaterialIcons name="school" size={20} color={colors.purple} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tus primeros pasos</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>Aprende las nociones básicas para empezar a rapear y formar tus primeros versos improvisados.</Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.purple }]}>
            <Text style={styles.primaryButtonText}>Empezar tutorial</Text>
          </Pressable>
        </View>

        <View style={[styles.sectionCard, { borderColor: colors.sectionBorder, backgroundColor: colors.card }]}>
          <View style={styles.sectionHeaderInline}>
            <View style={styles.flagTitleWrap}>
              <MaterialIcons name="flag" size={20} color={colors.yellowFlag} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Retos diarios</Text>
            </View>
            <View style={[styles.streakPill, { backgroundColor: colors.pill }]}>
              <MaterialIcons name="local-fire-department" size={14} color={colors.purple} />
              <Text style={[styles.streakText, { color: colors.purple }]}>{STREAK_DAYS} días</Text>
            </View>
          </View>

          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>Completa los retos diarios, mejora tu freestyle y demuestra todo lo aprendido.</Text>

          <Pressable style={[styles.primaryButton, { backgroundColor: colors.purple }]} onPress={() => setChallengeModalVisible(true)}>
            <Text style={styles.primaryButtonText}>Abrir progresión semanal</Text>
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

      <Modal animationType="fade" transparent visible={notificationsModalVisible} onRequestClose={() => setNotificationsModalVisible(false)}>
        <View style={styles.modalBackdropCenter}>
          <View style={[styles.centerModalCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <ScrollView contentContainerStyle={styles.centerModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.centerModalTitle, { color: colors.textPrimary }]}>Mis notificaciones</Text>
                <Pressable onPress={() => setNotificationsModalVisible(false)} hitSlop={8}>
                  <MaterialIcons name="close" size={22} color={colors.textPrimary} />
                </Pressable>
              </View>

              {NOTIFICATIONS.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.mutedBg, borderColor: colors.border }]}>
                  <MaterialIcons name="notifications-none" size={22} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay notificaciones por ahora.</Text>
                </View>
              ) : (
                NOTIFICATIONS.map((item) => (
                  <View key={item.id} style={[styles.upcomingBox, { borderColor: colors.border, backgroundColor: colors.mutedBg }]}>
                    <Text style={[styles.upcomingTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.upcomingText, { color: colors.textSecondary }]}>{item.detail}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={boardModalVisible} onRequestClose={() => setBoardModalVisible(false)}>
        <View style={styles.modalBackdropCenter}>
          <View style={[styles.centerModalCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <ScrollView contentContainerStyle={styles.centerModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={[styles.centerModalTitle, { color: colors.textPrimary }]}>Tablón de anuncios</Text>
                <Pressable onPress={() => setBoardModalVisible(false)} hitSlop={8}>
                  <MaterialIcons name="close" size={22} color={colors.textPrimary} />
                </Pressable>
              </View>

              {boardNews.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.mutedBg, borderColor: colors.border }]}>
                  <MaterialIcons name="campaign" size={22} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay anuncios por ahora.</Text>
                </View>
              ) : (
                boardNews.map((item) => (
                  <View key={item.id} style={[styles.upcomingBox, { borderColor: colors.border, backgroundColor: colors.mutedBg }]}>
                    <View style={styles.newsHeaderRow}>
                      <Text style={[styles.upcomingTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                      <Pressable onPress={() => setBoardNews((prev) => prev.filter((news) => news.id !== item.id))} hitSlop={8}>
                        <MaterialIcons name="delete-outline" size={18} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                    <Text style={[styles.upcomingText, { color: colors.textSecondary }]}>{item.detail}</Text>
                  </View>
                ))
              )}

              <View style={styles.categoryRow}>
                <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>Próximamente</Text>
              </View>

              {UPCOMING_NEWS.map((item) => (
                <View key={item.id} style={[styles.upcomingBox, { borderColor: colors.border, backgroundColor: colors.mutedBg }]}>
                  <Text style={[styles.upcomingTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.upcomingText, { color: colors.textSecondary }]}>{item.detail}</Text>
                </View>
              ))}

              <View style={[styles.upcomingBox, { borderColor: colors.border, backgroundColor: colors.mutedBg }]}>
                <Text style={[styles.upcomingTitle, { color: colors.textPrimary }]}>Rapea con gente</Text>
                <Text style={[styles.upcomingText, { color: colors.textSecondary }]}>Buscar enfrentamiento: busca oponente para medir tu nivel de freestyle.</Text>
                <Text style={[styles.upcomingText, { color: colors.textSecondary }]}>Rapear como dupla: Rapea junto a otro MC y crea nuevas combinaciones.</Text>
              </View>
            </ScrollView>
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
    paddingTop: VIEW_TOP_OFFSET,
    paddingBottom: 16,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 2,
  },
  sectionTitleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', flexShrink: 1 },
  sectionDescription: { fontSize: 14, lineHeight: 20 },
  primaryButton: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, lineHeight: 20 },
  progressGrid: { marginTop: 8, gap: 10 },
  dayNode: { borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 4 },
  dayLabel: { fontSize: 12, fontWeight: '600' },
  dayValue: { fontSize: 16, fontWeight: '700' },
  emptyBox: { borderRadius: 12, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyText: { fontSize: 14, textAlign: 'center', fontWeight: '600' },
  upcomingBox: { borderRadius: 12, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 6 },
  upcomingTitle: { fontSize: 14, fontWeight: '700' },
  upcomingText: { fontSize: 12, lineHeight: 17 },
  newsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  categoryText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
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
  modalBackdropCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, gap: 14, minHeight: '60%' },
  centerModalCard: { borderRadius: 18, borderWidth: 1, maxHeight: '82%' },
  centerModalContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '800' },
  centerModalTitle: { fontSize: 20, fontWeight: '800' },
  modalDescription: { fontSize: 14, lineHeight: 20 },
});
