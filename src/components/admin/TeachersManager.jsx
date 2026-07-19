// src/components/admin/TeachersManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, getDocs 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  Users, Plus, Trash2, Edit3, Save, X, Search, 
  Loader2, User, Key, Phone, Eye, EyeOff, CheckCircle, AlertCircle,
  RefreshCw
} from 'lucide-react';

// ============ ✅ تحويل عربي إلى إنجليزي (نفس الموجود في StudentsManager) ============
const arabicToEnglish = (text) => {
  const charMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a',
    'ب': 'b', 'ت': 't', 'ة': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ى': 'a', 'ء': 'a', 'ئ': 'a', 'ؤ': 'a',
    'َ': '', 'ُ': '', 'ِ': '', 'ّ': '', 'ْ': '', 'ً': '', 'ٌ': '', 'ٍ': '', 'ـ': '',
    'لا': 'la', 'لآ': 'laa'
  };

  let result = '';
  let i = 0;
  while (i < text.length) {
    if (i + 1 < text.length) {
      const twoChars = text[i] + text[i + 1];
      if (charMap[twoChars] !== undefined) {
        result += charMap[twoChars];
        i += 2;
        continue;
      }
    }
    const char = text[i];
    result += charMap[char] || char;
    i++;
  }
  return result;
};

// ============ ✅ توليد اسم مستخدم من الاسم الكامل ============
const generateUsername = (fullName) => {
  if (!fullName || !fullName.trim()) {
    return 'teacher_' + Math.floor(Math.random() * 10000);
  }

  const cleanName = fullName.trim().replace(/\s+/g, ' ').replace(/[^ء-ي\s]/g, '');
  if (!cleanName) return 'teacher_' + Math.floor(Math.random() * 10000);

  const parts = cleanName.split(' ');
  const englishParts = parts.map(p => arabicToEnglish(p)).filter(p => p.length > 0);

  if (englishParts.length === 0) {
    return 'teacher_' + Math.floor(Math.random() * 10000);
  }

  let username = '';
  const firstName = englishParts[0];
  const lastName = englishParts.length > 1 ? englishParts[englishParts.length - 1] : '';

  if (lastName) {
    username = firstName.slice(0, 5) + lastName.slice(0, 4);
  } else {
    username = firstName.slice(0, 8);
  }

  username = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

  if (username.length < 3) {
    username = 'teacher_' + Math.floor(Math.random() * 10000);
  }

  if (username.length > 15) {
    username = username.slice(0, 15);
  }

  username = username + Math.floor(Math.random() * 100);
  return username.toLowerCase();
};

// ============ ✅ توليد كلمة مرور (6 أرقام) ============
const generatePassword = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export default function TeachersManager() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  
  // ====== البيانات الأولية للنموذج ======
  const INITIAL_FORM_DATA = {
    fullName: '',
    username: '',
    phone: '',
    password: ''
  };

  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });

  // ============ جلب المعلمين من Firestore ============
  useEffect(() => {
    console.log("📡 جلب المعلمين من Firestore...");
    
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'teacher')),
      (snapshot) => {
        const teacherList = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          console.log(`📄 مستند: ${doc.id}`, data);
          teacherList.push({ id: doc.id, ...data });
        });
        console.log(`✅ تم جلب ${teacherList.length} معلم`);
        setTeachers(teacherList);
        setLoading(false);
      },
      (error) => {
        console.error('❌ خطأ في جلب المعلمين:', error);
        setLoading(false);
        setMessage({ type: 'error', text: '❌ خطأ في جلب المعلمين: ' + error.message });
      }
    );

    return () => unsubscribe();
  }, []);

  // ============ ✅ عند تغيير الاسم - توليد اسم مستخدم ============
  const handleFullNameChange = useCallback((e) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, fullName: name }));

    if (name.trim()) {
      const username = generateUsername(name);
      setGeneratedUsername(username);
      setFormData(prev => ({ ...prev, username: username }));
    } else {
      setGeneratedUsername('');
      setFormData(prev => ({ ...prev, username: '' }));
    }
  }, []);

  // ============ ✅ توليد كلمة مرور ============
  const handleGeneratePassword = useCallback(() => {
    const password = generatePassword();
    setGeneratedPassword(password);
    setFormData(prev => ({ ...prev, password: password }));
  }, []);

  // ============ ✅ إعادة تعيين النموذج ============
  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM_DATA });
    setGeneratedUsername('');
    setGeneratedPassword('');
    setShowAddForm(false);
    setMessage({ type: '', text: '' });
  }, []);

  // ============ ✅ فتح نموذج الإضافة ============
  const openAddForm = useCallback(() => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM_DATA });
    setGeneratedUsername('');
    setGeneratedPassword('');
    setShowAddForm(true);
    setMessage({ type: '', text: '' });
  }, []);

  // ============ ✅ إضافة معلم جديد ============
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // ✅ التحقق من البيانات
    if (!formData.fullName || !formData.username || !formData.password) {
      setMessage({ type: 'error', text: '❌ الرجاء ملء جميع الحقول المطلوبة' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: '❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      return;
    }

    try {
      setLoading(true);
      
      // ✅ حفظ بيانات المدير الحالي قبل إنشاء الحساب
      const adminUser = auth.currentUser;
      const adminEmail = adminUser?.email;

      // ✅ 1. التحقق من عدم وجود اسم مستخدم مكرر
      const existingQuery = query(collection(db, 'users'), where('username', '==', formData.username));
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        const newUsername = formData.username + Math.floor(Math.random() * 1000);
        setFormData(prev => ({ ...prev, username: newUsername }));
        setMessage({ type: 'warning', text: `⚠️ اسم المستخدم مستخدم، تم تغييره إلى: ${newUsername}` });
        setLoading(false);
        return;
      }

      // ✅ 2. إنشاء البريد الإلكتروني
      const email = `${formData.username}@school.local`;
      console.log('📝 إنشاء حساب للمعلم:', email);

      // ✅ 3. إنشاء حساب في Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
      const user = userCredential.user;
      
      console.log('✅ تم إنشاء الحساب في Authentication');
      console.log('📌 UID:', user.uid);
      console.log('📌 Email:', user.email);

      // ✅ 4. تسجيل الخروج من الحساب الجديد فوراً
      await auth.signOut();

      // ✅ 5. إعادة تسجيل الدخول كمدير
      if (adminEmail) {
        console.log('ℹ️ تم تسجيل الخروج من حساب المعلم، الرجاء تسجيل الدخول مرة أخرى كمدير');
      }

      // ✅ 6. تحضير بيانات المعلم
      const teacherData = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: email,
        phone: formData.phone || '',
        password: formData.password,
        role: 'teacher',
        uid: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      console.log('📝 حفظ بيانات المعلم في Firestore:');
      console.log('📌 UID:', user.uid);

      // ✅ 7. حفظ بيانات المعلم في Firestore
      await setDoc(doc(db, 'users', user.uid), teacherData);

      // ✅ 8. التحقق من نجاح الحفظ
      const checkDoc = await getDoc(doc(db, 'users', user.uid));
      if (checkDoc.exists()) {
        console.log('✅ تم حفظ بيانات المعلم بنجاح في Firestore');
        console.log('📄 Document ID:', checkDoc.id);
        console.log('📄 البيانات المحفوظة:', checkDoc.data());
      } else {
        throw new Error('فشل حفظ البيانات في Firestore');
      }

      // ✅ 9. إعادة تعيين النموذج
      resetForm();
      
      setMessage({ 
        type: 'success', 
        text: `✅ تم إضافة المعلم بنجاح!\n👤 اسم المستخدم: ${formData.username}\n🔑 كلمة المرور: ${formData.password}\n📌 UID: ${user.uid}\n⚠️ تم تسجيل الخروج، الرجاء تسجيل الدخول مرة أخرى كمدير` 
      });

      // ✅ 10. إخفاء الرسالة بعد 5 ثوانٍ
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);

    } catch (error) {
      console.error('❌ خطأ في إضافة المعلم:', error);
      
      let errorMessage = 'حدث خطأ في إضافة المعلم';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
          break;
        case 'auth/invalid-email':
          errorMessage = 'البريد الإلكتروني غير صحيح';
          break;
        case 'auth/weak-password':
          errorMessage = 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'تم حظر الطلب مؤقتاً. حاول لاحقاً';
          break;
        default:
          errorMessage = error.message;
      }
      
      setMessage({ type: 'error', text: '❌ ' + errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // ============ تحديث معلم ============
  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.fullName || !formData.username) {
      setMessage({ type: 'error', text: '❌ الرجاء ملء جميع الحقول المطلوبة' });
      return;
    }

    try {
      setLoading(true);
      
      const docRef = doc(db, 'users', editingId);
      const updateData = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        phone: formData.phone || '',
        updatedAt: new Date().toISOString()
      };
      
      // إذا تم إدخال كلمة مرور جديدة
      if (formData.password && formData.password.trim() !== '') {
        if (formData.password.length < 6) {
          setMessage({ type: 'error', text: '❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
          setLoading(false);
          return;
        }
        updateData.password = formData.password;
      }
      
      await updateDoc(docRef, updateData);
      
      resetForm();
      
      setMessage({ type: 'success', text: '✅ تم تحديث بيانات المعلم بنجاح!' });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);

    } catch (error) {
      console.error('❌ خطأ في تحديث المعلم:', error);
      setMessage({ type: 'error', text: '❌ خطأ في تحديث المعلم: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // ============ حذف معلم ============
  const handleDeleteTeacher = async (id) => {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المعلم نهائياً؟')) return;
    
    try {
      await deleteDoc(doc(db, 'users', id));
      setMessage({ type: 'success', text: '✅ تم حذف المعلم بنجاح!' });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('❌ خطأ في حذف المعلم:', error);
      setMessage({ type: 'error', text: '❌ خطأ في حذف المعلم: ' + error.message });
    }
  };

  // ============ بدء التعديل ============
  const startEdit = (teacher) => {
    setEditingId(teacher.id);
    setFormData({
      fullName: teacher.fullName || '',
      username: teacher.username || '',
      phone: teacher.phone || '',
      password: ''
    });
    setGeneratedUsername('');
    setGeneratedPassword('');
  };

  // ============ إلغاء التعديل ============
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM_DATA });
    setGeneratedUsername('');
    setGeneratedPassword('');
    setShowAddForm(false);
    setMessage({ type: '', text: '' });
  };

  // ============ إظهار/إخفاء كلمة المرور ============
  const toggleShowPassword = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ============ فلترة المعلمين ============
  const filteredTeachers = teachers.filter(teacher =>
    teacher.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============ عرض حالة التحميل ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل المعلمين...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            إدارة المعلمين
          </h2>
          <p className="text-xs text-slate-400">إضافة وتعديل وحذف المعلمين</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">👨‍🏫 عدد المعلمين: {teachers.length}</span>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'إلغاء' : 'إضافة معلم'}
          </button>
        </div>
      </div>

      {/* ====== عرض الرسائل ====== */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm whitespace-pre-line ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : message.type === 'warning'
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ====== نموذج إضافة/تعديل معلم ====== */}
      {(showAddForm || editingId) && (
        <form onSubmit={editingId ? handleUpdateTeacher : handleAddTeacher} className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-blue-400 mb-4">
            {editingId ? '✏️ تعديل بيانات المعلم' : '➕ إضافة معلم جديد'}
          </h3>

          {/* ✅ معلومات التوليد التلقائي */}
          {!editingId && (
            <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
              💡 يتم توليد اسم المستخدم تلقائياً من الاسم الأول والأخير
            </div>
          )}

          {editingId && (
            <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
              ✏️ قم بتعديل البيانات المطلوبة، واترك كلمة المرور فارغة للحفاظ على القديمة
            </div>
          )}

          {/* ✅ تنبيه مهم للمستخدم */}
          {!editingId && (
            <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
              ⚠️ بعد إضافة المعلم، سيتم تسجيل الخروج من حساب المدير. الرجاء تسجيل الدخول مرة أخرى.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ====== الاسم الكامل ====== */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">الاسم الكامل *</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={handleFullNameChange}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="أحمد محمد علي"
                  required
                />
              </div>
              {generatedUsername && !editingId && (
                <p className="text-[10px] text-emerald-400 mt-1">✨ تم توليد: <span className="font-bold">{generatedUsername}</span></p>
              )}
            </div>

            {/* ====== اسم المستخدم ====== */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم المستخدم *</label>
              <div className="relative">
                <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="ahmed_teacher"
                  required
                />
              </div>
              {!editingId && (
                <p className="text-[10px] text-slate-500 mt-1">📧 البريد: {formData.username}@school.local</p>
              )}
            </div>

            {/* ====== رقم الهاتف ====== */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="0912345678"
                />
              </div>
            </div>

            {/* ====== كلمة المرور ====== */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {editingId ? 'كلمة المرور (اتركها فارغة للحفاظ على القديمة)' : 'كلمة المرور *'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder={editingId ? 'اترك فارغاً' : '********'}
                    required={!editingId}
                  />
                </div>
                {!editingId && (
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                  >
                    🔑 توليد
                  </button>
                )}
              </div>
              {generatedPassword && !editingId && (
                <p className="text-[10px] text-emerald-400 mt-1">✨ تم توليد: {generatedPassword}</p>
              )}
              {!editingId && (
                <p className="text-[10px] text-slate-500 mt-1">🔑 6 أرقام</p>
              )}
              {editingId && (
                <p className="text-[10px] text-slate-500 mt-1">🔑 اترك فارغاً للحفاظ على كلمة المرور الحالية</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'تحديث' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); cancelEdit(); }}
              className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg text-sm font-bold transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ====== شريط البحث ====== */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="🔍 بحث عن معلم بالاسم، اسم المستخدم أو البريد..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* ====== قائمة المعلمين ====== */}
      <div className="space-y-3">
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {searchQuery ? '🔍 لا توجد نتائج مطابقة للبحث' : '👨‍🏫 لا يوجد معلمين حالياً'}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddForm}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5 inline ml-1" />
                إضافة أول معلم
              </button>
            )}
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {teacher.fullName?.charAt(0) || 'T'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{teacher.fullName}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>👤 {teacher.username}</span>
                    <span>📧 {teacher.email}</span>
                    {teacher.phone && <span>📱 {teacher.phone}</span>}
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      معلم
                    </span>
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-[9px]">
                      UID: {teacher.uid?.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                      🔑 كلمة المرور: 
                    </span>
                    <button
                      onClick={() => toggleShowPassword(teacher.id)}
                      className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      {showPassword[teacher.id] ? (
                        <><EyeOff className="w-3 h-3" /> {teacher.password || '********'}</>
                      ) : (
                        <><Eye className="w-3 h-3" /> إظهار</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(teacher)}
                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                  title="تعديل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}