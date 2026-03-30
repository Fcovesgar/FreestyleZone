import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, Text, View } from 'react-native';

import styles from '../styles';
import type { InstrumentalId, ThemeColors, TrackItem } from '../types';

type TrackStepViewProps = {
  loadingInstrumentals: boolean;
  tracks: TrackItem[];
  selectedTrack: InstrumentalId | null;
  previewTrack: InstrumentalId | null;
  onSelectTrack: (trackId: InstrumentalId) => void;
  onToggleTrackPreview: (trackId: InstrumentalId) => void;
  themeColors: ThemeColors;
};

export function TrackStepView({
  loadingInstrumentals,
  tracks,
  selectedTrack,
  previewTrack,
  onSelectTrack,
  onToggleTrackPreview,
  themeColors,
}: TrackStepViewProps) {
  return (
    <View style={styles.optionsColumn}>
      {loadingInstrumentals ? <Text style={[styles.trackInfo, { color: themeColors.textSecondary }]}>Cargando instrumentales...</Text> : null}
      {!loadingInstrumentals && !tracks.length ? (
        <Text style={[styles.trackInfo, { color: themeColors.textSecondary }]}>No hay instrumentales activas en la base de datos.</Text>
      ) : null}
      {tracks.map((track) => {
        const selected = selectedTrack === track.key;
        const isPlaying = previewTrack === track.key;

        return (
          <View key={track.key} style={[styles.trackCard, { backgroundColor: selected ? '#6B46FF22' : themeColors.card, borderColor: selected ? '#6B46FF' : themeColors.optionBorder }]}>
            <Pressable onPress={() => onSelectTrack(track.key)} style={styles.trackMainArea}>
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
  );
}
