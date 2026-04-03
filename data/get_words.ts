import { collection, getDocs, query } from 'firebase/firestore';

import { db } from '../firebase/firebaseConfig';

export type Word = {
  id: string;
  Word?: string;
  Name?: string;
  value?: string;
  text?: string;
};

const pickWordValue = (entry: Omit<Word, 'id'>) =>
  [entry.Word, entry.Name, entry.value, entry.text].find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? null;

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
