// src/components/admin/AdminInfo.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Mail, Phone, MapPin, Edit3, Save, X, Loader2,
  UserCircle, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import AdminInfoFields from './AdminInfoFields';

export default function AdminInfo() {
  const { userData, loading, refreshing, updateUser, refreshUserData, isAuthenticated } = useAuth();
  
  const userDataRef = useRef(userData);
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    bio: ''  // ✅ تأكد من وجود bio
  });

  // ============ تحديث الـ ref عند تغيير userData ============
  useEffect(() => {
    userDataRef.current = userData;
    console.log('🔄 userDataRef updated:', userData);
  }, [userData]);

  // ============ تحديث البيانات ============
  useEffect(() => {
    if (userData) {
      console.log('📝 Updating form from userData:', userData);
      setUserInfo({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        bio: userData.bio || ''  // ✅ التأكد من تضمين bio
      });
    }
  }, [userData]);

  // ============ معالجة التغيير ============
  const handleFieldChange = useCallback((name, value) => {
    console.log(`🔄 Field changed: ${name} = ${value}`);
    setUserInfo(prev => ({ ...prev, [name]: value }));
  }, []);

  // ============ حفظ البيانات ============
  const handleSave = useCallback(async () => {
    console.log("🔴🔴🔴 handleSave called! 🔴🔴🔴");
    
    const currentUserData = userDataRef.current;
    console.log("📊 currentUserData from ref:", currentUserData);
    
    if (!currentUserData) {
      console.error("❌ currentUserData is null or undefined!");
      setMessage({ 
        type: 'error', 
        text: '❌ لا توجد بيانات مستخدم. الرجاء تسجيل الدخول مرة أخرى.' 
      });
      return;
    }
    
    const uid = currentUserData.uid || currentUserData.id;
    console.log("👤 Extracted UID:", uid);
    
    if (!uid) {
      console.error("❌ No uid found in currentUserData!");
      setMessage({ 
        type: 'error', 
        text: '❌ لا توجد بيانات مستخدم. الرجاء تسجيل الدخول مرة أخرى.' 
      });
      return;
    }

    if (!userInfo.fullName.trim()) {
      console.error("❌ Full name is required!");
      setMessage({ type: 'error', text: '❌ الاسم الكامل مطلوب' });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const updateData = {
        fullName: userInfo.fullName.trim(),
        phone: userInfo.phone || '',
        address: userInfo.address || '',
        bio: userInfo.bio || ''  // ✅ تضمين bio في بيانات التحديث
      };
      
      console.log('📝 Saving data:', updateData);
      console.log('👤 Using UID:', uid);
      
      const result = await updateUser(uid, updateData);
      console.log('✅ Update result:', result);
      
      await refreshUserData();
      
      setEditing(false);
      setMessage({ type: 'success', text: '✅ تم تحديث البيانات الشخصية بنجاح!' });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('❌ Error saving data:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ حدث خطأ في تحديث البيانات: ${error.message || 'خطأ غير معروف'}` 
      });
    } finally {
      setSaving(false);
    }
  }, [userInfo, updateUser, refreshUserData]);

  // ============ إلغاء التعديل ============
  const cancelEdit = useCallback(() => {
    console.log("🔄 cancelEdit called");
    setEditing(false);
    const currentUserData = userDataRef.current;
    if (currentUserData) {
      setUserInfo({
        fullName: currentUserData.fullName || '',
        email: currentUserData.email || '',
        phone: currentUserData.phone || '',
        address: currentUserData.address || '',
        bio: currentUserData.bio || ''  // ✅ تضمين bio
      });
    }
    setMessage({ type: '', text: '' });
  }, []);

  // ============ بدء التعديل ============
  const startEdit = useCallback(() => {
    console.log("🔄 startEdit called");
    setEditing(true);
    setMessage({ type: '', text: '' });
  }, []);

  // ============ عرض حالة التحميل ============
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-slate-400">جاري تحميل بيانات المستخدم...</p>
      </div>
    );
  }

  if (!userData || !isAuthenticated) {
    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <p className="text-slate-400">لا توجد بيانات مستخدم. الرجاء تسجيل الدخول مرة أخرى.</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button 
            onClick={refreshUserData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'جاري التحميل...' : 'إعادة تحميل البيانات'}
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
          >
            🔄 تحديث الصفحة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-400" />
            معلوماتي الشخصية
          </h2>
          <p className="text-xs text-slate-400">عرض وتعديل بيانات حسابك الشخصية</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={refreshUserData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                onClick={startEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                تعديل
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl text-xs font-bold transition-all"
              >
                <X className="w-3.5 h-3.5" />
                إلغاء
              </button>
            </>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : message.type === 'info'
            ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex items-center gap-6 p-4 bg-slate-900 rounded-xl border border-slate-800 mb-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-blue-500/20">
          {userData?.fullName?.charAt(0) || 'A'}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{userData?.fullName || 'غير محدد'}</h3>
          <p className="text-sm text-slate-400">{userData?.role === 'admin' ? '👑 مدير النظام' : '🛡️ مساعد مدير'}</p>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 inline-block mt-1">
            ✅ نشط
          </span>
        </div>
      </div>

      <AdminInfoFields 
        editing={editing}
        userInfo={userInfo}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
}