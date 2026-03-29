import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJ83_dF1Aj7GFMKnIXqQKWz8p9Xv4qGyo",
  authDomain: "freestylezone.firebaseapp.com",
  projectId: "freestylezone",
  storageBucket: "freestylezone.firebasestorage.app",
  messagingSenderId: "51200422013",
  appId: "1:51200422013:web:02b6f3a30082660f94c114",
  measurementId: "G-855DV8TXBT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);