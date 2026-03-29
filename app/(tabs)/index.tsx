import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, PermissionsAndroid, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInstrumentals } from '../../data/get_instrumentals';
import * as WebBrowser from 'expo-web-browser';

import { useAppThemeColors } from '@/hooks/use-app-theme-colors';

type RapMode = 'easy' | 'hard' | 'incremental' | 'history' | 'ending' | 'images' | 'free';
type InstrumentalId = string;
type SessionTime = '1-min' | '2-min' | '5-min' | 'infinite';
type SessionType = 'record' | 'train';
type CameraFacing = 'front' | 'back';
type SetupStep = 'mode' | 'track' | 'time';

type SessionSummary = {
  mode: RapMode | null;
  sessionType: SessionType;
  instrumental: InstrumentalId | null;
  elapsedSeconds: number;
};

const RAP_MODES: { key: RapMode; label: string; description: string; icon: keyof typeof MaterialIcons.glyphMap; accent: string }[] = [
  { key: 'free', label: 'Libre', description: 'Rapea libremente y sin estímulos.', icon: 'graphic-eq', accent: '#0EA5E9' },
  { key: 'easy', label: 'Easy', description: 'Palabras cada 10s', icon: 'security', accent: '#16A34A' },
  { key: 'hard', label: 'Hard', description: 'Palabras cada 5s', icon: 'flash-on', accent: '#EA580C' },
  { key: 'incremental', label: 'Incremental', description: 'Palabras cada 10s - 5s - 2s', icon: 'local-fire-department', accent: '#DC2626' },
  { key: 'history', label: 'Historia', description: 'Crea historia con palabras', icon: 'history-edu', accent: '#DB2777' },
  { key: 'ending', label: 'Terminación', description: 'Rapea con terminaciones', icon: 'text-fields', accent: '#EAB308' },
  { key: 'images', label: 'Imágenes', description: 'Rapea con imágenes', icon: 'image', accent: '#9333EA' },
];

type Instrumental = {
  id: string;
  Name: string;
  Url: string;
  Genre: string;
  Bpm: string;
  Active: boolean;
};
type TrackItem = { key: InstrumentalId; label: string; description: string; bpm: string; url: string };

const SESSION_TIMES: { key: SessionTime; label: string; description: string; icon?: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: '1-min', label: '1 min', description: 'Ronda rápida' },
  { key: '2-min', label: '2 min', description: 'Formato clásico' },
  { key: '5-min', label: '5 min', description: 'Sesión extensa' },
];

const TRAINING_TIME: { key: SessionTime; label: string; description: string; icon?: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'infinite', label: '∞', description: 'Sin límite de tiempo', icon: 'all-inclusive' },
];

const SESSION_TYPES: { key: SessionType; label: string }[] = [
  { key: 'record', label: 'Grabar' },
  { key: 'train', label: 'Entrenar' },
];

const PRE_RECORD_COUNTDOWN_SECONDS = 5;
const VIEW_TOP_OFFSET = 12;

export default function RapearScreen() {
  const insets = useSafeAreaInsets();
  const appColors = useAppThemeColors();
  const isDark = appColors.isDark;
  const themeColors = {
    screen: appColors.screen,
    card: appColors.card,
    border: appColors.border,
    optionBorder: appColors.sectionBorder,
    textPrimary: appColors.textPrimary,
    textSecondary: appColors.textSecondary,
    mutedBg: appColors.inputBg,
    mutedBorder: isDark ? '#242424' : '#D8DEE6',
    activeBg: appColors.purple,
  };

  const [instrumentals, setInstrumentals] = useState<Instrumental[]>([]);
  const [loadingInstrumentals, setLoadingInstrumentals] = useState(false);
  const [selectedMode, setSelectedMode] = useState<RapMode | null>('free');
  const [selectedTrack, setSelectedTrack] = useState<InstrumentalId | null>(null);
  const [selectedSessionTime, setSelectedSessionTime] = useState<SessionTime | null>('1-min');
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('record');
  const [setupStep, setSetupStep] = useState<SetupStep>('mode');
  const [pressedMode, setPressedMode] = useState<RapMode | null>(null);
  const [previewTrack, setPreviewTrack] = useState<InstrumentalId | null>(null);
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
  const [baseSelectorVisible, setBaseSelectorVisible] = useState(false);
  const [isTrainingBeatPlaying, setIsTrainingBeatPlaying] = useState(true);
  const [trainingRestartKey, setTrainingRestartKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const tracks: TrackItem[] = useMemo(
    () =>
      instrumentals
        .filter((item) => item.Active)
        .map((item) => ({
          key: item.id,
          label: item.Name,
          description: item.Genre,
          bpm: `${item.Bpm} BPM`,
          url: item.Url,
        })),
    [instrumentals]
  );

  const loadInstrumentals = useCallback(async () => {
    setLoadingInstrumentals(true);
    const data = await getInstrumentals();
    setInstrumentals(data);
    setLoadingInstrumentals(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPreviewTrack(null);
    setPressedMode(null);
    setBaseSelectorVisible(false);
    await loadInstrumentals();
    await new Promise((resolve) => setTimeout(resolve, 300));
    setRefreshing(false);
  }, [loadInstrumentals]);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webPreviewAudioRef = useRef<any>(null);
  const webTrainingAudioRef = useRef<any>(null);
  const nativePreviewSoundRef = useRef<any>(null);
  const nativeTrainingSoundRef = useRef<any>(null);
  const nativeAudioUnavailableRef = useRef(false);

  const initialSessionSeconds = getSessionDuration(selectedSessionTime);
  const availableSessionTimes = selectedSessionType === 'train' ? TRAINING_TIME : SESSION_TIMES;
  const selectedTrackLabel = tracks.find((track) => track.key === selectedTrack)?.label ?? '-';
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

  useEffect(() => {
    loadInstrumentals();
  }, [loadInstrumentals]);

  useEffect(() => {
    if (!tracks.length) {
      setSelectedTrack(null);
      return;
    }

    if (!selectedTrack || !tracks.some((track) => track.key === selectedTrack)) {
      setSelectedTrack(tracks[0].key);
    }
  }, [tracks, selectedTrack]);

  const resolveNativeAudioModule = useCallback(() => {
    if (Platform.OS === 'web') return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('expo-av');
    } catch {
      if (!nativeAudioUnavailableRef.current) {
        nativeAudioUnavailableRef.current = true;
        Alert.alert(
          'Audio nativo no disponible',
          'Para reproducir dentro de la app en iOS/Android necesitas instalar expo-av.'
        );
      }
      return null;
    }
  }, []);

  const stopNativeSound = useCallback(async (ref: React.MutableRefObject<any>) => {
    if (Platform.OS === 'web' || !ref.current) return;
    try {
      await ref.current.stopAsync?.();
      await ref.current.unloadAsync?.();
    } catch {
      // ignore cleanup errors
    } finally {
      ref.current = null;
    }
  }, []);

  const stopWebPreviewSound = useCallback(() => {
    if (Platform.OS !== 'web' || !webPreviewAudioRef.current) return;
    webPreviewAudioRef.current.pause();
    webPreviewAudioRef.current.currentTime = 0;
    webPreviewAudioRef.current = null;
  }, []);

  const stopWebTrainingSound = useCallback(() => {
    if (Platform.OS !== 'web' || !webTrainingAudioRef.current) return;
    webTrainingAudioRef.current.pause();
    webTrainingAudioRef.current.currentTime = 0;
    webTrainingAudioRef.current = null;
  }, []);

  const stopPreviewPlayback = useCallback(async () => {
    setPreviewTrack(null);
    stopWebPreviewSound();
    await stopNativeSound(nativePreviewSoundRef);
  }, [stopNativeSound, stopWebPreviewSound]);

  const stopTrainingPlayback = useCallback(async () => {
    stopWebTrainingSound();
    await stopNativeSound(nativeTrainingSoundRef);
  }, [stopNativeSound, stopWebTrainingSound]);

  useEffect(() => {
    if (setupStep !== 'track') {
      setPreviewTrack(null);
      stopPreviewPlayback();
      setIsTrainingBeatPlaying(false);
    }
  }, [setupStep, stopPreviewPlayback]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (!sessionVisible || selectedSessionType !== 'train' || !selectedTrack || !isTrainingBeatPlaying) {
      stopWebTrainingSound();
      return;
    }

    const currentTrack = tracks.find((track) => track.key === selectedTrack);
    if (!currentTrack?.url) return;

    if (webTrainingAudioRef.current?.src !== currentTrack.url) {
      stopWebTrainingSound();

      const audio = new Audio(currentTrack.url);
      audio.loop = true;
      audio.volume = 1;
      webTrainingAudioRef.current = audio;
    }

    webTrainingAudioRef.current.play().catch(() => {
      setIsTrainingBeatPlaying(false);
    });
  }, [isTrainingBeatPlaying, selectedSessionType, selectedTrack, sessionVisible, stopWebTrainingSound, tracks, trainingRestartKey]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const playTrainingNative = async () => {
      if (!sessionVisible || selectedSessionType !== 'train' || !selectedTrack || !isTrainingBeatPlaying) {
        await stopTrainingPlayback();
        return;
      }

      const currentTrack = tracks.find((track) => track.key === selectedTrack);
      if (!currentTrack?.url) return;

      const avModule = resolveNativeAudioModule();
      if (!avModule?.Audio?.Sound) return;

      await stopTrainingPlayback();

      try {
        const sound = new avModule.Audio.Sound();
        await sound.loadAsync({ uri: currentTrack.url }, { shouldPlay: true, isLooping: true });
        nativeTrainingSoundRef.current = sound;
      } catch {
        Alert.alert('No se pudo reproducir', 'No se pudo iniciar la reproducción de la base.');
        setIsTrainingBeatPlaying(false);
      }
    };

    playTrainingNative();
  }, [resolveNativeAudioModule, isTrainingBeatPlaying, selectedSessionType, selectedTrack, sessionVisible, stopTrainingPlayback, tracks, trainingRestartKey]);

  useEffect(() => {
    return () => {
      if (Platform.OS === 'web') {
        if (webPreviewAudioRef.current) {
          webPreviewAudioRef.current.pause();
          webPreviewAudioRef.current = null;
        }

        if (webTrainingAudioRef.current) {
          webTrainingAudioRef.current.pause();
          webTrainingAudioRef.current = null;
        }
      }

      stopPreviewPlayback();
      stopTrainingPlayback();
    };
  }, [stopPreviewPlayback, stopTrainingPlayback]);

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

  const onToggleTrackPreview = async (trackId: InstrumentalId) => {
    setSelectedTrack(trackId);

    const currentTrack = tracks.find((track) => track.key === trackId);
    if (!currentTrack?.url) {
      Alert.alert('Sin audio', 'Esta base no tiene URL de audio válida.');
      return;
    }

    if (Platform.OS !== 'web') {
      const isSameTrack = previewTrack === trackId;
      if (isSameTrack) {
        await stopPreviewPlayback();
        return;
      }

      const avModule = resolveNativeAudioModule();
      if (!avModule?.Audio?.Sound) return;

      await stopPreviewPlayback();
      await stopTrainingPlayback();

      try {
        const sound = new avModule.Audio.Sound();
        await sound.loadAsync({ uri: currentTrack.url }, { shouldPlay: true, isLooping: false });
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status?.didJustFinish) {
            setPreviewTrack(null);
            stopNativeSound(nativePreviewSoundRef);
          }
        });
        nativePreviewSoundRef.current = sound;
        setPreviewTrack(trackId);
      } catch {
        Alert.alert('No se pudo reproducir', 'No se pudo iniciar la reproducción de la base.');
      }
      return;
    }

    const isSameTrackPlaying = previewTrack === trackId && webPreviewAudioRef.current;
    if (isSameTrackPlaying) {
      await stopPreviewPlayback();
      return;
    }

    await stopPreviewPlayback();
    await stopTrainingPlayback();

    const audio = new Audio(currentTrack.url);
    audio.volume = 1;
    audio.onended = () => {
      setPreviewTrack(null);
      webPreviewAudioRef.current = null;
    };

    try {
      await audio.play();
      webPreviewAudioRef.current = audio;
      setPreviewTrack(trackId);
    } catch {
      Alert.alert('No se pudo reproducir', 'No se pudo iniciar la reproducción de la base.');
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
    setIsTrainingBeatPlaying(true);

    if (selectedSessionType === 'train') {
      startSessionTimer();
    }
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
    stopTrainingPlayback();
    setCountdown(null);
    setRemainingSeconds(initialSessionSeconds);
    setIsUnlimitedSession(initialSessionSeconds === null);
    setHasSessionStarted(false);
    setBaseSelectorVisible(false);

    const nextSummary: SessionSummary = {
      mode: selectedMode,
      sessionType: selectedSessionType,
      instrumental: selectedTrack,
      elapsedSeconds,
    };

    if (selectedSessionType === 'record') {
      setSessionSummary(nextSummary);
      setSummaryVisible(true);
    } else {
      setSessionSummary(null);
      setSummaryVisible(false);
      setSetupStep('mode');
    }

    setElapsedSeconds(0);
  };

  const stopSession = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);

    setSessionVisible(false);
    stopTrainingPlayback();
    setCountdown(null);
    setRemainingSeconds(initialSessionSeconds);
    setElapsedSeconds(0);
    setIsUnlimitedSession(initialSessionSeconds === null);
    setHasSessionStarted(false);
    setBaseSelectorVisible(false);
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
      { text: 'Salir', style: 'destructive', onPress: closeSummaryAndReset },
    ]);
  };

  const closeSummaryAndReset = () => {
    setSummaryVisible(false);
    setSessionSummary(null);
    setBaseSelectorVisible(false);
    setSetupStep('mode');
  };

  const onSelectTrainingTrack = (track: InstrumentalId) => {
    stopPreviewPlayback();
    setSelectedTrack(track);
    setIsTrainingBeatPlaying(false);
    setTrainingRestartKey((previous) => previous + 1);
    setIsTrainingBeatPlaying(true);
  };

  const onSeekTrainingTrack = async (secondsDelta: number) => {
    if (Platform.OS === 'web') {
      const audio = webTrainingAudioRef.current;
      if (!audio) return;
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const nextPosition = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, audio.currentTime + secondsDelta));
      audio.currentTime = nextPosition;
      return;
    }

    if (!nativeTrainingSoundRef.current) return;

    try {
      const status = await nativeTrainingSoundRef.current.getStatusAsync();
      if (!status?.isLoaded) return;

      const duration = status.durationMillis ?? Number.MAX_SAFE_INTEGER;
      const nextPosition = Math.max(0, Math.min(duration, status.positionMillis + secondsDelta * 1000));
      await nativeTrainingSoundRef.current.setPositionAsync(nextPosition);
    } catch {
      Alert.alert('No se pudo adelantar/retroceder', 'No se pudo ajustar la posición de la instrumental.');
    }
  };

  const onTrainingPreviousTrack = () => {
    if (!selectedTrack || !tracks.length) return;
    const currentTrackIndex = tracks.findIndex((track) => track.key === selectedTrack);
    if (currentTrackIndex === -1) return;
    const previousTrack = tracks[(currentTrackIndex - 1 + tracks.length) % tracks.length];
    setSelectedTrack(previousTrack.key);
    setIsTrainingBeatPlaying(true);
  };

  const onTrainingNextTrack = () => {
    if (!selectedTrack || !tracks.length) return;
    const currentTrackIndex = tracks.findIndex((track) => track.key === selectedTrack);
    if (currentTrackIndex === -1) return;
    const nextTrack = tracks[(currentTrackIndex + 1) % tracks.length];
    setSelectedTrack(nextTrack.key);
    setIsTrainingBeatPlaying(true);
  };

  const summaryTheme = {
    modalBg: isDark ? '#050505' : '#F2F4F8',
    cardBg: appColors.card,
    cardBorder: appColors.border,
    primaryText: appColors.textPrimary,
    secondaryText: isDark ? '#D8D8D8' : '#344054',
    tertiaryText: appColors.textSecondary,
    previewBg: isDark ? '#1A1A1A' : '#E9EEF6',
    buttonBg: appColors.purple,
    closeBg: isDark ? '#222222' : '#E4E7EC',
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.screen }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingTop: VIEW_TOP_OFFSET, paddingBottom: setupStep === 'mode' ? insets.bottom + 36 : 0 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#FFFFFF' : '#111111'} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.badgeRow}>
          <View style={styles.badgeLeftRow}>
            {setupStep === 'mode' ? (
              <View style={[styles.headerAction, styles.headerGhostAction, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}>
                <MaterialIcons name="mic" size={18} color={themeColors.textPrimary} />
              </View>
            ) : null}
            {(setupStep === 'track' || setupStep === 'time') ? (
              <Pressable onPress={onBackStep} style={[styles.headerAction, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <MaterialIcons name="arrow-back" size={18} color={themeColors.textPrimary} />
              </Pressable>
            ) : null}
            <Text style={[styles.badge, { color: themeColors.textSecondary }]}>FreestyleZone</Text>
          </View>
          <View style={[styles.stepPill, { borderColor: themeColors.border, backgroundColor: themeColors.mutedBg }]}>
            <Text style={[styles.stepPillText, { color: themeColors.textSecondary }]}>{setupStep === 'mode' ? '1/3' : setupStep === 'track' ? '2/3' : '3/3'}</Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>
              {setupStep === 'mode' ? 'Selecciona el modo' : setupStep === 'track' ? 'Instrumental' : 'Tiempo de la sesión'}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            {setupStep !== 'time' ? (
              <Pressable
                disabled={!canAdvance}
                onPress={onContinueStep}
                style={[styles.continueButton, { backgroundColor: canAdvance ? themeColors.activeBg : themeColors.mutedBorder }]}>
                <Text style={[styles.continueButtonText, { color: canAdvance ? '#FFFFFF' : themeColors.textSecondary }]}>Continuar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {setupStep === 'mode' ? (
          <View style={styles.modeRail}>
            {RAP_MODES.map((mode) => {
              const selected = selectedMode === mode.key;
              const isActiveMode = selected || pressedMode === mode.key;
              const selectedCardTextColor = themeColors.textPrimary;
              const selectedModeBackground = isDark ? `${mode.accent}2B` : `${mode.accent}14`;
              return (
                <Pressable
                  key={mode.key}
                  onPressIn={() => setPressedMode(mode.key)}
                  onPressOut={() => setPressedMode((currentMode) => (currentMode === mode.key ? null : currentMode))}
                  onPress={() => setSelectedMode(mode.key)}
                  style={[
                    styles.modeCard,
                    { borderColor: selected ? mode.accent : themeColors.optionBorder, backgroundColor: selected ? selectedModeBackground : themeColors.card },
                    selected && styles.modeCardSelected,
                  ]}>
                  <View style={styles.modeCardInner}>
                    <View>
                      <Text style={[styles.modeTitle, { color: selectedCardTextColor }]}>{mode.label}</Text>
                      <Text style={[styles.modeDescription, { color: selected ? themeColors.textPrimary : themeColors.textSecondary }]}>{mode.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.modeIconBubble,
                        {
                          borderColor: selected ? mode.accent : themeColors.optionBorder,
                          backgroundColor: selected ? (isDark ? `${mode.accent}26` : `${mode.accent}12`) : 'transparent',
                        },
                      ]}>
                      <MaterialIcons name={mode.icon} size={24} color={isActiveMode ? mode.accent : themeColors.textSecondary} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {setupStep === 'track' ? (
          <View style={styles.optionsColumn}>
            {loadingInstrumentals ? (
              <Text style={[styles.trackInfo, { color: themeColors.textSecondary }]}>Cargando instrumentales...</Text>
            ) : null}
            {!loadingInstrumentals && !tracks.length ? (
              <Text style={[styles.trackInfo, { color: themeColors.textSecondary }]}>No hay instrumentales activas en la base de datos.</Text>
            ) : null}
            {tracks.map((track) => {
              const selected = selectedTrack === track.key;
              const isPlaying = previewTrack === track.key;

              return (
                <View key={track.key} style={[styles.trackCard, { backgroundColor: selected ? '#6B46FF22' : themeColors.card, borderColor: selected ? '#6B46FF' : themeColors.optionBorder }]}>
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
            {availableSessionTimes.map((sessionTime) => {
              const selected = selectedSessionTime === sessionTime.key;
              return (
                <Pressable
                  key={sessionTime.key}
                  onPress={() => setSelectedSessionTime(sessionTime.key)}
                  style={[styles.timeCard, { borderColor: selected ? '#6B46FF' : themeColors.optionBorder, backgroundColor: selected ? '#6B46FF22' : themeColors.card }]}>
                  {sessionTime.icon ? <MaterialIcons name={sessionTime.icon} size={30} color={themeColors.textPrimary} /> : null}
                  {!sessionTime.icon ? <Text style={[styles.timeTitle, { color: themeColors.textPrimary }]}>{sessionTime.label}</Text> : null}
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
            {selectedSessionType === 'train' ? (
              <>
                <View style={[styles.trainingHeader, { paddingTop: insets.top + 8 }]}>
                  <View>
                    <Text style={styles.trainingAppName}>FreestyleZone</Text>
                    <Text style={[styles.timer, { color: timerColor }]}>{displayTimer}</Text>
                    <View style={styles.trainingModeTag}>
                      <MaterialIcons name="school" size={11} color="#CFC5FF" />
                      <Text style={styles.trainingModeTagText}>Entrenar</Text>
                    </View>
                  </View>
                  <Pressable style={styles.finishButton} onPress={finishSession}>
                    <Text style={styles.finishButtonText}>Finalizar</Text>
                  </Pressable>
                </View>

                <View style={styles.trainingCenterClearSpace} />

                <View style={[styles.trainingBottomArea, { paddingBottom: insets.bottom + 18 }]}>
                  <Pressable style={styles.selectBeatButton} onPress={() => setBaseSelectorVisible(true)}>
                    <MaterialIcons name="library-music" size={18} color="#FFFFFF" />
                    <Text style={styles.selectBeatButtonText}>Seleccionar base</Text>
                  </Pressable>

                  <View style={styles.trainingPlayerBar}>
                    <View style={styles.trainingTrackMeta}>
                      <Text style={styles.trainingTrackTitle}>{selectedTrackLabel}</Text>
                      <Text style={styles.trainingTrackSub}>{isTrainingBeatPlaying ? 'Sonando ahora' : 'Pausada'}</Text>
                    </View>
                    <View style={styles.trainingPlayerControls}>
                      <Pressable style={styles.trainingControlButton} onPress={onTrainingPreviousTrack}>
                        <MaterialIcons name="skip-previous" size={22} color="#FFFFFF" />
                      </Pressable>
                      <Pressable style={styles.trainingControlButton} onPress={() => onSeekTrainingTrack(-10)}>
                        <MaterialIcons name="replay-10" size={22} color="#FFFFFF" />
                      </Pressable>
                      <Pressable
                        style={styles.trainingControlButton}
                        onPress={() => {
                          setIsTrainingBeatPlaying((previous) => {
                            const nextState = !previous;
                            return nextState;
                          });
                        }}>
                        <MaterialIcons name={isTrainingBeatPlaying ? 'pause' : 'play-arrow'} size={22} color="#FFFFFF" />
                      </Pressable>
                      <Pressable style={styles.trainingControlButton} onPress={() => onSeekTrainingTrack(10)}>
                        <MaterialIcons name="forward-10" size={22} color="#FFFFFF" />
                      </Pressable>
                      <Pressable style={styles.trainingControlButton} onPress={onTrainingNextTrack}>
                        <MaterialIcons name="skip-next" size={22} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {baseSelectorVisible ? (
                  <Pressable style={styles.baseModalBackdrop} onPress={() => setBaseSelectorVisible(false)}>
                    <Pressable style={styles.baseModalCard} onPress={(event) => event.stopPropagation()}>
                      <View style={styles.baseModalHeader}>
                        <Text style={styles.baseModalTitle}>Selecciona una base</Text>
                        <Pressable style={styles.baseModalClose} onPress={() => setBaseSelectorVisible(false)}>
                          <MaterialIcons name="close" size={18} color="#FFFFFF" />
                        </Pressable>
                      </View>

                      <View style={styles.baseOptionsColumn}>
                        {tracks.map((track) => {
                          const isSelected = selectedTrack === track.key;
                          return (
                            <Pressable key={track.key} style={[styles.baseOptionItem, isSelected && styles.baseOptionSelected]} onPress={() => onSelectTrainingTrack(track.key)}>
                              <View style={styles.baseOptionMain}>
                                <Text style={styles.baseOptionTitle}>{track.label}</Text>
                                <Text style={styles.baseOptionDesc}>{track.bpm}</Text>
                              </View>
                              {isSelected ? <MaterialIcons name="check-circle" size={20} color="#9F7AEA" /> : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    </Pressable>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <>
                <View style={[styles.trainingHeader, { paddingTop: insets.top + 8 }]}>
                  <View>
                    <Text style={styles.trainingAppName}>FreestyleZone</Text>
                    <Text style={[styles.timer, { color: timerColor }]}>{displayTimer}</Text>
                    <View style={styles.trainingModeTag}>
                      <MaterialIcons name="mic" size={11} color="#FFD9D9" />
                      <Text style={styles.recordingModeTagText}>{hasSessionStarted ? 'Grabando' : 'Listo para grabar'}</Text>
                    </View>
                  </View>
                  <View style={styles.sessionHeaderActions}>
                    {shouldShowExtendAction ? (
                      <Pressable style={styles.extendButton} onPress={extendSession}>
                        <MaterialIcons name="add-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.extendButtonText}>Ampliar</Text>
                      </Pressable>
                    ) : null}
                    <Pressable style={styles.finishButton} onPress={finishSession}>
                      <Text style={styles.finishButtonText}>Finalizar</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.sessionBottomActions, { paddingBottom: insets.bottom + 26 }]}>
                  {countdown !== null ? <Text style={[styles.countdownNumber, { color: getCountdownColor(countdown) }]}>{countdown}</Text> : null}

                  {!hasSessionStarted && countdown === null ? (
                    <View style={styles.preSessionActionsRow}>
                      <Pressable style={styles.recordButton} onPress={onStartRecordingPress}>
                        <View style={styles.recordButtonInner} />
                      </Pressable>

                      <Pressable
                        style={[styles.bottomSwitchCameraButton, styles.bottomSwitchCameraButtonBeforeStart, hasCameraPermission === false && styles.bottomSwitchCameraDisabled]}
                        accessibilityLabel={`alternar cámara ${cameraFacing === 'front' ? 'frontal' : 'trasera'}`}
                        disabled={hasCameraPermission === false}
                        onPress={() => setCameraFacing((previous) => (previous === 'front' ? 'back' : 'front'))}>
                        <MaterialIcons name="sync-alt" size={20} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ) : null}

                  {hasSessionStarted ? (
                    <Pressable
                      style={[styles.bottomSwitchCameraButton, hasCameraPermission === false && styles.bottomSwitchCameraDisabled]}
                      accessibilityLabel={`alternar cámara ${cameraFacing === 'front' ? 'frontal' : 'trasera'}`}
                      disabled={hasCameraPermission === false}
                      onPress={() => setCameraFacing((previous) => (previous === 'front' ? 'back' : 'front'))}>
                      <MaterialIcons name="sync-alt" size={22} color="#FFFFFF" />
                    </Pressable>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={baseSelectorVisible && !sessionVisible} animationType="fade" transparent onRequestClose={() => setBaseSelectorVisible(false)}>
        <Pressable style={styles.baseModalBackdrop} onPress={() => setBaseSelectorVisible(false)}>
          <Pressable style={styles.baseModalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.baseModalHeader}>
              <Text style={styles.baseModalTitle}>Selecciona una base</Text>
              <Pressable style={styles.baseModalClose} onPress={() => setBaseSelectorVisible(false)}>
                <MaterialIcons name="close" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.baseOptionsColumn}>
              {tracks.map((track) => {
                const isSelected = selectedTrack === track.key;
                return (
                  <Pressable key={track.key} style={[styles.baseOptionItem, isSelected && styles.baseOptionSelected]} onPress={() => onSelectTrainingTrack(track.key)}>
                    <View style={styles.baseOptionMain}>
                      <Text style={styles.baseOptionTitle}>{track.label}</Text>
                      <Text style={styles.baseOptionDesc}>{track.bpm}</Text>
                    </View>
                    {isSelected ? <MaterialIcons name="check-circle" size={20} color="#9F7AEA" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={summaryVisible && sessionSummary?.sessionType === 'record'} animationType="slide" onRequestClose={confirmCloseSummary}>
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
            <Text style={[styles.summaryMetaText, { color: summaryTheme.secondaryText }]}>Base: {sessionSummary?.instrumental ? selectedTrackLabel : '-'}</Text>
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
  badgeLeftRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '700' },
  stepPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  stepPillText: { fontSize: 11, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  headerAction: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerGhostAction: { opacity: 0.95 },
  headerTitleWrap: { flex: 1 },
  title: { fontSize: 29, fontWeight: '800', textTransform: 'uppercase' },
  continueButton: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  continueButtonText: { fontWeight: '800', fontSize: 13 },
  sectionCaption: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  sessionTypeCard: { borderRadius: 14, borderWidth: 1, padding: 10, gap: 8 },
  sessionTypeSegment: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, gap: 6 },
  sessionTypeOption: { flex: 1, borderRadius: 9, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  sessionTypeOptionSelected: { backgroundColor: '#6B46FF' },
  sessionTypeOptionText: { fontSize: 13, fontWeight: '700' },

  modeRail: { gap: 12 },
  modeCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  modeCardSelected: { shadowColor: '#6B46FF', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  modeCardInner: { paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modeTitle: { fontSize: 24, fontWeight: '500', marginTop: 2 },
  modeDescription: { fontSize: 13, marginTop: 4, maxWidth: 250, fontWeight: '400' },
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
  timeTitle: { fontSize: 24, fontWeight: '500' },
  timeDescription: { fontSize: 13 },
  startButton: { marginTop: 4, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  startButtonText: { fontSize: 17, fontWeight: '800' },

  sessionFullscreen: { flex: 1, backgroundColor: '#000000' },
  cameraPlaceholder: { flex: 1, justifyContent: 'space-between' },
  sessionModalCard: { marginHorizontal: 12, borderRadius: 18, overflow: 'hidden' },
  recordingBackground: { backgroundColor: '#1A1A1A' },
  trainingBackground: { backgroundColor: '#14122A' },
  trainingHeader: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trainingAppName: { color: '#D4CCFF', fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 },
  trainingModeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trainingModeTagText: { color: '#CFC5FF', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  recordingModeTagText: { color: '#FFD9D9', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  trainingCenterClearSpace: { flex: 1 },
  trainingBottomArea: { gap: 12, paddingHorizontal: 12 },
  selectBeatButton: { alignSelf: 'flex-end', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#6B46FF', flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectBeatButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  trainingPlayerBar: { borderRadius: 18, borderWidth: 1, borderColor: '#FFFFFF20', backgroundColor: '#00000099', paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  trainingTrackMeta: { flex: 1, gap: 2 },
  trainingTrackTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  trainingTrackSub: { color: '#B3B3C4', fontSize: 12, fontWeight: '600' },
  trainingPlayerControls: { flexDirection: 'row', gap: 8 },
  trainingControlButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#FFFFFF26', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF14' },
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
  baseModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000A6', justifyContent: 'center', paddingHorizontal: 18, zIndex: 20 },
  baseModalCard: { borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF1F', backgroundColor: '#121022', padding: 14, gap: 12, maxHeight: '70%' },
  baseModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  baseModalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  baseModalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF1A', alignItems: 'center', justifyContent: 'center' },
  baseOptionsColumn: { gap: 8 },
  baseOptionItem: { borderRadius: 12, borderWidth: 1, borderColor: '#FFFFFF1F', backgroundColor: '#FFFFFF0A', padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  baseOptionSelected: { borderColor: '#6B46FF', backgroundColor: '#6B46FF22' },
  baseOptionMain: { gap: 2 },
  baseOptionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  baseOptionDesc: { color: '#BDB7E5', fontSize: 12, fontWeight: '600' },

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
