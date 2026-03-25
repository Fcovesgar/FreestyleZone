import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/app-theme-context';

type RapMode = 'easy' | 'hard' | 'incremental' | 'history' | 'ending' | 'images';
type Track = 'base-1' | 'base-2' | 'base-3';
type SessionTime = '1-min' | '2-min' | '5-min' | 'infinite';
type SessionType = 'record' | 'train';

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

export default function RapearScreen() {
  const insets = useSafeAreaInsets();
  const { effectiveColorScheme } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';

  const themeColors = useMemo(() => ({
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
  }), [isDark]);
  const [selectedMode, setSelectedMode] = useState<RapMode | null>('easy');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedSessionTime, setSelectedSessionTime] = useState<SessionTime | null>('1-min');
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('record');

  const isReadyToStart = useMemo(
    () => selectedMode !== null && selectedTrack !== null && selectedSessionTime !== null,
    [selectedMode, selectedTrack, selectedSessionTime]
  );
  const topModes = RAP_MODES.filter((mode) => ['easy', 'hard', 'incremental'].includes(mode.key));
  const bottomModes = RAP_MODES.filter((mode) => ['history', 'ending', 'images'].includes(mode.key));
  const availableSessionTimes = selectedSessionType === 'train' ? TRAINING_TIME : SESSION_TIMES;

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

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.screen }]} edges={['top', 'bottom']}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !isReadyToStart }}
        disabled={!isReadyToStart}
        onPress={() => {}}
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
    </SafeAreaView>
  );
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
});
