import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, Text, View } from 'react-native';

import styles from '../styles';
import type { RapMode, RapModeOption, ThemeColors } from '../types';

type ModeStepViewProps = {
  isDark: boolean;
  loadingModes: boolean;
  rapModes: RapModeOption[];
  selectedMode: RapMode | null;
  pressedMode: RapMode | null;
  onPressInMode: (mode: RapMode) => void;
  onPressOutMode: (mode: RapMode) => void;
  onSelectMode: (mode: RapMode) => void;
  themeColors: ThemeColors;
};

export function ModeStepView({
  isDark,
  loadingModes,
  rapModes,
  selectedMode,
  pressedMode,
  onPressInMode,
  onPressOutMode,
  onSelectMode,
  themeColors,
}: ModeStepViewProps) {
  return (
    <View style={styles.modeRail}>
      {loadingModes ? <Text style={[styles.trackInfo, { color: themeColors.textSecondary }]}>Cargando modos...</Text> : null}
      {!loadingModes && !rapModes.length ? (
        <Text style={[styles.trackInfo, { color: themeColors.textSecondary }]}>No hay modos configurados en la base de datos.</Text>
      ) : null}
      {rapModes.map((mode) => {
        const selected = selectedMode === mode.key;
        const isActiveMode = selected || pressedMode === mode.key;
        const selectedCardTextColor = themeColors.textPrimary;
        const selectedModeBackground = isDark ? `${mode.accent}2B` : `${mode.accent}14`;
        const modeIcon = (mode.icon in MaterialIcons.glyphMap ? mode.icon : 'help-outline') as keyof typeof MaterialIcons.glyphMap;

        return (
          <Pressable
            key={mode.key}
            onPressIn={() => onPressInMode(mode.key)}
            onPressOut={() => onPressOutMode(mode.key)}
            onPress={() => onSelectMode(mode.key)}
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
                <MaterialIcons name={modeIcon} size={24} color={isActiveMode ? mode.accent : themeColors.textSecondary} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
