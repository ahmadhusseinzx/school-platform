// src/components/admin/AttendanceManager.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, 
  doc, query, where, onSnapshot, writeBatch, getDoc
} from 'firebase/firestore';
import { 
  UserCheck, Users, Calendar, CheckCircle, XCircle, 
  Clock, AlertCircle, Plus, Trash2, BarChart3, 
  TrendingUp, TrendingDown, Filter, Download, 
  Eye, EyeOff, ChevronDown, ChevronUp, RefreshCw,
  UserX, UserMinus, UserPlus, Award, LogOut,
  Zap, Sparkles
} from 'lucide-react';

export default function AttendanceManager() {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    studentId: '',
    status: 'present',
    note: ''
  });
  
  // ====== حالة الإحصائيات ======
  const [showStats, setShowStats] = useState(false);
  const [statsFilter, setStatsFilter] = useState('all');
  const [sortBy, setSortBy] = useState('count');
  const [sortOrder, setSortOrder] = useState('desc');

  // ====== حالة الحضور التلقائي ======
  const [autoAttendance, setAutoAttendance] = useState(true);
  const [autoAttendanceMessage, setAutoAttendanceMessage] = useState('');

  // ============ جلب البيانات ============
  useEffect(() => {
    const unsubscribeAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const attendanceList = [];
      snapshot.forEach(doc => {
        attendanceList.push({ id: doc.id, ...doc.data() });
      });
      setAttendance(attendanceList);
      setLoading(false);
    });

    const unsubscribeStudents = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'student')),
      (snapshot) => {
        const studentList = [];
        snapshot.forEach(doc => {
          studentList.push({ id: doc.id, ...doc.data() });
        });
        setStudents(studentList);
      }
    );

    const unsubscribeClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const classList = [];
      snapshot.forEach(doc => {
        classList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classList);
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeStudents();
      unsubscribeClasses();
    };
  }, []);

  // ============ دوال مساعدة ============
  const getClassName = useCallback((classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || 'غير محدد';
  }, [classes]);

  const getStudentName = useCallback((studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.fullName || 'غير محدد';
  }, [students]);

  const getStudentClass = useCallback((studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.classId || null;
  }, [students]);

  // ============ الحضور التلقائي: حساب الطلاب الحاضرين تلقائياً ============
  const getAutoPresentStudents = useCallback((date) => {
    // الحصول على جميع الطلاب
    const allStudents = students;
    
    // الحصول على سجلات الحضور لهذا اليوم
    const todayAttendance = attendance.filter(a => a.date === date);
    
    // الطلاب الذين تم تسجيلهم (حاضر، غائب، متأخر، مبرر، مغادر)
    const recordedStudentIds = new Set(todayAttendance.map(a => a.studentId));
    
    // الطلاب غير المسجلين يعتبرون حاضرين تلقائياً
    const autoPresent = allStudents.filter(s => !recordedStudentIds.has(s.id));
    
    return autoPresent;
  }, [students, attendance]);

  // ============ الحصول على طلاب اليوم ============
  const getTodayStudents = useCallback((date) => {
    let todayStudents = [];
    let autoPresentStudents = [];
    
    // الطلاب المسجلين في هذا اليوم
    const todayRecords = attendance.filter(a => a.date === date);
    const recordedStudentIds = new Set(todayRecords.map(a => a.studentId));
    
    // الطلاب الحاضرين تلقائياً (غير المسجلين)
    const allStudents = selectedClass 
      ? students.filter(s => s.classId === selectedClass)
      : students;
    
    const autoPresent = allStudents.filter(s => !recordedStudentIds.has(s.id));
    
    // دمج السجلات مع الحضور التلقائي
    const records = todayRecords.map(record => ({
      ...record,
      isAuto: false,
      student: students.find(s => s.id === record.studentId)
    }));
    
    const autoRecords = autoPresent.map(student => ({
      id: `auto_${student.id}`,
      studentId: student.id,
      date: date,
      status: 'present',
      note: '✅ حضور تلقائي (لم يتم تسجيل حالة)',
      isAuto: true,
      student: student,
      createdAt: new Date().toISOString()
    }));
    
    // دمج وترتيب حسب الاسم
    const allRecords = [...records, ...autoRecords];
    allRecords.sort((a, b) => {
      const nameA = a.student?.fullName || '';
      const nameB = b.student?.fullName || '';
      return nameA.localeCompare(nameB);
    });
    
    return allRecords;
  }, [attendance, students, selectedClass]);

  // ============ حساب إحصائيات الطلاب (مع الحضور التلقائي) ============
  const studentStats = useMemo(() => {
    const stats = {};
    
    // تهيئة الإحصائيات لكل طالب
    students.forEach(student => {
      stats[student.id] = {
        studentId: student.id,
        fullName: student.fullName,
        classId: student.classId,
        className: getClassName(student.classId),
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        left: 0,
        autoPresent: 0,
        total: 0,
        attendanceRate: 0
      };
    });

    // حساب الإحصائيات من سجلات الحضور
    attendance.forEach(record => {
      if (stats[record.studentId]) {
        stats[record.studentId].total++;
        switch (record.status) {
          case 'present':
            stats[record.studentId].present++;
            break;
          case 'absent':
            stats[record.studentId].absent++;
            break;
          case 'late':
            stats[record.studentId].late++;
            break;
          case 'excused':
            stats[record.studentId].excused++;
            break;
          case 'left':
            stats[record.studentId].left++;
            break;
          default:
            break;
        }
      }
    });

    // ✅ حساب الحضور التلقائي (الأيام التي لم يتم تسجيل فيها)
    // نأخذ كل يوم دراسي ونحسب الطلاب غير المسجلين
    const dates = [...new Set(attendance.map(a => a.date))];
    dates.forEach(date => {
      const recordedStudents = new Set(
        attendance.filter(a => a.date === date).map(a => a.studentId)
      );
      students.forEach(student => {
        if (!recordedStudents.has(student.id) && stats[student.id]) {
          stats[student.id].autoPresent++;
          stats[student.id].total++;
        }
      });
    });

    // حساب نسبة الحضور
    Object.values(stats).forEach(stat => {
      if (stat.total > 0) {
        stat.attendanceRate = ((stat.present + stat.autoPresent) / stat.total * 100);
      } else {
        stat.attendanceRate = 0;
      }
    });

    return stats;
  }, [students, attendance, getClassName]);

  // ============ فلترة وترتيب الإحصائيات ============
  const filteredStats = useMemo(() => {
    let result = Object.values(studentStats);

    if (selectedClass) {
      result = result.filter(s => s.classId === selectedClass);
    }

    if (statsFilter === 'absent') {
      result = result.filter(s => s.absent > 0);
    } else if (statsFilter === 'late') {
      result = result.filter(s => s.late > 0);
    } else if (statsFilter === 'left') {
      result = result.filter(s => s.left > 0);
    } else if (statsFilter === 'problem') {
      result = result.filter(s => s.absent > 0 || s.late > 0 || s.left > 0);
    }

    result.sort((a, b) => {
      if (sortBy === 'count') {
        const aCount = a.absent + a.late + a.left;
        const bCount = b.absent + b.late + b.left;
        return sortOrder === 'desc' ? bCount - aCount : aCount - bCount;
      } else if (sortBy === 'name') {
        return sortOrder === 'desc' 
          ? b.fullName.localeCompare(a.fullName)
          : a.fullName.localeCompare(b.fullName);
      } else if (sortBy === 'attendance') {
        return sortOrder === 'desc' 
          ? b.attendanceRate - a.attendanceRate
          : a.attendanceRate - b.attendanceRate;
      }
      return 0;
    });

    return result;
  }, [studentStats, selectedClass, statsFilter, sortBy, sortOrder]);

  // ============ إحصائيات عامة ============
  const generalStats = useMemo(() => {
    let totalStudents = students.length;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalLeft = 0;
    let totalAutoPresent = 0;
    let totalRecords = attendance.length;

    Object.values(studentStats).forEach(stat => {
      totalPresent += stat.present;
      totalAbsent += stat.absent;
      totalLate += stat.late;
      totalExcused += stat.excused;
      totalLeft += stat.left;
      totalAutoPresent += stat.autoPresent;
    });

    const problemStudents = Object.values(studentStats).filter(
      s => s.absent > 0 || s.late > 0 || s.left > 0
    ).length;

    return {
      totalStudents,
      totalRecords,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      totalLeft,
      totalAutoPresent,
      problemStudents,
      attendanceRate: totalRecords > 0 
        ? ((totalPresent + totalAutoPresent) / (totalRecords + totalAutoPresent) * 100).toFixed(1)
        : 0
    };
  }, [studentStats, students, attendance]);

  // ============ إضافة سجل حضور ============
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.studentId) return;

    // ✅ التحقق من عدم وجود سجل مكرر لنفس الطالب في نفس اليوم
    const existingRecord = attendance.find(
      a => a.studentId === formData.studentId && a.date === selectedDate
    );

    if (existingRecord) {
      if (!confirm(`⚠️ هذا الطالب لديه سجل حضور في هذا اليوم (${existingRecord.status}). هل تريد تحديث الحالة؟`)) {
        return;
      }
      
      // تحديث السجل الموجود
      try {
        const docRef = doc(db, 'attendance', existingRecord.id);
        await updateDoc(docRef, {
          status: formData.status,
          note: formData.note || existingRecord.note,
          updatedAt: new Date().toISOString()
        });
        alert(`✅ تم تحديث حالة الطالب إلى: ${getStatusLabel(formData.status)}`);
        setFormData({ studentId: '', status: 'present', note: '' });
        return;
      } catch (error) {
        alert('❌ خطأ في تحديث الحضور: ' + error.message);
        return;
      }
    }

    try {
      await addDoc(collection(db, 'attendance'), {
        ...formData,
        date: selectedDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setFormData({ studentId: '', status: 'present', note: '' });
      alert('✅ تم تسجيل الحضور بنجاح!');
    } catch (error) {
      alert('❌ خطأ في تسجيل الحضور: ' + error.message);
    }
  };

  // ============ حذف سجل حضور ============
  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await deleteDoc(doc(db, 'attendance', id));
      alert('✅ تم حذف السجل بنجاح!');
    } catch (error) {
      alert('❌ خطأ في حذف السجل: ' + error.message);
    }
  };

  // ============ تحديث البيانات ============
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  // ============ الحصول على تسمية الحالة ============
  const getStatusLabel = (status) => {
    switch(status) {
      case 'present': return 'حاضر';
      case 'absent': return 'غائب';
      case 'late': return 'متأخر';
      case 'excused': return 'مبرر';
      case 'left': return 'مغادر';
      default: return 'غير محدد';
    }
  };

  // ============ عرض حالة الحضور ============
  const getStatusBadge = (status, isAuto = false) => {
    if (isAuto) {
      return <span className="flex items-center gap-1 text-blue-400"><Zap className="w-3 h-3" /> حضور تلقائي</span>;
    }
    switch(status) {
      case 'present':
        return <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" /> حاضر</span>;
      case 'absent':
        return <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" /> غائب</span>;
      case 'late':
        return <span className="flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3" /> متأخر</span>;
      case 'excused':
        return <span className="flex items-center gap-1 text-blue-400"><AlertCircle className="w-3 h-3" /> مبرر</span>;
      case 'left':
        return <span className="flex items-center gap-1 text-purple-400"><LogOut className="w-3 h-3" /> مغادر</span>;
      default:
        return <span className="text-slate-400">غير محدد</span>;
    }
  };

  // ============ عرض حالة الطالب في الإحصائيات ============
  const getStudentStatusBadge = (stat) => {
    if (stat.absent > 0 && stat.late > 0 && stat.left > 0) {
      return <span className="text-rose-400 font-bold">⚠️ غائب + متأخر + مغادر</span>;
    } else if (stat.absent > 0 && stat.late > 0) {
      return <span className="text-rose-400 font-bold">⚠️ غائب + متأخر</span>;
    } else if (stat.absent > 0) {
      return <span className="text-rose-400 font-bold">❌ غائب</span>;
    } else if (stat.late > 0) {
      return <span className="text-amber-400 font-bold">⏰ متأخر</span>;
    } else if (stat.left > 0) {
      return <span className="text-purple-400 font-bold">🚪 مغادر</span>;
    } else if (stat.total === 0) {
      return <span className="text-slate-500">📋 لا توجد سجلات</span>;
    } else {
      return <span className="text-emerald-400 font-bold">✅ ملتزم</span>;
    }
  };

  // ============ تصدير الإحصائيات ============
  const exportStats = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const rows = filteredStats.map((stat, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${stat.fullName}</td>
        <td>${stat.className}</td>
        <td>${stat.total}</td>
        <td style="color: #22c55e;">${stat.present}</td>
        <td style="color: #60a5fa;">${stat.autoPresent}</td>
        <td style="color: #ef4444;">${stat.absent}</td>
        <td style="color: #facc15;">${stat.late}</td>
        <td style="color: #a855f7;">${stat.left}</td>
        <td style="color: #60a5fa;">${stat.excused}</td>
        <td>${stat.attendanceRate.toFixed(1)}%</td>
        <td>${stat.absent > 0 || stat.late > 0 || stat.left > 0 ? '⚠️' : '✅'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>تقرير الحضور والغياب</title>
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
          <h1>📊 تقرير الحضور والغياب</h1>
          <div class="info">
            تاريخ التصدير: ${new Date().toLocaleDateString('ar')} | عدد الطلاب: ${filteredStats.length}
            ${selectedClass ? `| الصف: ${getClassName(selectedClass)}` : '| جميع الصفوف'}
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الطالب</th>
                <th>الصف</th>
                <th>إجمالي</th>
                <th>حاضر</th>
                <th>حاضر تلقائي</th>
                <th>غائب</th>
                <th>متأخر</th>
                <th>مغادر</th>
                <th>مبرر</th>
                <th>نسبة الحضور</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">تم إنشاء هذا التقرير بواسطة المنصة التعليمية الذكية</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ============ عرض التحميل ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ============ الحصول على طلاب اليوم ============
  const todayStudents = getTodayStudents(selectedDate);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            إدارة الحضور
          </h2>
          <p className="text-xs text-slate-400">تسجيل ومتابعة حضور الطلاب</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">📊 عدد السجلات: {attendance.length}</span>
          
          {/* ✅ زر تفعيل/تعطيل الحضور التلقائي */}
          <button
            onClick={() => setAutoAttendance(!autoAttendance)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              autoAttendance 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {autoAttendance ? 'حضور تلقائي مفعل' : 'حضور تلقائي معطل'}
          </button>
          
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              showStats 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                : 'bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {showStats ? 'إخفاء الإحصائيات' : 'عرض الإحصائيات'}
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* ====== 📊 الإحصائيات العامة ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <div className="bg-slate-900 rounded-xl p-3 text-center border border-slate-800">
          <p className="text-xs text-slate-400">👨‍🎓 الطلاب</p>
          <p className="text-xl font-bold text-white">{generalStats.totalStudents}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center border border-slate-800">
          <p className="text-xs text-slate-400">📋 السجلات</p>
          <p className="text-xl font-bold text-white">{generalStats.totalRecords + generalStats.totalAutoPresent}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center border border-emerald-500/30">
          <p className="text-xs text-slate-400">✅ حاضر</p>
          <p className="text-xl font-bold text-emerald-400">{generalStats.totalPresent}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center border border-blue-500/30">
          <p className="text-xs text-slate-400">⚡ تلقائي</p>
          <p className="text-xl font-bold text-blue-400">{generalStats.totalAutoPresent}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center border border-rose-500/30">
          <p className="text-xs text-slate-400">❌ غائب</p>
          <p className="text-xl font-bold text-rose-400">{generalStats.totalAbsent}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center border border-amber-500/30">
          <p className="text-xs text-slate-400">⏰ متأخر</p>
          <p className="text-xl font-bold text-amber-400">{generalStats.totalLate}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center border border-purple-500/30">
          <p className="text-xs text-slate-400">🚪 مغادر</p>
          <p className="text-xl font-bold text-purple-400">{generalStats.totalLeft}</p>
        </div>
      </div>

      {/* ====== 📊 إحصائيات الطلاب التفصيلية ====== */}
      {showStats && (
        <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              إحصائيات الحضور والغياب
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statsFilter}
                onChange={(e) => setStatsFilter(e.target.value)}
                className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="all">الكل</option>
                <option value="problem">⚠️ مشاكل</option>
                <option value="absent">❌ غائب</option>
                <option value="late">⏰ متأخر</option>
                <option value="left">🚪 مغادر</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="count">عدد المشاكل</option>
                <option value="name">الاسم</option>
                <option value="attendance">نسبة الحضور</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs hover:bg-slate-700 transition-all"
              >
                {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              
              <button
                onClick={exportStats}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                تصدير
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700 sticky top-0">
                  <th className="p-2 text-center text-slate-400">#</th>
                  <th className="p-2 text-center text-slate-400">اسم الطالب</th>
                  <th className="p-2 text-center text-slate-400">الصف</th>
                  <th className="p-2 text-center text-slate-400">إجمالي</th>
                  <th className="p-2 text-center text-emerald-400">✅ حاضر</th>
                  <th className="p-2 text-center text-blue-400">⚡ تلقائي</th>
                  <th className="p-2 text-center text-rose-400">❌ غائب</th>
                  <th className="p-2 text-center text-amber-400">⏰ متأخر</th>
                  <th className="p-2 text-center text-purple-400">🚪 مغادر</th>
                  <th className="p-2 text-center text-blue-400">📝 مبرر</th>
                  <th className="p-2 text-center text-slate-400">نسبة الحضور</th>
                  <th className="p-2 text-center text-slate-400">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-6 text-slate-400">
                      لا توجد بيانات للعرض
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((stat, index) => (
                    <tr key={stat.studentId} className="border-b border-slate-800 hover:bg-slate-800/30 transition-all">
                      <td className="p-2 text-center text-slate-500">{index + 1}</td>
                      <td className="p-2 text-center text-white font-bold">{stat.fullName}</td>
                      <td className="p-2 text-center text-slate-400">{stat.className}</td>
                      <td className="p-2 text-center text-white">{stat.total}</td>
                      <td className="p-2 text-center text-emerald-400">{stat.present}</td>
                      <td className="p-2 text-center text-blue-400">{stat.autoPresent}</td>
                      <td className={`p-2 text-center font-bold ${stat.absent > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {stat.absent}
                        {stat.absent > 0 && stat.total > 0 && ` (${(stat.absent / stat.total * 100).toFixed(1)}%)`}
                      </td>
                      <td className={`p-2 text-center font-bold ${stat.late > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {stat.late}
                        {stat.late > 0 && stat.total > 0 && ` (${(stat.late / stat.total * 100).toFixed(1)}%)`}
                      </td>
                      <td className={`p-2 text-center font-bold ${stat.left > 0 ? 'text-purple-400' : 'text-slate-500'}`}>
                        {stat.left}
                        {stat.left > 0 && stat.total > 0 && ` (${(stat.left / stat.total * 100).toFixed(1)}%)`}
                      </td>
                      <td className="p-2 text-center text-blue-400">{stat.excused}</td>
                      <td className="p-2 text-center">
                        <span className={`font-bold ${
                          stat.attendanceRate >= 90 ? 'text-emerald-400' :
                          stat.attendanceRate >= 70 ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>
                          {stat.attendanceRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        {getStudentStatusBadge(stat)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====== أدوات التصفية ====== */}
      <div className="flex flex-wrap gap-3 mb-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">الصف:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">الكل</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">التاريخ:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        {autoAttendance && (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />
              الحضور التلقائي مفعل
            </span>
          </div>
        )}
      </div>

      {/* ====== نموذج الإضافة ====== */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <select
          value={formData.studentId}
          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
          className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          required
        >
          <option value="">اختر الطالب</option>
          {students
            .filter(s => !selectedClass || s.classId === selectedClass)
            .map(student => {
              const hasRecord = attendance.some(a => a.studentId === student.id && a.date === selectedDate);
              return (
                <option key={student.id} value={student.id}>
                  {student.fullName} {hasRecord ? '(✅ مسجل)' : ''}
                </option>
              );
            })}
        </select>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="present">✅ حاضر</option>
          <option value="absent">❌ غائب</option>
          <option value="late">⏰ متأخر</option>
          <option value="left">🚪 مغادر</option>
          <option value="excused">📝 مبرر</option>
        </select>
        <input
          type="text"
          placeholder="ملاحظة (اختياري)"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          تسجيل الحضور
        </button>
      </form>

      {/* ====== قائمة سجلات الحضور (مع الحضور التلقائي) ====== */}
      <div className="space-y-3">
        {todayStudents.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">لا توجد سجلات حضور لهذا اليوم</p>
          </div>
        ) : (
          todayStudents.map((record) => {
            const student = record.student || students.find(s => s.id === record.studentId);
            const classInfo = classes.find(c => c.id === student?.classId);

            return (
              <div 
                key={record.id} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  record.isAuto 
                    ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    record.isAuto 
                      ? 'bg-blue-500' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-500'
                  }`}>
                    {student?.fullName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{student?.fullName || 'غير محدد'}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>🏫 {classInfo?.name || 'غير محدد'}</span>
                      <span>📅 {record.date}</span>
                      {record.note && <span>📝 {record.note}</span>}
                      {record.isAuto && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                          ⚡ تلقائي
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-bold">
                    {getStatusBadge(record.status, record.isAuto)}
                  </div>
                  {!record.isAuto && (
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {record.isAuto && (
                    <span className="text-[10px] text-slate-500">(تلقائي)</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}