import { FirebaseError } from 'firebase/app';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

import { db } from '@/firebase/firebaseConfig';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
};

export type UserProfileDetailsUpdate = {
  name: string;
  bio: string;
  rapStyle: string;
  avatarUri: string;
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
    UsernameNormalized: profile.name.trim().toLowerCase(),
    updatedAt: serverTimestamp(),
  };

  if (!snapshot.exists()) {
    payload.Biography = '';
    payload.City = '';
    payload.Language = '';
    payload.Profile_image = '';
    payload.Rap_style = 'Sin estilo';
    payload.Theme = '';
    payload.CreatedAt = serverTimestamp();
  }

  await setDoc(userRef, payload, { merge: true });
}

export async function updateUserProfileDetails(uid: string, profile: UserProfileDetailsUpdate) {
  const userRef = doc(db, 'users', uid);

  const payload: Record<string, unknown> = {
    Name: profile.name,
    UsernameNormalized: profile.name.trim().toLowerCase(),
    Biography: profile.bio,
    Rap_style: profile.rapStyle || 'Sin estilo',
    Profile_image: profile.avatarUri,
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, payload, { merge: true });
}

export async function getEmailByUsername(usernameOrEmail: string) {
  const input = usernameOrEmail.trim();
  if (!input) {
    return null;
  }

  if (input.includes('@')) {
    return input.toLowerCase();
  }

  const normalized = input.toLowerCase();

  const usersRef = collection(db, 'users');
  const normalizedQuery = query(usersRef, where('UsernameNormalized', '==', normalized), limit(1));
  const normalizedSnapshot = await getDocs(normalizedQuery);

  if (!normalizedSnapshot.empty) {
    const data = normalizedSnapshot.docs[0].data();
    return typeof data.Email === 'string' ? data.Email : null;
  }

  const legacyQuery = query(usersRef, where('Name', '==', input), limit(1));
  const legacySnapshot = await getDocs(legacyQuery);

  if (legacySnapshot.empty) {
    return null;
  }

  const legacyData = legacySnapshot.docs[0].data();
  return typeof legacyData.Email === 'string' ? legacyData.Email : null;
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
