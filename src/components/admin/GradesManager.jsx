// src/components/admin/GradesManager.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db, auth } from '../../../services/firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot, writeBatch 
} from 'firebase/firestore';
import { 
  reauthenticateWithCredential, EmailAuthProvider 
} from 'firebase/auth';
import { 
  FileText, Loader2, CheckCircle, AlertCircle,
  Printer, RefreshCw, Bell, SaveAll,
  Play, Lock, Unlock, Flag, Keyboard, Calendar
} from 'lucide-react';

// ====== المكونات الفرعية ======
import GradeTable from './components/GradeTable';
import GradeFilters from './components/GradeFilters';
import GradeSummary from './components/GradeSummary';
import YearModal from './components/YearModal';
import ConfirmModal from './components/ConfirmModal';

// ====== Hooks ======
import { useSchoolSettings } from './hooks/useSchoolSettings';
import { useGradeEditing } from './hooks/useGradeEditing';

// ====== دوال مساعدة ======
import { printGradeSheet } from './utils/printUtils';
import { GRADE_FIELDS } from './constants/gradeFields';
import { getTotalMaxForSubject } from './constants/gradeFields';

export default function GradesManager() {
  // ====== البيانات الأساسية ======
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // ====== خيارات الفلترة ======
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifyTeacher, setNotifyTeacher] = useState(true);
  
  // ====== حالة النوافذ المنبثقة ======
  const [showYearModal, setShowYearModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // ====== ✅ توزيع العلامات ======
  const [gradingConfig, setGradingConfig] = useState(null);

  // ====== استخدام Hooks ======
  const {
    schoolSettings,
    settingsLoading,
    academicYear,
    setAcademicYear,
    isSemester1Closed,
    isSemester2Closed,
    isYearActive,
    isYearClosed,
    startAcademicYear,
    openSemester,
    closeSemester,
    closeAcademicYear
  } = useSchoolSettings();

  const {
    tempGrades,
    editingCell,
    editingValue,
    setEditingValue,
    saving,
    inputRef,
    getFieldValue,
    startEdit,
    updateTempGrade,
    saveAllGrades,
    getTotalChanges,
    clearChanges,
    getSubjectMaxTotal
  } = useGradeEditing(
    grades,
    students,
    subjects,
    selectedSubject,
    selectedSemester,
    academicYear,
    notifyTeacher,
    setMessage,
    gradingConfig
  );

  // ====== ✅ جلب توزيع العلامات ======
  useEffect(() => {
    const fetchGradingConfig = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'schoolSettings', 'settings'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.gradingConfig) {
            setGradingConfig(data.gradingConfig);
            console.log('✅ تم جلب توزيع العلامات:', data.gradingConfig);
          }
        }
      } catch (error) {
        console.error('❌ خطأ في جلب توزيع العلامات:', error);
      }
    };
    fetchGradingConfig();
  }, []);

  // ====== جلب البيانات ======
  useEffect(() => {
    const unsubGrades = onSnapshot(collection(db, 'grades'), (snapshot) => {
      const gradeList = [];
      snapshot.forEach(doc => {
        gradeList.push({ id: doc.id, ...doc.data() });
      });
      setGrades(gradeList);
      setLoading(false);
    });

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

    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      const subjectList = [];
      snapshot.forEach(doc => {
        subjectList.push({ id: doc.id, ...doc.data() });
      });
      setSubjects(subjectList);
    });

    return () => {
      unsubGrades();
      unsubStudents();
      unsubClasses();
      unsubSubjects();
    };
  }, []);

  // ====== فلترة وترتيب الطلاب ======
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedClass && student.classId !== selectedClass) return false;
      if (searchQuery && !student.fullName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [students, selectedClass, searchQuery]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => 
      a.fullName.localeCompare(b.fullName)
    );
  }, [filteredStudents]);

  // ====== دوال مساعدة ======
  const getClassName = useCallback((classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || 'غير محدد';
  }, [classes]);

  const getSubjectName = useCallback((id) => {
    const subject = subjects.find(s => s.id === id);
    return subject?.name || 'غير محدد';
  }, [subjects]);

  // ====== معالج لوحة المفاتيح ======
  const handleKeyDown = useCallback((e, studentId, field) => {
    const studentIndex = sortedStudents.findIndex(s => s.id === studentId);
    const fieldIndex = GRADE_FIELDS.findIndex(f => f.key === field);
    
    const saveCurrentValue = () => {
      if (editingValue !== '') {
        updateTempGrade(studentId, field, editingValue);
      }
    };

    const isSemesterClosed = selectedSemester === 1 ? isSemester1Closed : isSemester2Closed;
    if (isSemesterClosed) {
      setMessage({ type: 'error', text: '⚠️ الفصل الدراسي مغلق' });
      return;
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        saveCurrentValue();
        setEditingCell(null);
        setEditingValue('');
        if (fieldIndex < GRADE_FIELDS.length - 1) {
          const nextField = GRADE_FIELDS[fieldIndex + 1].key;
          setTimeout(() => navigateToCell(studentId, nextField), 50);
        } else if (studentIndex < sortedStudents.length - 1) {
          const nextStudent = sortedStudents[studentIndex + 1];
          const firstField = GRADE_FIELDS[0].key;
          setTimeout(() => navigateToCell(nextStudent.id, firstField), 50);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        const key = `${studentId}_${field}`;
        const newTemp = { ...tempGrades };
        delete newTemp[key];
        setTempGrades(newTemp);
        setEditingCell(null);
        setEditingValue('');
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        saveCurrentValue();
        setEditingCell(null);
        setEditingValue('');
        if (studentIndex < sortedStudents.length - 1) {
          const nextStudent = sortedStudents[studentIndex + 1];
          setTimeout(() => navigateToCell(nextStudent.id, field), 50);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        saveCurrentValue();
        setEditingCell(null);
        setEditingValue('');
        if (studentIndex > 0) {
          const prevStudent = sortedStudents[studentIndex - 1];
          setTimeout(() => navigateToCell(prevStudent.id, field), 50);
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        saveCurrentValue();
        setEditingCell(null);
        setEditingValue('');
        if (fieldIndex > 0) {
          const prevField = GRADE_FIELDS[fieldIndex - 1].key;
          setTimeout(() => navigateToCell(studentId, prevField), 50);
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        saveCurrentValue();
        setEditingCell(null);
        setEditingValue('');
        if (fieldIndex < GRADE_FIELDS.length - 1) {
          const nextField = GRADE_FIELDS[fieldIndex + 1].key;
          setTimeout(() => navigateToCell(studentId, nextField), 50);
        }
        break;
    }
  }, [sortedStudents, tempGrades, editingValue, isSemester1Closed, isSemester2Closed, selectedSemester]);

  // ====== التنقل بين الخلايا ======
  const navigateToCell = useCallback((studentId, field) => {
    const value = getFieldValue(studentId, field);
    setEditingCell({ studentId, field });
    setEditingValue(String(value));
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  }, [getFieldValue]);

  // ====== إلغاء التعديل ======
  const handleBlur = useCallback(() => {
    if (editingValue !== '') {
      updateTempGrade(editingCell?.studentId, editingCell?.field, editingValue);
    }
    setEditingCell(null);
    setEditingValue('');
  }, [editingValue, editingCell, updateTempGrade]);

  // ====== تحديث البيانات ======
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setMessage({ type: 'info', text: '🔄 جاري تحديث البيانات...' });
    
    setTimeout(() => {
      setMessage({ type: 'success', text: '✅ تم تحديث البيانات بنجاح!' });
      setRefreshing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }, 500);
  }, []);

  // ====== طباعة الكشف ======
  const handlePrint = useCallback(() => {
    if (!selectedSubject) {
      setMessage({ type: 'error', text: '❌ الرجاء اختيار المادة أولاً' });
      return;
    }
    
    if (!selectedClass) {
      setMessage({ type: 'error', text: '❌ الرجاء اختيار الصف أولاً' });
      return;
    }
    
    const classData = classes.find(c => c.id === selectedClass);
    const subjectData = subjects.find(s => s.id === selectedSubject);
    const studentsList = students.filter(s => s.classId === selectedClass);
    
    if (studentsList.length === 0) {
      setMessage({ type: 'error', text: '❌ لا يوجد طلاب في هذا الصف' });
      return;
    }
    
    printGradeSheet(
      classData,
      studentsList,
      grades,
      subjectData,
      selectedSemester,
      academicYear,
      gradingConfig  // ✅ تمرير gradingConfig للطباعة
    );
  }, [selectedSubject, selectedClass, classes, subjects, students, grades, selectedSemester, academicYear, gradingConfig]);

  // ====== معالجات النوافذ المنبثقة ======
  const handleStartYear = useCallback(async (year, password) => {
    await startAcademicYear(year, password);
    setShowYearModal(false);
    setMessage({ type: 'success', text: `✅ تم بدء العام الدراسي ${year} بنجاح!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, [startAcademicYear]);

  const handleOpenSemester = useCallback(async (semester, password) => {
    await openSemester(semester, password);
    setShowConfirmModal(false);
    setConfirmAction(null);
    setMessage({ type: 'success', text: `✅ تم فتح الفصل ${semester === 1 ? 'الأول' : 'الثاني'} بنجاح!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, [openSemester]);

  const handleCloseSemester = useCallback(async (semester, password) => {
    await closeSemester(semester, password);
    setShowConfirmModal(false);
    setConfirmAction(null);
    setMessage({ type: 'success', text: `✅ تم إغلاق الفصل ${semester === 1 ? 'الأول' : 'الثاني'} بنجاح!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, [closeSemester]);

  const handleCloseYear = useCallback(async (password) => {
    await closeAcademicYear(password);
    setShowConfirmModal(false);
    setConfirmAction(null);
    setMessage({ type: 'success', text: `✅ تم إغلاق العام الدراسي ${academicYear} بنجاح!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, [closeAcademicYear, academicYear]);

  // ====== حالة الإغلاق ======
  const isSemesterClosed = selectedSemester === 1 ? isSemester1Closed : isSemester2Closed;

  // ====== الحصول على المجموع الكلي للمادة المحددة ======
  const currentMaxTotal = useMemo(() => {
    return getTotalMaxForSubject(selectedSubject, gradingConfig);
  }, [selectedSubject, gradingConfig]);

  // ====== عرض التحميل ======
  if (loading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== النوافذ المنبثقة ====== */}
      {showYearModal && (
        <YearModal
          onStartYear={handleStartYear}
          onCancel={() => setShowYearModal(false)}
        />
      )}
      
      {showConfirmModal && (
        <ConfirmModal
          action={confirmAction}
          academicYear={academicYear}
          onConfirm={async (password) => {
            if (confirmAction === 'close_semester1') {
              await handleCloseSemester(1, password);
            } else if (confirmAction === 'close_semester2') {
              await handleCloseSemester(2, password);
            } else if (confirmAction === 'open_semester1') {
              await handleOpenSemester(1, password);
            } else if (confirmAction === 'open_semester2') {
              await handleOpenSemester(2, password);
            } else if (confirmAction === 'close_year') {
              await handleCloseYear(password);
            }
          }}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
        />
      )}

      {/* ====== العنوان مع أزرار الإدارة ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            إدارة العلامات
            <span className="text-[10px] font-normal bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Keyboard className="w-3 h-3" />
              ⌨️ تنقل بالأسهم
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            العام الدراسي: <span className="text-white font-bold">{academicYear}</span>
            {isYearClosed && <span className="text-rose-400 mr-2">🔒 مغلق</span>}
            {!isYearActive && !isYearClosed && <span className="text-amber-400 mr-2">⏳ لم يبدأ</span>}
            {selectedSubject && (
              <span className="text-emerald-400 mr-2">📊 المجموع الكلي: {currentMaxTotal} علامة</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* زر بدء العام الدراسي */}
          {!isYearActive && (
            <button
              onClick={() => setShowYearModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 animate-pulse"
            >
              <Play className="w-3.5 h-3.5" />
              بدء العام الدراسي
            </button>
          )}

          {/* حالة الفصل الدراسي */}
          {isYearActive && (
            <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${
              isSemesterClosed 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isSemesterClosed ? '🔒 مغلق' : '✅ مفتوح'}
              <span className="mr-1 text-slate-400 font-normal">(الفصل {selectedSemester})</span>
            </span>
          )}

          {/* عدد التغييرات */}
          {getTotalChanges() > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/30">
              {getTotalChanges()} تعديلات معلقة
            </span>
          )}

          {/* زر حفظ الكل */}
          <button
            onClick={() => saveAllGrades(isSemesterClosed)}
            disabled={saving || getTotalChanges() === 0 || isSemesterClosed}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <SaveAll className="w-3.5 h-3.5" />
            )}
            {saving ? 'جاري الحفظ...' : 'حفظ الكل'}
          </button>

          {/* زر إشعار المعلم */}
          <button
            onClick={() => setNotifyTeacher(!notifyTeacher)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              notifyTeacher 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {notifyTeacher ? 'إشعار مفعل' : 'إشعار معطل'}
          </button>

          {/* زر الطباعة */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
            disabled={!selectedClass || !selectedSubject}
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة
          </button>

          {/* زر التحديث */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </div>
      </div>

      {/* ====== عرض الرسائل ====== */}
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

      {/* ====== أدوات الفلترة ====== */}
      <GradeFilters
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        selectedSemester={selectedSemester}
        setSelectedSemester={setSelectedSemester}
        academicYear={academicYear}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        classes={classes}
        subjects={subjects}
        isYearActive={isYearActive}
        isYearClosed={isYearClosed}
      />

      {/* ====== تعليمات ====== */}
      <div className="mb-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
        <div className="flex items-center gap-4 flex-wrap text-xs text-blue-400">
          <span className="font-bold">⌨️ اختصارات لوحة المفاتيح:</span>
          <span>⬆️ ⬇️ التنقل بين الطلاب (نفس العمود)</span>
          <span>⬅️ ➡️ التنقل بين العلامات (نفس الطالب)</span>
          <span>⏎ Enter حفظ والانتقال للخلية التالية</span>
          <span>⎋ Esc إلغاء التعديل</span>
          <span className="text-amber-400">* العلامات المعدلة تظهر باللون البرتقالي</span>
          {isSemesterClosed && (
            <span className="text-rose-400">⚠️ الفصل {selectedSemester} مغلق - لا يمكن التعديل</span>
          )}
          {selectedSubject && (
            <span className="text-emerald-400">📊 المجموع الكلي للمادة: {currentMaxTotal} علامة</span>
          )}
        </div>
      </div>

      {/* ====== جدول العلامات ====== */}
      {selectedSubject ? (
        <GradeTable
          students={sortedStudents}
          getFieldValue={getFieldValue}
          startEdit={startEdit}
          updateTempGrade={updateTempGrade}
          editingCell={editingCell}
          editingValue={editingValue}
          setEditingValue={setEditingValue}
          inputRef={inputRef}
          handleKeyDown={handleKeyDown}
          handleBlur={handleBlur}
          isSemesterClosed={isSemesterClosed}
          tempGrades={tempGrades}
          selectedSubject={selectedSubject}
          gradingConfig={gradingConfig}
        />
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">الرجاء اختيار مادة لعرض العلامات</p>
        </div>
      )}

      {/* ====== أزرار إدارة الفصل والعام الدراسي ====== */}
      {isYearActive && (
        <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                إدارة العام الدراسي
              </h4>
              <p className="text-[10px] text-slate-500">
                العام: <span className="text-white font-bold">{academicYear}</span> | 
                الحالة: {isYearClosed ? '🔒 مغلق' : '✅ نشط'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              
              {/* زر إغلاق الفصل الأول */}
              {selectedSemester === 1 && !isSemester1Closed && (
                <button
                  onClick={() => { setConfirmAction('close_semester1'); setShowConfirmModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  إغلاق الفصل الأول
                </button>
              )}
              
              {/* زر إغلاق الفصل الثاني */}
              {selectedSemester === 2 && !isSemester2Closed && (
                <button
                  onClick={() => { setConfirmAction('close_semester2'); setShowConfirmModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  إغلاق الفصل الثاني
                </button>
              )}

              {/* زر فتح الفصل الأول */}
              {selectedSemester === 1 && isSemester1Closed && (
                <button
                  onClick={() => { setConfirmAction('open_semester1'); setShowConfirmModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  فتح الفصل الأول
                </button>
              )}

              {/* زر فتح الفصل الثاني */}
              {selectedSemester === 2 && isSemester2Closed && (
                <button
                  onClick={() => { setConfirmAction('open_semester2'); setShowConfirmModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  فتح الفصل الثاني
                </button>
              )}
              
              {/* زر إغلاق العام الدراسي */}
              {!isYearClosed && isSemester1Closed && isSemester2Closed && (
                <button
                  onClick={() => { setConfirmAction('close_year'); setShowConfirmModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 animate-pulse"
                >
                  <Flag className="w-3.5 h-3.5" />
                  إغلاق العام الدراسي
                </button>
              )}
            </div>
          </div>
          
          {/* عرض حالة الفصول */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">الفصل الأول:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                isSemester1Closed 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isSemester1Closed ? '🔒 مغلق' : '✅ مفتوح'}
              </span>
              {selectedSemester === 1 && (
                <span className="text-[10px] text-blue-400 font-bold">(مختار)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">الفصل الثاني:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                isSemester2Closed 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isSemester2Closed ? '🔒 مغلق' : '✅ مفتوح'}
              </span>
              {selectedSemester === 2 && (
                <span className="text-[10px] text-blue-400 font-bold">(مختار)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">العام الدراسي:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                isYearClosed 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isYearClosed ? '🔒 مغلق' : '✅ نشط'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ====== ملخص العلامات ====== */}
      <GradeSummary
        students={sortedStudents}
        grades={grades}
        selectedSubject={selectedSubject}
        selectedSemester={selectedSemester}
        gradingConfig={gradingConfig}
      />
    </div>
  );
}