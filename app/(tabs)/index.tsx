import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/app-theme-context';

type RapMode = 'easy' | 'hard' | 'incremental' | 'history' | 'ending' | 'images';
type Track = 'base-1' | 'base-2' | 'base-3';
type SessionTime = '1-min' | '2-min' | '5-min' | 'infinite';
type SessionType = 'record' | 'train';
type CameraFacing = 'front' | 'back';

type SessionSummary = {
  mode: RapMode | null;
  sessionType: SessionType;
  track: Track | null;
  elapsedSeconds: number;
};

const RAP_MODES: { key: RapMode; label: string; description: string }[] = [
  { key: 'easy', label: 'Easy', description: 'Palabras cada 10s' },
  { key: 'hard', label: 'Hard', description: 'Palabras cada 5s' },
  { key: 'incremental', label: 'Incremental', description: 'Palabras cada 10s - 5s - 2s' },
  { key: 'history', label: 'Historia', description: 'Crea historia con palabras' },
  { key: 'ending', label: 'Terminación', description: 'Rapea con terminaciones' },
  { key: 'images', label: 'Imágenes', description: 'Rapea con imágenes' },
];

const TRACKS: { key: Track; label: string }[] = [
  { key: 'base-1', label: 'Base Boom Bap' },
  { key: 'base-2', label: 'Base Trap' },
  { key: 'base-3', label: 'Base Lo-Fi' },
];

const SESSION_TIMES: { key: SessionTime; label: string }[] = [
  { key: '1-min', label: '1 min' },
  { key: '2-min', label: '2 min' },
  { key: '5-min', label: '5 min' },
];

const TRAINING_TIME: { key: SessionTime; label: string }[] = [{ key: 'infinite', label: 'Infinito' }];

const SESSION_TYPES: { key: SessionType; label: string }[] = [
  { key: 'record', label: 'Grabar' },
  { key: 'train', label: 'Entrenar' },
];

const PRE_RECORD_COUNTDOWN_SECONDS = 5;

export default function RapearScreen() {
  const insets = useSafeAreaInsets();
  const { effectiveColorScheme } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';

  const themeColors = useMemo(
    () => ({
      isDark,
      screen: isDark ? '#000000' : '#F3F5F8',
      card: isDark ? '#0D0D0D' : '#FFFFFF',
      border: isDark ? '#1D1D1D' : '#E2E5EA',
      textPrimary: isDark ? '#FFFFFF' : '#111111',
      textSecondary: isDark ? '#8C8C8C' : '#67707D',
      chipBg: isDark ? '#101010' : '#F4F5F8',
      chipBorder: isDark ? '#242424' : '#DCE1E7',
      chipText: isDark ? '#B7B7B7' : '#4B5563',
      startBg: '#6B46FF',
      startText: '#FFFFFF',
      disabledStartBg: isDark ? '#2A2A2A' : '#D1D5DB',
      disabledStartText: isDark ? '#787878' : '#6B7280',
    }),
    [isDark]
  );
  const [selectedMode, setSelectedMode] = useState<RapMode | null>('easy');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedSessionTime, setSelectedSessionTime] = useState<SessionTime | null>('1-min');
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('record');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [sessionVisible, setSessionVisible] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('front');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isUnlimitedSession, setIsUnlimitedSession] = useState(false);
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initialSessionSeconds = getSessionDuration(selectedSessionTime);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, []);

  const isReadyToStart = useMemo(
    () => selectedMode !== null && selectedTrack !== null && selectedSessionTime !== null,
    [selectedMode, selectedTrack, selectedSessionTime]
  );
  const topModes = RAP_MODES.filter((mode) => ['easy', 'hard', 'incremental'].includes(mode.key));
  const bottomModes = RAP_MODES.filter((mode) => ['history', 'ending', 'images'].includes(mode.key));
  const availableSessionTimes = selectedSessionType === 'train' ? TRAINING_TIME : SESSION_TIMES;

  const selectedModeLabel = RAP_MODES.find((mode) => mode.key === selectedMode)?.label ?? '-';
  const selectedTrackLabel = TRACKS.find((track) => track.key === selectedTrack)?.label ?? '-';

  const onSelectSessionType = (sessionType: SessionType) => {
    setSelectedSessionType(sessionType);

    if (sessionType === 'train') {
      setSelectedSessionTime('infinite');
      return;
    }

    if (selectedSessionTime === 'infinite') {
      setSelectedSessionTime('1-min');
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Permiso de cámara',
        message: 'Necesitamos acceder a tu cámara para grabar tu sesión de freestyle.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Cancelar',
        buttonNeutral: 'Más tarde',
      });

      const accepted = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasCameraPermission(accepted);
      return accepted;
    }

    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        setHasCameraPermission(true);
        return true;
      } catch {
        setHasCameraPermission(false);
        return false;
      }
    }

    // En iOS nativo, sin SDK de cámara instalada, no podemos forzar prompt real aquí.
    setHasCameraPermission(true);
    return true;
  };

  const openSession = async () => {
    if (!isReadyToStart) return;

    if (selectedSessionType === 'record') {
      const granted = await requestCameraPermission();
      if (!granted) {
        return;
      }
    }

    setSessionVisible(true);
    setCountdown(null);
    setElapsedSeconds(0);
    setIsUnlimitedSession(initialSessionSeconds === null);
    setRemainingSeconds(initialSessionSeconds);
    setHasSessionStarted(false);
  };

  const startSessionTimer = () => {
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    setHasSessionStarted(true);

    sessionIntervalRef.current = setInterval(() => {
      setElapsedSeconds((previousElapsed) => previousElapsed + 1);

      setRemainingSeconds((previousRemaining) => {
        if (previousRemaining === null) {
          return null;
        }

        if (previousRemaining <= 1) {
          return 0;
        }

        return previousRemaining - 1;
      });
    }, 1000);
  };

  const onStartRecordingPress = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setCountdown(PRE_RECORD_COUNTDOWN_SECONDS);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((previousCountdown) => {
        if (previousCountdown === null) {
          return PRE_RECORD_COUNTDOWN_SECONDS;
        }

        const nextCountdown = previousCountdown - 1;
        Vibration.vibrate(90);

        if (nextCountdown <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          startSessionTimer();
          return null;
        }

        return nextCountdown;
      });
    }, 1000);
  };

  const finishSession = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);

    setSessionVisible(false);
    setCountdown(null);
    setRemainingSeconds(initialSessionSeconds);
    setIsUnlimitedSession(initialSessionSeconds === null);
    setHasSessionStarted(false);
    setSessionSummary({
      mode: selectedMode,
      sessionType: selectedSessionType,
      track: selectedTrack,
      elapsedSeconds,
    });
    setSummaryVisible(true);
    setElapsedSeconds(0);
  };

  const stopSession = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);

    setSessionVisible(false);
    setCountdown(null);
    setRemainingSeconds(initialSessionSeconds);
    setElapsedSeconds(0);
    setIsUnlimitedSession(initialSessionSeconds === null);
    setHasSessionStarted(false);
  };

  const extendSession = () => {
    setIsUnlimitedSession(true);
    setRemainingSeconds(null);
  };

  const shouldShowExtendAction = !isUnlimitedSession && remainingSeconds !== null && remainingSeconds <= 10;

  const displayTimer = isUnlimitedSession || remainingSeconds === null ? formatTime(elapsedSeconds) : formatTime(remainingSeconds);
  const timerColor = getSessionTimerColor(remainingSeconds, initialSessionSeconds, isUnlimitedSession);

  useEffect(() => {
    if (!isUnlimitedSession && remainingSeconds === 0) {
      finishSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isUnlimitedSession]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.screen }]} edges={['top', 'bottom']}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !isReadyToStart }}
        disabled={!isReadyToStart}
        onPress={openSession}
        style={[
          styles.startButtonFloating,
          { top: insets.top + 10 },
          { backgroundColor: themeColors.startBg },
          !isReadyToStart && [styles.startButtonDisabled, { backgroundColor: themeColors.disabledStartBg }],
        ]}>
        <Text style={[styles.startButtonText, { color: themeColors.startText }, !isReadyToStart && [styles.startButtonTextDisabled, { color: themeColors.disabledStartText }]]}>Empezar</Text>
      </Pressable>

      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.screen }]}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 }]}>
        <Text style={[styles.badge, { color: themeColors.textSecondary }]}>FreestyleZone</Text>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>Configura tu sesión</Text>

        <View style={[styles.sessionTypeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.sessionTypeHeaderRow}>
            <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Rapear</Text>
            <Text style={[styles.sessionTypeHelp, { color: themeColors.textSecondary }]}>Modo sesión</Text>
          </View>
          <View style={[styles.sessionTypeSegment, { backgroundColor: themeColors.chipBg, borderColor: themeColors.chipBorder }]}>
            {SESSION_TYPES.map((sessionType) => {
              const isSelected = selectedSessionType === sessionType.key;

              return (
                <Pressable
                  key={sessionType.key}
                  onPress={() => onSelectSessionType(sessionType.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.sessionTypeOption, isSelected && styles.sessionTypeOptionSelected]}>
                  <MaterialIcons
                    name={sessionType.key === 'record' ? 'mic' : 'school'}
                    size={16}
                    color={isSelected ? '#FFFFFF' : themeColors.textSecondary}
                  />
                  <Text style={[styles.sessionTypeOptionText, { color: isSelected ? '#FFFFFF' : themeColors.textSecondary }]}>
                    {sessionType.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Selecciona el modo.</Text>
          <View style={styles.modePrimaryRow}>
            {topModes.map((mode) => (
              <SelectableChip
                key={mode.key}
                label={mode.label}
                description={mode.description}
                selected={selectedMode === mode.key}
                onPress={() => setSelectedMode(mode.key)}
                selectionVariant={mode.key}
                modePrimary
                themeColors={themeColors}
              />
            ))}
          </View>
          <View style={styles.modePrimaryRow}>
            {bottomModes.map((mode) => (
              <SelectableChip
                key={mode.key}
                label={mode.label}
                description={mode.description}
                selected={selectedMode === mode.key}
                onPress={() => setSelectedMode(mode.key)}
                selectionVariant={mode.key}
                modePrimary
                themeColors={themeColors}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Base de fondo</Text>
          <View style={styles.optionsColumn}>
            {TRACKS.map((track) => (
              <SelectableChip
                key={track.key}
                label={track.label}
                selected={selectedTrack === track.key}
                onPress={() => setSelectedTrack(track.key)}
                fullWidth
                themeColors={themeColors}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Tiempo de la sesión</Text>
          <View style={styles.optionsRow}>
            {availableSessionTimes.map((sessionTime) => (
              <SelectableChip
                key={sessionTime.key}
                label={sessionTime.label}
                selected={selectedSessionTime === sessionTime.key}
                onPress={() => setSelectedSessionTime(sessionTime.key)}
                themeColors={themeColors}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={sessionVisible} animationType="slide" onRequestClose={stopSession}>
        <View style={styles.sessionFullscreen}>
          <View style={[styles.cameraPlaceholder, selectedSessionType === 'train' ? styles.trainingBackground : styles.recordingBackground]}>
            <View style={[styles.cameraHudTop, { paddingTop: insets.top + 8 }]}> 
              <View style={styles.sessionHeaderActions}>
                <Text style={[styles.timer, { color: timerColor }]}>{displayTimer}</Text>
                {shouldShowExtendAction ? (
                  <Pressable style={styles.extendButton} onPress={extendSession}>
                    <MaterialIcons name="add-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.extendButtonText}>Ampliar</Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable style={styles.finishButton} onPress={finishSession}>
                <Text style={styles.finishButtonText}>Finalizar</Text>
              </Pressable>
            </View>

            <View style={[styles.sessionBottomActions, { paddingBottom: insets.bottom + 26 }]}> 
              {countdown !== null ? (
                <Text style={[styles.countdownNumber, { color: getCountdownColor(countdown) }]}>{countdown}</Text>
              ) : null}

              {!hasSessionStarted && countdown === null ? (
                <View style={styles.preSessionActionsRow}>
                  <Pressable style={styles.recordButton} onPress={onStartRecordingPress}>
                    <View style={styles.recordButtonInner} />
                  </Pressable>

                  {selectedSessionType === 'record' ? (
                    <Pressable
                      style={[styles.bottomSwitchCameraButton, styles.bottomSwitchCameraButtonBeforeStart, hasCameraPermission === false && styles.bottomSwitchCameraDisabled]}
                      accessibilityLabel={`alternar cámara ${cameraFacing === 'front' ? 'frontal' : 'trasera'}`}
                      disabled={hasCameraPermission === false}
                      onPress={() => setCameraFacing((previous) => (previous === 'front' ? 'back' : 'front'))}>
                      <MaterialIcons name="sync-alt" size={20} color="#FFFFFF" />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {hasSessionStarted && selectedSessionType === 'record' ? (
                <Pressable
                  style={[styles.bottomSwitchCameraButton, hasCameraPermission === false && styles.bottomSwitchCameraDisabled]}
                  accessibilityLabel={`alternar cámara ${cameraFacing === 'front' ? 'frontal' : 'trasera'}`}
                  disabled={hasCameraPermission === false}
                  onPress={() => setCameraFacing((previous) => (previous === 'front' ? 'back' : 'front'))}>
                  <MaterialIcons name="sync-alt" size={22} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={summaryVisible} animationType="slide" onRequestClose={() => setSummaryVisible(false)}>
        <SafeAreaView style={styles.summaryScreen} edges={['top', 'bottom']}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Resumen de la sesión</Text>
            <Pressable onPress={() => setSummaryVisible(false)} style={styles.summaryCloseButton}>
              <MaterialIcons name="close" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.summaryMetaCard}>
            <Text style={styles.summaryMetaText}>Modo: {sessionSummary?.mode ? selectedModeLabel : '-'}</Text>
            <Text style={styles.summaryMetaText}>Sesión: {sessionSummary?.sessionType === 'record' ? 'Grabar' : 'Entrenar'}</Text>
            <Text style={styles.summaryMetaText}>Base: {sessionSummary?.track ? selectedTrackLabel : '-'}</Text>
            <Text style={styles.summaryMetaText}>Tiempo: {formatTime(sessionSummary?.elapsedSeconds ?? 0)}</Text>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewVideo}>
              <Text style={styles.previewTimer}>{formatTime(sessionSummary?.elapsedSeconds ?? 0)}</Text>
            </View>
            <Text style={styles.previewHint}>Preview con overlay de tiempo (sin botones de control).</Text>
          </View>

          <View style={styles.summaryActions}>
            <Pressable
              style={styles.summaryActionButton}
              onPress={() => Alert.alert('Guardar en dispositivo', 'Función preparada para conectar con guardado local de video.')}>
              <MaterialIcons name="download" size={18} color="#FFFFFF" />
              <Text style={styles.summaryActionText}>Guardar en dispositivo</Text>
            </Pressable>

            <Pressable
              style={styles.summaryActionButton}
              onPress={() => Alert.alert('Guardar en perfil', 'Función preparada para publicar el video en el perfil del usuario.')}>
              <MaterialIcons name="person" size={18} color="#FFFFFF" />
              <Text style={styles.summaryActionText}>Guardar en perfil</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function getSessionDuration(time: SessionTime | null) {
  if (time === '1-min') return 60;
  if (time === '2-min') return 120;
  if (time === '5-min') return 300;
  return null;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getSessionTimerColor(remainingSeconds: number | null, totalSeconds: number | null, isUnlimited: boolean) {
  if (isUnlimited || totalSeconds === null || remainingSeconds === null) {
    return '#FFFFFF';
  }

  const ratio = remainingSeconds / totalSeconds;

  if (ratio > 0.6) return '#22C55E';
  if (ratio > 0.3) return '#FACC15';
  if (ratio > 0.1) return '#FB923C';
  return '#EF4444';
}

function getCountdownColor(value: number) {
  if (value > 3) return '#22C55E';
  if (value > 1) return '#FACC15';
  return '#EF4444';
}

function ModeIcon({ mode, color }: { mode: RapMode; color: string }) {
  const iconNameByMode: Record<RapMode, string> = {
    easy: 'security',
    hard: 'flash-on',
    incremental: 'local-fire-department',
    history: 'history-edu',
    ending: 'text-fields',
    images: 'image',
  };

  if (mode === 'easy') {
    return <MaterialIcons name={iconNameByMode[mode] as any} size={24} color={color} />;
  }

  if (mode === 'hard') {
    return <MaterialIcons name={iconNameByMode[mode] as any} size={24} color={color} />;
  }

  if (mode === 'images') {
    return <MaterialIcons name={iconNameByMode[mode] as any} size={24} color={color} />;
  }

  return <MaterialIcons name={iconNameByMode[mode] as any} size={24} color={color} />;
}

function getModeColor(mode: RapMode, selected: boolean) {
  if (!selected) {
    return '#9F9F9F';
  }

  if (mode === 'easy') return '#22C55E';
  if (mode === 'hard') return '#F97316';
  if (mode === 'incremental') return '#EF4444';
  if (mode === 'history') return '#38BDF8';
  if (mode === 'ending') return '#FACC15';
  return '#A855F7';
}

function getModeIconColor(selected: boolean, isDarkTheme: boolean) {
  if (!selected) {
    return '#9F9F9F';
  }

  return isDarkTheme ? undefined : '#FFFFFF';
}

function getModeGlow(mode: RapMode, selected: boolean) {
  if (!selected) {
    return 'transparent';
  }

  if (mode === 'easy') return '#22C55E99';
  if (mode === 'hard') return '#F9731699';
  if (mode === 'incremental') return '#EF444499';
  if (mode === 'history') return '#38BDF899';
  if (mode === 'ending') return '#FACC1599';
  return '#A855F799';
}

function SelectableChip({
  label,
  description,
  selected,
  onPress,
  fullWidth = false,
  modePrimary = false,
  selectionVariant = 'default',
  themeColors,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  fullWidth?: boolean;
  modePrimary?: boolean;
  selectionVariant?: RapMode | 'default';
  themeColors: { isDark: boolean; chipBg: string; chipBorder: string; chipText: string; textPrimary: string; textSecondary: string };
}) {
  const selectedReadableText = '#FFFFFF';

  const selectedStyle = getChipSelectedStyle(selectionVariant, themeColors.isDark, selected);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: themeColors.chipBg, borderColor: themeColors.chipBorder }, selectedStyle, fullWidth && styles.chipFullWidth, modePrimary && styles.modePrimaryChip]}>
      {selectionVariant !== 'default' ? (
        <View style={styles.iconWrap}>
          <View style={[styles.iconGlowWrap, { shadowColor: getModeGlow(selectionVariant, selected) }]}>
            <ModeIcon mode={selectionVariant} color={getModeIconColor(selected, themeColors.isDark) ?? getModeColor(selectionVariant, selected)} />
          </View>
        </View>
      ) : null}
      <Text style={[styles.chipText, { color: themeColors.chipText }, selected && [styles.chipTextSelected, { color: selectedReadableText }]]}>{label}</Text>
      {description ? (
        <Text style={[styles.chipDescription, { color: themeColors.textSecondary }, selected && [styles.chipDescriptionSelected, { color: selectedReadableText }]]}>{description}</Text>
      ) : null}
    </Pressable>
  );
}

function getChipSelectedStyle(selectionVariant: RapMode | 'default', isDark: boolean, selected: boolean) {
  if (!selected) {
    return null;
  }

  if (selectionVariant === 'default') {
    return styles.chipSelected;
  }

  if (isDark) {
    if (selectionVariant === 'easy') return styles.chipSelectedEasy;
    if (selectionVariant === 'hard') return styles.chipSelectedHard;
    if (selectionVariant === 'incremental') return styles.chipSelectedIncremental;
    if (selectionVariant === 'history') return styles.chipSelectedHistory;
    if (selectionVariant === 'ending') return styles.chipSelectedEnding;
    return styles.chipSelectedImages;
  }

  if (selectionVariant === 'easy') return { borderColor: '#16A34A', backgroundColor: '#2FBF68' };
  if (selectionVariant === 'hard') return { borderColor: '#EA580C', backgroundColor: '#F27A3E' };
  if (selectionVariant === 'incremental') return { borderColor: '#DC2626', backgroundColor: '#EB5A5A' };
  if (selectionVariant === 'history') return { borderColor: '#2563EB', backgroundColor: '#4D8FF6' };
  if (selectionVariant === 'ending') return { borderColor: '#A16207', backgroundColor: '#C98A17' };
  return { borderColor: '#7E22CE', backgroundColor: '#9A66E8' };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    paddingHorizontal: 20,
    gap: 24,
  },
  badge: {
    color: '#8A8A8A',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sessionTypeCard: {
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#1D1D1D',
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  sessionTypeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTypeHelp: {
    color: '#8C8C8C',
    fontSize: 11,
    fontWeight: '600',
  },
  sessionTypeSegment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  sessionTypeOption: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  sessionTypeOptionSelected: {
    backgroundColor: '#6B46FF',
  },
  sessionTypeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modePrimaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionsColumn: {
    gap: 10,
  },
  chip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242424',
    backgroundColor: '#101010',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  chipSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1F1F1F',
  },
  chipSelectedEasy: {
    borderColor: '#22C55E',
    backgroundColor: '#16261B',
  },
  chipSelectedHard: {
    borderColor: '#F97316',
    backgroundColor: '#2B1B12',
  },
  chipSelectedIncremental: {
    borderColor: '#EF4444',
    backgroundColor: '#321616',
  },
  chipSelectedImages: {
    borderColor: '#A855F7',
    backgroundColor: '#20152F',
  },
  chipSelectedHistory: {
    borderColor: '#38BDF8',
    backgroundColor: '#122632',
  },
  chipSelectedEnding: {
    borderColor: '#FACC15',
    backgroundColor: '#2E2A16',
  },
  chipFullWidth: {
    width: '100%',
    flex: 1,
  },
  modePrimaryChip: {
    flex: 1,
    minWidth: 0,
  },
  chipText: {
    color: '#B7B7B7',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipDescription: {
    color: '#818181',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '400',
    textAlign: 'center',
  },
  chipDescriptionSelected: {
    color: '#D8D8D8',
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  iconGlowWrap: {
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  startButtonFloating: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  startButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  startButtonTextDisabled: {
    color: '#787878',
  },
  sessionFullscreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'space-between',
  },
  recordingBackground: {
    backgroundColor: '#1A1A1A',
  },
  trainingBackground: {
    backgroundColor: '#14122A',
  },
  cameraHudTop: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timer: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  finishButton: {
    borderRadius: 999,
    backgroundColor: '#0000007A',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  extendButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF66',
    backgroundColor: '#00000066',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  extendButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  preSessionActionsRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bottomSwitchCameraButton: {
    alignItems: 'center',
    gap: 2,
    padding: 8,
  },
  bottomSwitchCameraButtonBeforeStart: {
    position: 'absolute',
    left: '50%',
    marginLeft: 58,
  },
  bottomSwitchCameraDisabled: {
    opacity: 0.4,
  },

  summaryScreen: {
    flex: 1,
    backgroundColor: '#050505',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  summaryCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryMetaCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    backgroundColor: '#101010',
    padding: 14,
    gap: 6,
  },
  summaryMetaText: {
    color: '#D8D8D8',
    fontSize: 14,
    fontWeight: '600',
  },
  previewCard: {
    gap: 8,
  },
  previewVideo: {
    height: 320,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 14,
  },
  previewTimer: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  previewHint: {
    color: '#909090',
    fontSize: 12,
  },
  summaryActions: {
    gap: 10,
    marginTop: 'auto',
  },
  summaryActionButton: {
    borderRadius: 12,
    backgroundColor: '#6B46FF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  sessionBottomActions: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  recordButton: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 4,
    borderColor: '#FFFFFFAA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EF4444',
  },
  countdownNumber: {
    fontSize: 82,
    fontWeight: '800',
  },
});
