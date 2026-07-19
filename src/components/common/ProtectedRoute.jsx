import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  // ============ حالة التحميل ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-slate-400 text-sm">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // ============ غير مسجل الدخول ============
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ============ التحقق من الصلاحية ============
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userData?.role)) {
      // إعادة توجيه إلى الصفحة المناسبة حسب الدور
      const redirectPath = `/${userData?.role || 'dashboard'}`;
      return <Navigate to={redirectPath} replace />;
    }
  }

  // ============ السماح بالوصول ============
  return children;
}