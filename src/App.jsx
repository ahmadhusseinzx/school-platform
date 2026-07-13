import React, { useState, useEffect } from 'react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard'; // تم استيراد لوحة تحكم الطالب المتكاملة
import Login from './pages/Login'; 
import { RefreshCw, LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data()); // حفظ كامل البيانات (role, classId, fullName)
          } else {
            setUserData({ role: 'student', classId: null });
          }
        } catch (error) {
          console.error("خطأ في جلب صلاحيات المستخدم:", error);
          setUserData({ role: 'student', classId: null });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 font-sans">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-xs text-slate-400">جاري التحقق من الهوية والصلاحيات السحابية...</p>
      </div>
    );
  }

  // إذا لم يكن مسجلاً، اعرض شاشة تسجيل الدخول مباشرة
  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="relative min-h-screen bg-slate-900">
        
        {/* زر تسجيل الخروج العائم */}
        <button 
          onClick={handleLogout}
          className="fixed bottom-4 left-4 z-50 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-900 p-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>

        {/* إدارة التوجيه والمسارات الآمنة بناءً على الصلاحيات */}
        <Routes>
          {userData?.role === 'teacher' ? (
            <>
              <Route path="/teacher" element={<TeacherDashboard />} />
              {/* توجيه المعلم تلقائياً إلى لوحته عند دخول صفحة رئيسية أخرى */}
              <Route path="*" element={<Navigate to="/teacher" replace />} />
            </>
          ) : (
            <>
              {/* توجيه الطالب إلى لوحته الكاملة الحية والأرشيفية */}
              <Route path="/dashboard" element={<StudentDashboard userProfile={userData} />} />
              {/* توجيه الطالب تلقائياً بناءً على بيانات صفه في Firestore */}
              <Route 
                path="*" 
                element={
                  userData?.classId ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
                      الحساب غير مرتبط بصف دراسي حالياً. يرجى مراجعة المعلم.
                    </div>
                  )
                } 
              />
            </>
          )}
        </Routes>

      </div>
    </Router>
  );
}