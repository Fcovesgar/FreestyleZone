import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type RapMode = 'easy' | 'hard' | 'images';
type Track = 'base-1' | 'base-2' | 'base-3';

const RAP_MODES: { key: RapMode; label: string }[] = [
  { key: 'easy', label: 'Easy mode' },
  { key: 'hard', label: 'Hard mode' },
  { key: 'images', label: 'Imágenes' },
];

const TRACKS: { key: Track; label: string }[] = [
  { key: 'base-1', label: 'Base Boom Bap' },
  { key: 'base-2', label: 'Base Trap' },
  { key: 'base-3', label: 'Base Lo-Fi' },
];

export default function RapearScreen() {
  const [selectedMode, setSelectedMode] = useState<RapMode | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const isReadyToStart = useMemo(() => selectedMode !== null && selectedTrack !== null, [selectedMode, selectedTrack]);

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>FreestyleZone</Text>
      <Text style={styles.title}>Configura tu sesión</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de rap</Text>
        <View style={styles.optionsRow}>
          {RAP_MODES.map((mode) => (
            <SelectableChip
              key={mode.key}
              label={mode.label}
              selected={selectedMode === mode.key}
              onPress={() => setSelectedMode(mode.key)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pista o base de fondo</Text>
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
  selected,
  onPress,
  fullWidth = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected, fullWidth && styles.chipFullWidth]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
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
