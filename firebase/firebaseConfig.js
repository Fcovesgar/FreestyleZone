import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Directory, File, Paths } from 'expo-file-system';

const firebaseConfig = {
  apiKey: 'AIzaSyCJ83_dF1Aj7GFMKnIXqQKWz8p9Xv4qGyo',
  authDomain: 'freestylezone.firebaseapp.com',
  projectId: 'freestylezone',
  storageBucket: 'freestylezone.firebasestorage.app',
  messagingSenderId: '51200422013',
  appId: '1:51200422013:web:02b6f3a30082660f94c114',
  measurementId: 'G-855DV8TXBT',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const authStorageDir = new Directory(Paths.document, 'auth');
const authStorageFile = new File(authStorageDir, 'firebase-auth-storage.json');

let authStorageCache = null;

async function readAuthStorage() {
  if (authStorageCache) {
    return authStorageCache;
  }

  if (!authStorageFile.exists) {
    authStorageCache = {};
    return authStorageCache;
  }

  try {
    const content = await authStorageFile.text();
    const parsed = JSON.parse(content);
    authStorageCache = typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    authStorageCache = {};
  }

  return authStorageCache;
}

function writeAuthStorage(data) {
  if (!authStorageDir.exists) {
    authStorageDir.create({ idempotent: true, intermediates: true });
  }

  if (!authStorageFile.exists) {
    authStorageFile.create({ intermediates: true, overwrite: true });
  }

  authStorageFile.write(JSON.stringify(data));
  authStorageCache = data;
}

const filePersistenceStorage = {
  getItem: async (key) => {
    const state = await readAuthStorage();
    return typeof state[key] === 'string' ? state[key] : null;
  },
  setItem: async (key, value) => {
    const state = await readAuthStorage();
    writeAuthStorage({ ...state, [key]: value });
  },
  removeItem: async (key) => {
    const state = await readAuthStorage();
    if (!(key in state)) {
      return;
    }

    const { [key]: _, ...nextState } = state;
    writeAuthStorage(nextState);
  },
};

function buildAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(filePersistenceStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = buildAuth();
export const db = getFirestore(app);
