// src/hooks/useAuth.js

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook مخصص للوصول إلى سياق المصادقة
 * @returns {Object} - { user, userData, loading, isAuthenticated, isAdmin, isTeacher, isStudent }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;