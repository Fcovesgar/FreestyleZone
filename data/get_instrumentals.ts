import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, query } from "firebase/firestore";

export type Instrumental = {
  id: string;
  Name: string;
  Url: string;
  Genre: string;
  Bpm: string;
  Active: boolean;
};

export const getInstrumentals = async (): Promise<Instrumental[]> => {
  try {
    const q = query(collection(db, "instrumentals"));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Instrumental, "id">),
    }));
  } catch (error) {
    console.error("Error obteniendo instrumentales:", error);
    return [];
  }
};