import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@/firebase/firebaseConfig';
import { useAppThemeColors } from '@/hooks/use-app-theme-colors';

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
  signInWithCredentials: (email: string, password: string) => Promise<AuthResult>;
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

async function loadProfile(firebaseUser: User): Promise<AuthProviderUser> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  const firestoreName = snapshot.exists() ? snapshot.data().Name : undefined;
  const fallbackName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Freestyler';

  return {
    uid: firebaseUser.uid,
    name: String(firestoreName || fallbackName),
    email: firebaseUser.email || '',
    authMethod: mapAuthMethod(firebaseUser.providerData[0]?.providerId),
  };
}

async function upsertUserProfile({ uid, name, email }: { uid: string; name: string; email: string }) {
  await setDoc(
    doc(db, 'users', uid),
    {
      Name: name,
      Email: email,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
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
          return { ok: false, message: 'El inicio con Google está disponible en web por ahora.' };
        }

        try {
          const provider = new GoogleAuthProvider();
          const response = await signInWithPopup(auth, provider);
          const name = response.user.displayName || response.user.email?.split('@')[0] || 'Freestyler';
          const email = response.user.email || '';

          await upsertUserProfile({ uid: response.user.uid, name, email });
          setIsAuthModalOpen(false);
          return { ok: true };
        } catch {
          return { ok: false, message: 'No se pudo iniciar con Google.' };
        }
      },
      signInWithCredentials: async (email: string, password: string) => {
        if (!email.trim() || !password.trim()) {
          return { ok: false, message: 'Introduce email y contraseña.' };
        }

        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
          setIsAuthModalOpen(false);
          return { ok: true };
        } catch {
          return { ok: false, message: 'Credenciales inválidas.' };
        }
      },
      registerWithGoogle: async () => {
        if (Platform.OS !== 'web') {
          return { ok: false, message: 'El inicio con Google está disponible en web por ahora.' };
        }

        try {
          const provider = new GoogleAuthProvider();
          const response = await signInWithPopup(auth, provider);
          const name = response.user.displayName || response.user.email?.split('@')[0] || 'Freestyler';
          const email = response.user.email || '';

          await upsertUserProfile({ uid: response.user.uid, name, email });
          setIsAuthModalOpen(false);
          return { ok: true };
        } catch {
          return { ok: false, message: 'No se pudo registrar con Google.' };
        }
      },
      registerWithCredentials: async (name: string, email: string, password: string) => {
        if (!name.trim() || !email.trim() || !password.trim()) {
          return { ok: false, message: 'Completa nombre, email y contraseña para registrarte.' };
        }

        try {
          const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          await updateProfile(credential.user, { displayName: name.trim() });
          await upsertUserProfile({ uid: credential.user.uid, name: name.trim(), email: email.trim() });
          setIsAuthModalOpen(false);
          return { ok: true };
        } catch {
          return { ok: false, message: 'No se pudo crear la cuenta.' };
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
    signInWithCredentials,
    registerWithGoogle,
    registerWithCredentials,
  } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    resetForm();
  };

  const handleCredentials = async () => {
    if (mode === 'register' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const result =
      mode === 'login' ? await signInWithCredentials(email, password) : await registerWithCredentials(name, email, password);

    if (!result.ok) {
      setError(result.message ?? 'No se pudo completar la acción.');
      return;
    }

    resetForm();
  };

  const handleGoogle = async () => {
    const result = mode === 'login' ? await signInWithGoogle() : await registerWithGoogle();

    if (!result.ok) {
      setError(result.message ?? 'No se pudo iniciar con Google.');
      return;
    }

    resetForm();
  };

  return (
    <Modal animationType="fade" transparent visible={!isLoggedIn && !isLoadingSession && isAuthModalOpen}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}> 
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.title, { color: colors.textPrimary }]}>Bienvenido a FreestyleZone</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Inicia sesión ahora para acceder a todas las funcionalidades.</Text>

          <Pressable onPress={closeAuthModal} style={[styles.closeBtn, { borderColor: colors.border }]}>
            <Text style={[styles.closeBtnText, { color: colors.textPrimary }]}>✕</Text>
          </Pressable>

          {mode === 'register' ? (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nombre</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor="#8A8A8A"
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary }]}
              />
            </>
          ) : null}

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#8A8A8A"
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary }]}
          />

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
              <Text style={styles.googleBtnText}>Google</Text>
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
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 19, paddingRight: 28 },
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
  inputLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { color: '#DB2C2C', fontSize: 13, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  googleBtn: {
    backgroundColor: '#6B46FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  googleBtnText: { color: '#FFFFFF', fontWeight: '700' },
  mainBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  mainBtnText: { fontWeight: '700' },
  footText: { textAlign: 'center', marginTop: 6 },
  textButton: { alignItems: 'center', paddingVertical: 4 },
  textButtonLabel: { color: '#6B46FF', fontWeight: '700' },
});
