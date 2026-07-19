// src/hooks/useFirestore.js
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook مخصص للتعامل مع Firestore
 * @param {string} collectionName - اسم المجموعة
 * @param {Object} options - خيارات إضافية
 * @returns {Object} - دوال للتعامل مع البيانات
 */
export const useFirestore = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============ جلب جميع البيانات ============
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getDocs(collection(db, collectionName));
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setData(items);
      return items;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // ============ جلب بيانات بواسطة ID ============
  const fetchById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // ============ جلب بيانات بواسطة شرط ============
  const fetchWhere = useCallback(async (field, operator, value) => {
    try {
      setLoading(true);
      setError(null);
      const q = query(collection(db, collectionName), where(field, operator, value));
      const snapshot = await getDocs(q);
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      return items;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // ============ إضافة بيانات جديدة ============
  const add = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...data };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // ============ تحديث بيانات ============
  const update = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return { id, ...data };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // ============ حذف بيانات ============
  const remove = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await deleteDoc(doc(db, collectionName, id));
      return id;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // ============ الاستماع للتغييرات (Realtime) ============
  const subscribe = useCallback((callback) => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setData(items);
      if (callback) callback(items);
    }, (err) => {
      setError(err.message);
    });
    return unsubscribe;
  }, [collectionName]);

  // ============ تحميل البيانات تلقائياً ============
  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchAll();
    }
  }, [fetchAll, options.autoLoad]);

  return {
    data,
    loading,
    error,
    fetchAll,
    fetchById,
    fetchWhere,
    add,
    update,
    remove,
    subscribe,
    setData,
    setLoading,
    setError
  };
};

// ============ تصدير افتراضي ============
export default useFirestore;