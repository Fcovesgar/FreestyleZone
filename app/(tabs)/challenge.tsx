import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAppTheme } from '@/context/app-theme-context';

const WEEK_DAYS = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'] as const;
const CURRENT_PROGRESS_DAY = 0;
const STREAK_DAYS = 3;

const NOTIFICATIONS = [
  {
    title: 'Nuevo reto desbloqueado',
    description: 'Hoy te toca improvisar usando 3 palabras sorpresa.',
    time: 'Hace 1 h',
  },
  {
    title: 'Tu racha sigue viva',
    description: 'Te faltan 2 minutos para completar el reto diario de hoy.',
    time: 'Hace 3 h',
  },
] as const;

const ANNOUNCEMENTS = [
  {
    title: 'Liga semanal de freestyle',
    description: 'El lunes arrancan las clasificaciones abiertas para todos los niveles.',
  },
  {
    title: 'Mejora de bases en camino',
    description: 'Estamos preparando nuevas instrumentales para las sesiones de práctica.',
  },
] as const;

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
      heroFrom: isDark ? '#2B1A6D' : '#6B46FF',
      heroTo: isDark ? '#171027' : '#8E6DFF',
      infoBg: isDark ? '#131313' : '#F8FAFC',
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
        <View style={[styles.heroCard, { borderColor: colors.border, backgroundColor: colors.heroFrom }]}> 
          <View style={[styles.heroTint, { backgroundColor: colors.heroTo }]} />
          <Text style={styles.heroTitle}>Inicio</Text>
          <Text style={styles.heroDescription}>Entrena, mantén tu racha y prepárate para romperla en cada sesión de freestyle.</Text>
          <View style={styles.heroPillsRow}>
            <View style={[styles.streakPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}> 
              <MaterialIcons name="local-fire-department" size={14} color="#FFFFFF" />
              <Text style={[styles.streakText, { color: '#FFFFFF' }]}>{STREAK_DAYS} días de racha</Text>
            </View>
            <View style={[styles.heroSmallPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}> 
              <Text style={styles.heroSmallPillText}>Nivel Novato</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.card }]}> 
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tus primeros pasos</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>Aprende las nociones básicas para empezar a rapear y formar tus primeros versos improvisados.</Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.purple }]}>
            <Text style={styles.primaryButtonText}>Empezar tutorial</Text>
          </Pressable>
        </View>

        <View style={styles.twoColumnWrap}>
          <View style={[styles.sideCard, { borderColor: colors.border, backgroundColor: colors.card }]}> 
            <View style={styles.sideHeaderRow}>
              <MaterialIcons name="campaign" size={18} color={colors.purple} />
              <Text style={[styles.sideTitle, { color: colors.textPrimary }]}>Tablón de anuncios</Text>
            </View>
            {ANNOUNCEMENTS.map((item) => (
              <View key={item.title} style={[styles.infoItem, { backgroundColor: colors.infoBg, borderColor: colors.border }]}> 
                <Text style={[styles.infoItemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.infoItemText, { color: colors.textSecondary }]}>{item.description}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.sideCard, { borderColor: colors.border, backgroundColor: colors.card }]}> 
            <View style={styles.sideHeaderRow}>
              <MaterialIcons name="notifications" size={18} color={colors.purple} />
              <Text style={[styles.sideTitle, { color: colors.textPrimary }]}>Mis notificaciones</Text>
            </View>
            {NOTIFICATIONS.map((item) => (
              <View key={item.title} style={[styles.infoItem, { backgroundColor: colors.infoBg, borderColor: colors.border }]}> 
                <Text style={[styles.infoItemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.infoItemText, { color: colors.textSecondary }]}>{item.description}</Text>
                <Text style={[styles.infoItemTime, { color: colors.disabledText }]}>{item.time}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.sectionCard, { borderColor: colors.border, backgroundColor: colors.card }]}> 
          <View style={styles.sectionHeaderInline}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Rapea con gente</Text>
            <View style={[styles.soonPill, { backgroundColor: colors.pill }]}> 
              <Text style={[styles.soonPillText, { color: colors.purple }]}>Próximamente</Text>
            </View>
          </View>

          <View style={[styles.disabledAction, { backgroundColor: colors.disabled, borderColor: colors.border }]}> 
            <Text style={[styles.disabledActionTitle, { color: colors.disabledText }]}>Buscar enfrentamiento</Text>
            <Text style={[styles.disabledActionDescription, { color: colors.disabledText }]}>busca oponente para medir tu nivel de freestyle</Text>
          </View>

          <View style={[styles.disabledAction, { backgroundColor: colors.disabled, borderColor: colors.border }]}> 
            <Text style={[styles.disabledActionTitle, { color: colors.disabledText }]}>Rapear como dupla</Text>
            <Text style={[styles.disabledActionDescription, { color: colors.disabledText }]}>Rapea junto a otro MC y crea nuevas combinaciones</Text>
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
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    gap: 10,
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroDescription: {
    color: '#F4F0FF',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '95%',
  },
  heroPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  heroSmallPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroSmallPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  twoColumnWrap: {
    gap: 12,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  sideCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
  },
  sideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sideTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoItem: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
  },
  infoItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoItemText: {
    fontSize: 12,
    lineHeight: 17,
  },
  infoItemTime: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
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
    flexShrink: 1,
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
    gap: 4,
  },
  disabledActionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  disabledActionDescription: {
    fontSize: 12,
    lineHeight: 17,
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
