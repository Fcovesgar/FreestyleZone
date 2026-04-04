import type MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { Mode } from '../../data/get_modes';

export type RapMode = string;
export type InstrumentalId = string;
export type SessionTime = '1-min' | '2-min' | '5-min' | 'infinite';
export type SessionType = 'record' | 'train';
export type CameraFacing = 'front' | 'back';
export type SetupStep = 'mode' | 'track' | 'time';

export type SessionSummary = {
  mode: RapMode | null;
  modeLabel: string;
  modeIcon: keyof typeof MaterialIcons.glyphMap;
  sessionType: SessionType;
  instrumental: InstrumentalId | null;
  instrumentalLabel: string;
  elapsedSeconds: number;
  recordedWithMicrophone: boolean;
  recordedVideoUri?: string;
  renderedVideoUri?: string;
  recordedThumbnailUri?: string;
  overlayWordsTimeline?: { atSecond: number; word: string }[];
  hasEmbeddedOverlay?: boolean;
};

export type RapModeOption = {
  key: RapMode;
  label: string;
  description: string;
  icon: string;
  accent: string;
};

export type Instrumental = {
  id: string;
  Name: string;
  Url: string;
  Genre: string;
  Bpm: string;
  Active: boolean;
};

export type TrackItem = {
  key: InstrumentalId;
  label: string;
  description: string;
  bpm: string;
  url: string;
};

export type NativeAudioPlayer = {
  play: () => void;
  pause: () => void;
  remove?: () => void;
  release?: () => void;
  seekTo: (seconds: number) => void;
  addListener?: (eventName: string, listener: (status: any) => void) => { remove: () => void };
  duration?: number;
  currentTime?: number;
  playing?: boolean;
  volume?: number;
  loop?: boolean;
};

export type SessionTimeOption = {
  key: SessionTime;
  label: string;
  description: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export type SessionTypeOption = { key: SessionType; label: string };

export type ThemeColors = {
  screen: string;
  card: string;
  border: string;
  optionBorder: string;
  textPrimary: string;
  textSecondary: string;
  mutedBg: string;
  mutedBorder: string;
  activeBg: string;
};

export type SummaryTheme = {
  modalBg: string;
  cardBg: string;
  cardBorder: string;
  primaryText: string;
  secondaryText: string;
  tertiaryText: string;
  previewBg: string;
  buttonBg: string;
  closeBg: string;
};

export type ModeEntity = Mode;
