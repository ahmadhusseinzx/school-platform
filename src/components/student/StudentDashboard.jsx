import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { collection, getDocs, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { 
  BookOpen, Calendar, Clock, Award, User, Bell, 
  TrendingUp, TrendingDown, CheckCircle, XCircle,
  Video, FileText, MessageSquare, BarChart3
} from 'lucide-react';

// استيراد المكونات الفرعية
import StudentInfo from './StudentInfo';
import SubjectsView from './SubjectsView';
import LiveLesson from './LiveLesson';
import GradesView from './GradesView';
import AttendanceView from './AttendanceView';
import AskQuestion from './AskQuestion';

export default function StudentDashboard() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // حالات البيانات
  const [studentClass, setStudentClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);

  // حالات البث المباشر
  const [liveLesson, setLiveLesson] = useState(null);
  const [liveStep, setLiveStep] = useState(1);
  const [liveSlide, setLiveSlide] = useState(0);
  const [liveBlocks, setLiveBlocks] = useState([]);
  const [liveIntro, setLiveIntro] = useState('');

  useEffect(() => {
    if (userData) {
      loadStudentData();
      loadLiveLesson();
    }
  }, [userData]);

  const loadStudentData = async () => {
    try {
      setLoading(true);

      // جلب بيانات الصف
      if (userData.classId) {
        const classDoc = await getDoc(doc(db, 'classes', userData.classId));
        if (classDoc.exists()) {
          setStudentClass({ id: classDoc.id, ...classDoc.data() });
        }
      }

      // جلب المواد الدراسية للصف
      const subjectsQuery = query(
        collection(db, 'subjects'),
        where('classId', '==', userData.classId)
      );
      const subjectsSnap = await getDocs(subjectsQuery);
      const subjectsList = [];
      subjectsSnap.forEach(doc => {
        subjectsList.push({ id: doc.id, ...doc.data() });
      });
      setSubjects(subjectsList);

      // جلب العلامات
      const gradesQuery = query(
        collection(db, 'grades'),
        where('studentId', '==', userData.uid)
      );
      const gradesSnap = await getDocs(gradesQuery);
      const gradesList = [];
      gradesSnap.forEach(doc => {
        gradesList.push({ id: doc.id, ...doc.data() });
      });
      setGrades(gradesList);

      // جلب الحضور
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('studentId', '==', userData.uid)
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      const attendanceList = [];
      attendanceSnap.forEach(doc => {
        attendanceList.push({ id: doc.id, ...doc.data() });
      });
      setAttendance(attendanceList);

      // محاكاة جدول اليوم
      const today = new Date().toLocaleDateString('ar', { weekday: 'long' });
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
      const dayIndex = days.indexOf(today);
      
      if (dayIndex !== -1) {
        const scheduleQuery = query(
          collection(db, 'schedule'),
          where('classId', '==', userData.classId),
          where('day', '==', today)
        );
        const scheduleSnap = await getDocs(scheduleQuery);
        const scheduleList = [];
        scheduleSnap.forEach(doc => {
          scheduleList.push({ id: doc.id, ...doc.data() });
        });
        setTodaySchedule(scheduleList);
      }

      // محاكاة الإشعارات
      setNotifications([
        { id: 1, type: 'info', text: 'تم إضافة درس جديد في مادة الرياضيات', time: 'منذ ساعة', read: false },
        { id: 2, type: 'warning', text: 'موعد تسليم الواجب غداً', time: 'منذ 3 ساعات', read: false },
        { id: 3, type: 'success', text: 'تم تصحيح امتحان الرياضيات', time: 'منذ يوم', read: true }
      ]);

    } catch (error) {
      console.error('خطأ في تحميل بيانات الطالب:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveLesson = () => {
    // الاستماع للبث المباشر (سيتم ربطه مع Realtime Database)
    // محاكاة بيانات البث
    setLiveLesson({
      id: 'live_1',
      title: 'الدرس المباشر - الرياضيات',
      teacher: 'الأستاذ أحمد'
    });
    setLiveBlocks([
      { type: 'text', value: 'مرحباً بكم في الدرس المباشر...' },
      { type: 'note', value: 'انتبهوا للقاعدة التالية...' }
    ]);
    setLiveIntro('هذه مقدمة الدرس المباشر');
  };

  // ============ دوال مساعدة ============
  const getSubjectGrade = (subjectId) => {
    const grade = grades.find(g => g.subjectId === subjectId);
    return grade || { total: 0, grade: 'F' };
  };

  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A': return 'text-emerald-400 bg-emerald-500/10';
      case 'B': return 'text-blue-400 bg-blue-500/10';
      case 'C': return 'text-amber-400 bg-amber-500/10';
      case 'D': return 'text-orange-400 bg-orange-500/10';
      case 'F': return 'text-rose-400 bg-rose-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getAttendanceStats = () => {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    return { total, present, absent, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const getAverageGrade = () => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((sum, g) => sum + (g.total || 0), 0);
    return Math.round(total / grades.length);
  };

  // ============ عرض المحتوى حسب التبويب ============
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 fade-in">
            {/* ترحيب */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h1 className="text-2xl font-black">مرحباً، {userData?.fullName} 👋</h1>
              <p className="text-blue-100 mt-1">الصف: {studentClass?.name || 'غير محدد'}</p>
            </div>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <span className="text-2xl font-black text-white">{subjects.length}</span>
                <p className="text-xs text-slate-400">المواد</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                <Award className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <span className="text-2xl font-black text-white">{getAverageGrade()}%</span>
                <p className="text-xs text-slate-400">المعدل</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <span className="text-2xl font-black text-white">{getAttendanceStats().percentage}%</span>
                <p className="text-xs text-slate-400">الحضور</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                <Bell className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <span className="text-2xl font-black text-white">{notifications.filter(n => !n.read).length}</span>
                <p className="text-xs text-slate-400">إشعارات</p>
              </div>
            </div>

            {/* الجدول والإشعارات */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* حصص اليوم */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  حصص اليوم
                </h3>
                {todaySchedule.length > 0 ? (
                  <div className="space-y-2">
                    {todaySchedule.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <div>
                          <p className="text-xs font-bold text-white">{session.subject}</p>
                          <p className="text-[10px] text-slate-400">الحصة {session.period}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">{session.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 text-sm py-4">لا توجد حصص اليوم</p>
                )}
              </div>

              {/* الإشعارات */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  الإشعارات
                </h3>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((notif) => (
                    <div key={notif.id} className={`p-2 rounded-lg border ${notif.read ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-900 border-blue-500/30'}`}>
                      <p className="text-xs text-slate-200">{notif.text}</p>
                      <span className="text-[10px] text-slate-500">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return <StudentInfo />;

      case 'subjects':
        return <SubjectsView subjects={subjects} grades={grades} />;

      case 'live':
        return (
          <LiveLesson
            liveLesson={liveLesson}
            liveStep={liveStep}
            liveSlide={liveSlide}
            liveBlocks={liveBlocks}
            liveIntro={liveIntro}
          />
        );

      case 'grades':
        return <GradesView grades={grades} subjects={subjects} />;

      case 'attendance':
        return <AttendanceView attendance={attendance} />;

      case 'questions':
        return <AskQuestion studentId={userData?.uid} />;

      default:
        return null;
    }
  };

  // ============ قائمة التبويبات ============
  const tabs = [
    { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
    { id: 'subjects', label: 'موادي', icon: '📚' },
    { id: 'live', label: 'الحصة المباشرة', icon: '🎥' },
    { id: 'grades', label: 'علاماتي', icon: '📊' },
    { id: 'attendance', label: 'حضوري', icon: '✅' },
    { id: 'questions', label: 'أسئلتي', icon: '❓' },
    { id: 'profile', label: 'معلوماتي', icon: '👤' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white" dir="rtl">
      {/* الهيدر */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold">🎓 لوحة الطالب</h1>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
              {userData?.fullName}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all text-sm"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* المحتوى */}
      <main className="max-w-7xl mx-auto p-4">
        {renderContent()}
      </main>
    </div>
  );
}