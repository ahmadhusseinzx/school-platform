// src/components/admin/SchoolInfo.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  School, Edit3, Save, X, Loader2,
  CheckCircle, AlertCircle, Image, Upload, Trash2
} from 'lucide-react';
import SchoolInfoFields from './SchoolInfoFields';

export default function SchoolInfo() {
  // ====== حالة التعديل ======
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ====== بيانات المدرسة ======
  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: 'مدرسة الجيل الجديد',
    schoolAddress: 'حافظة القدس - أبو ديس',
    establishmentYear: '1999',
    principalName: 'منال عريقات',
    phone: '',
    email: '',
    website: '',
    headerText: 'النتائج المدرسية',
    footerText: 'معاً نحو مستقبل أفضل',
    logo: null,
    motto: 'بالعلم نرتقي',
    vision: 'الريادة في التعليم',
    mission: 'تخريج جيل واعٍ ومثقف',
    gradeLevels: '1-12',
    schoolType: 'خاص',
    gender: 'مختلط'
  });

  // ============ جلب إعدادات المدرسة ============
  useEffect(() => {
    const fetchSchoolSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'schoolSettings', 'settings'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.schoolInfo) {
            setSchoolInfo(prev => ({ ...prev, ...data.schoolInfo }));
          }
        }
      } catch (error) {
        console.error('❌ خطأ في جلب إعدادات المدرسة:', error);
      }
    };
    fetchSchoolSettings();
  }, []);

  // ============ معالجة التغيير ============
  const handleFieldChange = useCallback((name, value) => {
    setSchoolInfo(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // ============ رفع الشعار ============
  const handleLogoUpload = useCallback(async (file) => {
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '❌ الرجاء اختيار ملف صورة صالح (jpg, png, gif, svg)' });
      return;
    }

    // التحقق من حجم الملف (أقصى 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: '❌ حجم الصورة يجب أن لا يتجاوز 2 ميجابايت' });
      return;
    }

    try {
      setUploading(true);
      setMessage({ type: '', text: '' });

      // حذف الشعار القديم إذا كان موجوداً
      if (schoolInfo.logo) {
        try {
          const oldPath = schoolInfo.logo.split('/o/')[1]?.split('?')[0];
          if (oldPath) {
            const oldRef = ref(storage, decodeURIComponent(oldPath));
            await deleteObject(oldRef);
          }
        } catch (error) {
          console.warn('⚠️ لا يمكن حذف الشعار القديم:', error);
        }
      }

      // إنشاء مسار فريد للصورة
      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `school-logos/logo_${Date.now()}.${fileExtension}`);
      
      // رفع الملف
      const snapshot = await uploadBytes(storageRef, file);
      
      // الحصول على رابط التحميل
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // تحديث حالة المكون
      setSchoolInfo(prev => ({ ...prev, logo: downloadURL }));
      setMessage({ type: 'success', text: '✅ تم رفع شعار المدرسة بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('❌ خطأ في رفع الشعار:', error);
      setMessage({ type: 'error', text: '❌ حدث خطأ في رفع الشعار: ' + error.message });
    } finally {
      setUploading(false);
    }
  }, [schoolInfo.logo]);

  // ============ حذف الشعار ============
  const handleLogoRemove = useCallback(async () => {
    if (!schoolInfo.logo) return;
    
    if (!confirm('⚠️ هل أنت متأكد من حذف شعار المدرسة؟')) return;
    
    try {
      setUploading(true);
      
      // استخراج المسار من الرابط
      const path = schoolInfo.logo.split('/o/')[1]?.split('?')[0];
      if (path) {
        const storageRef = ref(storage, decodeURIComponent(path));
        await deleteObject(storageRef);
      }
      
      // تحديث حالة المكون
      setSchoolInfo(prev => ({ ...prev, logo: null }));
      setMessage({ type: 'success', text: '✅ تم حذف شعار المدرسة بنجاح' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
    } catch (error) {
      console.error('❌ خطأ في حذف الشعار:', error);
      setMessage({ type: 'error', text: '❌ حدث خطأ في حذف الشعار: ' + error.message });
    } finally {
      setUploading(false);
    }
  }, [schoolInfo.logo]);

  // ============ حفظ البيانات ============
  const handleSave = async () => {
    if (!schoolInfo.schoolName.trim()) {
      setMessage({ type: 'error', text: '❌ اسم المدرسة مطلوب' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      await setDoc(doc(db, 'schoolSettings', 'settings'), {
        schoolInfo: schoolInfo,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      }, { merge: true });
      
      setEditing(false);
      setMessage({ type: 'success', text: '✅ تم تحديث بيانات المدرسة بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('❌ خطأ:', error);
      setMessage({ type: 'error', text: '❌ حدث خطأ في تحديث بيانات المدرسة: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // ============ إلغاء التعديل ============
  const cancelEdit = useCallback(async () => {
    setEditing(false);
    setMessage({ type: '', text: '' });
    
    // إعادة جلب البيانات الأصلية
    try {
      const settingsDoc = await getDoc(doc(db, 'schoolSettings', 'settings'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.schoolInfo) {
          setSchoolInfo(prev => ({ ...prev, ...data.schoolInfo }));
        }
      }
    } catch (error) {
      console.error('❌ خطأ في جلب إعدادات المدرسة:', error);
    }
  }, []);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      
      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <School className="w-5 h-5 text-emerald-400" />
            إعدادات المدرسة
          </h2>
          <p className="text-xs text-slate-400">تعديل بيانات المدرسة الظاهرة في الشهادات والتقارير</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              تعديل بيانات المدرسة
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                حفظ
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

      {/* ====== عرض الرسائل ====== */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ====== معاينة بيانات المدرسة مع الشعار ====== */}
      <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
        {schoolInfo.logo && (
          <div className="flex justify-center mb-3">
            <img 
              src={schoolInfo.logo} 
              alt="شعار المدرسة" 
              className="h-20 w-auto object-contain rounded-lg bg-white/5 p-2 border border-slate-700"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <h3 className="text-2xl font-bold text-white">{schoolInfo.schoolName}</h3>
        <p className="text-sm text-slate-400">{schoolInfo.schoolAddress}</p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
          <span>📅 تأسست سنة {schoolInfo.establishmentYear}</span>
          <span>👩‍🏫 المدير/ة: {schoolInfo.principalName}</span>
          {schoolInfo.phone && <span>📞 {schoolInfo.phone}</span>}
          {schoolInfo.email && <span>📧 {schoolInfo.email}</span>}
        </div>
        {schoolInfo.motto && (
          <p className="text-sm text-emerald-400 mt-2 italic">"{schoolInfo.motto}"</p>
        )}
      </div>

      {/* ====== حقول إعدادات المدرسة ====== */}
      <SchoolInfoFields 
        editing={editing}
        schoolInfo={schoolInfo}
        onFieldChange={handleFieldChange}
        onLogoUpload={handleLogoUpload}
        onLogoRemove={handleLogoRemove}
        uploading={uploading}
      />

      {/* ====== تعليمات ====== */}
      <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-400">
            <p className="font-bold">📌 ملاحظات:</p>
            <ul className="list-disc pr-4 space-y-1 mt-1">
              <li>هذه البيانات ستظهر في <span className="font-bold">الشهادات المدرسية</span> والتقارير</li>
              <li>يمكنك إضافة <span className="font-bold">شعار المدرسة</span> (jpg, png, gif, svg - حد أقصى 2MB)</li>
              <li>تحديث هذه البيانات سيؤثر على جميع الشهادات التي سيتم إنشاؤها مستقبلاً</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ====== معاينة ترويسة الشهادة ====== */}
      {!editing && (
        <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 mb-2">📄 معاينة ترويسة الشهادة</h4>
          <div className="bg-white/5 rounded-lg p-4 text-center border border-slate-700">
            {schoolInfo.logo && (
              <div className="flex justify-center mb-2">
                <img 
                  src={schoolInfo.logo} 
                  alt="شعار المدرسة" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="text-lg font-bold text-white">{schoolInfo.schoolName}</div>
            <div className="text-xs text-slate-400">{schoolInfo.schoolAddress}</div>
            <div className="text-[10px] text-slate-500">تأسست سنة {schoolInfo.establishmentYear}</div>
            <div className="mt-2 text-sm text-emerald-400">{schoolInfo.headerText}</div>
            <div className="mt-1 text-xs text-slate-500">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            <div className="mt-1 text-xs text-slate-500">{schoolInfo.footerText}</div>
          </div>
        </div>
      )}
    </div>
  );
}