// src/components/admin/NotesManager.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, getDoc 
} from 'firebase/firestore';
import { 
  FileText, Users, School, Loader2, Plus, X, 
  CheckCircle, AlertCircle, Trash2, Edit3, Save,
  Filter, Search, UserCog, MessageSquare, Bell,
  Calendar, User, Building
} from 'lucide-react';

export default function NotesManager() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // ✅ اسم مدير المدرسة من قاعدة البيانات
  const [principalName, setPrincipalName] = useState('');
  
  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    content: '',
    semester: 1,
    academicYear: '',
    date: new Date().toISOString().split('T')[0]
  });

  // ============ ✅ جلب اسم مدير المدرسة من إعدادات المدرسة ============
  useEffect(() => {
    const fetchPrincipalName = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'schoolSettings', 'settings'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.schoolInfo?.principalName) {
            setPrincipalName(data.schoolInfo.principalName);
            console.log('✅ تم جلب اسم مدير المدرسة:', data.schoolInfo.principalName);
          }
        }
      } catch (error) {
        console.error('❌ خطأ في جلب اسم مدير المدرسة:', error);
      }
    };
    fetchPrincipalName();
  }, []);

  // ============ جلب البيانات ============
  useEffect(() => {
    const unsubStudents = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'student')),
      (snapshot) => {
        const studentList = [];
        snapshot.forEach(doc => {
          studentList.push({ id: doc.id, ...doc.data() });
        });
        setStudents(studentList);
      }
    );

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const classList = [];
      snapshot.forEach(doc => {
        classList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classList);
    });

    const unsubNotes = onSnapshot(
      query(collection(db, 'studentNotes'), where('type', '==', 'principal')),
      (snapshot) => {
        const noteList = [];
        snapshot.forEach(doc => {
          noteList.push({ id: doc.id, ...doc.data() });
        });
        setNotes(noteList);
        setLoading(false);
      }
    );

    return () => {
      unsubStudents();
      unsubClasses();
      unsubNotes();
    };
  }, []);

  // ============ إضافة ملاحظة ============
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.classId || !formData.content) {
      setMessage({ type: 'error', text: '❌ الرجاء ملء جميع الحقول المطلوبة' });
      return;
    }

    try {
      await addDoc(collection(db, 'studentNotes'), {
        studentId: formData.studentId,
        classId: formData.classId,
        type: 'principal',
        content: formData.content,
        authorName: principalName || 'مدير المدرسة', // ✅ استخدام اسم المدير من الإعدادات
        semester: formData.semester,
        academicYear: formData.academicYear || '',
        date: formData.date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      resetForm();
      setMessage({ type: 'success', text: '✅ تم إضافة ملاحظة مدير المدرسة بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في إضافة الملاحظة: ' + error.message });
    }
  };

  // ============ تحديث ملاحظة ============
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'studentNotes', editingId), {
        content: formData.content,
        updatedAt: new Date().toISOString()
      });

      setEditingId(null);
      resetForm();
      setMessage({ type: 'success', text: '✅ تم تحديث الملاحظة بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في تحديث الملاحظة: ' + error.message });
    }
  };

  // ============ حذف ملاحظة ============
  const handleDelete = async (id) => {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه الملاحظة؟')) return;
    try {
      await deleteDoc(doc(db, 'studentNotes', id));
      setMessage({ type: 'success', text: '✅ تم حذف الملاحظة بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في حذف الملاحظة: ' + error.message });
    }
  };

  // ============ بدء التعديل ============
  const startEdit = (note) => {
    setEditingId(note.id);
    setFormData({
      studentId: note.studentId,
      classId: note.classId,
      content: note.content || '',
      semester: note.semester || 1,
      academicYear: note.academicYear || '',
      date: note.date || new Date().toISOString().split('T')[0]
    });
    setSelectedStudent(note.studentId);
    setSelectedClass(note.classId);
  };

  // ============ إعادة تعيين النموذج ============
  const resetForm = () => {
    setFormData({
      studentId: '',
      classId: '',
      content: '',
      semester: 1,
      academicYear: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedStudent('');
    setSelectedClass('');
    setEditingId(null);
  };

  // ============ الحصول على اسم الطالب ============
  const getStudentName = (id) => {
    const student = students.find(s => s.id === id);
    return student?.fullName || 'غير محدد';
  };

  // ============ الحصول على اسم الصف ============
  const getClassName = (id) => {
    const cls = classes.find(c => c.id === id);
    return cls?.name || 'غير محدد';
  };

  // ============ تصفية الملاحظات ============
  const filteredNotes = notes.filter(n => {
    if (selectedClass && n.classId !== selectedClass) return false;
    if (selectedStudent && n.studentId !== selectedStudent) return false;
    if (selectedSemester && n.semester !== selectedSemester) return false;
    return true;
  });

  // ============ عرض حالة التحميل ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            ملاحظات مدير المدرسة
          </h2>
          <p className="text-xs text-slate-400">إدارة ملاحظات مدير المدرسة للطلاب</p>
        </div>
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400">👩‍💼 {principalName || 'مدير المدرسة'}</span>
        </div>
      </div>

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

      {/* ====== ✅ نموذج إضافة ملاحظة (بدون عنوان) ====== */}
      <form onSubmit={editingId ? handleUpdate : handleAdd} className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <h3 className="text-sm font-bold text-blue-400 mb-4">
          {editingId ? '✏️ تعديل ملاحظة' : '➕ إضافة ملاحظة جديدة'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">الصف *</label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">اختر الصف</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">الطالب *</label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">اختر الطالب</option>
              {students
                .filter(s => !formData.classId || s.classId === formData.classId)
                .map(student => (
                  <option key={student.id} value={student.id}>{student.fullName}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">الفصل الدراسي *</label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value={1}>الفصل الأول</option>
              <option value={2}>الفصل الثاني</option>
            </select>
          </div>
        </div>

        {/* ✅ إزالة حقل العنوان */}
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1">
            محتوى الملاحظة *
            <span className="text-[10px] text-slate-500 mr-2">
              (سيتم إضافة اسم المدير تلقائياً: {principalName || 'مدير المدرسة'})
            </span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="أدخل نص الملاحظة..."
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? 'تحديث الملاحظة' : 'إضافة الملاحظة'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg text-sm font-bold transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* ====== أدوات التصفية ====== */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">جميع الصفوف</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">جميع الطلاب</option>
            {students
              .filter(s => !selectedClass || s.classId === selectedClass)
              .map(student => (
                <option key={student.id} value={student.id}>{student.fullName}</option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value={1}>الفصل الأول</option>
            <option value={2}>الفصل الثاني</option>
          </select>
        </div>
      </div>

      {/* ====== قائمة الملاحظات ====== */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">لا توجد ملاحظات مدير المدرسة</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const studentName = getStudentName(note.studentId);
            const className = getClassName(note.classId);

            return (
              <div key={note.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">👩‍💼</span>
                      <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        ملاحظات مدير المدرسة
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ✍️ {note.authorName || principalName || 'مدير المدرسة'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-300 mt-2 whitespace-pre-line">{note.content}</p>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                      <span>👤 {studentName}</span>
                      <span>🏫 {className}</span>
                      <span>📅 الفصل {note.semester}</span>
                      <span>📆 {note.date}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(note)}
                      className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}