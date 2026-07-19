// src/hooks/index.js

// ============ تصدير جميع الـ Hooks ============

export { default as useAuth } from './useAuth';
export { default as usePermissions } from './usePermissions';
export { default as useFirestore } from './useFirestore';
export { default as useRealtime } from './useRealtime';
export { default as useLocalStorage } from './useLocalStorage';

// ============ تصدير مسمى أيضاً ============
export * from './useAuth';
export * from './usePermissions';
export * from './useFirestore';
export * from './useRealtime';
export * from './useLocalStorage';