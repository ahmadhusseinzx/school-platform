// src/components/admin/GradesViewer.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot 
} from 'firebase/firestore';
import { 
  FileText, Search, Loader2, Users, School, BookOpen, 
  Printer, Calendar, Filter, RefreshCw, Eye, ChevronDown,
  AlertCircle, CheckCircle  // ✅ أضف هذين المكونين هنا
} from 'lucide-react';

// ============ دوال مساعدة ============
const calculateTotal = (grades) => {
  const {
    dailyExam1 = 0,
    participation1 = 0,
    midtermExam = 0,
    dailyExam2 = 0,
    participation2 = 0,
    finalExam = 0
  } = grades;
  
  return dailyExam1 + participation1 + midtermExam + 
         dailyExam2 + participation2 + finalExam;
};

const getGrade = (percentage) => {
  if (percentage >= 90) return { label: 'ممتاز', key: 'A', color: 'text-emerald-400 bg-emerald-500/10' };
  if (percentage >= 80) return { label: 'جيد جداً', key: 'B', color: 'text-blue-400 bg-blue-500/10' };
  if (percentage >= 70) return { label: 'جيد', key: 'C', color: 'text-amber-400 bg-amber-500/10' };
  if (percentage >= 60) return { label: 'مقبول', key: 'D', color: 'text-orange-400 bg-orange-500/10' };
  return { label: 'ضعيف', key: 'F', color: 'text-rose-400 bg-rose-500/10' };
};

const GRADE_FIELDS = [
  { key: 'dailyExam1', label: 'امتحان يومي 1', max: 10, color: 'blue-400' },
  { key: 'participation1', label: 'مشاركة 1', max: 10, color: 'emerald-400' },
  { key: 'midtermExam', label: 'امتحان شهري', max: 20, color: 'amber-400' },
  { key: 'dailyExam2', label: 'امتحان يومي 2', max: 10, color: 'purple-400' },
  { key: 'participation2', label: 'مشاركة 2', max: 10, color: 'rose-400' },
  { key: 'finalExam', label: 'امتحان فصلي', max: 40, color: 'orange-400' }
];

// ============ دالة طباعة الكشف ============
const printGradeSheet = (classData, studentsData, gradesData, subjectData, semesterData, academicYearData) => {
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) return;
  
  const rows = studentsData.map(student => {
    const grade = gradesData.find(g => 
      g.studentId === student.id && 
      g.subjectId === subjectData?.id && 
      g.semester === semesterData &&
      g.academicYear === academicYearData
    );
    
    const fields = {
      dailyExam1: grade?.dailyExam1 || 0,
      participation1: grade?.participation1 || 0,
      midtermExam: grade?.midtermExam || 0,
      dailyExam2: grade?.dailyExam2 || 0,
      participation2: grade?.participation2 || 0,
      finalExam: grade?.finalExam || 0
    };
    const total = calculateTotal(fields);
    const percentage = (total / 100) * 100;
    const gradeInfo = getGrade(percentage);
    
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${student.fullName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.dailyExam1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.participation1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.midtermExam}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.dailyExam2}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.participation2}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.finalExam}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #2e7d32;">${total}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          <span style="padding: 2px 8px; border-radius: 12px; background: ${percentage >= 90 ? '#e8f5e9' : percentage >= 80 ? '#e3f2fd' : percentage >= 70 ? '#fff3e0' : percentage >= 60 ? '#fff8e1' : '#ffebee'}; color: ${percentage >= 90 ? '#2e7d32' : percentage >= 80 ? '#1565c0' : percentage >= 70 ? '#e65100' : percentage >= 60 ? '#f57f17' : '#c62828'};">
            ${gradeInfo.label}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const semesterLabel = semesterData === 1 ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني';
  const className = classData?.name || 'غير محدد';
  const subjectName = subjectData?.name || 'غير محدد';
  const schoolName = 'مدرستك الثانوية';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <title>كشف العلامات - ${className}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #fff; margin: 0; }
          .container { max-width: 1100px; margin: 0 auto; direction: rtl; }
          .header { text-align: center; border-bottom: 3px solid #1a237e; padding-bottom: 15px; margin-bottom: 20px; }
          .school-name { font-size: 24px; font-weight: bold; color: #1a237e; }
          .title { font-size: 20px; font-weight: bold; margin: 10px 0; color: #1a237e; }
          .info { text-align: center; color: #555; font-size: 14px; margin-bottom: 15px; }
          .info span { margin: 0 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
          th { background: #1a237e; color: white; padding: 10px 8px; border: 1px solid #1a237e; text-align: center; font-weight: bold; }
          td { padding: 8px; border: 1px solid #ddd; text-align: center; }
          tr:nth-child(even) { background: #f8f9fa; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #1a237e; font-size: 12px; color: #888; }
          .sub-title { font-size: 14px; font-weight: bold; color: #1a237e; margin: 5px 0; }
          @media print { body { padding: 10px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="school-name">${schoolName}</div>
            <div class="title">كشف العلامات</div>
            <div class="sub-title">الصف: ${className}</div>
            <div class="info">
              <span>📚 المادة: ${subjectName}</span>
              <span>📅 الفصل: ${semesterLabel}</span>
              <span>📆 العام الدراسي: ${academicYearData}</span>
              <span>👨‍🎓 عدد الطلاب: ${studentsData.length}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>امتحان يومي 1<br><span style="font-size:10px;font-weight:normal;">(10)</span></th>
                <th>مشاركة 1<br><span style="font-size:10px;font-weight:normal;">(10)</span></th>
                <th>امتحان شهري<br><span style="font-size:10px;font-weight:normal;">(20)</span></th>
                <th>امتحان يومي 2<br><span style="font-size:10px;font-weight:normal;">(10)</span></th>
                <th>مشاركة 2<br><span style="font-size:10px;font-weight:normal;">(10)</span></th>
                <th>امتحان فصلي<br><span style="font-size:10px;font-weight:normal;">(40)</span></th>
                <th>المجموع<br><span style="font-size:10px;font-weight:normal;">(100)</span></th>
                <th>التقدير</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; display: flex; justify-content: space-around; flex-wrap: wrap;">
            <div><strong>عدد الطلاب:</strong> ${studentsData.length}</div>
            <div><strong>المعدل العام:</strong> ${studentsData.length > 0 ? (studentsData.reduce((sum, s) => {
              const grade = gradesData.find(g => g.studentId === s.id && g.subjectId === subjectData?.id && g.semester === semesterData && g.academicYear === academicYearData);
              return sum + (grade ? calculateTotal(grade) : 0);
            }, 0) / studentsData.length).toFixed(1) : 0}</div>
          </div>
          <div class="footer">
            تم إنشاء هذا التقرير بواسطة المنصة التعليمية الذكية<br>
            تاريخ الطباعة: ${new Date().toLocaleDateString('ar')}
          </div>
          <div style="text-align: center; margin-top: 20px;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 30px; background: #1a237e; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
              🖨️ طباعة الكشف
            </button>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export default function GradesViewer() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // ====== خيارات الفلترة ======
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [academicYear, setAcademicYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // ====== قائمة السنوات الدراسية ======
  const [availableYears, setAvailableYears] = useState([]);
  const [schoolSettings, setSchoolSettings] = useState(null);

  // ============ جلب إعدادات المدرسة والسنوات المتاحة ============
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const q = query(collection(db, 'schoolSettings'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setSchoolSettings({ id: doc.id, ...doc.data() });
          
          const history = doc.data().history || [];
          const years = history
            .filter(h => h.action === 'start_academic_year')
            .map(h => h.academicYear);
          
          const currentYear = doc.data().academicYear?.current;
          if (currentYear && !years.includes(currentYear)) {
            years.push(currentYear);
          }
          
          if (years.length === 0) {
            const current = new Date().getFullYear();
            years.push(`${current}-${current + 1}`);
            years.push(`${current - 1}-${current}`);
            years.push(`${current - 2}-${current - 1}`);
          }
          
          setAvailableYears([...new Set(years)].sort().reverse());
          
          if (doc.data().academicYear?.current) {
            setAcademicYear(doc.data().academicYear.current);
          }
        } else {
          const current = new Date().getFullYear();
          setAvailableYears([`${current}-${current + 1}`, `${current - 1}-${current}`, `${current - 2}-${current - 1}`]);
          setAcademicYear(`${current}-${current + 1}`);
        }
      } catch (error) {
        console.error('❌ خطأ في جلب إعدادات المدرسة:', error);
      }
    };
    fetchSettings();
  }, []);

  // ============ جلب البيانات ============
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

  // ============ ✅ إصلاح زر التحديث ============
  const handleRefresh = () => {
    setRefreshing(true);
    setMessage({ type: 'info', text: '🔄 جاري تحديث البيانات...' });
    
    // البيانات يتم تحديثها تلقائياً عبر onSnapshot
    // فقط نعرض رسالة نجاح
    setTimeout(() => {
      setMessage({ type: 'success', text: '✅ تم تحديث البيانات بنجاح!' });
      setRefreshing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }, 500);
  };

  // ============ الحصول على العلامات ============
  const getStudentGrade = (studentId) => {
    const grade = grades.find(g => 
      g.studentId === studentId && 
      g.subjectId === selectedSubject && 
      g.semester === selectedSemester &&
      g.academicYear === academicYear
    );
    return grade || null;
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || 'غير محدد';
  };

  const getSubjectName = (id) => {
    const subject = subjects.find(s => s.id === id);
    return subject?.name || 'غير محدد';
  };

  // ============ فلترة الطلاب ============
  const filteredStudents = students.filter(student => {
    if (selectedClass && student.classId !== selectedClass) return false;
    if (searchQuery && !student.fullName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => 
    a.fullName.localeCompare(b.fullName)
  );

  // ============ طباعة الكشف ============
  const handlePrint = () => {
    if (!selectedSubject) {
      alert('❌ الرجاء اختيار المادة أولاً');
      return;
    }
    
    if (!selectedClass) {
      alert('❌ الرجاء اختيار الصف أولاً');
      return;
    }
    
    const classData = classes.find(c => c.id === selectedClass);
    const subjectData = subjects.find(s => s.id === selectedSubject);
    const studentsList = students.filter(s => s.classId === selectedClass);
    
    if (studentsList.length === 0) {
      alert('❌ لا يوجد طلاب في هذا الصف');
      return;
    }
    
    printGradeSheet(
      classData,
      studentsList,
      grades,
      subjectData,
      selectedSemester,
      academicYear
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل العلامات...</p>
      </div>
    );
  }

  const isSemester1Closed = schoolSettings?.semesters?.semester1?.status === 'closed';
  const isSemester2Closed = schoolSettings?.semesters?.semester2?.status === 'closed';

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            عرض العلامات
          </h2>
          <p className="text-xs text-slate-400">
            عرض علامات الطلاب - للاطلاع فقط (بدون تعديل)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
            disabled={!selectedClass || !selectedSubject}
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة
          </button>
          
          {/* ====== ✅ زر التحديث المُصلح ====== */}
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
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-400 mb-1">الصف</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">جميع الصفوف</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-400 mb-1">المادة *</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">جميع المواد</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[120px]">
          <label className="block text-xs text-slate-400 mb-1">الفصل</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value={1}>الفصل الأول</option>
            <option value={2}>الفصل الثاني</option>
          </select>
        </div>

        {/* ====== حقل العام الدراسي - مفتوح للتغيير ====== */}
        <div className="min-w-[150px]">
          <label className="block text-xs text-slate-400 mb-1">العام الدراسي</label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <p className="text-[9px] text-slate-500 mt-1">🔓 يمكن اختيار أي عام</p>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-slate-400 mb-1">بحث</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن طالب..."
              className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ====== حالة الفصل الدراسي ====== */}
      <div className="mb-4 p-3 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-slate-400">حالة الفصل:</span>
          <span className={`px-2 py-0.5 rounded-full ${selectedSemester === 1 ? (isSemester1Closed ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400') : (isSemester2Closed ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400')}`}>
            الفصل {selectedSemester}: {selectedSemester === 1 ? (isSemester1Closed ? '🔒 مغلق' : '✅ مفتوح') : (isSemester2Closed ? '🔒 مغلق' : '✅ مفتوح')}
          </span>
          <span className="text-slate-500">| عرض فقط - لا يمكن التعديل</span>
          <span className="text-slate-500">| العام: <span className="text-white font-bold">{academicYear}</span></span>
        </div>
      </div>

      {/* ====== جدول العلامات ====== */}
      {selectedSubject ? (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700">
                <th className="p-3 text-center font-bold text-slate-300 sticky right-0 bg-slate-900 min-w-[120px]">
                  اسم الطالب
                </th>
                {GRADE_FIELDS.map(field => (
                  <th key={field.key} className={`p-3 text-center font-bold text-${field.color} min-w-[80px]`}>
                    <div>{field.label}</div>
                    <div className="text-[9px] text-slate-500">({field.max})</div>
                  </th>
                ))}
                <th className="p-3 text-center font-bold text-emerald-400 min-w-[80px]">
                  <div>المجموع</div>
                  <div className="text-[9px] text-slate-500">(100)</div>
                </th>
                <th className="p-3 text-center font-bold text-slate-400 min-w-[80px]">
                  التقدير
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-400">
                    لا يوجد طلاب في هذا الصف
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student) => {
                  const grade = getStudentGrade(student.id);
                  const fields = {
                    dailyExam1: grade?.dailyExam1 || 0,
                    participation1: grade?.participation1 || 0,
                    midtermExam: grade?.midtermExam || 0,
                    dailyExam2: grade?.dailyExam2 || 0,
                    participation2: grade?.participation2 || 0,
                    finalExam: grade?.finalExam || 0
                  };
                  const total = calculateTotal(fields);
                  const percentage = (total / 100) * 100;
                  const gradeInfo = getGrade(percentage);

                  return (
                    <tr key={student.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-all">
                      <td className="p-3 font-bold text-white sticky right-0 bg-slate-800/50 min-w-[120px]">
                        {student.fullName}
                      </td>
                      {GRADE_FIELDS.map(field => (
                        <td key={field.key} className="p-2 text-center text-white">
                          {fields[field.key]}
                        </td>
                      ))}
                      <td className="p-3 text-center font-bold text-emerald-400">
                        {total}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${gradeInfo.color}`}>
                          {gradeInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">الرجاء اختيار مادة لعرض العلامات</p>
        </div>
      )}

      {/* ====== ملخص العلامات ====== */}
      {selectedSubject && sortedStudents.length > 0 && (
        <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 mb-3">📊 ملخص العلامات</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400">عدد الطلاب</p>
              <p className="text-lg font-bold text-white">{sortedStudents.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">المعدل العام</p>
              <p className="text-lg font-bold text-emerald-400">
                {sortedStudents.length > 0 
                  ? (sortedStudents.reduce((sum, s) => {
                      const grade = getStudentGrade(s.id);
                      return sum + (grade ? calculateTotal(grade) : 0);
                    }, 0) / sortedStudents.length).toFixed(1)
                  : 0
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">أعلى علامة</p>
              <p className="text-lg font-bold text-emerald-400">
                {sortedStudents.length > 0
                  ? Math.max(...sortedStudents.map(s => {
                      const grade = getStudentGrade(s.id);
                      return grade ? calculateTotal(grade) : 0;
                    }))
                  : 0
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">أدنى علامة</p>
              <p className="text-lg font-bold text-rose-400">
                {sortedStudents.length > 0
                  ? Math.min(...sortedStudents.map(s => {
                      const grade = getStudentGrade(s.id);
                      return grade ? calculateTotal(grade) : 0;
                    }))
                  : 0
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}