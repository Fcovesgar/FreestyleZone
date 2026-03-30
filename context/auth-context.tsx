import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FirebaseError } from 'firebase/app';
import {
  makeRedirectUri,
  ResponseType,
  exchangeCodeAsync,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '@/firebase/firebaseConfig';
import { getEmailByUsername, getUserProfile, mapUserProfileErrorMessage, upsertUserProfile } from '@/data/user_profiles';
import { useAppThemeColors } from '@/hooks/use-app-theme-colors';

WebBrowser.maybeCompleteAuthSession();

export type AuthProviderUser = {
  uid: string;
  name: string;
  email: string;
  authMethod: 'google' | 'credentials';
};

type AuthResult = { ok: boolean; message?: string };

type AuthContextValue = {
  user: AuthProviderUser | null;
  isLoggedIn: boolean;
  isLoadingSession: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithGoogleToken: (idToken: string) => Promise<AuthResult>;
  signInWithCredentials: (usernameOrEmail: string, password: string) => Promise<AuthResult>;
  registerWithGoogle: () => Promise<AuthResult>;
  registerWithCredentials: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOutFromApp: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthMethod(providerId?: string): 'google' | 'credentials' {
  return providerId === 'google.com' ? 'google' : 'credentials';
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/\s+/g, '.');
}

function usernameToEmail(username: string) {
  const normalized = normalizeUsername(username);
  return `${normalized}@${AUTH_EMAIL_DOMAIN}`;
}

async function loadProfile(firebaseUser: User): Promise<AuthProviderUser> {
  const profile = await getUserProfile(firebaseUser.uid);

  const firestoreName = profile?.Name ?? profile?.name;
  const fallbackName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Freestyler';

  return {
    uid: firebaseUser.uid,
    name: String(firestoreName || fallbackName).trim(),
    email: firebaseUser.email || '',
    authMethod: mapAuthMethod(firebaseUser.providerData[0]?.providerId),
  };
}

async function buildAuthUserFromFirebase(firebaseUser: User): Promise<AuthProviderUser> {
  try {
    return await loadProfile(firebaseUser);
  } catch {
    const fallbackName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Freestyler';
    return {
      uid: firebaseUser.uid,
      name: fallbackName,
      email: firebaseUser.email || '',
      authMethod: mapAuthMethod(firebaseUser.providerData[0]?.providerId),
    };
  }
}

function getGoogleAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof FirebaseError && error.code.startsWith('auth/')) {
    return fallback;
  }

  return mapUserProfileErrorMessage(error);
}

function getCredentialRegisterErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return 'No se pudo crear la cuenta.';
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Ese correo ya está registrado. Prueba con otro.';
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/missing-email':
      return 'Introduce un correo válido para registrarte.';
    case 'auth/missing-password':
      return 'Introduce una contraseña para registrarte.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil. Usa al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Error de red. Revisa tu conexión e inténtalo de nuevo.';
    case 'auth/operation-not-allowed':
      return 'El registro no está disponible temporalmente. Inténtalo más tarde.';
    case 'auth/configuration-not-found':
      return 'El registro no está disponible temporalmente. Inténtalo más tarde.';
    case 'auth/admin-restricted-operation':
      return 'No se puede completar el registro en este momento.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e inténtalo otra vez.';
    default:
      return 'No se pudo crear la cuenta en este momento.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthProviderUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoadingSession(false);
        return;
      }

      void loadProfile(firebaseUser)
        .then((profile) => {
          setUser(profile);
          setIsAuthModalOpen(false);
        })
        .finally(() => {
          setIsLoadingSession(false);
        });
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      isLoadingSession,
      isAuthModalOpen,
      signInWithGoogle: async () => {
        if (Platform.OS !== 'web') {
          return { ok: false, message: 'Google no está configurado para esta plataforma.' };
        }

        try {
          if (auth.currentUser) {
            await signOut(auth);
          }

          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const response = await signInWithPopup(auth, provider);
          const name = response.user.displayName || response.user.email?.split('@')[0] || 'Freestyler';
          const email = response.user.email || '';

          await upsertUserProfile({ uid: response.user.uid, name, email });
          setUser(await buildAuthUserFromFirebase(response.user));
          setIsAuthModalOpen(false);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: getGoogleAuthErrorMessage(error, 'No se pudo iniciar con Google.') };
        }
      },
      signInWithGoogleToken: async (idToken: string) => {
        if (!idToken) {
          return { ok: false, message: 'No se recibió el token de Google.' };
        }

        try {
          const credential = GoogleAuthProvider.credential(idToken);
          const response = await signInWithCredential(auth, credential);
          const name = response.user.displayName || response.user.email?.split('@')[0] || 'Freestyler';
          const email = response.user.email || '';

          await upsertUserProfile({ uid: response.user.uid, name, email });
          setUser(await buildAuthUserFromFirebase(response.user));
          setIsAuthModalOpen(false);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: getGoogleAuthErrorMessage(error, 'No se pudo iniciar con Google.') };
        }
      },
      signInWithCredentials: async (usernameOrEmail: string, password: string) => {
        if (!usernameOrEmail.trim() || !password.trim()) {
          return { ok: false, message: 'Introduce nombre de usuario/email y contraseña.' };
        }

        try {
          const resolvedEmail = await getEmailByUsername(usernameOrEmail);
          if (!resolvedEmail) {
            return { ok: false, message: 'No existe ningún usuario con ese nombre o email.' };
          }

          await signInWithEmailAndPassword(auth, resolvedEmail, password);
          setIsAuthModalOpen(false);
          return { ok: true };
        } catch {
          return { ok: false, message: 'Credenciales inválidas.' };
        }
      },
      registerWithGoogle: async () => {
        if (Platform.OS !== 'web') {
          return { ok: false, message: 'Google no está configurado para esta plataforma.' };
        }

        try {
          if (auth.currentUser) {
            await signOut(auth);
          }

          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const response = await signInWithPopup(auth, provider);
          const name = response.user.displayName || response.user.email?.split('@')[0] || 'Freestyler';
          const email = response.user.email || '';

          await upsertUserProfile({ uid: response.user.uid, name, email });
          setUser(await buildAuthUserFromFirebase(response.user));
          setIsAuthModalOpen(false);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: getGoogleAuthErrorMessage(error, 'No se pudo registrar con Google.') };
        }
      },
      registerWithCredentials: async (name: string, email: string, password: string) => {
        if (!name.trim() || !email.trim() || !password.trim()) {
          return { ok: false, message: 'Completa nombre, email y contraseña para registrarte.' };
        }

        try {
          const normalizedName = name.trim();
          const normalizedEmail = email.trim().toLowerCase();
          const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

          try {
            await updateProfile(credential.user, { displayName: normalizedName });
          } catch {
            // Si falla, mantenemos la cuenta creada y usamos fallback de nombre.
          }

          try {
            await upsertUserProfile({ uid: credential.user.uid, name: normalizedName, email: normalizedEmail });
          } catch (error) {
            return { ok: false, message: mapUserProfileErrorMessage(error) };
          }

          setUser({
            uid: credential.user.uid,
            name: normalizedName,
            email: normalizedEmail,
            authMethod: 'credentials',
          });
          setIsAuthModalOpen(false);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: getCredentialRegisterErrorMessage(error) };
        }
      },
      signOutFromApp: async () => {
        await signOut(auth);
        setIsAuthModalOpen(true);
      },
      openAuthModal: () => setIsAuthModalOpen(true),
      closeAuthModal: () => setIsAuthModalOpen(false),
    }),
    [isAuthModalOpen, isLoadingSession, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}

export function AuthEntryModal() {
  const colors = useAppThemeColors();
  const {
    isLoggedIn,
    isLoadingSession,
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    signInWithGoogleToken,
    signInWithCredentials,
    registerWithGoogle,
    registerWithCredentials,
  } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleAuthInProgress, setIsGoogleAuthInProgress] = useState(false);
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const mobileGoogleClientId = Platform.OS === 'ios' ? googleIosClientId : googleAndroidClientId;
  const googleDiscovery = useAutoDiscovery('https://accounts.google.com');
  const [googleRequest, googleResponse, promptGoogleAuth] = useAuthRequest(
    mobileGoogleClientId
      ? {
          clientId: mobileGoogleClientId,
          responseType: ResponseType.Code,
          scopes: ['openid', 'profile', 'email'],
          redirectUri: makeRedirectUri({ scheme: 'freestylezone', path: 'auth' }),
          extraParams: { prompt: 'select_account' },
        }
      : null,
    googleDiscovery
  );

  const resetForm = () => {
    setName('');
    setRegisterEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    resetForm();
  };

  useEffect(() => {
    if (Platform.OS === 'web' || !isGoogleAuthInProgress) {
      return;
    }

    if (googleResponse?.type === 'dismiss' || googleResponse?.type === 'cancel') {
      setError('Se canceló el inicio de sesión con Google.');
      setIsGoogleAuthInProgress(false);
      return;
    }

    if (googleResponse?.type !== 'success') {
      return;
    }

    if (!mobileGoogleClientId || !googleDiscovery?.tokenEndpoint || !googleRequest?.codeVerifier) {
      setError('La configuración de Google OAuth para móvil está incompleta.');
      setIsGoogleAuthInProgress(false);
      return;
    }

    const code = googleResponse.params?.code;
    if (!code) {
      setError('No se recibió el código de autorización de Google.');
      setIsGoogleAuthInProgress(false);
      return;
    }

    void (async () => {
      let idToken = '';
      try {
        const tokenResponse = await exchangeCodeAsync(
          {
            clientId: mobileGoogleClientId,
            code,
            redirectUri: makeRedirectUri({ scheme: 'freestylezone', path: 'auth' }),
            extraParams: { code_verifier: googleRequest.codeVerifier },
          },
          { tokenEndpoint: googleDiscovery.tokenEndpoint }
        );
        idToken = tokenResponse.idToken ?? '';
      } catch {
        setError('No se pudo completar el intercambio OAuth con Google.');
        setIsGoogleAuthInProgress(false);
        return;
      }

      if (!idToken) {
        setError('No se recibió el token de Google. Revisa la configuración OAuth de Android/iOS.');
        setIsGoogleAuthInProgress(false);
        return;
      }

      const authResult = await signInWithGoogleToken(idToken);
      if (!authResult.ok) {
        setError(authResult.message ?? 'No se pudo iniciar con Google.');
      } else {
        setName('');
        setRegisterEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
      }
      setIsGoogleAuthInProgress(false);
    })();
  }, [googleDiscovery, googleRequest, googleResponse, isGoogleAuthInProgress, mobileGoogleClientId, signInWithGoogleToken]);

  const handleCredentials = async () => {
    if (mode === 'register' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const result =
      mode === 'login' ? await signInWithCredentials(name, password) : await registerWithCredentials(name, registerEmail, password);

    if (!result.ok) {
      setError(result.message ?? 'No se pudo completar la acción.');
      return;
    }

    resetForm();
  };

  const handleGoogle = async () => {
    if (Platform.OS === 'web') {
      const result = mode === 'login' ? await signInWithGoogle() : await registerWithGoogle();
      if (!result.ok) {
        setError(result.message ?? 'No se pudo iniciar con Google.');
        return;
      }
      resetForm();
      return;
    }

    if (!googleIosClientId || !googleAndroidClientId) {
      setError('Configura EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID y EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.');
      return;
    }
    if (!googleRequest) {
      setError('No se pudo preparar la autenticación de Google en móvil.');
      return;
    }

    setError('');
    setIsGoogleAuthInProgress(true);
    const nativeResult = await promptGoogleAuth();
    if (nativeResult.type === 'dismiss' || nativeResult.type === 'cancel') {
      setError('Se canceló el inicio de sesión con Google.');
      setIsGoogleAuthInProgress(false);
      return;
    }
  };

  return (
    <Modal animationType="fade" transparent visible={!isLoggedIn && !isLoadingSession && isAuthModalOpen}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}> 
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.title, { color: colors.textPrimary }]}>{mode === 'login' ? 'Inicia sesión' : 'Regístrate'}</Text>

          <Pressable onPress={closeAuthModal} style={[styles.closeBtn, { borderColor: colors.border }]}>
            <Text style={[styles.closeBtnText, { color: colors.textPrimary }]}>✕</Text>
          </Pressable>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{mode === 'login' ? 'Usuario o email' : 'Nombre de usuario'}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            placeholder={mode === 'login' ? 'Tu usuario o correo' : 'Tu nombre de usuario'}
            placeholderTextColor="#8A8A8A"
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary }]}
          />

          {mode === 'register' ? (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                value={registerEmail}
                onChangeText={setRegisterEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#8A8A8A"
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary }]}
              />
            </>
          ) : null}

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#8A8A8A"
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary }]}
          />

          {mode === 'register' ? (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Repite la contraseña</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#8A8A8A"
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary }]}
              />
            </>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <Pressable onPress={handleGoogle} style={styles.googleBtn}>
              <View style={styles.googleBtnContent}>
                <FontAwesome name="google" size={16} color="#FFFFFF" />
                <Text style={styles.googleBtnText}>Google</Text>
              </View>
            </Pressable>
            <Pressable onPress={handleCredentials} style={[styles.mainBtn, { borderColor: colors.border }]}> 
              <Text style={[styles.mainBtnText, { color: colors.textPrimary }]}>{mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}</Text>
            </Pressable>
          </View>

          {mode === 'login' ? (
            <Text style={[styles.footText, { color: colors.textSecondary }]}>¿No tienes cuenta aún?</Text>
          ) : (
            <Text style={[styles.footText, { color: colors.textSecondary }]}>¿Ya tienes cuenta?</Text>
          )}

          <Pressable onPress={switchMode} style={styles.textButton}>
            <Text style={styles.textButtonLabel}>{mode === 'login' ? 'Regístrate' : 'Inicia sesión'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 14,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontWeight: '700', fontSize: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  errorText: { color: '#DB2C2C', fontSize: 13, fontWeight: '600', marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  googleBtn: {
    backgroundColor: '#6B46FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  googleBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  googleBtnText: { color: '#FFFFFF', fontWeight: '700' },
  mainBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  mainBtnText: { fontWeight: '700' },
  footText: { textAlign: 'center', marginTop: 10 },
  textButton: { alignItems: 'center', paddingVertical: 6, marginBottom: 2 },
  textButtonLabel: { color: '#6B46FF', fontWeight: '700' },
});
