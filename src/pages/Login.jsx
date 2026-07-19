// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { GraduationCap, User, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getUserByUsername = async (username) => {
    try {
      const q = query(collection(db, 'users'), where('username', '==', username));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!identifier || !password) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      setLoading(false);
      return;
    }

    try {
      let email = identifier;

      if (!identifier.includes('@')) {
        const userData = await getUserByUsername(identifier);
        if (!userData) {
          setError('اسم المستخدم غير موجود');
          setLoading(false);
          return;
        }
        email = userData.email;
        console.log(`✅ Found user: ${userData.fullName} (${userData.role})`);
      }

      // ✅ تسجيل الدخول
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful, UID:', userCredential.user.uid);

      // ✅ ✅ ✅ الانتظار حتى يتم تحديث AuthContext
      // ننتظر 1.5 ثانية للتأكد من أن AuthContext قد حدّث البيانات
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ✅ التحقق من وجود البيانات
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        console.log('📊 User role:', userDoc.data().role);
      }

      // ✅ الانتقال إلى الصفحة الرئيسية
      navigate('/');
      
    } catch (err) {
      console.error('❌ Login error:', err);
      let errorMessage = 'حدث خطأ في تسجيل الدخول';
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'المستخدم غير موجود';
          break;
        case 'auth/wrong-password':
          errorMessage = 'كلمة المرور غير صحيحة';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'تم حظر الحساب مؤقتاً. حاول لاحقاً';
          break;
        default:
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
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mt-4">المنصة التعليمية الذكية</h1>
          <p className="text-slate-400 text-sm mt-1">نظام إدارة المدرسة المتكامل</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full p-3 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري تسجيل الدخول...</>
              ) : (
                'تسجيل الدخول'
              )}
            </button>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}