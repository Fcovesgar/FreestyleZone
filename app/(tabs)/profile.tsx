import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/app-theme-context';

type RapStyle = 'Doble punch' | 'Metriquero' | 'Batallero';

const RAP_STYLES: RapStyle[] = ['Doble punch', 'Metriquero', 'Batallero'];

const RECORDINGS = [
  { id: '1', title: '#PunchlineChallenge', views: '12.8K', likes: '2.1K' },
  { id: '2', title: '#BatallaEnPlaza', views: '9.4K', likes: '1.2K' },
  { id: '3', title: '#FMSFlow', views: '22.3K', likes: '4.8K' },
];

export default function ProfileScreen() {
  const [username, setUsername] = useState('@mc_verso');
  const [city, setCity] = useState('Madrid, ES');
  const [bio, setBio] = useState('MC en progreso, barras y métricas todos los días.');
  const [rapStyle, setRapStyle] = useState<RapStyle>('Doble punch');
  const [avatarInitials, setAvatarInitials] = useState('MV');

  const { effectiveColorScheme, themePreference, setThemePreference } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#F4F5F7',
      card: isDark ? '#0E0E0E' : '#FFFFFF',
      border: isDark ? '#1E1E1E' : '#E3E3E3',
      textPrimary: isDark ? '#FFFFFF' : '#0B0B0B',
      textSecondary: isDark ? '#AEAEAE' : '#5E5E5E',
      inputBackground: isDark ? '#131313' : '#F2F2F2',
      selectedChip: '#6B46FF',
    }),
    [isDark]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.avatarText, { color: colors.textPrimary }]}>{avatarInitials}</Text>
          </View>
          <Pressable
            style={[styles.photoButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => setAvatarInitials((prev) => (prev === 'MV' ? 'FZ' : 'MV'))}>
            <Text style={[styles.photoButtonText, { color: colors.textPrimary }]}>Cambiar foto de perfil</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Editar datos del perfil</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Field label="Usuario" value={username} onChangeText={setUsername} colors={colors} />
            <Field label="Ciudad" value={city} onChangeText={setCity} colors={colors} />
            <Field label="Bio" value={bio} onChangeText={setBio} colors={colors} multiline />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Estilo de rapeo</Text>
            <View style={styles.chipsRow}>
              {RAP_STYLES.map((style) => {
                const selected = rapStyle === style;
                return (
                  <Pressable
                    key={style}
                    onPress={() => setRapStyle(style)}
                    style={[
                      styles.chip,
                      {
                        borderColor: selected ? colors.selectedChip : colors.border,
                        backgroundColor: selected ? '#6B46FF22' : colors.inputBackground,
                      },
                    ]}>
                    <Text
                      style={{
                        color: selected ? colors.selectedChip : colors.textPrimary,
                        fontWeight: selected ? '700' : '500',
                      }}>
                      {style}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Mis grabaciones</Text>
          <View style={styles.recordingsGrid}>
            {RECORDINGS.map((video) => (
              <View key={video.id} style={[styles.tiktokCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.tiktokPlay}>
                  <Text style={styles.tiktokPlayText}>▶</Text>
                </View>
                <Text style={[styles.tiktokTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {video.title}
                </Text>
                <Text style={[styles.tiktokStats, { color: colors.textSecondary }]}>
                  {video.views} vistas · {video.likes} likes
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Configuración del perfil</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.themeRow}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Modo de la app</Text>
              <View style={styles.themeButtonsWrap}>
                <Pressable
                  onPress={() => setThemePreference('light')}
                  style={[
                    styles.themeButton,
                    themePreference === 'light' && styles.themeButtonActive,
                  ]}>
                  <Text style={styles.themeButtonText}>Claro</Text>
                </Pressable>
                <Pressable
                  onPress={() => setThemePreference('dark')}
                  style={[
                    styles.themeButton,
                    themePreference === 'dark' && styles.themeButtonActive,
                  ]}>
                  <Text style={styles.themeButtonText}>Oscuro</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.themeRow}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Alternar con switch</Text>
              <Switch
                value={themePreference === 'dark'}
                onValueChange={(enabled) => setThemePreference(enabled ? 'dark' : 'light')}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: {
    textSecondary: string;
    textPrimary: string;
    border: string;
    inputBackground: string;
  };
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            borderColor: colors.border,
            backgroundColor: colors.inputBackground,
          },
          multiline && styles.multiline,
        ]}
        placeholderTextColor="#8C8C8C"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  photoButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recordingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tiktokCard: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    minHeight: 156,
    justifyContent: 'flex-end',
  },
  tiktokPlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiktokPlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tiktokTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  tiktokStats: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeButtonsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#232327',
  },
  themeButtonActive: {
    backgroundColor: '#6B46FF',
  },
  themeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
