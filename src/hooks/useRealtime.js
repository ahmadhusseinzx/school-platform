// src/hooks/useRealtime.js
import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, update, remove, get } from 'firebase/database';
import { rtdb } from '../services/firebase';

/**
 * Hook مخصص للتعامل مع Realtime Database
 * @param {string} path - مسار البيانات في Realtime Database
 * @returns {Object} - دوال للتعامل مع البيانات
 */
export const useRealtime = (path) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============ الاستماع للتغييرات ============
  const subscribe = useCallback((callback) => {
    const dataRef = ref(rtdb, path);
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const value = snapshot.val();
      setData(value);
      setLoading(false);
      if (callback) callback(value);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });
    return unsubscribe;
  }, [path]);

  // ============ كتابة بيانات ============
  const write = useCallback(async (value) => {
    try {
      setLoading(true);
      setError(null);
      const dataRef = ref(rtdb, path);
      await set(dataRef, value);
      setData(value);
      return value;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path]);

  // ============ تحديث بيانات ============
  const patch = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);
      const dataRef = ref(rtdb, path);
      await update(dataRef, updates);
      // جلب البيانات المحدثة
      const snapshot = await get(dataRef);
      const value = snapshot.val();
      setData(value);
      return value;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path]);

  // ============ حذف بيانات ============
  const clear = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dataRef = ref(rtdb, path);
      await remove(dataRef);
      setData(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path]);

  // ============ جلب بيانات (مرة واحدة) ============
  const fetchOnce = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dataRef = ref(rtdb, path);
      const snapshot = await get(dataRef);
      const value = snapshot.val();
      setData(value);
      return value;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path]);

  // ============ الاشتراك التلقائي ============
  useEffect(() => {
    const unsubscribe = subscribe();
    return () => unsubscribe();
  }, [subscribe]);

  return {
    data,
    loading,
    error,
    subscribe,
    write,
    patch,
    clear,
    fetchOnce,
    setData
  };
};

// ============ تصدير افتراضي ============
export default useRealtime;