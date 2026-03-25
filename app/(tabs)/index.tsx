import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type RapMode = 'easy' | 'hard' | 'images';
type Track = 'base-1' | 'base-2' | 'base-3';
type SessionTime = '1-min' | '2-min' | '5-min';

const RAP_MODES: { key: RapMode; label: string; description: string }[] = [
  { key: 'easy', label: 'Easy mode', description: 'Palabras cada 10 segundos' },
  { key: 'hard', label: 'Hard mode', description: 'Palabras cada 5s' },
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

export default function RapearScreen() {
  const [selectedMode, setSelectedMode] = useState<RapMode | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedSessionTime, setSelectedSessionTime] = useState<SessionTime | null>(null);

  const isReadyToStart = useMemo(
    () => selectedMode !== null && selectedTrack !== null && selectedSessionTime !== null,
    [selectedMode, selectedTrack, selectedSessionTime]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>FreestyleZone</Text>
      <Text style={styles.title}>Configura tu sesión</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo (tipo de rap)</Text>
        <View style={styles.optionsRow}>
          {RAP_MODES.map((mode) => (
            <SelectableChip
              key={mode.key}
              label={mode.label}
              description={mode.description}
              selected={selectedMode === mode.key}
              onPress={() => setSelectedMode(mode.key)}
              selectionVariant={mode.key}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Base de fondo</Text>
        <View style={styles.optionsColumn}>
          {TRACKS.map((track) => (
            <SelectableChip
              key={track.key}
              label={track.label}
              selected={selectedTrack === track.key}
              onPress={() => setSelectedTrack(track.key)}
              fullWidth
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tiempo de la sesión</Text>
        <View style={styles.optionsRow}>
          {SESSION_TIMES.map((sessionTime) => (
            <SelectableChip
              key={sessionTime.key}
              label={sessionTime.label}
              selected={selectedSessionTime === sessionTime.key}
              onPress={() => setSelectedSessionTime(sessionTime.key)}
            />
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !isReadyToStart }}
        disabled={!isReadyToStart}
        onPress={() => {}}
        style={[styles.startButton, !isReadyToStart && styles.startButtonDisabled]}>
        <Text style={[styles.startButtonText, !isReadyToStart && styles.startButtonTextDisabled]}>Empezar</Text>
      </Pressable>
    </View>
  );
}

function SelectableChip({
  label,
  description,
  selected,
  onPress,
  fullWidth = false,
  selectionVariant = 'default',
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  fullWidth?: boolean;
  selectionVariant?: RapMode | 'default';
}) {
  const selectedStyle =
    selected && selectionVariant === 'easy'
      ? styles.chipSelectedEasy
      : selected && selectionVariant === 'hard'
        ? styles.chipSelectedHard
        : selected && selectionVariant === 'images'
          ? styles.chipSelectedImages
          : selected
            ? styles.chipSelected
            : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selectedStyle, fullWidth && styles.chipFullWidth]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      {description ? (
        <Text style={[styles.chipDescription, selected && styles.chipDescriptionSelected]}>{description}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 28,
  },
  badge: {
    color: '#9B9B9B',
    fontSize: 12,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionsColumn: {
    gap: 10,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#121212',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  chipSelectedImages: {
    borderColor: '#A855F7',
    backgroundColor: '#20152F',
  },
  chipFullWidth: {
    width: '100%',
  },
  chipText: {
    color: '#BDBDBD',
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipDescription: {
    color: '#8D8D8D',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  chipDescriptionSelected: {
    color: '#D8D8D8',
  },
  startButton: {
    marginTop: 'auto',
    marginBottom: 20,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  startButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
  startButtonTextDisabled: {
    color: '#787878',
  },
});
