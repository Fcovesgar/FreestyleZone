import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/app-theme-context';

type RapStyle = 'Doble punch' | 'Metriquero' | 'Batallero';

type ProfileData = {
  username: string;
  city: string;
  bio: string;
  rapStyle: RapStyle;
  avatarUri: string;
};

const RAP_STYLES: RapStyle[] = ['Doble punch', 'Metriquero', 'Batallero'];

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
];

export default function ProfileScreen() {
  const { effectiveColorScheme, themePreference, setThemePreference } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';

  const [profile, setProfile] = useState<ProfileData>({
    username: '@mc_verso',
    city: 'Madrid, ES',
    bio: 'MC en progreso, barras y métricas todos los días.',
    rapStyle: 'Doble punch',
    avatarUri: AVATAR_OPTIONS[0],
  });
  const [draftProfile, setDraftProfile] = useState<ProfileData>(profile);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const colors = useMemo(
    () => ({
      background: isDark ? '#020202' : '#F2F4F7',
      card: isDark ? '#0E0E0E' : '#FFFFFF',
      border: isDark ? '#1E1E1E' : '#DFE3E8',
      textPrimary: isDark ? '#FFFFFF' : '#141414',
      textSecondary: isDark ? '#AFAFAF' : '#5F646D',
      inputBg: isDark ? '#131313' : '#F4F5F7',
      overlay: isDark ? '#000000A8' : '#00000066',
    }),
    [isDark]
  );

  const openEditModal = () => {
    setDraftProfile(profile);
    setEditModalVisible(true);
  };

  const saveProfileChanges = () => {
    setProfile(draftProfile);
    setEditModalVisible(false);
  };

  const rotateAvatar = () => {
    const currentIndex = AVATAR_OPTIONS.findIndex((item) => item === draftProfile.avatarUri);
    const nextIndex = (currentIndex + 1) % AVATAR_OPTIONS.length;
    setDraftProfile((prev) => ({ ...prev, avatarUri: AVATAR_OPTIONS[nextIndex] }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View style={styles.userRow}>
            <Image source={{ uri: profile.avatarUri }} style={[styles.avatar, { borderColor: colors.border }]} contentFit="cover" />
            <View>
              <View style={styles.nameRow}>
                <Text style={[styles.username, { color: colors.textPrimary }]}>{profile.username}</Text>
                <Pressable onPress={openEditModal} style={styles.iconBtn}>
                  <MaterialIcons name="edit" size={18} color={colors.textPrimary} />
                </Pressable>
              </View>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{profile.city}</Text>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>Estilo: {profile.rapStyle}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setSettingsVisible(true)}
            style={[styles.settingsBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <MaterialIcons name="settings" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.bioLabel, { color: colors.textSecondary }]}>Bio</Text>
          <Text style={[styles.bioText, { color: colors.textPrimary }]}>{profile.bio}</Text>
        </View>

        <View style={styles.gridHeader}>
          <MaterialIcons name="grid-view" size={20} color={colors.textSecondary} />
        </View>

        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Aún no hay videos.</Text>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Editar perfil</Text>

              <Field
                label="Nombre de usuario"
                value={draftProfile.username}
                onChangeText={(text) => setDraftProfile((prev) => ({ ...prev, username: text }))}
                colors={colors}
              />
              <Field
                label="Ciudad"
                value={draftProfile.city}
                onChangeText={(text) => setDraftProfile((prev) => ({ ...prev, city: text }))}
                colors={colors}
              />
              <Field
                label="Bio"
                value={draftProfile.bio}
                onChangeText={(text) => setDraftProfile((prev) => ({ ...prev, bio: text }))}
                colors={colors}
                multiline
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Imagen de perfil</Text>
              <Pressable onPress={rotateAvatar} style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                <MaterialIcons name="photo-library" size={16} color={colors.textPrimary} />
                <Text style={[styles.imagePickerBtnText, { color: colors.textPrimary }]}>Seleccionar del dispositivo</Text>
              </Pressable>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Estilo de rapeo</Text>
              <View style={styles.chipsRow}>
                {RAP_STYLES.map((style) => {
                  const selected = draftProfile.rapStyle === style;
                  return (
                    <Pressable
                      key={style}
                      onPress={() => setDraftProfile((prev) => ({ ...prev, rapStyle: style }))}
                      style={[
                        styles.chip,
                        {
                          borderColor: selected ? '#6B46FF' : colors.border,
                          backgroundColor: selected ? '#6B46FF22' : colors.inputBg,
                        },
                      ]}>
                      <Text style={{ color: selected ? '#6B46FF' : colors.textPrimary, fontWeight: selected ? '700' : '500' }}>
                        {style}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <Pressable onPress={() => setEditModalVisible(false)} style={[styles.actionBtn, { borderColor: colors.border }]}> 
                  <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={saveProfileChanges} style={[styles.actionBtn, styles.actionBtnPrimary]}>
                  <Text style={styles.actionBtnPrimaryText}>Aceptar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="fade" transparent visible={settingsVisible} onRequestClose={() => setSettingsVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Configuración</Text>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tema de la app</Text>
            <View style={styles.themeButtonsWrap}>
              <Pressable
                onPress={() => setThemePreference('light')}
                style={[styles.themeBtn, themePreference === 'light' && styles.themeBtnActive]}>
                <Text style={styles.themeBtnText}>Claro</Text>
              </Pressable>
              <Pressable
                onPress={() => setThemePreference('dark')}
                style={[styles.themeBtn, themePreference === 'dark' && styles.themeBtnActive]}>
                <Text style={styles.themeBtnText}>Oscuro</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setSettingsVisible(false)} style={[styles.closeSettingsBtn, { borderColor: colors.border }]}> 
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  colors: { textPrimary: string; textSecondary: string; border: string; inputBg: string };
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[
          styles.input,
          { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg },
          multiline && styles.multiline,
        ]}
        placeholderTextColor="#8A8A8A"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 18, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userRow: { flexDirection: 'row', gap: 12 },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  username: { fontSize: 24, fontWeight: '700' },
  iconBtn: { padding: 4 },
  metaText: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  settingsBtn: {
    borderWidth: 1,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataCard: { borderRadius: 14, padding: 14, gap: 4 },
  bioLabel: { fontSize: 12, fontWeight: '600' },
  bioText: { fontSize: 14, lineHeight: 20 },
  gridHeader: { alignItems: 'center', marginTop: 8 },
  emptyState: {
    minHeight: 130,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: { fontSize: 14, fontWeight: '500' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  modalCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  modalScroll: { maxHeight: '76%' },
  modalContent: { gap: 12, paddingBottom: 8 },
  settingsCard: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12, alignSelf: 'stretch' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  multiline: { minHeight: 74, textAlignVertical: 'top' },
  imagePickerBtn: { borderWidth: 1, borderRadius: 10, padding: 11, flexDirection: 'row', gap: 8, alignItems: 'center' },
  imagePickerBtnText: { fontSize: 13, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  actionBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  actionBtnPrimary: { backgroundColor: '#6B46FF', borderColor: '#6B46FF' },
  actionBtnText: { fontWeight: '600' },
  actionBtnPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  themeButtonsWrap: { flexDirection: 'row', gap: 10 },
  themeBtn: { backgroundColor: '#2A2A2A', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  themeBtnActive: { backgroundColor: '#6B46FF' },
  themeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  closeSettingsBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
});
