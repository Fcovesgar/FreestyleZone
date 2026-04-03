import { collection, getDocs, query } from 'firebase/firestore';

import { db } from '../firebase/firebaseConfig';

export type Word = {
  id: string;
  word: string;
};

const pickWordValue = (entry: Omit<Word, 'id'>) => (typeof entry.word === 'string' && entry.word.trim().length > 0 ? entry.word.trim() : null);

export const getWords = async (): Promise<string[]> => {
  try {
    const q = query(collection(db, 'words'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs
      .map((doc) => pickWordValue(doc.data() as Omit<Word, 'id'>))
      .filter((word): word is string => Boolean(word));
  } catch (error) {
    console.error('Error obteniendo palabras:', error);
    return [];
  }
};
