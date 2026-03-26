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
type SetupStep = 'mode' | 'track' | 'time';

type SessionSummary = {
  mode: RapMode | null;
  sessionType: SessionType;
  track: Track | null;
  elapsedSeconds: number;
};

const RAP_MODES: { key: RapMode; label: string; description: string; vibe: string; icon: keyof typeof MaterialIcons.glyphMap; accent: string }[] = [
  { key: 'easy', label: 'Easy', description: 'Palabras cada 10s para entrar en calor sin freno.', vibe: 'Flow chill', icon: 'security', accent: '#22C55E' },
  { key: 'hard', label: 'Hard', description: 'Palabras cada 5s para tirar barras agresivas.', vibe: 'Pura presión', icon: 'flash-on', accent: '#F97316' },
  { key: 'incremental', label: 'Incremental', description: 'Empieza suave y acaba en modo metralla.', vibe: 'Subida extrema', icon: 'local-fire-department', accent: '#EF4444' },
  { key: 'history', label: 'Historia', description: 'Construye una historia conectando cada palabra.', vibe: 'Storytelling', icon: 'history-edu', accent: '#38BDF8' },
  { key: 'ending', label: 'Terminación', description: 'Remata barras con finales que te marcan.', vibe: 'Punchline', icon: 'text-fields', accent: '#FACC15' },
  { key: 'images', label: 'Imágenes', description: 'Inspírate en visuales y suelta imaginación.', vibe: 'Modo visual', icon: 'image', accent: '#A855F7' },
];

const TRACKS: { key: Track; label: string; description: string; bpm: string }[] = [
  { key: 'base-1', label: 'Base Boom Bap', description: 'Clásico noventero, bombo y caja al frente.', bpm: '92 BPM' },
  { key: 'base-2', label: 'Base Trap', description: '808 profundo y hi-hat para romper.', bpm: '140 BPM' },
  { key: 'base-3', label: 'Base Lo-Fi', description: 'Atmósfera relajada para barras melódicas.', bpm: '78 BPM' },
];

const SESSION_TIMES: { key: SessionTime; label: string; description: string }[] = [
  { key: '1-min', label: '1 min', description: 'Ronda rápida' },
  { key: '2-min', label: '2 min', description: 'Formato clásico' },
  { key: '5-min', label: '5 min', description: 'Sesión extensa' },
];

const TRAINING_TIME: { key: SessionTime; label: string; description: string }[] = [{ key: 'infinite', label: 'Infinito', description: 'Sin límite de tiempo' }];

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
      screen: isDark ? '#050505' : '#F3F5F8',
      card: isDark ? '#0F0F0F' : '#FFFFFF',
      border: isDark ? '#222222' : '#DFE3E8',
      textPrimary: isDark ? '#FFFFFF' : '#101828',
      textSecondary: isDark ? '#A1A1AA' : '#667085',
      mutedBg: isDark ? '#131313' : '#F2F4F7',
      mutedBorder: isDark ? '#242424' : '#D8DEE6',
      activeBg: '#6B46FF',
    }),
    [isDark]
  );

  const [selectedMode, setSelectedMode] = useState<RapMode | null>('easy');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedSessionTime, setSelectedSessionTime] = useState<SessionTime | null>('1-min');
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('record');
  const [setupStep, setSetupStep] = useState<SetupStep>('mode');
  const [previewTrack, setPreviewTrack] = useState<Track | null>(null);
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
  const availableSessionTimes = selectedSessionType === 'train' ? TRAINING_TIME : SESSION_TIMES;
  const selectedTrackLabel = TRACKS.find((track) => track.key === selectedTrack)?.label ?? '-';
  const summaryModeInfo = RAP_MODES.find((mode) => mode.key === sessionSummary?.mode);

  const canAdvance =
    (setupStep === 'mode' && selectedMode !== null) ||
    (setupStep === 'track' && selectedTrack !== null) ||
    (setupStep === 'time' && selectedSessionTime !== null);

  const isReadyToStart = selectedMode !== null && selectedTrack !== null && selectedSessionTime !== null;

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isUnlimitedSession && remainingSeconds === 0) {
      finishSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isUnlimitedSession]);

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

  const onContinueStep = () => {
    if (!canAdvance) return;
    if (setupStep === 'mode') {
      setSetupStep('track');
      return;
    }
    if (setupStep === 'track') {
      setSetupStep('time');
    }
  };

  const onBackStep = () => {
    if (setupStep === 'time') {
      setSetupStep('track');
      return;
    }
    if (setupStep === 'track') {
      setSetupStep('mode');
    }
  };

  const onToggleTrackPreview = (track: Track) => {
    setPreviewTrack((prev) => (prev === track ? null : track));
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

  const confirmCloseSummary = () => {
    Alert.alert('¿Salir del resumen?', 'Si sales ahora, se cerrará el resumen y perderás la sesión.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => setSummaryVisible(false) },
    ]);
  };

  const summaryTheme = {
    modalBg: isDark ? '#050505' : '#F2F4F8',
    cardBg: isDark ? '#101010' : '#FFFFFF',
    cardBorder: isDark ? '#2B2B2B' : '#DDE1E7',
    primaryText: isDark ? '#FFFFFF' : '#101828',
    secondaryText: isDark ? '#D8D8D8' : '#344054',
    tertiaryText: isDark ? '#AFAFAF' : '#667085',
    previewBg: isDark ? '#1A1A1A' : '#E9EEF6',
    buttonBg: isDark ? '#6B46FF' : '#5B3BF1',
    closeBg: isDark ? '#222222' : '#E4E7EC',
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.screen }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.badgeRow}>
          <Text style={[styles.badge, { color: themeColors.textSecondary }]}>FreestyleZone</Text>
          <View style={[styles.stepPill, { borderColor: themeColors.border, backgroundColor: themeColors.mutedBg }]}>
            <Text style={[styles.stepPillText, { color: themeColors.textSecondary }]}>{setupStep === 'mode' ? '1/3' : setupStep === 'track' ? '2/3' : '3/3'}</Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          {(setupStep === 'track' || setupStep === 'time') && (
            <Pressable onPress={onBackStep} style={[styles.headerAction, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <MaterialIcons name="arrow-back" size={18} color={themeColors.textPrimary} />
            </Pressable>
          )}

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>
              {setupStep === 'mode' ? 'Selecciona el modo' : setupStep === 'track' ? 'Instrumental' : 'Tiempo de la sesión'}
            </Text>
          </View>

          {setupStep !== 'time' ? (
            <Pressable
              disabled={!canAdvance}
              onPress={onContinueStep}
              style={[styles.continueButton, { backgroundColor: canAdvance ? themeColors.activeBg : themeColors.mutedBorder }]}>
              <Text style={[styles.continueButtonText, { color: canAdvance ? '#FFFFFF' : themeColors.textSecondary }]}>Continuar</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <View style={[styles.sessionTypeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionCaption, { color: themeColors.textSecondary }]}>MODO DE SESIÓN</Text>
          <View style={[styles.sessionTypeSegment, { backgroundColor: themeColors.mutedBg, borderColor: themeColors.mutedBorder }]}>
            {SESSION_TYPES.map((sessionType) => {
              const isSelected = selectedSessionType === sessionType.key;

              return (
                <Pressable
                  key={sessionType.key}
                  onPress={() => onSelectSessionType(sessionType.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.sessionTypeOption, isSelected && styles.sessionTypeOptionSelected]}>
                  <MaterialIcons name={sessionType.key === 'record' ? 'mic' : 'school'} size={16} color={isSelected ? '#FFFFFF' : themeColors.textSecondary} />
                  <Text style={[styles.sessionTypeOptionText, { color: isSelected ? '#FFFFFF' : themeColors.textSecondary }]}>{sessionType.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {setupStep === 'mode' ? (
          <View style={styles.modeRail}>
            {RAP_MODES.map((mode) => {
              const selected = selectedMode === mode.key;
              return (
                <Pressable
                  key={mode.key}
                  onPress={() => setSelectedMode(mode.key)}
                  style={[
                    styles.modeCard,
                    { borderColor: selected ? mode.accent : themeColors.border, backgroundColor: selected ? `${mode.accent}22` : themeColors.card },
                    selected && styles.modeCardSelected,
                  ]}>
                  <View style={[styles.modeAccent, { backgroundColor: mode.accent }]} />
                  <View style={styles.modeCardInner}>
                    <View>
                      <Text style={[styles.modeVibe, { color: selected ? mode.accent : themeColors.textSecondary }]}>{mode.vibe}</Text>
                      <Text style={[styles.modeTitle, { color: themeColors.textPrimary }]}>{mode.label}</Text>
                      <Text style={[styles.modeDescription, { color: themeColors.textSecondary }]}>{mode.description}</Text>
                    </View>
                    <View style={[styles.modeIconBubble, { borderColor: selected ? mode.accent : themeColors.border }]}>
                      <MaterialIcons name={mode.icon} size={24} color={selected ? mode.accent : themeColors.textSecondary} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {setupStep === 'track' ? (
          <View style={styles.optionsColumn}>
            {TRACKS.map((track) => {
              const selected = selectedTrack === track.key;
              const isPlaying = previewTrack === track.key;

              return (
                <View key={track.key} style={[styles.trackCard, { backgroundColor: themeColors.card, borderColor: selected ? '#6B46FF' : themeColors.border }]}>
                  <Pressable onPress={() => setSelectedTrack(track.key)} style={styles.trackMainArea}>
                    <Text style={[styles.trackTitle, { color: themeColors.textPrimary }]}>{track.label}</Text>
                    <Text style={[styles.trackInfo, { color: themeColors.textSecondary }]}>{track.description}</Text>
                    <Text style={[styles.trackMeta, { color: themeColors.textSecondary }]}>{track.bpm}</Text>
                  </Pressable>
                  <Pressable style={[styles.previewButton, { backgroundColor: isPlaying ? '#DC2626' : '#6B46FF' }]} onPress={() => onToggleTrackPreview(track.key)}>
                    <MaterialIcons name={isPlaying ? 'stop' : 'play-arrow'} size={16} color="#FFFFFF" />
                    <Text style={styles.previewButtonText}>{isPlaying ? 'Parar' : 'Reproducir'}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}

        {setupStep === 'time' ? (
          <View style={styles.optionsColumn}>
            {availableSessionTimes.map((sessionTime) => {
              const selected = selectedSessionTime === sessionTime.key;
              return (
                <Pressable
                  key={sessionTime.key}
                  onPress={() => setSelectedSessionTime(sessionTime.key)}
                  style={[styles.timeCard, { borderColor: selected ? '#6B46FF' : themeColors.border, backgroundColor: selected ? '#6B46FF22' : themeColors.card }]}>
                  <Text style={[styles.timeTitle, { color: themeColors.textPrimary }]}>{sessionTime.label}</Text>
                  <Text style={[styles.timeDescription, { color: themeColors.textSecondary }]}>{sessionTime.description}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {setupStep === 'time' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !isReadyToStart }}
            disabled={!isReadyToStart}
            onPress={openSession}
            style={[styles.startButton, { backgroundColor: isReadyToStart ? themeColors.activeBg : themeColors.mutedBorder }]}>
            <Text style={[styles.startButtonText, { color: isReadyToStart ? '#FFFFFF' : themeColors.textSecondary }]}>Empezar</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal visible={sessionVisible} animationType="slide" onRequestClose={stopSession}>
        <View style={styles.sessionFullscreen}>
          <View style={[styles.cameraPlaceholder, styles.sessionModalCard, selectedSessionType === 'train' ? styles.trainingBackground : styles.recordingBackground, { marginTop: insets.top + 8, marginBottom: insets.bottom + 8 }]}>
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
              {countdown !== null ? <Text style={[styles.countdownNumber, { color: getCountdownColor(countdown) }]}>{countdown}</Text> : null}

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

      <Modal visible={summaryVisible} animationType="slide" onRequestClose={confirmCloseSummary}>
        <SafeAreaView style={[styles.summaryScreen, { backgroundColor: summaryTheme.modalBg, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]} edges={['left', 'right']}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: summaryTheme.primaryText }]}>Resumen de la sesión</Text>
            <Pressable onPress={confirmCloseSummary} style={[styles.summaryCloseButton, { backgroundColor: summaryTheme.closeBg }]}>
              <MaterialIcons name="close" size={18} color={summaryTheme.primaryText} />
            </Pressable>
          </View>

          <View style={styles.previewCard}>
            <View style={[styles.previewVideo, { backgroundColor: summaryTheme.previewBg, borderColor: summaryTheme.cardBorder }]}> 
              <Text style={[styles.previewTimer, { color: summaryTheme.primaryText }]}>{formatTime(sessionSummary?.elapsedSeconds ?? 0)}</Text>
            </View>
            <Text style={[styles.previewHint, { color: summaryTheme.tertiaryText }]}>Preview con overlay de tiempo (sin botones de control).</Text>
          </View>

          <View style={[styles.summaryMetaCard, { backgroundColor: summaryTheme.cardBg, borderColor: summaryTheme.cardBorder }]}> 
            <Text style={[styles.summaryMetaText, { color: summaryTheme.secondaryText }]}>Modo: {summaryModeInfo?.label ?? '-'}</Text>
            <Text style={[styles.summaryMetaDescription, { color: summaryTheme.tertiaryText }]}>Descripción: {summaryModeInfo?.description ?? '-'}</Text>
            <Text style={[styles.summaryMetaText, { color: summaryTheme.secondaryText }]}>Sesión: {sessionSummary?.sessionType === 'record' ? 'Grabar' : 'Entrenar'}</Text>
            <Text style={[styles.summaryMetaText, { color: summaryTheme.secondaryText }]}>Base: {sessionSummary?.track ? selectedTrackLabel : '-'}</Text>
            <Text style={[styles.summaryMetaText, { color: summaryTheme.secondaryText }]}>Tiempo: {formatTime(sessionSummary?.elapsedSeconds ?? 0)}</Text>
          </View>

          <View style={styles.summaryActions}>
            <Pressable
              style={[styles.summaryActionButton, { backgroundColor: summaryTheme.buttonBg }]}
              onPress={() => Alert.alert('Guardar en galería', 'Función preparada para conectar con guardado local de video.')}>
              <MaterialIcons name="download" size={18} color="#FFFFFF" />
              <Text style={styles.summaryActionText}>Guardar en galería</Text>
            </Pressable>

            <Pressable
              style={[styles.summaryActionButton, { backgroundColor: summaryTheme.buttonBg }]}
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, gap: 18 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '700' },
  stepPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  stepPillText: { fontSize: 11, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  headerAction: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1 },
  title: { fontSize: 29, fontWeight: '800', textTransform: 'uppercase' },
  continueButton: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  continueButtonText: { fontWeight: '800', fontSize: 13 },
  headerSpacer: { width: 36 },
  sectionCaption: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  sessionTypeCard: { borderRadius: 14, borderWidth: 1, padding: 10, gap: 8 },
  sessionTypeSegment: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, gap: 6 },
  sessionTypeOption: { flex: 1, borderRadius: 9, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  sessionTypeOptionSelected: { backgroundColor: '#6B46FF' },
  sessionTypeOptionText: { fontSize: 13, fontWeight: '700' },

  modeRail: { gap: 12 },
  modeCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  modeCardSelected: { shadowColor: '#6B46FF', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  modeAccent: { height: 4, width: '100%' },
  modeCardInner: { paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modeVibe: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  modeTitle: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  modeDescription: { fontSize: 13, marginTop: 4, maxWidth: 250 },
  modeIconBubble: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },

  optionsColumn: { gap: 10 },
  trackCard: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  trackMainArea: { flex: 1, gap: 4 },
  trackTitle: { fontSize: 17, fontWeight: '700' },
  trackInfo: { fontSize: 13 },
  trackMeta: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  previewButton: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', gap: 4, alignItems: 'center' },
  previewButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  timeCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  timeTitle: { fontSize: 24, fontWeight: '800' },
  timeDescription: { fontSize: 13 },
  startButton: { marginTop: 4, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  startButtonText: { fontSize: 17, fontWeight: '800' },

  sessionFullscreen: { flex: 1, backgroundColor: '#000000' },
  cameraPlaceholder: { flex: 1, justifyContent: 'space-between' },
  sessionModalCard: { marginHorizontal: 12, borderRadius: 18, overflow: 'hidden' },
  recordingBackground: { backgroundColor: '#1A1A1A' },
  trainingBackground: { backgroundColor: '#14122A' },
  cameraHudTop: { paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timer: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  finishButton: { borderRadius: 999, backgroundColor: '#0000007A', paddingHorizontal: 16, paddingVertical: 10 },
  finishButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  extendButton: { borderRadius: 999, borderWidth: 1, borderColor: '#FFFFFF66', backgroundColor: '#00000066', paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  extendButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  preSessionActionsRow: { width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bottomSwitchCameraButton: { alignItems: 'center', gap: 2, padding: 8 },
  bottomSwitchCameraButtonBeforeStart: { position: 'absolute', left: '50%', marginLeft: 58 },
  bottomSwitchCameraDisabled: { opacity: 0.4 },
  sessionBottomActions: { alignItems: 'center', justifyContent: 'center', minHeight: 150 },
  recordButton: { width: 86, height: 86, borderRadius: 43, borderWidth: 4, borderColor: '#FFFFFFAA', justifyContent: 'center', alignItems: 'center' },
  recordButtonInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#EF4444' },
  countdownNumber: { fontSize: 82, fontWeight: '800' },

  summaryScreen: { flex: 1, paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontSize: 22, fontWeight: '800' },
  summaryCloseButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  summaryMetaCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  summaryMetaText: { fontSize: 14, fontWeight: '600' },
  summaryMetaDescription: { fontSize: 13, fontWeight: '500' },
  previewCard: { gap: 8 },
  previewVideo: { height: 320, borderRadius: 16, borderWidth: 1, justifyContent: 'flex-start', alignItems: 'flex-start', padding: 14 },
  previewTimer: { fontSize: 18, fontWeight: '800' },
  previewHint: { fontSize: 12 },
  summaryActions: { flexDirection: 'row', gap: 10, marginTop: 'auto' },
  summaryActionButton: { flex: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  summaryActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
