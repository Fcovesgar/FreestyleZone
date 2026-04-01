import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Linking, Modal, PermissionsAndroid, Platform, Pressable, RefreshControl, ScrollView, Text, Vibration, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
// eslint-disable-next-line import/no-unresolved
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInstrumentals } from '../../data/get_instrumentals';
import { getModes } from '../../data/get_modes';

import { useAppThemeColors } from '@/hooks/use-app-theme-colors';
import { ModeStepView } from '../../features/rapear/components/mode-step-view';
import { TimeStepView } from '../../features/rapear/components/time-step-view';
import { TrackStepView } from '../../features/rapear/components/track-step-view';
import { PRE_RECORD_COUNTDOWN_SECONDS, SESSION_TIMES, TRAINING_TIME, VIEW_TOP_OFFSET } from '../../features/rapear/constants';
import styles from '../../features/rapear/styles';
import type { CameraFacing, Instrumental, InstrumentalId, ModeEntity, NativeAudioPlayer, RapMode, RapModeOption, SessionSummary, SessionTime, SessionType, SetupStep, TrackItem } from '../../features/rapear/types';
import { formatTime, getCountdownColor, getSessionDuration, getSessionTimerColor } from '../../features/rapear/utils';

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
  const [modes, setModes] = useState<ModeEntity[]>([]);
  const [loadingInstrumentals, setLoadingInstrumentals] = useState(false);
  const [loadingModes, setLoadingModes] = useState(false);
  const [selectedMode, setSelectedMode] = useState<RapMode | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<InstrumentalId | null>(null);
  const [selectedSessionTime, setSelectedSessionTime] = useState<SessionTime | null>('1-min');
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('record');
  const [setupStep, setSetupStep] = useState<SetupStep>('mode');
  const [pressedMode, setPressedMode] = useState<RapMode | null>(null);
  const [previewTrack, setPreviewTrack] = useState<InstrumentalId | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);
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
  const [isRecordingBeatPlaying, setIsRecordingBeatPlaying] = useState(true);
  const [trainingRestartKey, setTrainingRestartKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [, setRecordedVideoUri] = useState<string | null>(null);
  const [, setRecordedThumbnailUri] = useState<string | null>(null);
  const [isRecordingCaptureActive, setIsRecordingCaptureActive] = useState(false);

  const rapModes: RapModeOption[] = useMemo(
    () =>
      modes.map((mode) => ({
        key: mode.Key,
        label: mode.Name,
        description: mode.Description,
        icon: mode.Icon,
        accent: mode.Accent,
      })),
    [modes]
  );

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

  const loadModes = useCallback(async () => {
    setLoadingModes(true);
    const data = await getModes();
    setModes(data);
    setLoadingModes(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPreviewTrack(null);
    setPressedMode(null);
    setBaseSelectorVisible(false);
    await loadModes();
    await loadInstrumentals();
    await new Promise((resolve) => setTimeout(resolve, 300));
    setRefreshing(false);
  }, [loadInstrumentals, loadModes]);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webPreviewAudioRef = useRef<any>(null);
  const webTrainingAudioRef = useRef<any>(null);
  const webTrainingTrackRef = useRef<InstrumentalId | null>(null);
  const webRestartKeyAppliedRef = useRef(0);
  const latestTrainingRestartKeyRef = useRef(0);
  const nativePreviewSoundRef = useRef<NativeAudioPlayer | null>(null);
  const nativeTrainingSoundRef = useRef<NativeAudioPlayer | null>(null);
  const nativeTrainingTrackRef = useRef<InstrumentalId | null>(null);
  const nativeRestartKeyAppliedRef = useRef(0);
  const nativeAudioUnavailableRef = useRef(false);
  const previewRequestRef = useRef(0);
  const trainingRequestRef = useRef(0);
  const nativePreviewStatusListenerRef = useRef<{ remove: () => void } | null>(null);
  const cameraRef = useRef<any>(null);
  const recordingTaskRef = useRef<Promise<void> | null>(null);
  const recordedVideoUriRef = useRef<string | null>(null);
  const recordedThumbnailUriRef = useRef<string | null>(null);

  const initialSessionSeconds = getSessionDuration(selectedSessionTime);
  const availableSessionTimes = selectedSessionType === 'train' ? TRAINING_TIME : SESSION_TIMES;
  const selectedTrackLabel = tracks.find((track) => track.key === selectedTrack)?.label ?? '-';
  latestTrainingRestartKeyRef.current = trainingRestartKey;
  const selectedModeInfo = rapModes.find((mode) => mode.key === selectedMode);
  const summaryModeInfo = rapModes.find((mode) => mode.key === sessionSummary?.mode);
  const instrumentalVolume = 0.8;
  const sessionBeatVolume = selectedSessionType === 'record' && hasSessionStarted ? Math.max(instrumentalVolume, 0.65) : instrumentalVolume;

  const summaryVideoPlayer = useVideoPlayer(
    sessionSummary?.recordedVideoUri ? { uri: sessionSummary.recordedVideoUri } : null,
    (player) => {
      player.pause();
      player.loop = false;
    }
  );

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
    loadModes();
  }, [loadModes]);

  useEffect(() => {
    loadInstrumentals();
  }, [loadInstrumentals]);

  useEffect(() => {
    if (!rapModes.length) {
      setSelectedMode(null);
      return;
    }

    if (!selectedMode || !rapModes.some((mode) => mode.key === selectedMode)) {
      setSelectedMode(rapModes[0].key);
    }
  }, [rapModes, selectedMode]);

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
      return require('expo-audio');
    } catch {
      if (!nativeAudioUnavailableRef.current) {
        nativeAudioUnavailableRef.current = true;
        Alert.alert(
          'Audio nativo no disponible',
          'Para reproducir dentro de la app en iOS/Android necesitas instalar expo-audio.'
        );
      }
      return null;
    }
  }, []);

  const createNativeAudioPlayer = useCallback((audioModule: any, source: string): NativeAudioPlayer | null => {
    if (audioModule?.createAudioPlayer) {
      return audioModule.createAudioPlayer(source) as NativeAudioPlayer;
    }
    if (audioModule?.Audio?.createAudioPlayer) {
      return audioModule.Audio.createAudioPlayer(source) as NativeAudioPlayer;
    }
    return null;
  }, []);

  const disposeNativeSound = useCallback((sound: NativeAudioPlayer | null) => {
    if (!sound) return;
    sound.remove?.();
    sound.release?.();
  }, []);

  const resolveCameraModule = useCallback(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('expo-camera');
    } catch {
      return null;
    }
  }, []);

  const stopNativeSound = useCallback(async (ref: React.MutableRefObject<NativeAudioPlayer | null>) => {
    if (Platform.OS === 'web' || !ref.current) return;
    try {
      ref.current.pause?.();
      disposeNativeSound(ref.current);
    } catch {
      // ignore cleanup errors
    } finally {
      ref.current = null;
    }
  }, [disposeNativeSound]);

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
    webTrainingTrackRef.current = null;
    webRestartKeyAppliedRef.current = latestTrainingRestartKeyRef.current;
  }, []);

  const stopPreviewPlayback = useCallback(async () => {
    setPreviewTrack(null);
    nativePreviewStatusListenerRef.current?.remove();
    nativePreviewStatusListenerRef.current = null;
    stopWebPreviewSound();
    await stopNativeSound(nativePreviewSoundRef);
  }, [stopNativeSound, stopWebPreviewSound]);

  const stopTrainingPlayback = useCallback(async () => {
    stopWebTrainingSound();
    await stopNativeSound(nativeTrainingSoundRef);
    nativeTrainingTrackRef.current = null;
    nativeRestartKeyAppliedRef.current = latestTrainingRestartKeyRef.current;
  }, [stopNativeSound, stopWebTrainingSound]);

  const stopAllAudioPlayback = useCallback(async () => {
    await stopPreviewPlayback();
    await stopTrainingPlayback();
    setIsTrainingBeatPlaying(false);
    setIsRecordingBeatPlaying(false);
  }, [stopPreviewPlayback, stopTrainingPlayback]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
        setCountdown(null);
        setHasSessionStarted(false);
        setSessionVisible(false);
        setBaseSelectorVisible(false);
        void stopAllAudioPlayback();
      };
    }, [stopAllAudioPlayback])
  );

  useEffect(() => {
    if (setupStep !== 'track') {
      void stopAllAudioPlayback();
    }
  }, [setupStep, stopAllAudioPlayback]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const shouldPlayBeat = selectedSessionType === 'train' ? isTrainingBeatPlaying : isRecordingBeatPlaying || hasSessionStarted;

    if (!sessionVisible || !selectedTrack || !shouldPlayBeat) {
      if (webTrainingAudioRef.current) {
        webTrainingAudioRef.current.pause();
      }
      return;
    }

    const currentTrack = tracks.find((track) => track.key === selectedTrack);
    if (!currentTrack?.url) return;

    const shouldRestart = trainingRestartKey !== webRestartKeyAppliedRef.current;

    const shouldLoadNewTrack = webTrainingTrackRef.current !== selectedTrack;

    if (shouldRestart || shouldLoadNewTrack) {
      stopWebTrainingSound();

      const audio = new Audio(currentTrack.url);
      audio.loop = true;
      audio.volume = sessionBeatVolume;
      webTrainingAudioRef.current = audio;
      webTrainingTrackRef.current = selectedTrack;
      webRestartKeyAppliedRef.current = trainingRestartKey;
    }

    webTrainingAudioRef.current.play().catch(() => {
      setIsTrainingBeatPlaying(false);
    });
  }, [hasSessionStarted, isRecordingBeatPlaying, isTrainingBeatPlaying, selectedSessionType, selectedTrack, sessionBeatVolume, sessionVisible, stopWebTrainingSound, tracks, trainingRestartKey]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const playTrainingNative = async () => {
      const requestId = ++trainingRequestRef.current;

      const shouldPlayBeat = selectedSessionType === 'train' ? isTrainingBeatPlaying : isRecordingBeatPlaying || hasSessionStarted;

      if (!sessionVisible || !selectedTrack || !shouldPlayBeat) {
        const currentTrainingSound = nativeTrainingSoundRef.current;
        if (currentTrainingSound) {
          try {
            currentTrainingSound.pause?.();
          } catch {
            // sound may have been unloaded by another effect; ignore
          }
        }
        return;
      }

      const currentTrack = tracks.find((track) => track.key === selectedTrack);
      if (!currentTrack?.url) return;

      const audioModule = resolveNativeAudioModule();
      if (!audioModule) return;

      const shouldRestart = trainingRestartKey !== nativeRestartKeyAppliedRef.current;

      const canResumeExisting =
        nativeTrainingSoundRef.current &&
        nativeTrainingTrackRef.current === selectedTrack &&
        !shouldRestart;

      if (canResumeExisting) {
        try {
          const currentTrainingPlayer = nativeTrainingSoundRef.current;
          currentTrainingPlayer?.play?.();
        } catch {
          setIsTrainingBeatPlaying(false);
        }
        return;
      }

      const previousTrainingSound = nativeTrainingSoundRef.current;
      if (previousTrainingSound) {
        previousTrainingSound.pause?.();
      }

      try {
        const sound = createNativeAudioPlayer(audioModule, currentTrack.url);
        if (!sound) {
          Alert.alert('Audio no compatible', 'No se pudo crear el reproductor de audio nativo.');
          return;
        }
        sound.loop = true;
        sound.volume = sessionBeatVolume;
        sound.play();
        if (requestId !== trainingRequestRef.current) {
          disposeNativeSound(sound);
          return;
        }
        nativeTrainingSoundRef.current = sound;
        nativeTrainingTrackRef.current = selectedTrack;
        nativeRestartKeyAppliedRef.current = trainingRestartKey;
        if (previousTrainingSound && previousTrainingSound !== sound) {
          disposeNativeSound(previousTrainingSound);
        }
      } catch {
        Alert.alert('No se pudo reproducir', 'No se pudo iniciar la reproducción de la base.');
        setIsTrainingBeatPlaying(false);
      }
    };

    playTrainingNative();
  }, [createNativeAudioPlayer, disposeNativeSound, hasSessionStarted, isRecordingBeatPlaying, resolveNativeAudioModule, isTrainingBeatPlaying, selectedSessionType, selectedTrack, sessionBeatVolume, sessionVisible, stopNativeSound, stopTrainingPlayback, tracks, trainingRestartKey]);

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

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (webPreviewAudioRef.current) webPreviewAudioRef.current.volume = instrumentalVolume;
      if (webTrainingAudioRef.current) webTrainingAudioRef.current.volume = sessionBeatVolume;
      return;
    }

    if (nativePreviewSoundRef.current) nativePreviewSoundRef.current.volume = instrumentalVolume;
    if (nativeTrainingSoundRef.current) nativeTrainingSoundRef.current.volume = sessionBeatVolume;
  }, [sessionBeatVolume]);

  const onSelectSessionType = (sessionType: SessionType) => {
    setSelectedSessionType(sessionType);
    setIsRecordingBeatPlaying(sessionType === 'record');
    setIsTrainingBeatPlaying(sessionType === 'train');

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
    const requestId = ++previewRequestRef.current;
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

      setPreviewTrack(trackId);

      const audioModule = resolveNativeAudioModule();
      if (!audioModule) return;

      const previousPreviewSound = nativePreviewSoundRef.current;
      if (previousPreviewSound) {
        previousPreviewSound.pause?.();
      }
      if (requestId !== previewRequestRef.current) return;
      stopTrainingPlayback();
      if (requestId !== previewRequestRef.current) return;

      try {
        const sound = createNativeAudioPlayer(audioModule, currentTrack.url);
        if (!sound) {
          setPreviewTrack(null);
          Alert.alert('Audio no compatible', 'No se pudo crear el reproductor de audio nativo.');
          return;
        }
        sound.loop = false;
        sound.volume = instrumentalVolume;
        sound.play();
        if (requestId !== previewRequestRef.current) {
          disposeNativeSound(sound);
          return;
        }
        nativePreviewStatusListenerRef.current?.remove();
        nativePreviewStatusListenerRef.current = sound.addListener?.('playbackStatusUpdate', (status: any) => {
          if (!status?.playing && status?.didJustFinish) {
            setPreviewTrack(null);
            stopNativeSound(nativePreviewSoundRef);
          }
        }) ?? null;
        nativePreviewSoundRef.current = sound;
        if (previousPreviewSound && previousPreviewSound !== sound) {
          disposeNativeSound(previousPreviewSound);
        }
      } catch {
        setPreviewTrack(null);
        Alert.alert('No se pudo reproducir', 'No se pudo iniciar la reproducción de la base.');
      }
      return;
    }

    const isSameTrackPlaying = previewTrack === trackId && webPreviewAudioRef.current;
    if (isSameTrackPlaying) {
      await stopPreviewPlayback();
      return;
    }

    setPreviewTrack(trackId);

    stopWebPreviewSound();
    if (requestId !== previewRequestRef.current) return;
    stopTrainingPlayback();
    if (requestId !== previewRequestRef.current) return;

    const audio = new Audio(currentTrack.url);
    audio.volume = instrumentalVolume;
    audio.onended = () => {
      setPreviewTrack(null);
      webPreviewAudioRef.current = null;
    };

    try {
      await audio.play();
      if (requestId !== previewRequestRef.current) {
        audio.pause();
        return;
      }
      webPreviewAudioRef.current = audio;
    } catch {
      setPreviewTrack(null);
      Alert.alert('No se pudo reproducir', 'No se pudo iniciar la reproducción de la base.');
    }
  };

  const syncCameraPermissionStatus = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      setHasCameraPermission(granted);
      return granted;
    }

    if (Platform.OS === 'web') {
      try {
        if ('permissions' in navigator && navigator.permissions?.query) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          const granted = result.state === 'granted';
          setHasCameraPermission(granted);
          return granted;
        }
      } catch {
        // ignore permission API errors on unsupported browsers
      }

      return hasCameraPermission === true;
    }

    const cameraModule = resolveCameraModule();
    if (!cameraModule?.Camera) {
      setHasCameraPermission(false);
      return false;
    }

    const permission = await cameraModule.Camera.getCameraPermissionsAsync();
    const granted = permission.status === 'granted';
    setHasCameraPermission(granted);
    return granted;
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

    const cameraModule = resolveCameraModule();
    if (!cameraModule?.Camera) {
      setHasCameraPermission(false);
      Alert.alert('Cámara no disponible', 'Instala expo-camera para activar permisos y vista previa en iOS.');
      return false;
    }

    const permission = await cameraModule.Camera.requestCameraPermissionsAsync();
    const accepted = permission.status === 'granted';
    setHasCameraPermission(accepted);
    if (!accepted) {
      Alert.alert(
        'Permiso de cámara denegado',
        'Si rechazaste el permiso en iPhone, debes activarlo desde Ajustes para volver a usar la cámara.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
        ]
      );
    }
    return accepted;
  };

  const syncMicrophonePermissionStatus = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      setHasMicrophonePermission(granted);
      return granted;
    }

    if (Platform.OS === 'web') {
      try {
        if ('permissions' in navigator && navigator.permissions?.query) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          const granted = result.state === 'granted';
          setHasMicrophonePermission(granted);
          return granted;
        }
      } catch {
        // ignore permission API errors on unsupported browsers
      }

      return hasMicrophonePermission === true;
    }

    const cameraModule = resolveCameraModule();
    if (!cameraModule?.Camera) {
      setHasMicrophonePermission(false);
      return false;
    }

    const permission = await cameraModule.Camera.getMicrophonePermissionsAsync();
    const granted = permission.status === 'granted';
    setHasMicrophonePermission(granted);
    return granted;
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Permiso de micrófono',
        message: 'Necesitamos acceder a tu micrófono para grabar tu voz durante la sesión.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Cancelar',
        buttonNeutral: 'Más tarde',
      });

      const accepted = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasMicrophonePermission(accepted);
      return accepted;
    }

    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setHasMicrophonePermission(true);
        return true;
      } catch {
        setHasMicrophonePermission(false);
        return false;
      }
    }

    const cameraModule = resolveCameraModule();
    if (!cameraModule?.Camera) {
      setHasMicrophonePermission(false);
      return false;
    }

    const permission = await cameraModule.Camera.requestMicrophonePermissionsAsync();
    const accepted = permission.status === 'granted';
    setHasMicrophonePermission(accepted);
    return accepted;
  };

  const openSession = async () => {
    if (!isReadyToStart) return;

    await syncCameraPermissionStatus();
    await syncMicrophonePermissionStatus();
    setSessionVisible(true);
    setCountdown(null);
    setElapsedSeconds(0);
    setIsUnlimitedSession(initialSessionSeconds === null);
    setRemainingSeconds(initialSessionSeconds);
    setHasSessionStarted(false);
    setIsTrainingBeatPlaying(selectedSessionType === 'train');
    setIsRecordingBeatPlaying(false);
    setRecordedVideoUri(null);
    setRecordedThumbnailUri(null);
    recordedVideoUriRef.current = null;
    recordedThumbnailUriRef.current = null;
    recordingTaskRef.current = null;

    if (selectedSessionType === 'train') {
      startSessionTimer();
    }
  };

  const startSessionTimer = () => {
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    setHasSessionStarted(true);
    setIsRecordingBeatPlaying(true);
    if (selectedSessionType === 'record') {
      setTrainingRestartKey((previous) => previous + 1);
      void startVideoRecordingCapture();
    }

    sessionIntervalRef.current = setInterval(() => {
      setElapsedSeconds((previousElapsed) => previousElapsed + 1);

      setRemainingSeconds((previousRemaining) => {
        if (previousRemaining === null) {
          return null;
        }

        if (previousRemaining <= 1) {
          setIsUnlimitedSession(true);
          return null;
        }

        return previousRemaining - 1;
      });
    }, 1000);
  };

  const generateVideoThumbnail = useCallback(async (videoUri: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const videoThumbnails = require('expo-video-thumbnails');
      if (!videoThumbnails?.getThumbnailAsync) return null;
      const { uri } = await videoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000,
      });
      return uri ?? null;
    } catch {
      return null;
    }
  }, []);

  const startVideoRecordingCapture = useCallback(() => {
    if (selectedSessionType !== 'record' || Platform.OS === 'web') return;
    const activeCamera = cameraRef.current;
    if (isRecordingCaptureActive) return;
    if (!activeCamera?.recordAsync) {
      Alert.alert('Grabación no disponible', 'No se pudo iniciar la grabación de video en este dispositivo.');
      return;
    }

    const recordingTask = (async () => {
      try {
        setIsRecordingCaptureActive(true);
        const video = await activeCamera.recordAsync({ mute: false });
        const uri = video?.uri ?? null;
        if (!uri) return;
        recordedVideoUriRef.current = uri;
        setRecordedVideoUri(uri);
        const thumbnailUri = await generateVideoThumbnail(uri);
        recordedThumbnailUriRef.current = thumbnailUri;
        setRecordedThumbnailUri(thumbnailUri);
      } catch {
        // ignore recording interruption errors when user ends session
      } finally {
        setIsRecordingCaptureActive(false);
      }
    })();

    recordingTaskRef.current = recordingTask;
  }, [generateVideoThumbnail, isRecordingCaptureActive, selectedSessionType]);

  const stopVideoRecordingCapture = useCallback(async () => {
    if (Platform.OS === 'web') return;
    const activeCamera = cameraRef.current;
    if (!activeCamera?.stopRecording) return;
    try {
      activeCamera.stopRecording();
      await recordingTaskRef.current;
    } catch {
      // ignore stop errors
    } finally {
      recordingTaskRef.current = null;
    }
  }, []);

  const onToggleCameraFacing = () => {
    if (!hasCameraPermission) {
      requestCameraPermission();
      return;
    }

    setCameraFacing((previousFacing) => (previousFacing === 'front' ? 'back' : 'front'));
  };

  const resetSessionBeatPosition = async () => {
    if (Platform.OS === 'web') {
      if (webTrainingAudioRef.current) {
        webTrainingAudioRef.current.currentTime = 0;
      }
      return;
    }

    if (!nativeTrainingSoundRef.current) return;

    try {
      nativeTrainingSoundRef.current.seekTo?.(0);
    } catch {
      // ignore seek errors when resetting pre-record beat position
    }
  };

  const onStartRecordingPress = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert('Permiso requerido', 'Necesitas aceptar la cámara para iniciar la cuenta atrás de grabación.');
      return;
    }
    const microphoneGranted = await requestMicrophonePermission();
    if (!microphoneGranted) {
      Alert.alert('Permiso requerido', 'Necesitas aceptar el micrófono para grabar tu voz.');
      return;
    }

    await stopPreviewPlayback();
    await resetSessionBeatPosition();
    setIsRecordingBeatPlaying(false);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setCountdown(PRE_RECORD_COUNTDOWN_SECONDS);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((previousCountdown) => {
        if (previousCountdown === null) {
          return PRE_RECORD_COUNTDOWN_SECONDS;
        }

        const nextCountdown = previousCountdown - 1;
        if (nextCountdown <= 3 && nextCountdown >= 1) {
          Vibration.vibrate(90);
        }

        if (nextCountdown <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          startSessionTimer();
          return null;
        }

        return nextCountdown;
      });
    }, 1000);
  };

  const finishSession = async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);

    setSessionVisible(false);
    await stopVideoRecordingCapture();
    stopTrainingPlayback();
    setCountdown(null);
    setRemainingSeconds(initialSessionSeconds);
    setIsUnlimitedSession(initialSessionSeconds === null);
    setHasSessionStarted(false);
    setBaseSelectorVisible(false);
    setIsRecordingBeatPlaying(false);

    const capturedVideoUri = recordedVideoUriRef.current;
    const capturedThumbnailUri = recordedThumbnailUriRef.current;
    const nextSummary: SessionSummary = {
      mode: selectedMode,
      sessionType: selectedSessionType,
      instrumental: selectedTrack,
      instrumentalLabel: selectedTrackLabel,
      elapsedSeconds,
      recordedVideoUri: capturedVideoUri ?? undefined,
      recordedThumbnailUri: capturedThumbnailUri ?? undefined,
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

  const stopSession = async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);

    setSessionVisible(false);
    await stopVideoRecordingCapture();
    stopTrainingPlayback();
    setCountdown(null);
    setRemainingSeconds(initialSessionSeconds);
    setElapsedSeconds(0);
    setIsUnlimitedSession(initialSessionSeconds === null);
    setHasSessionStarted(false);
    setBaseSelectorVisible(false);
    setIsRecordingBeatPlaying(false);
  };

  const saveRecordedVideoToDevice = useCallback(async () => {
    if (!sessionSummary?.recordedVideoUri) {
      Alert.alert('Sin video', 'Aún no hay video grabado para guardar.');
      return;
    }

    if (Platform.OS === 'web') {
      const anchor = document.createElement('a');
      anchor.href = sessionSummary.recordedVideoUri;
      anchor.download = `freestyle-session-${Date.now()}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mediaLibrary = require('expo-media-library');
      if (!mediaLibrary?.requestPermissionsAsync || !mediaLibrary?.createAssetAsync) {
        Alert.alert('Guardar no disponible', 'Instala expo-media-library para guardar videos en el dispositivo.');
        return;
      }

      const permission = await mediaLibrary.requestPermissionsAsync();
      if (!permission?.granted) {
        Alert.alert('Permiso denegado', 'Necesitas permitir acceso a fotos y videos para guardar.');
        return;
      }

      const asset = await mediaLibrary.createAssetAsync(sessionSummary.recordedVideoUri);
      await mediaLibrary.createAlbumAsync('FreestyleZone', asset, false);
      Alert.alert('Guardado', 'Video guardado en el dispositivo.');
    } catch {
      Alert.alert('Error al guardar', 'No se pudo guardar el video en el dispositivo.');
    }
  }, [sessionSummary]);

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

  const applyTrainingTrackChange = useCallback((track: InstrumentalId) => {
    void stopPreviewPlayback();
    setSelectedTrack(track);
    setTrainingRestartKey((previous) => previous + 1);
    setIsTrainingBeatPlaying(true);
  }, [stopPreviewPlayback]);

  const onSelectTrainingTrack = (track: InstrumentalId) => {
    applyTrainingTrackChange(track);
    setBaseSelectorVisible(false);
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
      const player = nativeTrainingSoundRef.current;
      const duration = Number.isFinite(player.duration) ? (player.duration as number) : Number.MAX_SAFE_INTEGER;
      const currentTime = Number.isFinite(player.currentTime) ? (player.currentTime as number) : 0;
      const nextPositionSeconds = Math.max(0, Math.min(duration, currentTime + secondsDelta));
      player.seekTo?.(nextPositionSeconds);
    } catch {
      Alert.alert('No se pudo adelantar/retroceder', 'No se pudo ajustar la posición de la instrumental.');
    }
  };

  const onTrainingPreviousTrack = () => {
    if (!selectedTrack || !tracks.length) return;
    const currentTrackIndex = tracks.findIndex((track) => track.key === selectedTrack);
    if (currentTrackIndex === -1) return;
    const previousTrack = tracks[(currentTrackIndex - 1 + tracks.length) % tracks.length];
    applyTrainingTrackChange(previousTrack.key);
  };

  const onTrainingNextTrack = () => {
    if (!selectedTrack || !tracks.length) return;
    const currentTrackIndex = tracks.findIndex((track) => track.key === selectedTrack);
    if (currentTrackIndex === -1) return;
    const nextTrack = tracks[(currentTrackIndex + 1) % tracks.length];
    applyTrainingTrackChange(nextTrack.key);
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
  const CameraPreviewComponent = resolveCameraModule()?.CameraView ?? null;

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
          <ModeStepView
            isDark={isDark}
            loadingModes={loadingModes}
            rapModes={rapModes}
            selectedMode={selectedMode}
            pressedMode={pressedMode}
            onPressInMode={setPressedMode}
            onPressOutMode={(mode) => setPressedMode((currentMode) => (currentMode === mode ? null : currentMode))}
            onSelectMode={setSelectedMode}
            themeColors={themeColors}
          />
        ) : null}

        {setupStep === 'track' ? (
          <TrackStepView
            loadingInstrumentals={loadingInstrumentals}
            tracks={tracks}
            selectedTrack={selectedTrack}
            previewTrack={previewTrack}
            onSelectTrack={setSelectedTrack}
            onToggleTrackPreview={(trackId) => void onToggleTrackPreview(trackId)}
            themeColors={themeColors}
          />
        ) : null}

        {setupStep === 'time' ? (
          <TimeStepView
            selectedSessionType={selectedSessionType}
            selectedSessionTime={selectedSessionTime}
            availableSessionTimes={availableSessionTimes}
            onSelectSessionType={onSelectSessionType}
            onSelectSessionTime={setSelectedSessionTime}
            themeColors={themeColors}
          />
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
      <Modal visible={sessionVisible} animationType="slide" onRequestClose={() => void stopSession()}>
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
                  <Pressable style={styles.finishButton} onPress={() => void finishSession()}>
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
                            return !previous;
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
                {hasCameraPermission && CameraPreviewComponent ? (
                  <CameraPreviewComponent ref={cameraRef} style={styles.cameraPreviewLayer} facing={cameraFacing} mode="video" mute={false} />
                ) : (
                  <View style={styles.cameraPermissionEmptyState}>
                    <MaterialIcons name="videocam-off" size={28} color="#FFFFFFCC" />
                    <Text style={styles.cameraPermissionEmptyStateText}>Activa permiso de cámara para previsualizarte antes de grabar.</Text>
                  </View>
                )}
                <View style={[styles.trainingHeader, { paddingTop: insets.top + 8 }]}>
                  <View style={styles.recordingOverlayInfoBlock}>
                    <Text style={styles.recordingOverlayAppName}>FreestyleZone</Text>
                    <Text style={[styles.timer, styles.recordingOverlayTimer, { color: timerColor }]}>{displayTimer}</Text>
                    <View style={[styles.trainingModeTag, styles.recordingOverlayTag]}>
                      <MaterialIcons name="mic" size={11} color="#FFFFFF" />
                      <Text style={styles.recordingModeTagText}>{selectedModeInfo?.label ?? 'Modo no seleccionado'}</Text>
                    </View>
                  </View>
                  <View style={styles.sessionHeaderActions}>
                    <Pressable style={styles.finishButton} onPress={() => void finishSession()}>
                      <Text style={styles.finishButtonText}>Finalizar</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.sessionBottomActions, { paddingBottom: insets.bottom + 26 }]}>
                  {countdown !== null ? <Text style={[styles.countdownNumber, { color: getCountdownColor(countdown) }]}>{countdown}</Text> : null}

                  {!hasSessionStarted && countdown === null ? (
                    <View style={styles.preSessionActionsRow}>
                      {(!hasCameraPermission || !hasMicrophonePermission) ? (
                        <View style={styles.recordingConfigCard}>
                          <Text style={styles.recordingConfigTitle}>Activa permisos</Text>
                          <View style={styles.recordingConfigActions}>
                            {!hasCameraPermission ? (
                              <Pressable style={styles.recordingConfigActionButton} onPress={requestCameraPermission}>
                                <MaterialIcons name="videocam" size={17} color="#FFFFFF" />
                                <Text style={styles.recordingConfigActionText}>Permiso cámara</Text>
                              </Pressable>
                            ) : null}
                            {!hasMicrophonePermission ? (
                              <Pressable style={styles.recordingConfigActionButton} onPress={requestMicrophonePermission}>
                                <MaterialIcons name="mic" size={17} color="#FFFFFF" />
                                <Text style={styles.recordingConfigActionText}>Permiso micro</Text>
                              </Pressable>
                            ) : null}
                          </View>
                        </View>
                      ) : null}

                      <View style={styles.recordPreControlsRow}>
                        <Pressable style={styles.preRecordSideButton} onPress={() => setIsRecordingBeatPlaying((previousState) => !previousState)}>
                          <MaterialIcons name={isRecordingBeatPlaying ? 'pause' : 'play-arrow'} size={24} color="#FFFFFF" />
                        </Pressable>

                        <Pressable style={styles.recordButton} onPress={() => void onStartRecordingPress()}>
                          <View style={styles.recordButtonInner} />
                        </Pressable>

                        <Pressable
                          style={[styles.preRecordSideButton, !hasCameraPermission && styles.bottomSwitchCameraDisabled]}
                          onPress={onToggleCameraFacing}
                          disabled={!hasCameraPermission}>
                          <MaterialIcons name="flip-camera-ios" size={22} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {hasSessionStarted ? (
                    <Pressable style={styles.liveSessionSwitchCameraButton} onPress={onToggleCameraFacing}>
                      <MaterialIcons name="flip-camera-ios" size={27} color="#FFFFFF" />
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
              {sessionSummary?.recordedVideoUri ? (
                <VideoView
                  player={summaryVideoPlayer}
                  style={styles.previewVideoPlayer}
                  contentFit="cover"
                  nativeControls
                />
              ) : null}
              {sessionSummary?.recordedThumbnailUri ? <Image source={{ uri: sessionSummary.recordedThumbnailUri }} style={styles.previewThumbnail} /> : null}
              <View style={styles.previewOverlayChip}>
                <MaterialIcons name="graphic-eq" size={12} color="#FFFFFF" />
                <Text style={styles.previewOverlayChipText}>{sessionSummary?.instrumentalLabel ?? 'Base'}</Text>
              </View>
              <Text style={[styles.previewTimer, { color: summaryTheme.primaryText }]}>{formatTime(sessionSummary?.elapsedSeconds ?? 0)}</Text>
            </View>
            <Text style={[styles.previewHint, { color: summaryTheme.tertiaryText }]}>Preview de la grabación + miniatura de referencia.</Text>
          </View>

          <View style={[styles.summaryMetaCard, { backgroundColor: summaryTheme.cardBg, borderColor: summaryTheme.cardBorder }]}> 
            <Text style={[styles.summaryMetaText, { color: summaryTheme.secondaryText }]}>Modo: {summaryModeInfo?.label ?? '-'}</Text>
            <Text style={[styles.summaryMetaDescription, { color: summaryTheme.tertiaryText }]}>Descripción: {summaryModeInfo?.description ?? '-'}</Text>
            <Text style={[styles.summaryMetaText, { color: summaryTheme.secondaryText }]}>Sesión: {sessionSummary?.sessionType === 'record' ? 'Grabar' : 'Entrenar'}</Text>
            <Text style={[styles.summaryMetaText, { color: summaryTheme.secondaryText }]}>Base: {sessionSummary?.instrumental ? sessionSummary.instrumentalLabel : '-'}</Text>
            <Text style={[styles.summaryMetaText, { color: summaryTheme.secondaryText }]}>Tiempo: {formatTime(sessionSummary?.elapsedSeconds ?? 0)}</Text>
          </View>

          <View style={styles.summaryActions}>
            <Pressable
              style={[styles.summaryActionButton, { backgroundColor: summaryTheme.buttonBg }]}
              onPress={() => void saveRecordedVideoToDevice()}>
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
