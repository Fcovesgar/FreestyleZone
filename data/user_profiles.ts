import { FirebaseError } from 'firebase/app';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseConfig';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
};

export async function getUserProfile(uid: string) {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

export async function upsertUserProfile(profile: UserProfile) {
  const userRef = doc(db, 'users', profile.uid);
  const snapshot = await getDoc(userRef);

  const payload: Record<string, unknown> = {
    Name: profile.name,
    Email: profile.email,
    updatedAt: serverTimestamp(),
  };

  if (!snapshot.exists()) {
    payload.Biography = '';
    payload.City = '';
    payload.Language = '';
    payload.Profile_image = '';
    payload.Rap_style = '';
    payload.Theme = '';
    payload.CreatedAt = serverTimestamp();
  }

  await setDoc(userRef, payload, { merge: true });
}

export function mapUserProfileErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return 'No se pudo guardar tu perfil en la base de datos.';
  }

  switch (error.code) {
    case 'permission-denied':
      return 'La base de datos rechazó la escritura del usuario (permission-denied).';
    case 'unavailable':
      return 'Firestore no está disponible temporalmente. Inténtalo de nuevo.';
    default:
      return 'No se pudo guardar tu perfil en la base de datos.';
  }
}
