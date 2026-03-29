import { where } from "firebase/firestore";

const q = query(
  collection(db, "instrumentals"),
  where("Active", "==", true)
);