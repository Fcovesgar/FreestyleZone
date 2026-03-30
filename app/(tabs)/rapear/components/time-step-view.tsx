import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, Text, View } from 'react-native';

import { SESSION_TYPES } from '../constants';
import styles from '../styles';
import type { SessionTime, SessionTimeOption, SessionType, ThemeColors } from '../types';

type TimeStepViewProps = {
  selectedSessionType: SessionType;
  selectedSessionTime: SessionTime | null;
  availableSessionTimes: SessionTimeOption[];
  onSelectSessionType: (sessionType: SessionType) => void;
  onSelectSessionTime: (sessionTime: SessionTime) => void;
  themeColors: ThemeColors;
};

export function TimeStepView({
  selectedSessionType,
  selectedSessionTime,
  availableSessionTimes,
  onSelectSessionType,
  onSelectSessionTime,
  themeColors,
}: TimeStepViewProps) {
  return (
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
            onPress={() => onSelectSessionTime(sessionTime.key)}
            style={[styles.timeCard, { borderColor: selected ? '#6B46FF' : themeColors.optionBorder, backgroundColor: selected ? '#6B46FF22' : themeColors.card }]}
          >
            {sessionTime.icon ? <MaterialIcons name={sessionTime.icon} size={30} color={themeColors.textPrimary} /> : null}
            {!sessionTime.icon ? <Text style={[styles.timeTitle, { color: themeColors.textPrimary }]}>{sessionTime.label}</Text> : null}
            <Text style={[styles.timeDescription, { color: themeColors.textSecondary }]}>{sessionTime.description}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
