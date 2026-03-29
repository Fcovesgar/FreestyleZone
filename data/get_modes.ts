import { collection, getDocs, query } from 'firebase/firestore';

import { db } from '../firebase/firebaseConfig';

export type Mode = {
  id: string;
  Key: string;
  Name: string;
  Description: string;
  Icon: string;
  Accent: string;
};

const FALLBACK_MODES: Mode[] = [
  { id: 'free', Key: 'free', Name: 'Libre', Description: 'Rapea libremente y sin estímulos.', Icon: 'graphic-eq', Accent: '#0EA5E9' },
  { id: 'easy', Key: 'easy', Name: 'Easy', Description: 'Palabras cada 10s', Icon: 'security', Accent: '#16A34A' },
  { id: 'hard', Key: 'hard', Name: 'Hard', Description: 'Palabras cada 5s', Icon: 'flash-on', Accent: '#EA580C' },
  {
    id: 'incremental',
    Key: 'incremental',
    Name: 'Incremental',
    Description: 'Palabras cada 10s - 5s - 2s',
    Icon: 'local-fire-department',
    Accent: '#DC2626',
  },
  { id: 'history', Key: 'history', Name: 'Historia', Description: 'Crea historia con palabras', Icon: 'history-edu', Accent: '#DB2777' },
  { id: 'ending', Key: 'ending', Name: 'Terminación', Description: 'Rapea con terminaciones', Icon: 'text-fields', Accent: '#EAB308' },
  { id: 'images', Key: 'images', Name: 'Imágenes', Description: 'Rapea con imágenes', Icon: 'image', Accent: '#9333EA' },
];

export const getModes = async (): Promise<Mode[]> => {
  try {
    const q = query(collection(db, 'modes'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return FALLBACK_MODES;
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Mode, 'id'>),
    }));
  } catch (error) {
    console.error('Error obteniendo modos:', error);
    return FALLBACK_MODES;
  }
};
