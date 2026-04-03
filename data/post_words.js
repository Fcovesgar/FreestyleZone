// uploadWords.js
import { db } from "../firebase/firebaseNode.js";
import { collection, writeBatch, doc } from "firebase/firestore";

// Import JSON moderno (Node.js actual)
import wordsData from "./words.json" with { type: "json" };

const words = wordsData.words;   // ← accedemos al array que te di antes

async function uploadWords() {
  try {
    console.log(`Iniciando subida de ${words.length} palabras...`);

    const batchSize = 400; // Firestore permite máximo 500 por batch
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalUploaded = 0;

    for (const word of words) {
      if (!word || word.trim() === "") continue; // saltar vacíos

      const wordRef = doc(collection(db, "words")); // ID automático
      batch.set(wordRef, { 
        word: word.trim().toLowerCase(),   // normalizamos un poco
        createdAt: new Date()
      });

      batchCount++;

      // Cuando llegamos al límite del batch, lo subimos
      if (batchCount === batchSize) {
        await batch.commit();
        console.log(`✅ Batch subido: ${totalUploaded + batchCount} palabras`);
        totalUploaded += batchCount;

        // Nuevo batch
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    // Subir el último batch (si queda algo)
    if (batchCount > 0) {
      await batch.commit();
      totalUploaded += batchCount;
    }

    console.log(`🎉 ¡Todo completado! ${totalUploaded} palabras subidas correctamente.`);
  } catch (error) {
    console.error("❌ Error durante la subida:", error);
  }
}

uploadWords();