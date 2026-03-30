import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/app-theme-context';
import { useAuth } from '@/context/auth-context';
import { useAppThemeColors } from '@/hooks/use-app-theme-colors';

type RapStyle = 'Doble punch' | 'Metriquero' | 'Batallero';

type ProfileData = {
  username: string;
  city: string;
  bio: string;
  rapStyle: RapStyle;
  avatarUri: string;
};
type ProfileContentTab = 'videos' | 'lines';

const RAP_STYLES: RapStyle[] = ['Doble punch', 'Metriquero', 'Batallero'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIEW_TOP_OFFSET = 12;

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
];

export default function ProfileScreen() {
  const { effectiveColorScheme, themePreference, setThemePreference } = useAppTheme();
  const isDark = effectiveColorScheme === 'dark';
  const colors = useAppThemeColors();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn, openAuthModal, signOutFromApp } = useAuth();

  const [profile, setProfile] = useState<ProfileData>({
    username: '@mc_verso',
    city: 'Madrid, ES',
    bio: 'MC en progreso, barras y métricas todos los días.',
    rapStyle: 'Doble punch',
    avatarUri: AVATAR_OPTIONS[0],
  });
  const [draftProfile, setDraftProfile] = useState<ProfileData>(profile);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [accountVisible, setAccountVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileContentTab>('videos');
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setDraftProfile(profile);
    setActiveTab('videos');
    setSettingsVisible(false);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setRefreshing(false);
  }, [profile]);

  const profileTranslateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_WIDTH] });
  const editTranslateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_WIDTH, 0] });

  const openEditScreen = () => {
    setDraftProfile(profile);
    setIsEditing(true);
    Animated.timing(slideAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const closeEditScreen = (save: boolean) => {
    Keyboard.dismiss();

    if (save) {
      setProfile(draftProfile);
    }

    Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setIsEditing(false);
    });
  };

  const rotateAvatar = () => {
    const currentIndex = AVATAR_OPTIONS.findIndex((item) => item === draftProfile.avatarUri);
    const nextIndex = (currentIndex + 1) % AVATAR_OPTIONS.length;
    setDraftProfile((prev) => ({ ...prev, avatarUri: AVATAR_OPTIONS[nextIndex] }));
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, styles.loggedOutContainer, { backgroundColor: colors.screen }]} edges={['top', 'bottom']}>
        <View style={[styles.loggedOutCard, { backgroundColor: colors.card, borderColor: colors.sectionBorder }]}>
          <Text style={[styles.loggedOutTitle, { color: colors.textPrimary }]}>FreestyleZone</Text>
          <Text style={[styles.loggedOutDescription, { color: colors.textSecondary }]}>
            Inicia sesión/regístrate para acceder ahora a todas las funcionalidades
          </Text>
          <Pressable onPress={openAuthModal} style={styles.loggedOutButton}>
            <Text style={styles.saveButtonText}>ACCEDER</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screen }]} edges={['top', 'bottom']}>
      <Animated.View style={[styles.mainPanel, { transform: [{ translateX: profileTranslateX }] }]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: VIEW_TOP_OFFSET }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#FFFFFF' : '#111111'} />}>
          <View style={styles.topActionsRow}>
            <Pressable
              onPress={() => setThemePreference(themePreference === 'dark' ? 'light' : 'dark')}
              style={[styles.settingsBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <MaterialIcons name={themePreference === 'dark' ? 'dark-mode' : 'light-mode'} size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => setSettingsVisible(true)}
              style={[styles.settingsBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <MaterialIcons name="settings" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.profileStack}>
            <Image source={{ uri: profile.avatarUri }} style={[styles.avatar, { borderColor: colors.border }]} contentFit="cover" />
            <View style={styles.profileInfoStack}>
              <View style={styles.nameRow}>
                <Text style={[styles.username, { color: colors.textPrimary }]}>{profile.username}</Text>
                <Pressable onPress={openEditScreen} style={styles.iconBtn}>
                  <MaterialIcons name="edit" size={18} color={colors.textPrimary} />
                </Pressable>
              </View>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{profile.city}</Text>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>Estilo: {profile.rapStyle}</Text>
            </View>
          </View>

          <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.sectionBorder }]}>
            <Text style={[styles.bioLabel, { color: colors.textSecondary }]}>Bio</Text>
            <Text style={[styles.bioText, { color: colors.textPrimary }]}>{profile.bio}</Text>
          </View>

          <View style={styles.gridHeader}>
            <Pressable onPress={() => setActiveTab('videos')} style={styles.profileTabBtn}>
              <MaterialIcons name="grid-view" size={20} color={activeTab === 'videos' ? colors.textPrimary : colors.textSecondary} />
              <Text style={[styles.profileTabText, { color: activeTab === 'videos' ? colors.textPrimary : colors.textSecondary }]}>Videos</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab('lines')} style={styles.profileTabBtn}>
              <MaterialIcons name="edit-note" size={20} color={activeTab === 'lines' ? colors.textPrimary : colors.textSecondary} />
              <Text style={[styles.profileTabText, { color: activeTab === 'lines' ? colors.textPrimary : colors.textSecondary }]}>Mis líneas</Text>
            </Pressable>
          </View>

          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.sectionBorder }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {activeTab === 'videos' ? 'Aún no hay videos.' : 'Aún no hay líneas privadas.'}
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {isEditing ? (
        <Animated.View style={[styles.editPanel, { backgroundColor: colors.screen, transform: [{ translateX: editTranslateX }] }]}>
          <KeyboardAvoidingView style={styles.editKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.editHeader, { paddingTop: insets.top + 10 }]}>
              <Pressable onPress={() => closeEditScreen(false)} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
              </Pressable>
              <Text style={[styles.editTitle, { color: colors.textPrimary }]}>Editar perfil</Text>
              <Pressable onPress={() => closeEditScreen(true)} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Aceptar</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.editContent} keyboardShouldPersistTaps="handled">
              <View style={styles.editAvatarWrap}>
                <Image source={{ uri: draftProfile.avatarUri }} style={[styles.editAvatar, { borderColor: colors.border }]} contentFit="cover" />
                <Pressable onPress={rotateAvatar} style={styles.editAvatarButton}>
                  <MaterialIcons name="edit" size={16} color="#FFFFFF" />
                </Pressable>
              </View>

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
                doneOnSubmit
              />

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
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : null}

      <Modal animationType="fade" transparent visible={settingsVisible} onRequestClose={() => setSettingsVisible(false)}>
        <View style={[styles.settingsBackdrop, { backgroundColor: colors.overlay }]}> 
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Configuración</Text>
            <Pressable
              onPress={() => {
                setSettingsVisible(false);
                setAccountVisible(true);
              }}
              style={[styles.closeSettingsBtn, { borderColor: colors.border }]}> 
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Datos del usuario</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setSettingsVisible(false);
                void signOutFromApp();
              }}
              style={[styles.logoutBtn, { borderColor: '#DB2C2C' }]}> 
              <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
            </Pressable>
            <Pressable onPress={() => setSettingsVisible(false)} style={[styles.closeSettingsBtn, { borderColor: colors.border }]}> 
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={accountVisible} onRequestClose={() => setAccountVisible(false)}>
        <View style={[styles.settingsBackdrop, { backgroundColor: colors.overlay }]}> 
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Datos del usuario</Text>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nombre: {user?.name ?? 'Sin sesión'}</Text>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email: {user?.email ?? 'Sin sesión'}</Text>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Método: {user?.authMethod === 'google' ? 'Google' : user?.authMethod === 'credentials' ? 'Usuario y contraseña' : 'Sin sesión'}
            </Text>
            <Pressable onPress={() => setAccountVisible(false)} style={[styles.closeSettingsBtn, { borderColor: colors.border }]}> 
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
  doneOnSubmit,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: { textPrimary: string; textSecondary: string; border: string; inputBg: string };
  multiline?: boolean;
  doneOnSubmit?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        blurOnSubmit={doneOnSubmit}
        onSubmitEditing={doneOnSubmit ? () => Keyboard.dismiss() : undefined}
        returnKeyType={doneOnSubmit ? 'done' : 'default'}
        submitBehavior={doneOnSubmit ? 'blurAndSubmit' : undefined}
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
  mainPanel: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18, paddingBottom: 30 },
  topActionsRow: { alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' },
  profileStack: { alignItems: 'center', gap: 10, marginTop: 4 },
  profileInfoStack: { alignItems: 'center' },
  avatar: { width: 116, height: 116, borderRadius: 58, borderWidth: 1.5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
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
  dataCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  bioLabel: { fontSize: 12, fontWeight: '600' },
  bioText: { fontSize: 14, lineHeight: 20 },
  gridHeader: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 8 },
  profileTabBtn: { alignItems: 'center', gap: 3 },
  profileTabText: { fontSize: 12, fontWeight: '600' },
  emptyState: {
    minHeight: 130,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: { fontSize: 14, fontWeight: '500' },
  editPanel: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  editKeyboard: {
    flex: 1,
  },
  editHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTitle: { fontSize: 20, fontWeight: '700' },
  saveButton: {
    backgroundColor: '#6B46FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700' },
  editContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  editAvatarWrap: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  editAvatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
  },
  editAvatarButton: {
    position: 'absolute',
    right: '37%',
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6B46FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBackdrop: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 0 },
  settingsCard: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12, alignSelf: 'stretch' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  multiline: { minHeight: 74, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  actionBtnText: { fontWeight: '600' },
  closeSettingsBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  logoutBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#DB2C2C1A' },
  logoutBtnText: { fontWeight: '700', color: '#DB2C2C' },
  loggedOutContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loggedOutCard: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 24, width: '100%', gap: 18 },
  loggedOutTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  loggedOutDescription: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 2 },
  loggedOutButton: {
    backgroundColor: '#6B46FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
  },
});
