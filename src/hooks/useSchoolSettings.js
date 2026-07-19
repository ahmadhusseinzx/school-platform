// src/hooks/useSchoolSettings.js

import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export const useSchoolSettings = () => {
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'schoolSettings'),
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setSchoolSettings({ id: doc.id, ...doc.data() });
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ خطأ في جلب إعدادات المدرسة:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { schoolSettings, loading };
};