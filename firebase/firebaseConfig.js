import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { getAuth, initializeAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

function buildAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, { persistence: inMemoryPersistence });
  } catch {
    return getAuth(app);
  }
}

export const auth = buildAuth();
export const db = getFirestore(app);
