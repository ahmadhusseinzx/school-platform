// src/components/auth/Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { login } from '../../services/auth';
import { GraduationCap, User, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { refreshUserData } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!identifier || !password) {
      setError('الرجاء إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور');
      setLoading(false);
      return;
    }

    try {
      // ✅ 1. تسجيل الدخول
      const user = await login(identifier, password);
      console.log('✅ Login successful, UID:', user?.uid);

      // ✅ 2. الانتظار 1.5 ثانية للتأكد من أن AuthContext قد حدّث البيانات
      console.log('⏳ جاري تحميل بيانات المستخدم...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ✅ 3. إعادة تحميل بيانات المستخدم للتأكد
      await refreshUserData();
      
      // ✅ 4. الانتقال إلى الصفحة الرئيسية
      console.log('✅ تم تسجيل الدخول بنجاح، جاري التوجيه...');
      navigate('/');
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      let errorMessage = 'حدث خطأ في تسجيل الدخول';
      if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/20">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mt-4">المنصة التعليمية الذكية</h1>
          <p className="text-slate-400 text-sm mt-1">نظام إدارة المدرسة المتكامل</p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* اسم المستخدم أو البريد */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full p-3 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="أحمد_المعلم أو ahmed@school.local"
                  autoComplete="username"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                يمكنك استخدام اسم المستخدم أو البريد الإلكتروني
              </p>
            </div>

            {/* كلمة المرور */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400">كلمة المرور</label>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>

            {/* عرض الأخطاء */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* رسالة إنشاء الحسابات */}
          <div className="mt-6 text-center border-t border-slate-700 pt-6">
            <p className="text-xs text-slate-400">
              🔒 الحسابات تُنشأ بواسطة إدارة المدرسة فقط
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              للتواصل مع الإدارة: <span className="text-blue-400">admin@school.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}