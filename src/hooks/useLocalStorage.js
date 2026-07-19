// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

/**
 * Hook مخصص للتعامل مع Local Storage
 * @param {string} key - مفتاح التخزين
 * @param {any} initialValue - القيمة الافتراضية
 * @returns {Array} - [value, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue) => {
  // ============ قراءة القيمة من Local Storage ============
  const readValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  };

  // ============ حالة القيمة ============
  const [storedValue, setStoredValue] = useState(readValue);

  // ============ تحديث القيمة ============
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  // ============ حذف القيمة ============
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key “${key}”:`, error);
    }
  };

  // ============ مزامنة التغييرات من علامات التبويب الأخرى ============
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key) {
        setStoredValue(readValue());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, readValue]);

  return [storedValue, setValue, removeValue];
};

// ============ تصدير افتراضي ============
export default useLocalStorage;