import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export const saveInstrumental = async ({ Name, Url, Genre, Bpm, Active }) => {
  try {
    const docRef = await addDoc(collection(db, "instrumentals"), {
      Name: Name || "",
      Url: Url || "",
      Genre: Genre || "",
      Bpm: Bpm || "",
      Active: Active ?? true,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error guardando instrumental:", error);
    throw error;
  }
};