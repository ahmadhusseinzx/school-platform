// 1. استيراد الدوال الأساسية من حزم الـ SDK
//import { initializeApp } from "firebase/app";
//import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
// 2. إعدادات مشروعك الحقيقي (Techno)
const firebaseConfig = {
  apiKey: "AIzaSyBo-3ZEgzXA12Gpaq28DU8q6bZjjyeI6uY",
  authDomain: "techno-86767.firebaseapp.com",
  projectId: "techno-86767",
  storageBucket: "techno-86767.firebasestorage.app",
  messagingSenderId: "464385771585",
  appId: "1:464385771585:web:319b3b415ac21afa341ec0",
  databaseURL: "https://techno-86767-default-rtdb.firebaseio.com" // رابط الـ Realtime DB الافتراضي لمشروعك
};

// 3. تهيئة التطبيق سحابياً
const app = initializeApp(firebaseConfig);

// 4. التصدير الفعلي (توفير الحزم لصفحة Login والصفحات الأخرى) 👇
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);