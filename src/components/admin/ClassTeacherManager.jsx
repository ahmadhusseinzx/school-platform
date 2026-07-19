// src/components/admin/ClassTeacherManager.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, 
  query, where, onSnapshot 
} from 'firebase/firestore';
import { 
  UserCog, School, Users, CheckCircle, AlertCircle, 
  Loader2, Plus, X, Edit3, Save, Search
} from 'lucide-react';

export default function ClassTeacherManager() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classTeachers, setClassTeachers] = useState({});
  const [editing, setEditing] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // ============ جلب البيانات ============
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const classList = [];
      snapshot.forEach(doc => {
        classList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classList);
    });

    const unsubTeachers = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'teacher')),
      (snapshot) => {
        const teacherList = [];
        snapshot.forEach(doc => {
          teacherList.push({ id: doc.id, ...doc.data() });
        });
        setTeachers(teacherList);
      }
    );

    // جلب تعيينات مربي الصف
    const fetchClassTeachers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'classTeachers'));
        const data = {};
        snapshot.forEach(doc => {
          data[doc.id] = doc.data();
        });
        setClassTeachers(data);
      } catch (error) {
        console.error('❌ خطأ في جلب تعيينات مربي الصف:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClassTeachers();

    return () => {
      unsubClasses();
      unsubTeachers();
    };
  }, []);

  // ============ تعيين مربي الصف ============
  const handleAssign = async (classId) => {
    if (!selectedTeacher) {
      setMessage({ type: 'error', text: '❌ الرجاء اختيار معلم' });
      return;
    }

    try {
      await setDoc(doc(db, 'classTeachers', classId), {
        classId: classId,
        teacherId: selectedTeacher,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setClassTeachers(prev => ({
        ...prev,
        [classId]: { classId, teacherId: selectedTeacher }
      }));

      setEditing(null);
      setSelectedTeacher('');
      setMessage({ type: 'success', text: '✅ تم تعيين مربي الصف بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في تعيين مربي الصف: ' + error.message });
    }
  };

  // ============ إلغاء تعيين مربي الصف ============
  const handleUnassign = async (classId) => {
    if (!confirm('⚠️ هل أنت متأكد من إلغاء تعيين مربي الصف؟')) return;

    try {
      await updateDoc(doc(db, 'classTeachers', classId), {
        teacherId: null,
        updatedAt: new Date().toISOString()
      });

      setClassTeachers(prev => ({
        ...prev,
        [classId]: { ...prev[classId], teacherId: null }
      }));

      setMessage({ type: 'success', text: '✅ تم إلغاء تعيين مربي الصف' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في إلغاء التعيين: ' + error.message });
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.fullName || 'غير معين';
  };

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
            <UserCog className="w-5 h-5 text-blue-400" />
            مربي الصفوف
          </h2>
          <p className="text-xs text-slate-400">تعيين مربي لكل صف دراسي</p>
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

      <div className="space-y-4">
        {classes.map(cls => {
          const assignment = classTeachers[cls.id];
          const currentTeacher = assignment?.teacherId || null;

          return (
            <div key={cls.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <School className="w-5 h-5 text-purple-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{cls.name}</h4>
                    <p className="text-xs text-slate-400">
                      مربي الصف: {currentTeacher ? getTeacherName(currentTeacher) : '⚠️ غير معين'}
                    </p>
                  </div>
                </div>

                {editing === cls.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTeacher}
                      onChange={(e) => setSelectedTeacher(e.target.value)}
                      className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">اختر معلم</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.fullName}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(cls.id)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditing(null); setSelectedTeacher(''); }}
                      className="p-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(cls.id); setSelectedTeacher(currentTeacher || ''); }}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {currentTeacher && (
                      <button
                        onClick={() => handleUnassign(cls.id)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}