// src/components/admin/SubjectsManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, getDocs 
} from 'firebase/firestore';
import { 
  BookOpen, Plus, Trash2, Edit3, Save, X, Search, 
  Loader2, School, User, CheckCircle, AlertCircle, Filter,
  ArrowUpDown, Copy, Check
} from 'lucide-react';

// ============ قائمة المواد الأساسية (Master Subjects) ============
const MASTER_SUBJECTS = [
  'الرياضيات',
  'اللغة العربية',
  'اللغة الإنجليزية',
  'العلوم',
  'الفيزياء',
  'الكيمياء',
  'الأحياء',
  'التاريخ',
  'الجغرافيا',
  'التربية الإسلامية',
  'التربية الوطنية',
  'التكنولوجيا',
  'الفنون',
  'التربية البدنية',
  'التنشئة الاجتماعية',
];

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMasterList, setShowMasterList] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // ====== حالة نافذة نسخ المواد ======
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceClass, setCopySourceClass] = useState('');
  const [copyTargetClass, setCopyTargetClass] = useState('');
  const [copying, setCopying] = useState(false);

  const INITIAL_FORM_DATA = {
    name: '',
    classId: '',
    teacherId: ''
  };

  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });

  // ============ جلب المواد ============
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      const subjectList = [];
      snapshot.forEach(doc => {
        subjectList.push({ id: doc.id, ...doc.data() });
      });
      setSubjects(subjectList);
      setLoading(false);
    });
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

  // ============ ✅ جلب المعلمين وترتيبهم أبجدياً ============
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'teacher')),
      (snapshot) => {
        const teacherList = [];
        snapshot.forEach(doc => {
          teacherList.push({ id: doc.id, ...doc.data() });
        });
        // ✅ ترتيب المعلمين أبجدياً حسب الاسم الكامل
        teacherList.sort((a, b) => {
          return (a.fullName || '').localeCompare(b.fullName || '', 'ar');
        });
        setTeachers(teacherList);
      }
    );
    return () => unsubscribe();
  }, []);

  // ============ المواد المستخدمة بالفعل (لكل صف) ============
  const getUsedSubjectNamesForClass = (classId) => {
    return new Set(
      subjects
        .filter(s => s.classId === classId)
        .map(s => s.name)
    );
  };

  // ============ المواد المتاحة لصف معين ============
  const getAvailableSubjectsForClass = (classId) => {
    const used = getUsedSubjectNamesForClass(classId);
    return MASTER_SUBJECTS.filter(name => !used.has(name));
  };

  // ============ التحقق من وجود المادة في الصف ============
  const isSubjectInClass = (subjectName, classId) => {
    return subjects.some(s => s.name === subjectName && s.classId === classId);
  };

  // ============ ✅ ترتيب الصفوف بشكل منطقي ============
  const getSortedClasses = () => {
    return [...classes].sort((a, b) => {
      // استخراج رقم الصف من الاسم
      const numA = parseInt(a.name?.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.name?.match(/\d+/)?.[0] || 0);
      // إذا كانت الأرقام متساوية، رتب حسب الحرف (أ، ب، ج، ...)
      if (numA === numB) {
        return (a.name || '').localeCompare(b.name || '', 'ar');
      }
      return numA - numB;
    });
  };

  // ============ إضافة مادة ============
  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.name || !formData.classId) {
      setMessage({ type: 'error', text: '❌ الرجاء إدخال اسم المادة واختيار الصف' });
      return;
    }

    try {
      setLoading(true);

      const existingQuery = query(
        collection(db, 'subjects'),
        where('name', '==', formData.name.trim()),
        where('classId', '==', formData.classId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        setMessage({ type: 'error', text: '❌ هذه المادة موجودة بالفعل في هذا الصف' });
        setLoading(false);
        return;
      }

      const subjectData = {
        name: formData.name.trim(),
        classId: formData.classId,
        teacherId: formData.teacherId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'subjects'), subjectData);

      resetForm();

      setMessage({
        type: 'success',
        text: `✅ تم إضافة المادة بنجاح!\n📚 ${formData.name}\n🏫 ${getClassName(formData.classId)}`
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في إضافة المادة: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // ============ إضافة مادة جديدة إلى القائمة الأساسية ============
  const addToMasterList = () => {
    const name = newSubjectName.trim();
    if (!name) {
      setMessage({ type: 'error', text: '❌ الرجاء إدخال اسم المادة' });
      return;
    }
    if (MASTER_SUBJECTS.includes(name)) {
      setMessage({ type: 'warning', text: '⚠️ هذه المادة موجودة بالفعل في القائمة' });
      return;
    }
    MASTER_SUBJECTS.push(name);
    MASTER_SUBJECTS.sort();
    setNewSubjectName('');
    setFormData(prev => ({ ...prev, name: name }));
    setMessage({ type: 'success', text: `✅ تم إضافة "${name}" إلى قائمة المواد` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // ============ تحديث مادة ============
  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.name || !formData.classId) {
      setMessage({ type: 'error', text: '❌ الرجاء إدخال اسم المادة واختيار الصف' });
      return;
    }

    try {
      setLoading(true);

      const docRef = doc(db, 'subjects', editingId);
      await updateDoc(docRef, {
        name: formData.name.trim(),
        classId: formData.classId,
        teacherId: formData.teacherId || '',
        updatedAt: new Date().toISOString()
      });

      resetForm();

      setMessage({ type: 'success', text: '✅ تم تحديث المادة بنجاح!' });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في تحديث المادة: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // ============ حذف مادة ============
  const handleDelete = async (id) => {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه المادة نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'subjects', id));
      setMessage({ type: 'success', text: '✅ تم حذف المادة بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في حذف المادة: ' + error.message });
    }
  };

  // ============ ✅ نسخ المواد بين الصفوف (محسّن) ============
  const handleCopySubjects = async () => {
    if (!copySourceClass || !copyTargetClass) {
      setMessage({ type: 'error', text: '❌ الرجاء اختيار الصف المصدر والهدف' });
      return;
    }

    if (copySourceClass === copyTargetClass) {
      setMessage({ type: 'error', text: '❌ لا يمكن النسخ إلى نفس الصف' });
      return;
    }

    try {
      setCopying(true);
      
      const sourceClass = classes.find(c => c.id === copySourceClass);
      const targetClass = classes.find(c => c.id === copyTargetClass);
      
      if (!sourceClass || !targetClass) {
        setMessage({ type: 'error', text: '❌ لم يتم العثور على الصفوف' });
        setCopying(false);
        return;
      }

      // جلب مواد الصف المصدر
      const sourceQuery = query(
        collection(db, 'subjects'),
        where('classId', '==', copySourceClass)
      );
      const sourceSnapshot = await getDocs(sourceQuery);
      
      if (sourceSnapshot.empty) {
        setMessage({ type: 'warning', text: `⚠️ لا توجد مواد في الصف ${sourceClass.name}` });
        setCopying(false);
        return;
      }

      // جلب مواد الصف الهدف
      const targetQuery = query(
        collection(db, 'subjects'),
        where('classId', '==', copyTargetClass)
      );
      const targetSnapshot = await getDocs(targetQuery);
      const targetNames = new Set(targetSnapshot.docs.map(doc => doc.data().name));

      let addedCount = 0;
      let skippedCount = 0;
      const addedSubjects = [];

      // نسخ المواد
      for (const docSnap of sourceSnapshot.docs) {
        const data = docSnap.data();
        if (targetNames.has(data.name)) {
          skippedCount++;
          continue;
        }

        await addDoc(collection(db, 'subjects'), {
          name: data.name,
          classId: copyTargetClass,
          teacherId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        addedCount++;
        addedSubjects.push(data.name);
      }

      setMessage({
        type: 'success',
        text: `✅ تم نسخ ${addedCount} مادة إلى ${targetClass.name}${skippedCount > 0 ? `\n⚠️ تخطى ${skippedCount} مادة مكررة` : ''}\n📚 المواد المنسوخة: ${addedSubjects.join('، ')}`
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);

      setShowCopyModal(false);
      setCopySourceClass('');
      setCopyTargetClass('');

    } catch (error) {
      console.error('❌ خطأ في نسخ المواد:', error);
      setMessage({ type: 'error', text: '❌ خطأ في نسخ المواد: ' + error.message });
    } finally {
      setCopying(false);
    }
  };

  // ============ إعادة تعيين النموذج ============
  const resetForm = () => {
    setEditingId(null);
    setFormData({ ...INITIAL_FORM_DATA });
    setShowAddForm(false);
    setShowMasterList(false);
    setNewSubjectName('');
  };

  // ============ بدء التعديل ============
  const startEdit = (subject) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name || '',
      classId: subject.classId || '',
      teacherId: subject.teacherId || ''
    });
    setShowAddForm(true);
  };

  // ============ إلغاء التعديل ============
  const cancelEdit = () => {
    resetForm();
  };

  // ============ الحصول على اسم الصف ============
  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || 'غير محدد';
  };

  // ============ الحصول على اسم المعلم ============
  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.fullName || 'غير معين';
  };

  // ============ فلترة وفرز المواد ============
  const getFilteredAndSortedSubjects = () => {
    let filtered = [...subjects];

    if (filterClass !== 'all') {
      filtered = filtered.filter(sub => sub.classId === filterClass);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.name?.toLowerCase().includes(q) ||
        getClassName(sub.classId).toLowerCase().includes(q) ||
        getTeacherName(sub.teacherId).toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return filtered;
  };

  const filteredSubjects = getFilteredAndSortedSubjects();

  // ============ تبديل الترتيب ============
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // ============ ✅ نافذة نسخ المواد (محسّنة) ============
  const renderCopyModal = () => {
    if (!showCopyModal) return null;

    const sortedClasses = getSortedClasses();

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Copy className="w-5 h-5 text-purple-400" />
              نسخ المواد بين الصفوف
            </h3>
            <button
              onClick={() => setShowCopyModal(false)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">الصف المصدر (انسخ منه)</label>
              <select
                value={copySourceClass}
                onChange={(e) => setCopySourceClass(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">-- اختر الصف المصدر --</option>
                {sortedClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">الصف الهدف (انسخ إليه)</label>
              <select
                value={copyTargetClass}
                onChange={(e) => setCopyTargetClass(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">-- اختر الصف الهدف --</option>
                {sortedClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCopySubjects}
                disabled={copying || !copySourceClass || !copyTargetClass}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {copying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري النسخ...</>
                ) : (
                  <><Copy className="w-4 h-4" /> نسخ المواد</>
                )}
              </button>
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all"
              >
                إلغاء
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              💡 سيتم نسخ جميع المواد من الصف المصدر إلى الصف الهدف<br />
              المواد المكررة سيتم تخطيها تلقائياً
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ============ عرض قائمة المواد الأساسية ============
  const renderMasterList = () => {
    if (!showMasterList) return null;

    const usedInCurrentClass = formData.classId 
      ? getUsedSubjectNamesForClass(formData.classId)
      : new Set();

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full mx-4 border border-slate-700 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              قائمة المواد الأساسية
            </h3>
            <button
              onClick={() => setShowMasterList(false)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formData.classId && (
            <div className="mb-3 p-2 bg-blue-500/10 rounded-lg text-xs text-blue-400">
              📌 الصف المحدد: <strong>{getClassName(formData.classId)}</strong>
              <br />
              ✅ المواد المستخدمة: {usedInCurrentClass.size}
            </div>
          )}

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="اسم مادة جديدة..."
                className="flex-1 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToMasterList();
                  }
                }}
              />
              <button
                onClick={addToMasterList}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">💡 اضغط Enter لإضافة المادة إلى القائمة</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {MASTER_SUBJECTS.map((name) => {
              const isUsed = usedInCurrentClass.has(name);
              const isAvailable = !isUsed;

              return (
                <button
                  key={name}
                  onClick={() => {
                    if (!isAvailable) {
                      setMessage({ type: 'warning', text: `⚠️ "${name}" موجودة بالفعل في هذا الصف` });
                      return;
                    }
                    setFormData(prev => ({ ...prev, name: name }));
                    setShowMasterList(false);
                    setMessage({ type: 'info', text: `📚 تم اختيار: ${name}` });
                    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isAvailable
                      ? 'bg-slate-700 hover:bg-slate-600 text-white hover:scale-105'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-40'
                  }`}
                  disabled={!isAvailable}
                  title={isUsed ? `✅ مستخدمة في ${getClassName(formData.classId)}` : ''}
                >
                  {name}
                  {isUsed && (
                    <Check className="w-3 h-3 inline ml-1 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-slate-500 grid grid-cols-3 gap-2">
            <p>📌 {MASTER_SUBJECTS.length} مادة</p>
            <p>✅ {usedInCurrentClass.size} مستخدمة</p>
            <p>📋 {MASTER_SUBJECTS.length - usedInCurrentClass.size} متاحة</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل المواد...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== نافذة نسخ المواد ====== */}
      {renderCopyModal()}

      {/* ====== نافذة قائمة المواد الأساسية ====== */}
      {renderMasterList()}

      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            المواد الدراسية
          </h2>
          <p className="text-xs text-slate-400">إضافة وتعديل وحذف المواد مع تحديد الصف والمعلم</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">📚 عدد المواد: {subjects.length}</span>
          <button
            onClick={() => setShowCopyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            نسخ المواد
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'إلغاء' : 'إضافة مادة'}
          </button>
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

      {/* ====== نموذج إضافة/تعديل ====== */}
      {(showAddForm || editingId) && (
        <form onSubmit={editingId ? handleUpdate : handleAdd} className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-amber-400 mb-4">
            {editingId ? '✏️ تعديل المادة' : '➕ إضافة مادة جديدة'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم المادة *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="اسم المادة"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMasterList(true)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all"
                  title="اختر من القائمة"
                >
                  📚
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">💡 اضغط على 📚 لاختيار مادة من القائمة</p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">الصف *</label>
              <div className="relative">
                <School className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- اختر الصف --</option>
                  {getSortedClasses().map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">معلم المادة</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- اختر المعلم --</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

      {/* ====== أدوات البحث والفلترة والفرز ====== */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="🔍 بحث عن مادة، صف أو معلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="all">📚 جميع الصفوف</option>
            {getSortedClasses().map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortOrder === 'asc' ? 'أ-ي' : 'ي-أ'}
        </button>
      </div>

      {/* ====== قائمة المواد ====== */}
      <div className="space-y-3">
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {searchQuery || filterClass !== 'all' ? '🔍 لا توجد نتائج مطابقة' : '📚 لا توجد مواد حالياً'}
            </p>
          </div>
        ) : (
          filteredSubjects.map((subject) => (
            <div key={subject.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{subject.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>🏫 {getClassName(subject.classId)}</span>
                    {subject.teacherId && (
                      <span>👨‍🏫 {getTeacherName(subject.teacherId)}</span>
                    )}
                    {!subject.teacherId && (
                      <span className="text-amber-400">⚠️ بدون معلم</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(subject)}
                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(subject.id)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
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