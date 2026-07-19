// src/hooks/usePermissions.js
import { useAuth } from './useAuth';

/**
 * Hook مخصص للتحقق من صلاحيات المستخدم
 * @returns {Object} - دوال للتحقق من الصلاحيات
 */
export const usePermissions = () => {
  const { userData, isAdmin, isTeacher, isStudent } = useAuth();

  // ============ التحقق من الصلاحيات العامة ============
  const hasPermission = (permission) => {
    if (isAdmin) return true;
    if (userData?.role === 'admin_assistant') {
      return userData?.permissions?.[permission] || false;
    }
    return false;
  };

  // ============ صلاحيات محددة ============
  const canManageTeachers = () => hasPermission('manageTeachers');
  const canManageStudents = () => hasPermission('manageStudents');
  const canManageClasses = () => hasPermission('manageClasses');
  const canManageSchedule = () => hasPermission('manageSchedule');
  const canManageGrades = () => hasPermission('manageGrades');
  const canManageAttendance = () => hasPermission('manageAttendance');
  const canViewAll = () => hasPermission('viewAll') || isAdmin;
  const canEditAll = () => hasPermission('editAll') || isAdmin;
  const canGenerateCertificates = () => hasPermission('generateCertificates') || isAdmin;
  const canImportStudents = () => hasPermission('importStudents') || isAdmin;

  // ============ التحقق من الدور ============
  const isAdminAssistant = () => userData?.role === 'admin_assistant';
  const isSuperAdmin = () => userData?.role === 'admin';

  // ============ الحصول على صلاحيات المستخدم ============
  const getUserPermissions = () => {
    return userData?.permissions || {};
  };

  // ============ الحصول على قائمة الصلاحيات المتاحة ============
  const getAvailablePermissions = () => {
    if (isAdmin) {
      return [
        'manageTeachers', 'manageStudents', 'manageClasses',
        'manageSchedule', 'manageGrades', 'manageAttendance',
        'viewAll', 'editAll', 'generateCertificates', 'importStudents'
      ];
    }
    
    if (userData?.role === 'admin_assistant') {
      return Object.keys(userData?.permissions || {}).filter(
        key => userData.permissions[key] === true
      );
    }
    
    return [];
  };

  // ============ التحقق من وجود صلاحية معينة ============
  const hasAnyPermission = (permissions) => {
    if (isAdmin) return true;
    if (!permissions || permissions.length === 0) return true;
    
    return permissions.some(p => hasPermission(p));
  };

  // ============ التحقق من وجود جميع الصلاحيات ============
  const hasAllPermissions = (permissions) => {
    if (isAdmin) return true;
    if (!permissions || permissions.length === 0) return true;
    
    return permissions.every(p => hasPermission(p));
  };

  return {
    // ====== الأساسيات ======
    isAdmin,
    isTeacher,
    isStudent,
    isAdminAssistant,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // ====== صلاحيات محددة ======
    canManageTeachers,
    canManageStudents,
    canManageClasses,
    canManageSchedule,
    canManageGrades,
    canManageAttendance,
    canViewAll,
    canEditAll,
    canGenerateCertificates,
    canImportStudents,
    
    // ====== معلومات إضافية ======
    getUserPermissions,
    getAvailablePermissions,
    userRole: userData?.role,
    userData
  };
};

// ============ تصدير افتراضي أيضاً ============
export default usePermissions;