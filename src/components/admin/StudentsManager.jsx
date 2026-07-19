// src/components/admin/StudentsManager.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, getDocs 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  Users, Plus, Trash2, Edit3, Save, X, Search, 
  Loader2, User, Key, School, Phone, Eye, EyeOff, 
  CheckCircle, AlertCircle, Filter, FileText, UserSquare,
  GraduationCap, MapPin, Globe 
} from 'lucide-react';
// ✅ إضافة استيراد PromoteStudentsModal
import PromoteStudentsModal from './StudentsManager/components/PromoteStudentsModal';

// ============ تحويل عربي إلى إنجليزي ============
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

// ============ توليد اسم مستخدم من الاسم الكامل ============
const generateUsername = (fullName) => {
  if (!fullName || !fullName.trim()) {
    return 'student_' + Math.floor(Math.random() * 10000);
  }

  const cleanName = fullName.trim().replace(/\s+/g, ' ').replace(/[^ء-ي\s]/g, '');
  if (!cleanName) return 'student_' + Math.floor(Math.random() * 10000);

  const parts = cleanName.split(' ');
  const englishParts = parts.map(p => arabicToEnglish(p)).filter(p => p.length > 0);

  if (englishParts.length === 0) {
    return 'student_' + Math.floor(Math.random() * 10000);
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
    username = 'student_' + Math.floor(Math.random() * 10000);
  }

  if (username.length > 15) {
    username = username.slice(0, 15);
  }

  username = username + Math.floor(Math.random() * 100);
  return username.toLowerCase();
};

// ============ توليد كلمة مرور (6 أرقام) ============
const generatePassword = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export default function StudentsManager() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
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
    classId: '',
    phone: '',
    password: '',
    parentPhone: '',
    dateOfBirth: '',
    idNumber: '',
    address: '',
    birthPlace: '',
    nationality: ''
  };

  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });

  // ============ جلب الطلاب ============
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'student')),
      (snapshot) => {
        const studentList = [];
        snapshot.forEach(doc => {
          studentList.push({ id: doc.id, ...doc.data() });
        });
        setStudents(studentList);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, []);

  // ============ جلب الصفوف ============
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const classList = [];
      snapshot.forEach(doc => {
        classList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classList);
    });
    return () => unsubscribe();
  }, []);

  // ============ جلب إعدادات المدرسة ============
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [isYearClosed, setIsYearClosed] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'schoolSettings'),
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setSchoolSettings({ id: snapshot.docs[0].id, ...data });
          setIsYearClosed(data?.academicYear?.status === 'closed');
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // ============ عند تغيير الاسم - توليد اسم مستخدم ============
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

  // ============ توليد كلمة مرور ============
  const handleGeneratePassword = useCallback(() => {
    const password = generatePassword();
    setGeneratedPassword(password);
    setFormData(prev => ({ ...prev, password: password }));
  }, []);

  // ============ إعادة تعيين النموذج ============
  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM_DATA });
    setGeneratedUsername('');
    setGeneratedPassword('');
    setShowAddForm(false);
    setMessage({ type: '', text: '' });
  }, []);

  // ============ فتح نموذج الإضافة ============
  const openAddForm = useCallback(() => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM_DATA });
    setGeneratedUsername('');
    setGeneratedPassword('');
    setShowAddForm(true);
    setMessage({ type: '', text: '' });
  }, []);

  // ============ بدء التعديل ============
  const startEdit = useCallback((student) => {
    setEditingId(student.id);
    setFormData({
      fullName: student.fullName || '',
      username: student.username || '',
      classId: student.classId || '',
      phone: student.phone || '',
      password: '',
      parentPhone: student.parentPhone || '',
      dateOfBirth: student.dateOfBirth || '',
      idNumber: student.idNumber || '',
      address: student.address || '',
      birthPlace: student.birthPlace || '',
      nationality: student.nationality || ''
    });
    setGeneratedUsername('');
    setGeneratedPassword('');
    setShowAddForm(true);
  }, []);

  // ============ إلغاء التعديل ============
  const cancelEdit = useCallback(() => {
    console.log('🔄 جاري إلغاء التعديل...');
    
    setEditingId(null);
    setFormData({ ...INITIAL_FORM_DATA });
    setGeneratedUsername('');
    setGeneratedPassword('');
    setShowAddForm(false);
    setMessage({ type: '', text: '' });
    
    console.log('✅ تم إلغاء التعديل وإعادة تعيين النموذج');
  }, []);

  // ============ ✅ إضافة طالب (مع منع تسجيل الدخول التلقائي) ============
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.fullName || !formData.username || !formData.password) {
      setMessage({ type: 'error', text: '❌ الرجاء ملء جميع الحقول المطلوبة' });
      return;
    }

    if (!formData.classId) {
      setMessage({ type: 'error', text: '❌ الرجاء اختيار الصف الدراسي' });
      return;
    }

    try {
      setLoading(true);

      // ✅ حفظ بيانات المدير الحالي قبل إنشاء الحساب
      const adminUser = auth.currentUser;
      const adminEmail = adminUser?.email;

      const existingQuery = query(collection(db, 'users'), where('username', '==', formData.username));
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        const newUsername = formData.username + Math.floor(Math.random() * 1000);
        setFormData(prev => ({ ...prev, username: newUsername }));
        setMessage({ type: 'warning', text: `⚠️ اسم المستخدم مستخدم، تم تغييره إلى: ${newUsername}` });
        setLoading(false);
        return;
      }

      if (formData.idNumber && formData.idNumber.trim() !== '') {
        const idQuery = query(collection(db, 'users'), where('idNumber', '==', formData.idNumber.trim()));
        const idSnapshot = await getDocs(idQuery);
        if (!idSnapshot.empty) {
          setMessage({ type: 'error', text: '❌ رقم الهوية مستخدم بالفعل' });
          setLoading(false);
          return;
        }
      }

      const email = `${formData.username}@school.local`;

      // ✅ إنشاء الحساب الجديد
      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
      const user = userCredential.user;

      // ✅ تسجيل الخروج من الحساب الجديد فوراً
      await auth.signOut();

      // ✅ إعادة تسجيل الدخول كمدير
      if (adminEmail) {
        // سيطلب من المستخدم إعادة تسجيل الدخول
        console.log('ℹ️ تم تسجيل الخروج من حساب الطالب، الرجاء تسجيل الدخول مرة أخرى كمدير');
      }

      // ✅ حفظ بيانات الطالب في Firestore
      const studentData = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: email,
        classId: formData.classId,
        phone: formData.phone || '',
        parentPhone: formData.parentPhone || '',
        dateOfBirth: formData.dateOfBirth || '',
        idNumber: formData.idNumber || '',
        address: formData.address || '',
        birthPlace: formData.birthPlace || '',
        nationality: formData.nationality || '',
        password: formData.password,
        role: 'student',
        uid: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        academicYear: schoolSettings?.academicYear?.current || '',
        promotionHistory: []
      };

      await setDoc(doc(db, 'users', user.uid), studentData);

      resetForm();

      setMessage({
        type: 'success',
        text: `✅ تم إضافة الطالب بنجاح!\n👤 اسم المستخدم: ${formData.username}\n🏫 الصف: ${classes.find(c => c.id === formData.classId)?.name || 'غير محدد'}\n🔑 كلمة المرور: ${formData.password}\n⚠️ تم تسجيل الخروج، الرجاء تسجيل الدخول مرة أخرى كمدير`
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 5000);

    } catch (error) {
      console.error('❌ خطأ:', error);
      setMessage({ type: 'error', text: '❌ ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // ============ تحديث طالب ============
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.fullName || !formData.username || !formData.classId) {
      setMessage({ type: 'error', text: '❌ الرجاء ملء جميع الحقول المطلوبة' });
      return;
    }

    try {
      setLoading(true);

      const docRef = doc(db, 'users', editingId);
      const updateData = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        classId: formData.classId,
        phone: formData.phone || '',
        parentPhone: formData.parentPhone || '',
        dateOfBirth: formData.dateOfBirth || '',
        idNumber: formData.idNumber || '',
        address: formData.address || '',
        birthPlace: formData.birthPlace || '',
        nationality: formData.nationality || '',
        updatedAt: new Date().toISOString()
      };

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

      setMessage({ type: 'success', text: '✅ تم تحديث بيانات الطالب بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('❌ خطأ في تحديث الطالب:', error);
      setMessage({ type: 'error', text: '❌ خطأ في تحديث الطالب: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // ============ حذف طالب ============
  const handleDeleteStudent = async (id) => {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الطالب نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      setMessage({ type: 'success', text: '✅ تم حذف الطالب بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في حذف الطالب: ' + error.message });
    }
  };

  // ============ تصدير بيانات الطلاب ============
  const exportStudentsData = () => {
    const filtered = getFilteredStudents();
    if (filtered.length === 0) {
      setMessage({ type: 'error', text: '❌ لا توجد بيانات للتصدير' });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const tableRows = filtered.map((student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${student.fullName}</td>
        <td>${student.username}</td>
        <td><strong>${student.password || '********'}</strong></td>
        <td>${student.idNumber || '-'}</td>
        <td>${student.birthPlace || '-'}</td>
        <td>${student.nationality || '-'}</td>
        <td>${student.address || '-'}</td>
        <td>${classes.find(c => c.id === student.classId)?.name || 'غير محدد'}</td>
        <td>${student.email}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>بيانات الطلاب</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #fff; }
            h1 { text-align: center; color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 10px; }
            .info { text-align: center; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #1a237e; color: white; padding: 8px; text-align: center; }
            td { padding: 6px; border: 1px solid #ddd; text-align: center; }
            tr:nth-child(even) { background: #f5f5f5; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>📋 بيانات الطلاب</h1>
          <div class="info">
            تاريخ التصدير: ${new Date().toLocaleDateString('ar')} | عدد الطلاب: ${filtered.length}
            ${filterClass !== 'all' ? `| الصف: ${classes.find(c => c.id === filterClass)?.name || 'الكل'}` : '| جميع الصفوف'}
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الطالب</th>
                <th>اسم المستخدم</th>
                <th>كلمة المرور</th>
                <th>رقم الهوية</th>
                <th>مكان الولادة</th>
                <th>الجنسية</th>
                <th>مكان السكن</th>
                <th>الصف</th>
                <th>البريد الإلكتروني</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer">تم إنشاء هذا التقرير بواسطة المنصة التعليمية الذكية</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ============ فلترة الطلاب ============
  const getFilteredStudents = useCallback(() => {
    let filtered = students;
    if (filterClass !== 'all') {
      filtered = filtered.filter(s => s.classId === filterClass);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.fullName?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.idNumber?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.birthPlace?.toLowerCase().includes(q) ||
        s.nationality?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [students, filterClass, searchQuery]);

  const filteredStudents = useMemo(() => getFilteredStudents(), [getFilteredStudents]);

  const getClassName = useCallback((classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || 'غير محدد';
  }, [classes]);

  // ============ التحقق من إمكانية الترفيع ============
  const canPromote = useMemo(() => {
    if (!isYearClosed) return false;
    if (classes.length === 0) return false;
    
    const hasStudents = students.some(s => {
      const classObj = classes.find(c => c.id === s.classId);
      if (!classObj) return false;
      const classNumber = parseInt(classObj.name);
      return classNumber >= 9 && classNumber <= 11;
    });
    
    return hasStudents;
  }, [isYearClosed, classes, students]);

  // ============ حالة الترفيع ============
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  const handlePromoteComplete = useCallback((results) => {
    setShowPromoteModal(false);
    setMessage({
      type: 'success',
      text: `✅ تم ترفيع ${results.promoted} طالب بنجاح!\n❌ فشل ترفيع ${results.failed} طالب`
    });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  // ============ عرض حالة التحميل ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل الطلاب...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== نافذة الترفيع ====== */}
      {showPromoteModal && (
        <PromoteStudentsModal
          students={students}
          classes={classes}
          schoolSettings={schoolSettings}
          onClose={() => setShowPromoteModal(false)}
          onComplete={handlePromoteComplete}
        />
      )}

      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            إدارة الطلاب
          </h2>
          <p className="text-xs text-slate-400">
            إضافة وتعديل وحذف الطلاب
            {isYearClosed && (
              <span className="text-rose-400 mr-2">🔒 العام الدراسي مغلق</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">👨‍🎓 عدد الطلاب: {students.length}</span>
          
          {canPromote && (
            <button
              onClick={() => setShowPromoteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20 animate-pulse"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              🎓 ترفيع الطلاب
            </button>
          )}
          
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'إلغاء' : 'إضافة طالب'}
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
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ====== نموذج إضافة/تعديل طالب ====== */}
      {showAddForm && (
        <form onSubmit={editingId ? handleUpdateStudent : handleAddStudent} className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-emerald-400 mb-4">
            {editingId ? '✏️ تعديل بيانات الطالب' : '➕ إضافة طالب جديد'}
          </h3>

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
              ⚠️ بعد إضافة الطالب، سيتم تسجيل الخروج من حساب المدير. الرجاء تسجيل الدخول مرة أخرى.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ====== معلومات أساسية ====== */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">الاسم الكامل *</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={handleFullNameChange}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="أحمد محمد علي"
                  required
                />
              </div>
              {generatedUsername && !editingId && (
                <p className="text-[10px] text-emerald-400 mt-1">✨ تم توليد: <span className="font-bold">{generatedUsername}</span></p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم المستخدم *</label>
              <div className="relative">
                <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="ahmedali"
                  required
                />
              </div>
            </div>

            {/* ====== معلومات المدرسة ====== */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">الصف الدراسي *</label>
              <div className="relative">
                <School className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- اختر الصف --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">رقم الهوية</label>
              <div className="relative">
                <UserSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="رقم الهوية"
                />
              </div>
            </div>

            {/* ====== معلومات الولادة والسكن ====== */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">مكان الولادة</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="القدس"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">الجنسية</label>
              <div className="relative">
                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="فلسطين"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">مكان السكن</label>
              <div className="relative">
                <UserSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="العيزرية"
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
                    className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
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

            {/* ====== معلومات الاتصال ====== */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="0912345678"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">هاتف ولي الأمر</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="0912345678"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">تاريخ الميلاد</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              />
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
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg text-sm font-bold transition-all"
            >
              <X className="w-4 h-4" />
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* ====== أدوات البحث والفلترة ====== */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="🔍 بحث عن طالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="all">📚 جميع الصفوف</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={exportStudentsData}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
        >
          <FileText className="w-4 h-4" />
          تصدير PDF
        </button>
      </div>

      {/* ====== قائمة الطلاب ====== */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {searchQuery || filterClass !== 'all' ? '🔍 لا توجد نتائج مطابقة' : '👨‍🎓 لا يوجد طلاب حالياً'}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {student.fullName?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{student.fullName}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>👤 {student.username}</span>
                    <span>🏫 {getClassName(student.classId)}</span>
                    {student.idNumber && <span>🆔 {student.idNumber}</span>}
                    {student.birthPlace && <span>📍 {student.birthPlace}</span>}
                    {student.nationality && <span>🌍 {student.nationality}</span>}
                    {student.address && <span>🏠 {student.address}</span>}
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[9px]">طالب</span>
                    {student.promotionHistory && student.promotionHistory.length > 0 && (
                      <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-[9px]">
                        🎓 {student.promotionHistory.length} ترفيع
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      🔑 كلمة المرور:
                    </span>
                    <button
                      onClick={() => setShowPassword(prev => ({ ...prev, [student.id]: !prev[student.id] }))}
                      className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      {showPassword[student.id] ? (
                        <><EyeOff className="w-3 h-3" /> {student.password || '********'}</>
                      ) : (
                        <><Eye className="w-3 h-3" /> إظهار</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(student)}
                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                  title="تعديل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteStudent(student.id)}
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