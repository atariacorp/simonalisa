// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyCE_IJlJdEHJKBOiNBMzNCNH_fKH0ln-NA",
  authDomain: "analisis-apbd.firebaseapp.com",
  projectId: "analisis-apbd",
  storageBucket: "analisis-apbd.appspot.com",
  messagingSenderId: "805666292304",
  appId: "1:805666292304:web:247f1e25e3e4d88621c755",
  measurementId: "G-6YDJ88NGWD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };