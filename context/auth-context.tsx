import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppThemeColors } from '@/hooks/use-app-theme-colors';

export type AuthProviderUser = {
  username: string;
  authMethod: 'google' | 'credentials';
};

type AuthContextValue = {
  user: AuthProviderUser | null;
  isLoggedIn: boolean;
  signInWithGoogle: () => void;
  signInWithCredentials: (username: string, password: string) => { ok: boolean; message?: string };
  registerWithGoogle: () => void;
  registerWithCredentials: (username: string, password: string) => { ok: boolean; message?: string };
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthProviderUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      signInWithGoogle: () => {
        setUser({ username: '@google_user', authMethod: 'google' });
      },
      signInWithCredentials: (username: string, password: string) => {
        if (!username.trim() || !password.trim()) {
          return { ok: false, message: 'Introduce usuario y contraseña.' };
        }

        setUser({ username: username.startsWith('@') ? username : `@${username}`, authMethod: 'credentials' });
        return { ok: true };
      },
      registerWithGoogle: () => {
        setUser({ username: '@google_user', authMethod: 'google' });
      },
      registerWithCredentials: (username: string, password: string) => {
        if (!username.trim() || !password.trim()) {
          return { ok: false, message: 'Completa usuario y contraseña para registrarte.' };
        }

        setUser({ username: username.startsWith('@') ? username : `@${username}`, authMethod: 'credentials' });
        return { ok: true };
      },
      signOut: () => {
        setUser(null);
      },
    }),
    [user]
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
  const { isLoggedIn, signInWithGoogle, signInWithCredentials, registerWithGoogle, registerWithCredentials } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setError('');
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    resetForm();
  };

  const handleCredentials = () => {
    const result = mode === 'login' ? signInWithCredentials(username, password) : registerWithCredentials(username, password);

    if (!result.ok) {
      setError(result.message ?? 'No se pudo completar la acción.');
      return;
    }

    resetForm();
  };

  const handleGoogle = () => {
    if (mode === 'login') {
      signInWithGoogle();
    } else {
      registerWithGoogle();
    }

    resetForm();
  };

  return (
    <Modal animationType="fade" transparent visible={!isLoggedIn}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}> 
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.title, { color: colors.textPrimary }]}>Bienvenido a FreestyleZone</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Inicia sesión ahora para acceder a todas las funcionalidades.</Text>

          <Pressable onPress={handleGoogle} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Iniciar con Google' : 'Registrarse con Google'}</Text>
          </Pressable>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nombre de usuario</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="Tu usuario"
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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable onPress={handleCredentials} style={[styles.secondaryBtn, { borderColor: colors.border }]}> 
            <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
              {mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </Text>
          </Pressable>

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
  subtitle: { fontSize: 14, lineHeight: 19 },
  primaryBtn: {
    backgroundColor: '#6B46FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryBtnText: { fontWeight: '700' },
  errorText: { color: '#DB2C2C', fontSize: 13, fontWeight: '600' },
  footText: { textAlign: 'center', marginTop: 6 },
  textButton: { alignItems: 'center', paddingVertical: 4 },
  textButtonLabel: { color: '#6B46FF', fontWeight: '700' },
});
