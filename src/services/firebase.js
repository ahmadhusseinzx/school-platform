// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAuqPgcnBrVE101HxPSnSh4_KMqqJNVoss",
  authDomain: "school-624e5.firebaseapp.com",
  databaseURL: "https://school-624e5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "school-624e5",
  storageBucket: "school-624e5.firebasestorage.app",
  messagingSenderId: "833684484564",
  appId: "1:833684484564:web:7891d587157e386f746641",
  measurementId: "G-GGGWK9GC6V"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

console.log("🔥 Firebase initialized successfully!");
console.log("📁 Project ID:", firebaseConfig.projectId);

export default app;