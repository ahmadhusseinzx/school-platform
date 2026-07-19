// src/components/admin/BehaviorManager.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDocs, query, where, onSnapshot 
} from 'firebase/firestore';
import { 
  Award, Users, School, Loader2, 
  CheckCircle, AlertCircle, Filter, Search,
  ChevronDown, ChevronUp, Eye, Calendar,
  UserCog, FileText, Star
} from 'lucide-react';

// ============ معايير السلوك ============
const BEHAVIOR_CRITERIA = [
  { id: 'respect', label: 'احترام النظام', icon: '👔' },
  { id: 'cleanliness', label: 'النظافة والترتيب', icon: '🧹' },
  { id: 'cooperation', label: 'التعاون مع الآخرين', icon: '🤝' },
  { id: 'responsibility', label: 'التحمل والمسؤولية', icon: '📋' },
  { id: 'initiative', label: 'المبادرة والإيجابية', icon: '🚀' },
];

const RATING_OPTIONS = [
  { value: 'excellent', label: 'ممتاز', color: 'text-emerald-400 bg-emerald-500/10', score: 5 },
  { value: 'good', label: 'جيد جداً', color: 'text-blue-400 bg-blue-500/10', score: 4 },
  { value: 'satisfactory', label: 'جيد', color: 'text-amber-400 bg-amber-500/10', score: 3 },
  { value: 'needs_improvement', label: 'بحاجة لتحسين', color: 'text-orange-400 bg-orange-500/10', score: 2 },
  { value: 'poor', label: 'ضعيف', color: 'text-rose-400 bg-rose-500/10', score: 1 },
];

export default function BehaviorManager() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [behaviors, setBehaviors] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
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

    const unsubBehaviors = onSnapshot(collection(db, 'behaviors'), (snapshot) => {
      const behaviorList = [];
      snapshot.forEach(doc => {
        behaviorList.push({ id: doc.id, ...doc.data() });
      });
      setBehaviors(behaviorList);
      setLoading(false);
    });

    return () => {
      unsubStudents();
      unsubClasses();
      unsubBehaviors();
    };
  }, []);

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

  // ============ حساب متوسط التقييم ============
  const getAverageRating = (behavior) => {
    if (!behavior || !behavior.criteria) return 'لا يوجد';
    const ratings = {
      excellent: 5,
      good: 4,
      satisfactory: 3,
      needs_improvement: 2,
      poor: 1
    };
    const values = Object.values(behavior.criteria);
    if (values.length === 0) return 'لا يوجد';
    const total = values.reduce((sum, r) => sum + (ratings[r] || 3), 0);
    const avg = total / values.length;
    
    if (avg >= 4.5) return { label: 'ممتاز', color: 'text-emerald-400 bg-emerald-500/10' };
    if (avg >= 3.5) return { label: 'جيد جداً', color: 'text-blue-400 bg-blue-500/10' };
    if (avg >= 2.5) return { label: 'جيد', color: 'text-amber-400 bg-amber-500/10' };
    if (avg >= 1.5) return { label: 'بحاجة لتحسين', color: 'text-orange-400 bg-orange-500/10' };
    return { label: 'ضعيف', color: 'text-rose-400 bg-rose-500/10' };
  };

  // ============ الحصول على تقييمات الفصل ============
  const getSemesterBehaviors = () => {
    return behaviors.filter(b => {
      if (b.semester !== selectedSemester) return false;
      if (selectedAcademicYear && b.academicYear !== selectedAcademicYear) return false;
      if (selectedClass && b.classId !== selectedClass) return false;
      if (selectedStudent && b.studentId !== selectedStudent) return false;
      return true;
    });
  };

  const filteredBehaviors = getSemesterBehaviors();

  // ============ ترتيب النتائج ============
  const sortedBehaviors = [...filteredBehaviors].sort((a, b) => {
    const nameA = getStudentName(a.studentId);
    const nameB = getStudentName(b.studentId);
    return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
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
            <Award className="w-5 h-5 text-amber-400" />
            تقييم السلوك
          </h2>
          <p className="text-xs text-slate-400">عرض تقييمات سلوك الطلاب (للاطلاع فقط)</p>
        </div>
        <span className="text-xs text-slate-400">👁️ عرض فقط</span>
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

      {/* ====== أدوات التصفية ====== */}
      <div className="flex flex-wrap gap-3 mb-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
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
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
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
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value={1}>الفصل الأول</option>
            <option value={2}>الفصل الثاني</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            placeholder="العام الدراسي"
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 w-32"
          />
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm hover:bg-slate-700 transition-all"
        >
          {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          ترتيب
        </button>
      </div>

      {/* ====== إحصائيات ====== */}
      {filteredBehaviors.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
            <p className="text-xs text-slate-400">عدد الطلاب</p>
            <p className="text-lg font-bold text-white">{filteredBehaviors.length}</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
            <p className="text-xs text-slate-400">المتوسط العام</p>
            <p className="text-lg font-bold text-amber-400">
              {(filteredBehaviors.reduce((sum, b) => {
                const avg = getAverageRating(b);
                const scores = { 'ممتاز': 5, 'جيد جداً': 4, 'جيد': 3, 'بحاجة لتحسين': 2, 'ضعيف': 1 };
                return sum + (scores[avg.label] || 0);
              }, 0) / filteredBehaviors.length || 0).toFixed(1)}
            </p>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
            <p className="text-xs text-slate-400">أعلى تقييم</p>
            <p className="text-lg font-bold text-emerald-400">
              {Math.max(...filteredBehaviors.map(b => {
                const avg = getAverageRating(b);
                const scores = { 'ممتاز': 5, 'جيد جداً': 4, 'جيد': 3, 'بحاجة لتحسين': 2, 'ضعيف': 1 };
                return scores[avg.label] || 0;
              }), 0)}
            </p>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
            <p className="text-xs text-slate-400">أدنى تقييم</p>
            <p className="text-lg font-bold text-rose-400">
              {Math.min(...filteredBehaviors.map(b => {
                const avg = getAverageRating(b);
                const scores = { 'ممتاز': 5, 'جيد جداً': 4, 'جيد': 3, 'بحاجة لتحسين': 2, 'ضعيف': 1 };
                return scores[avg.label] || 0;
              }), 0)}
            </p>
          </div>
        </div>
      )}

      {/* ====== قائمة التقييمات ====== */}
      <div className="space-y-4">
        {sortedBehaviors.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">لا توجد تقييمات سلوك للفصل المحدد</p>
          </div>
        ) : (
          sortedBehaviors.map((behavior) => {
            const studentName = getStudentName(behavior.studentId);
            const className = getClassName(behavior.classId);
            const avgRating = getAverageRating(behavior);

            return (
              <div key={behavior.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{studentName}</h4>
                    <p className="text-xs text-slate-400">🏫 {className} | 📅 الفصل {behavior.semester}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${avgRating.color}`}>
                      <Star className="w-3 h-3 inline mr-1" />
                      {avgRating.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {BEHAVIOR_CRITERIA.map(criteria => {
                    const rating = behavior.criteria?.[criteria.id] || 'satisfactory';
                    const ratingObj = RATING_OPTIONS.find(o => o.value === rating);
                    return (
                      <div key={criteria.id} className={`p-2 rounded-lg text-center ${ratingObj?.color || 'bg-slate-800'}`}>
                        <div className="text-lg">{criteria.icon}</div>
                        <div className="text-[10px] text-slate-400 truncate">{criteria.label}</div>
                        <div className="text-xs font-bold text-white">{ratingObj?.label || 'جيد'}</div>
                      </div>
                    );
                  })}
                </div>

                {behavior.notes && (
                  <p className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-2">
                    📝 {behavior.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}