import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, User, Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let formattedEmail = username.trim().toLowerCase();

    // إذا لم يكتب المستخدم الـ @، نلحق به النطاق المعتمد للمنصة تلقائياً
    if (!formattedEmail.includes('@')) {
      formattedEmail = `${formattedEmail}@school.local`;
    }

    try {
      await signInWithEmailAndPassword(auth, formattedEmail, password);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error("Firebase Auth Error:", err.code);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة، يرجى التحقق وإعادة المحاولة.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('مشكلة في الاتصال بالإنترنت، يرجى التحقق من الشبكة.');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة لاحقاً.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 font-sans select-none" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100"
      >
        <div className="text-center mb-8">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="bg-blue-50 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm"
          >
            <GraduationCap className="w-8 h-8" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">منصة التكنولوجيا الرقمية</h1>
          <p className="text-slate-400 text-sm mt-1.5">أهلاً بك يا بطل، سجل دخولك لبدء حصة اليوم</p>
        </div>

        {error && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl mb-5 flex items-center gap-2.5 text-sm"
          >
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">اسم المستخدم (Username)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input 
                type="text" 
                required
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm text-slate-800 disabled:opacity-60 text-left font-mono"
                placeholder="مثال: ahmad_ali"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input 
                type="password" 
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm text-slate-800 disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition duration-200 shadow-lg shadow-blue-100 flex items-center justify-center gap-2 mt-2 disabled:bg-blue-400"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>دخول إلى الصف التفاعلي</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}