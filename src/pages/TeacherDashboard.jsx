import React, { useState, useEffect, useRef } from 'react';
import { db, rtdb } from '../services/firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { 
  Folder, BookOpen, Edit3, ArrowUp, ArrowDown, Plus, 
  Trash2, ArrowLeft, Check, FileText, Clock, Calendar, BarChart2,
  Users, UserPlus, GraduationCap, Video, Sun, Moon, HelpCircle,
  ClipboardList, Maximize2, Minimize2, ZoomIn, ZoomOut, Eye, Link, Image as ImageIcon,
  Bell, AlertCircle, MessageSquare, ExternalLink, CheckCircle, Percent
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function TeacherDashboard() {
  // --- 1. حالات التحكم بالمظهر والتبويبات الأساسية ---
  const [darkMode, setDarkMode] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('dashboard'); // dashboard, live, curriculum, exams, management

  // --- 2. حالات البيانات السحابية العامة ---
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [examSubmissions, setExamSubmissions] = useState([]); 
  
  // بيانات محاكاة تفاعلية للوحة التحكم (Dashboard Data)
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'critical', text: 'قام الطالب (أحمد) بتسليم واجب (الشبكات) متأخراً', time: 'منذ 5 دقائق', read: false },
    { id: 2, type: 'medium', text: 'لديك استفسار جديد من طالب في ساحة نقاش (بوابة المنطق)', time: 'منذ 20 دقيقة', read: false },
    { id: 3, type: 'medium', text: 'طلب انضمام جديد من الطالبة (سارة) لصف الحادي عشر', time: 'منذ ساعة', read: true }
  ]);

  const [dailySchedule, setDailySchedule] = useState([
    { id: 1, subject: 'هندسة حاسوب وعمارة الحاسوب', class: 'الحادي عشر علمي - أ', timeFrom: '08:00', timeTo: '08:45', status: 'completed', link: 'https://teams.microsoft.com' },
    { id: 2, subject: 'الشبكات والاتصالات الرقمية', class: 'الثاني عشر علمي - ب', timeFrom: '09:00', timeTo: '09:45', status: 'current', link: 'https://teams.microsoft.com' },
    { id: 3, subject: 'أنظمة التحكم والميكروكنترولر', class: 'العاشر التكنولوجي', timeFrom: '10:00', timeTo: '10:45', status: 'upcoming', link: 'https://teams.microsoft.com' },
    { id: 4, subject: 'مبادئ البرمجة والمنطق الرقمي', class: 'الحادي عشر علمي - ب', timeFrom: '11:00', timeTo: '11:45', status: 'upcoming', link: 'https://teams.microsoft.com' }
  ]);

  // إحصائيات ثابتة للوحة التحكم
  const statsData = {
    remainingClasses: 2,
    totalClasses: 4,
    pendingHomeworks: 7,
    attendanceRate: 92,
    attendanceStatus: 'up' // up or down مقارنة بالأسبوع الماضي
  };

  // --- 3. حالات التحديد والاختيار الحالية ---
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [managementSelectedClass, setManagementSelectedClass] = useState(null);
  const [selectedExamForStats, setSelectedExamForStats] = useState(null);

  // --- 4. حالات البث والخطوات اللحظية ---
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- 5. حالات التعديل السريع للشرائح ---
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editIntro, setEditIntro] = useState("");
  const [editBlocks, setEditBlocks] = useState([]);
  const [newLiveBlockType, setNewLiveBlockType] = useState('text'); 

  // --- 6. حالات نماذج الإضافة (إدارة الطلاب والصفوف) ---
  const [newClassName, setNewClassName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClassId, setNewStudentClassId] = useState("");

  // --- 7. حالات واجهة تحضير المناهج المتقدمة ---
  const [curriculumStep, setCurriculumStep] = useState(1); 
  const [curriculumMode, setCurriculumMode] = useState(null); 
  const [curriculumClassId, setCurriculumClassId] = useState("");
  const [curriculumSemester, setCurriculumSemester] = useState("الفصل الدراسي الأول");
  const [curriculumUnit, setCurriculumUnit] = useState("1");
  const [curriculumLessonNum, setCurriculumLessonNum] = useState("1");
  const [curriculumTitle, setCurriculumTitle] = useState("");
  const [curriculumIntro, setCurriculumIntro] = useState("");
  
  const [examDuration, setExamDuration] = useState(30); 
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleChoices, setShuffleChoices] = useState(true);
  
  const [curriculumBlocks, setCurriculumBlocks] = useState([{ type: 'text', value: '' }]);
  const [curriculumQuestions, setCurriculumQuestions] = useState([
    { questionText: '', choice1: '', choice2: '', choice3: '', choice4: '', correctAnswer: '1' }
  ]);

  // --- 8. حالات شاشة العرض الكبيرة للبث ---
  const [presentFontSize, setPresentFontSize] = useState(24);
  const [presentFullscreen, setPresentFullscreen] = useState(false);
  const presentRef = useRef(null);

  const togglePresentFullscreen = () => {
    if (!document.fullscreenElement) {
      presentRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onFsChange = () => setPresentFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // --- 9. جلب البيانات من Firestore ---
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      const classList = [];
      snapshot.forEach(doc => classList.push({ id: doc.id, ...doc.data() }));
      setClasses(classList);
    });
    
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const studentList = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.role === 'student') studentList.push({ id: doc.id, ...data });
      });
      setStudents(studentList);
    });

    const unsubLessons = onSnapshot(collection(db, "lessons"), (snapshot) => {
      const lessonList = [];
      snapshot.forEach(doc => lessonList.push({ id: doc.id, ...doc.data() }));
      setLessons(lessonList);
    });

    const unsubExams = onSnapshot(collection(db, "exams"), (snapshot) => {
      const examList = [];
      snapshot.forEach(doc => examList.push({ id: doc.id, ...doc.data() }));
      setExams(examList);
    });

    const unsubSubmissions = onSnapshot(collection(db, "examSubmissions"), (snapshot) => {
      const subList = [];
      snapshot.forEach(doc => subList.push({ id: doc.id, ...doc.data() }));
      setExamSubmissions(subList);
    });

    return () => {
      unsubClasses(); unsubUsers(); unsubLessons(); unsubExams(); unsubSubmissions();
    };
  }, []);

  const filteredLessons = lessons.filter(l => l.classId === selectedClass?.id)
                                .sort((a, b) => a.lessonNumber - b.lessonNumber);

  const filteredStudents = managementSelectedClass 
    ? students.filter(s => s.classId === managementSelectedClass.id)
    : students;

  // --- 10. وظائف التحكم بالبث والمزامنة اللحظية ---
  const syncLiveStatus = (step, slide) => {
    if (!selectedClass || !selectedLesson) return;
    set(ref(rtdb, `lessons/${selectedClass.id}`), {
      lessonId: selectedLesson.id,
      currentStep: step,
      currentSlide: slide
    });
  };

  const handleNextSlide = () => {
    if (currentSlide < editBlocks.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      syncLiveStatus(2, nextSlide);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      syncLiveStatus(2, prevSlide);
    }
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setEditTitle(lesson.title);
    setEditIntro(lesson.introduction || "");
    setEditBlocks(lesson.blocks || []);
    setCurrentStep(1);
    setCurrentSlide(0);
  };

  // --- 11. وظائف تعديل وحفظ الشرائح التفاعلية اللحظية ---
  const moveBlock = (index, direction) => {
    const updated = [...editBlocks];
    if (direction === 'up' && index > 0) {
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    } else if (direction === 'down' && index < updated.length - 1) {
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    }
    setEditBlocks(updated);
  };

  const updateBlockValue = (index, newValue) => {
    const updated = [...editBlocks];
    updated[index].value = newValue;
    setEditBlocks(updated);
  };

  const updateEditBlockField = (index, field, newValue) => {
    const updated = [...editBlocks];
    updated[index] = { ...updated[index], [field]: newValue };
    setEditBlocks(updated);
  };

  const addBlockToLiveLesson = () => {
    if (newLiveBlockType === 'image' || newLiveBlockType === 'link') {
      setEditBlocks([...editBlocks, { type: newLiveBlockType, url: '', title: '', value: '' }]);
    } else {
      setEditBlocks([...editBlocks, { type: newLiveBlockType, value: '' }]);
    }
  };

  const deleteLiveBlock = (index) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الشريحة نهائياً؟")) {
      const updated = editBlocks.filter((_, idx) => idx !== index);
      setEditBlocks(updated);
      if (currentSlide >= updated.length && updated.length > 0) {
        setCurrentSlide(updated.length - 1);
      }
    }
  };

  const saveLessonUpdates = async () => {
    if (!selectedLesson) return;
    try {
      await updateDoc(doc(db, "lessons", selectedLesson.id), {
        title: editTitle,
        introduction: editIntro,
        blocks: editBlocks
      });
      setSelectedLesson({ ...selectedLesson, title: editTitle, introduction: editIntro, blocks: editBlocks });
      setIsEditing(false);
      alert("تم حفظ التعديلات وتحديث شاشات الطلاب بنجاح!");
    } catch (error) {
      alert("حدث خطأ أثناء تحديث البيانات: " + error.message);
    }
  };

  // --- 12. وظائف الإضافة والحذف الإدارية ---
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      await addDoc(collection(db, "classes"), { name: newClassName });
      setNewClassName("");
    } catch (error) {
      alert("خطأ في إضافة الصف: " + error.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    if(!confirm("هل أنت متأكد من حذف هذا الصف؟ لن يتم حذف الطلاب.")) return;
    try {
      await deleteDoc(doc(db, "classes", classId));
      if (managementSelectedClass?.id === classId) setManagementSelectedClass(null);
    } catch (error) {
      alert("خطأ في حذف الصف: " + error.message);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentClassId) return;
    try {
      await addDoc(collection(db, "users"), {
        fullName: newStudentName,
        email: `${Date.now()}@school.com`,
        classId: newStudentClassId,
        role: 'student'
      });
      setNewStudentName("");
    } catch (error) {
      alert("خطأ في قيد الطالب: " + error.message);
    }
  };

  const handleDeleteExam = async (examId) => {
    if(!confirm("هل أنت متأكد من حذف هذا الامتحان نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "exams", examId));
      if(selectedExamForStats?.id === examId) setSelectedExamForStats(null);
    } catch (error) {
      alert("خطأ في حذف الامتحان: " + error.message);
    }
  };

  // وظائف التفاعل السريع مع الإشعارات داخل الـ Dashboard
  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const snoozeNotification = (id) => {
    alert("تم تأجيل التنبيه لمراجعته لاحقاً.");
  };

  // --- 13. إعداد المناهج والامتحانات ---
  const addCurriculumBlock = (type) => {
    if (type === 'image' || type === 'link') {
      setCurriculumBlocks([...curriculumBlocks, { type, url: '', title: '', value: '' }]);
    } else {
      setCurriculumBlocks([...curriculumBlocks, { type, value: '' }]);
    }
  };

  const updateBlockField = (index, field, newValue) => {
    const updated = [...curriculumBlocks];
    updated[index] = { ...updated[index], [field]: newValue };
    setCurriculumBlocks(updated);
  };

  const addCurriculumQuestion = () => {
    setCurriculumQuestions([...curriculumQuestions, { questionText: '', choice1: '', choice2: '', choice3: '', choice4: '', correctAnswer: '1' }]);
  };

  const handleSaveFullCurriculum = async (e) => {
    e.preventDefault();
    if (!curriculumTitle.trim() || !curriculumClassId) {
      alert("الرجاء التأكد من اختيار الصف وكتابة عنوان واضح.");
      return;
    }

    const formattedQuestions = curriculumQuestions.map(q => ({
      text: q.questionText,
      options: [q.choice1, q.choice2, q.choice3, q.choice4],
      correctAnswer: Number(q.correctAnswer) - 1
    }));

    try {
      if (curriculumMode === 'exam') {
        await addDoc(collection(db, "exams"), {
          classId: curriculumClassId,
          semester: curriculumSemester,
          title: curriculumTitle,
          duration: Number(examDuration),
          startTime: startTime || null,
          endTime: endTime || null,
          shuffleQuestions,
          shuffleChoices,
          questions: formattedQuestions,
          createdAt: new Date().toISOString()
        });
        alert("تم حفظ الامتحان الرقمي بنجاح!");
      } else {
        await addDoc(collection(db, "lessons"), {
          classId: curriculumClassId,
          semester: curriculumSemester,
          unitNumber: Number(curriculumUnit),
          lessonNumber: Number(curriculumLessonNum),
          title: curriculumTitle,
          introduction: curriculumIntro,
          blocks: curriculumBlocks,
          questions: formattedQuestions,
          createdAt: new Date().toISOString()
        });
        alert("تم حفظ الدرس التفاعلي بنجاح!");
      }

      setCurriculumTitle("");
      setCurriculumIntro("");
      setCurriculumBlocks([{ type: 'text', value: '' }]);
      setCurriculumQuestions([{ questionText: '', choice1: '', choice2: '', choice3: '', choice4: '', correctAnswer: '1' }]);
      setCurriculumStep(1);
      setCurriculumMode(null);
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ السحابي: " + error.message);
    }
  };

  // --- 14. محرك استخراج الإحصائيات الفورية للامتحانات ---
  const getExamStats = (examId) => {
    const subs = examSubmissions.filter(s => s.examId === examId);
    if(subs.length === 0) return { count: 0, avg: 0, hardQuestions: [] };

    const totalScore = subs.reduce((acc, curr) => acc + curr.score, 0);
    const avg = (totalScore / subs.length).toFixed(1);

    const exam = exams.find(e => e.id === examId);
    const wrongCounts = {};
    if (exam && exam.questions) {
      exam.questions.forEach((_, idx) => wrongCounts[idx] = 0);
      subs.forEach(sub => {
        if(sub.wrongQuestionIndexes) {
          sub.wrongQuestionIndexes.forEach(idx => {
            if(wrongCounts[idx] !== undefined) wrongCounts[idx]++;
          });
        }
      });
    }

    const hardQuestions = Object.keys(wrongCounts)
      .map(idx => ({ index: Number(idx), count: wrongCounts[idx] }))
      .sort((a, b) => b.count - a.count)
      .filter(q => q.count > 0);

    return { count: subs.length, avg, hardQuestions };
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-800'}`} dir="rtl">
      
      {/* الهيدر والتبويبات الرئيسية */}
      <header className={`py-4 px-6 border-b sticky top-0 z-50 shadow-md ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold flex items-center gap-2">
                بوابة التحكم الذكية للمعلم
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">المهندس أحمد حسين</span>
              </h1>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>المنهاج التفاعلي المستدام ونظام التحكم المدرسي</p>
            </div>
          </div>

          <div className={`flex p-1 rounded-xl border flex-wrap justify-center ${darkMode ? 'bg-slate-950/40 border-slate-700/50' : 'bg-slate-200/60 border-slate-300'}`}>
            <button onClick={() => setActiveMainTab('dashboard')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}>
              <BarChart2 className="w-3.5 h-3.5" /> لوحة التحكم
            </button>
            <button onClick={() => setActiveMainTab('live')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'live' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}>
              <Video className="w-3.5 h-3.5" /> البث والتحكم اللحظي
            </button>
            <button onClick={() => setActiveMainTab('curriculum')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'curriculum' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}>
              <BookOpen className="w-3.5 h-3.5" /> إعداد وتحضير المناهج
            </button>
            <button onClick={() => setActiveMainTab('exams')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'exams' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}>
              <ClipboardList className="w-3.5 h-3.5" /> الامتحانات والنتائج
            </button>
            <button onClick={() => setActiveMainTab('management')} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'management' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}>
              <Users className="w-3.5 h-3.5" /> إدارة الصفوف والطلاب
            </button>
          </div>

          <button type="button" onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-amber-400' : 'bg-slate-100 border-slate-300 text-purple-700'}`}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">

        {/* ===================== التبويب الافتراضي: لوحة التحكم الرئيسية (Dashboard) ===================== */}
        {activeMainTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* 1. شريط الإحصائيات السريعة (Stats Cards Summary) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* بطاقة حصص اليوم المتبقية */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">الحصص اليومية</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-blue-500">{statsData.remainingClasses} حصص متبقية</h4>
                  <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>من أصل {statsData.totalClasses} حصص مجدولة لليوم</p>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((statsData.totalClasses - statsData.remainingClasses) / statsData.totalClasses) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>تم إنجاز 50%</span>
                    <span>المتبقي 50%</span>
                  </div>
                </div>
              </div>

              {/* بطاقة واجبات بانتظار التصحيح */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">التقييمات</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-amber-500">{statsData.pendingHomeworks} واجبات بانتظار التصحيح</h4>
                  <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تطلب رصداً عاجلاً في دفتر العلامات</p>
                </div>
                <button 
                  onClick={() => setActiveMainTab('exams')}
                  className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> ابدأ التصحيح الآن
                </button>
              </div>

              {/* بطاقة نسبة الحضور اليومي */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${statsData.attendanceStatus === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {statsData.attendanceStatus === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    <span>مقارنة بالأسبوع الماضي</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-black text-emerald-500">{statsData.attendanceRate}% نسبة الحضور اليومي</h4>
                  <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مؤشر التزام الطلاب ممتاز ومستقر</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                  <span>أعلى صف حضوراً: 11 علمي - أ</span>
                  <span className="text-emerald-400 font-bold">مستقر</span>
                </div>
              </div>

            </div>

            {/* الجزء السفلي: ينقسم إلى جدول دراسي ومركز تنبيهات */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 2. الجدول الدراسي اليومي الذكي (Smart Daily Schedule) */}
              <div className={`lg:col-span-2 p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> الجدول الدراسي اليومي والمرتب زمنياً (Timeline)
                </h3>
                
                <div className="space-y-3">
                  {dailySchedule.map((session) => (
                    <div 
                      key={session.id} 
                      className={`p-4 rounded-xl border transition-all duration-300 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        session.status === 'current' 
                          ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                          : session.status === 'completed' 
                          ? 'bg-slate-800/40 border-slate-800 opacity-60' 
                          : 'bg-[#0f172a] border-slate-800 hover:bg-slate-800/80'
                      }`}
                    >
                      {session.status === 'current' && (
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow animate-pulse">
                          نشط حالياً
                        </span>
                      )}

                      <div className="flex gap-3 items-start">
                        <div className={`p-2 rounded-lg text-center min-w-[65px] font-mono text-xs ${session.status === 'current' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                          <div>{session.timeFrom}</div>
                          <div className="text-[9px] opacity-60 border-t border-slate-755/50 mt-0.5 pt-0.5">{session.timeTo}</div>
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-100">{session.subject}</h4>
                          <span className="text-[10px] text-slate-400 mt-1 block">🏫 الصف: {session.class}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {session.status === 'completed' ? (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">✓ انتهت الحصة</span>
                        ) : (
                          <a 
                            href={session.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={`w-full sm:w-auto text-center px-4 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              session.status === 'current' 
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                                : 'bg-slate-700 text-slate-300 pointer-events-none opacity-50'
                            }`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> دخول البث المباشر
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. مركز التنبيهات والإشعارات الفورية (Notifications Hub) */}
              <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 animate-bounce" /> مركز التنبيهات الفورية
                  </h3>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full">
                    {notifications.filter(n => !n.read).length} جديد
                  </span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pl-1">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 rounded-xl border flex flex-col gap-2 transition-all duration-200 ${
                        notif.read ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-[#0f172a] border-slate-850 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {notif.type === 'critical' ? (
                          <div className="bg-rose-500/10 p-1 rounded-lg text-rose-500 mt-0.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="bg-amber-500/10 p-1 rounded-lg text-amber-500 mt-0.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className={`text-xs font-semibold leading-relaxed ${notif.read ? 'text-slate-400' : 'text-slate-200'}`}>
                            {notif.text}
                          </p>
                          <span className="text-[9px] text-slate-500 block mt-1">{notif.time}</span>
                        </div>
                      </div>

                      {!notif.read && (
                        <div className="flex gap-2 justify-end border-t border-slate-800/60 pt-2 mt-1">
                          <button 
                            onClick={() => snoozeNotification(notif.id)}
                            className="text-[10px] text-slate-400 hover:text-slate-300 px-2 py-0.5 rounded bg-slate-800"
                          >
                            تأجيل التنبيه
                          </button>
                          <button 
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-500/10"
                          >
                            تمت القراءة
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================== التبويب 1: البث والتحكم اللحظي ===================== */}
        {activeMainTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* العمود الأيمن الجانبي: اختيار الصف وقائمة الدروس */}
            <div className={`p-4 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'}`}>
              {!selectedClass ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-blue-500 flex items-center gap-1"><Folder className="w-4 h-4" /> اختر الصف لبدء البث:</h3>
                  <div className="space-y-2">
                    {classes.map(c => (
                      <button key={c.id} onClick={() => setSelectedClass(c)} className="w-full text-right p-3 rounded-xl border text-xs font-bold bg-slate-900 border-slate-750 hover:bg-slate-800 text-white transition-all">
                        🏫 {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => { setSelectedClass(null); setSelectedLesson(null); }} className="text-xs flex items-center gap-1 text-blue-400 hover:underline">
                    <ArrowLeft className="w-3.5 h-3.5" /> تغيير الصف الحالي
                  </button>
                  <div className="border-b border-slate-700 pb-2">
                    <span className="text-[10px] text-slate-400">الدروس المتاحة لـ:</span>
                    <p className="text-xs font-black text-blue-500 mt-0.5">{selectedClass.name}</p>
                  </div>
                  <div className="space-y-2 max-h-[65vh] overflow-y-auto pl-1">
                    {filteredLessons.map(les => (
                      <button 
                        key={les.id} 
                        onClick={() => handleSelectLesson(les)} 
                        className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex flex-col gap-1 ${selectedLesson?.id === les.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-[#0f172a] border-slate-800 text-slate-200 hover:bg-slate-800'}`}
                      >
                        <span className="text-[9px] opacity-70">الوحدة {les.unitNumber} • الدرس {les.lessonNumber}</span>
                        <span className="font-bold">{les.title}</span>
                      </button>
                    ))}
                    {filteredLessons.length === 0 && (
                      <p className="text-[11px] text-slate-500 text-center py-4">لا توجد دروس مضافة لهذا الصف.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* العمود الأيسر الرئيسي: مسار التحكم، الشاشة الكبيرة، والمعاينة الشاملة */}
            <div className="lg:col-span-3 space-y-6">
              {selectedLesson ? (
                <>
                  <div className="p-4 rounded-2xl border flex flex-wrap gap-3 items-center justify-between ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">{selectedClass?.name}</span>
                      <h2 className="text-xs font-bold mt-1 text-slate-300">الدرس النشط حالياً: <span className="text-white font-black">{selectedLesson.title}</span></h2>
                    </div>
                    <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all">
                      {isEditing ? "إلغاء التعديل" : "تعديل السلايدات الفوري"}
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="p-6 rounded-2xl border bg-[#1e293b] border-slate-700 space-y-6">
                      <div className="p-4 rounded-xl border border-dashed border-blue-500/40 bg-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold text-slate-300">إدراج أداة تفاعلية جديدة للدرس الحاضر:</span>
                          <select 
                            value={newLiveBlockType} 
                            onChange={(e) => setNewLiveBlockType(e.target.value)} 
                            className="p-1.5 rounded text-xs bg-[#1e293b] text-white border border-slate-700 focus:outline-none"
                          >
                            <option value="text">فقرة شرح</option>
                            <option value="note">تنبيه هام</option>
                            <option value="image">صورة تعليمية</option>
                            <option value="link">رابط تفاعلي</option>
                          </select>
                        </div>
                        <button type="button" onClick={addBlockToLiveLesson} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all">+ إضافة شريحة</button>
                      </div>

                      <div className="space-y-4">
                        {editBlocks.map((block, index) => (
                          <div key={index} className="p-4 rounded-xl border bg-[#0f172a] border-slate-800 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-bold text-blue-400">سلايد #{index + 1} ({block.type === 'image' ? 'صورة تعليمية' : block.type === 'link' ? 'رابط تفاعلي' : block.type === 'note' ? 'تنبيه هام' : 'فقرة شرح'})</span>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => moveBlock(index, 'up')} className="p-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"><ArrowUp className="w-3 h-3" /></button>
                                <button type="button" onClick={() => moveBlock(index, 'down')} className="p-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"><ArrowDown className="w-3 h-3" /></button>
                                <button type="button" onClick={() => deleteLiveBlock(index)} className="p-1 bg-rose-950 text-rose-400 border border-rose-900/40 rounded hover:bg-rose-900 transition-colors"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                            {(block.type === 'image' || block.type === 'link') ? (
                              <div className="space-y-2">
                                <input type="text" value={block.url || ''} onChange={(e) => updateEditBlockField(index, 'url', e.target.value)} placeholder={block.type === 'image' ? "رابط الصورة الإلكتروني URL..." : "رابط موقع الويب أو المحاكي الخارجي..."} className="w-full p-2 rounded text-xs bg-[#1e293b] text-white border border-slate-700 font-mono" />
                                <input type="text" value={block.title || ''} onChange={(e) => updateEditBlockField(index, 'title', e.target.value)} placeholder={block.type === 'image' ? "التعليق التوضيحي المرفق أسفل الصورة..." : "اسم الزر التفاعلي الموضح..."} className="w-full p-2 rounded text-xs bg-[#1e293b] text-white border border-slate-700" />
                              </div>
                            ) : (
                              <textarea rows={4} value={block.value || ''} onChange={(e) => updateBlockValue(index, e.target.value)} placeholder={block.type === 'note' ? "اكتب التنبيه الهام والملاحظة العريضة هنا..." : "اكتب محتوى الشرح باستخدام الماركدوان..."} className="w-full p-2 rounded text-xs bg-[#1e293b] text-white border border-slate-700 leading-relaxed" />
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={saveLessonUpdates} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md">حفظ تعديلات البث</button>
                    </div>
                  ) : (
                    <>
                      <div className={`p-4 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700/80' : 'bg-white border-slate-200'}`}>
                        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">🎬 مسار التحكم اللحظي النشط للحصة:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <button onClick={() => { setCurrentStep(1); syncLiveStatus(1, 0); }} className={`p-3.5 rounded-xl border text-center transition-all font-bold text-xs ${currentStep === 1 ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20' : 'bg-[#0f172a] border-slate-880 text-slate-300 hover:bg-slate-800'}`}>1. التمهيد ومقدمة المادة</button>
                          <button onClick={() => { setCurrentStep(2); syncLiveStatus(2, currentSlide); }} className={`p-3.5 rounded-xl border text-center transition-all font-bold text-xs ${currentStep === 2 ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20' : 'bg-[#0f172a] border-slate-880 text-slate-300 hover:bg-slate-800'}`}>2. العرض والتنقل بالشرائح</button>
                          <button onClick={() => { setCurrentStep(3); syncLiveStatus(3, 0); }} className={`p-3.5 rounded-xl border text-center transition-all font-bold text-xs ${currentStep === 3 ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20' : 'bg-[#0f172a] border-slate-880 text-slate-300 hover:bg-slate-800'}`}>3. التقييم والامتحانات الفورية</button>
                        </div>
                        {currentStep === 2 && (
                          <div className="flex items-center justify-between p-2 rounded-xl border bg-[#0f172a] border-slate-800">
                            <button disabled={currentSlide === 0} onClick={handlePrevSlide} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs disabled:opacity-40 transition-all">السابقة</button>
                            <span className="text-[11px] font-bold text-slate-300">الشريحة النشطة: {currentSlide + 1} من {editBlocks.length}</span>
                            <button disabled={currentSlide === editBlocks.length - 1} onClick={handleNextSlide} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs disabled:opacity-40 transition-all">التالية</button>
                          </div>
                        )}
                      </div>

                      <div ref={presentRef} className={`rounded-2xl border space-y-5 bg-[#0b0f19] border-slate-880 transition-all duration-300 ${presentFullscreen ? 'fixed inset-0 z-[100] p-10 flex flex-col justify-between overflow-y-auto bg-[#0b0f19]' : 'p-6'}`}>
                        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800/60 pb-3">
                          <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2"><Eye className="w-4 h-4" /> شاشة العرض الكبيرة (للشرح على جهاز العرض)</h3>
                          <div className="flex items-center gap-2 select-none">
                            <button type="button" onClick={togglePresentFullscreen} className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
                              {presentFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                            <button type="button" onClick={() => setPresentFontSize(f => Math.max(16, f - 2))} className="p-2 bg-[#1e293b] border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"><ZoomOut className="w-4 h-4" /></button>
                            <span className="text-xs font-mono font-bold text-slate-300 bg-[#151f32] px-3 py-1 rounded-lg border border-slate-700 min-w-[50px] text-center">{presentFontSize}px</span>
                            <button type="button" onClick={() => setPresentFontSize(f => Math.min(60, f + 2))} className="p-2 bg-[#1e293b] border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"><ZoomIn className="w-4 h-4" /></button>
                          </div>
                        </div>

                        <div className={`rounded-xl border p-8 min-h-[320px] bg-[#0f172a] border-slate-880 flex items-center justify-center transition-all ${presentFullscreen ? 'flex-1 my-4' : ''}`}>
                          {currentStep === 1 && (
                            <div style={{ fontSize: `${presentFontSize}px`, lineHeight: 1.8 }} className="w-full text-right whitespace-pre-line text-slate-100 font-medium border border-dashed border-slate-700/65 p-6 rounded-xl bg-slate-900/40 shadow-inner">
                              {editIntro ? `"${editIntro}"` : "💡 لا يوجد تمهيد أو افتتاحية مضافة لهذا الدرس حتى الآن."}
                            </div>
                          )}
                          {currentStep === 2 && editBlocks && editBlocks[currentSlide] && (
                            <div style={{ fontSize: `${presentFontSize}px`, lineHeight: 1.7 }} className="w-full text-right selection:bg-blue-500/30">
                              {editBlocks[currentSlide].type === 'text' && (
                                <div className="text-slate-200 leading-relaxed font-semibold markdown-content">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{editBlocks[currentSlide].value || "لا توجد نصوص في هذه الشريحة."}</ReactMarkdown>
                                </div>
                              )}
                              {editBlocks[currentSlide].type === 'note' && (
                                <div className="space-y-4 border-r-4 border-amber-500 bg-amber-950/20 p-6 rounded-xl border border-amber-900/30 shadow-sm animate-fade-in">
                                  <div className="flex items-center gap-2 text-amber-400 font-black text-[1.05em]"><span>💡</span><span>تنبيه وملاحظة هامة:</span></div>
                                  <p className="text-slate-200 mt-2 font-medium leading-relaxed">{editBlocks[currentSlide].value || "لم يتم كتابة نص التنبيه بعد."}</p>
                                </div>
                              )}
                              {editBlocks[currentSlide].type === 'image' && (
                                <div className="space-y-3 text-center flex flex-col items-center justify-center">
                                  {editBlocks[currentSlide].url ? (
                                    <>
                                      <img src={editBlocks[currentSlide].url} alt={editBlocks[currentSlide].title || "معاينة الصورة"} className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-750 p-1 bg-slate-900/50" />
                                      {editBlocks[currentSlide].title && <p className="text-sm text-slate-400 font-bold mt-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{editBlocks[currentSlide].title}</p>}
                                    </>
                                  ) : (
                                    <div className="text-slate-500 text-sm py-8">⚠️ لم يتم تحديد رابط الصورة بشكل صحيح.</div>
                                  )}
                                </div>
                              )}
                              {editBlocks[currentSlide].type === 'link' && (
                                <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                                  <a href={editBlocks[currentSlide].url || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-purple-400 underline hover:text-purple-350 font-black transition-colors transform hover:scale-105 duration-200">
                                    <span>🔗</span><span>{editBlocks[currentSlide].title || "انقر هنا لفتح الرابط التفاعلي المرفق"}</span>
                                  </a>
                                  {editBlocks[currentSlide].url && <p className="text-xs text-slate-500 mt-3 font-mono dir-ltr">{editBlocks[currentSlide].url}</p>}
                                </div>
                              )}
                            </div>
                          )}
                          {currentStep === 3 && (
                            <div style={{ fontSize: `${presentFontSize + 2}px` }} className="text-center font-black text-purple-400 max-w-2xl px-6 leading-loose animate-pulse">
                              🚀 وضع التقييم والامتحانات الفورية نشط الآن.
                              <span className="block text-slate-400 text-sm font-normal mt-3">يرجى من جميع الطلاب التوجه لشاشاتهم لبدء الإجابة.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-750' : 'bg-white border-slate-200'}`}>
                        <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">📋 معاينة محتويات الصفحة الموحدة للدرس</h3>
                        <div className="p-5 rounded-xl border bg-[#0f172a] border-slate-850 space-y-5 text-sm text-slate-300">
                          <div className="pb-4 border-b border-slate-850">
                            <span className="text-xs font-bold text-blue-400 block mb-2">المقدمة والتهيئة:</span>
                            <p className="italic text-slate-200 leading-relaxed bg-slate-900/40 p-3 rounded border border-slate-800">{editIntro ? `"${editIntro}"` : "لا توجد مقدمة مضافة لهذا الدرس بعد."}</p>
                          </div>
                          <div className="space-y-4 pt-1">
                            <span className="text-xs font-bold text-purple-400 block mb-1">شرائح العرض والميديا المضمنة:</span>
                            {editBlocks.map((block, i) => (
                              <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                                <span className="text-[10px] text-slate-500 font-extrabold block mb-1">[شريحة {i + 1}]:</span>
                                {block.type === 'text' && (
                                  <div className="text-slate-100 font-medium leading-relaxed markdown-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.value || "*لا يوجد محتوى مكتوب في هذه الشريحة حتى الآن.*"}</ReactMarkdown>
                                  </div>
                                )}
                                {block.type === 'note' && (
                                  <div className="border-r-4 border-amber-500 bg-amber-950/20 p-3 rounded border border-amber-900/30 text-slate-200 leading-relaxed font-medium">
                                    <span className="font-black text-amber-400 block mb-1">💡 تنبيه وملاحظة هامة:</span>{block.value || "لم يتم تدوين أي تنبيه."}
                                  </div>
                                )}
                                {block.type === 'image' && (
                                  <div className="flex flex-col items-start gap-2">
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">🖼️ صورة تعليمية مصاحبة:</span>
                                    <p className="text-slate-200 text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800"><span className="text-slate-400">العنوان:</span> {block.title || "بدون عنوان"} </p>
                                    {block.url && <img src={block.url} alt={block.title} className="max-h-40 rounded border border-slate-700 mt-1 object-contain bg-slate-900/50 p-1" />}
                                  </div>
                                )}
                                {block.type === 'link' && (
                                  <div className="space-y-1">
                                    <span className="text-purple-400 font-bold flex items-center gap-1">🔗 رابط تفاعلي خارجي:</span>
                                    <a href={block.url || "#"} target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300 font-semibold block text-xs">{block.title || "اضغط هنا لفتح الرابط المرفق"}</a>
                                    {block.url && <p className="text-[10px] text-slate-500 font-mono text-left" dir="ltr">{block.url}</p>}
                                  </div>
                                )}
                              </div>
                            ))}
                            {editBlocks.length === 0 && <p className="text-xs text-slate-500 italic">لا توجد شرائح شرح مضافة للدرس بعد.</p>}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center p-16 border border-dashed border-slate-700 rounded-2xl text-xs text-slate-500 bg-[#1e293b]/30">
                  الرجاء تفعيل/اختيار صف من القائمة الجانبية اليمنى، ثم تحديد الدرس لبدء العرض والمزامنة اللحظية على البروجكتر.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== التبويب 2: إعداد وتحضير المناهج والامتحانات الرقمية ===================== */}
        {activeMainTab === 'curriculum' && (
          <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="border-b border-slate-700 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black">إعداد وتحضير المناهج والوحدات التفاعلية المستدامة</h3>
                <p className="text-xs text-slate-400 mt-1">اضغط على أرقام الخطوات بالدائرة العلوية للانتقال والرجوع بحرية بأي وقت</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <button type="button" onClick={() => setCurriculumStep(1)} className={`px-2 py-1 rounded-md transition-all ${curriculumStep === 1 ? 'bg-blue-600 text-white shadow' : 'bg-[#0f172a] text-slate-400 hover:text-slate-200'}`}>1. الصف</button>
                <button type="button" onClick={() => { if(curriculumClassId) setCurriculumStep(2); }} className={`px-2 py-1 rounded-md transition-all ${curriculumStep === 2 ? 'bg-blue-600 text-white shadow' : 'bg-[#0f172a] text-slate-400'}`} disabled={!curriculumClassId}>2. النوع</button>
                <button type="button" onClick={() => { if(curriculumClassId && curriculumMode) setCurriculumStep(3); }} className={`px-2 py-1 rounded-md transition-all ${curriculumStep === 3 ? 'bg-blue-600 text-white shadow' : 'bg-[#0f172a] text-slate-400'}`} disabled={!curriculumClassId || !curriculumMode}>3. المحتوى</button>
              </div>
            </div>

            {curriculumStep === 1 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400">اختر الصف الأكاديمي المستهدف:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {classes.map(c => (
                    <button key={c.id} onClick={() => { setCurriculumClassId(c.id); setCurriculumStep(2); }} className={`p-4 rounded-xl border text-right text-xs font-bold bg-[#0f172a] hover:bg-slate-800 text-white transition-all ${curriculumClassId === c.id ? 'border-blue-500' : 'border-slate-700'}`}>🏫 {c.name}</button>
                  ))}
                </div>
              </div>
            )}

            {curriculumStep === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-400">حدد غاية بناء المحتوى الحالي:</p>
                  <button type="button" onClick={() => setCurriculumStep(1)} className="text-xs flex items-center gap-1 text-blue-400 hover:underline"><ArrowLeft className="w-3.5 h-3.5" /> العودة للخطوة السابقة</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => { setCurriculumMode('lesson'); setCurriculumStep(3); }} className="p-6 rounded-2xl border-2 border-slate-700 text-right space-y-2 bg-[#0f172a] hover:border-blue-500 transition-all">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                    <h5 className="text-sm font-bold">📚 درس تفاعلي بشرائح وأسئلة تقييمية</h5>
                    <p className="text-[11px] text-slate-400">تحضير درس كامل يحتوي على فقرات، صور، روابط خارجية ومؤشرات بث مباشر.</p>
                  </button>
                  <button onClick={() => { setCurriculumMode('exam'); setCurriculumStep(3); }} className="p-6 rounded-2xl border-2 border-slate-700 text-right space-y-2 bg-[#0f172a] hover:border-purple-500 transition-all">
                    <ClipboardList className="w-6 h-6 text-purple-500" />
                    <h5 className="text-sm font-bold">📝 امتحان رقمي مستقل بمؤقت زمني</h5>
                    <p className="text-[11px] text-slate-400">بنك أسئلة مخصص للامتحانات الشهرية مع تفعيل ميزات منع الغش والخلط العشوائي.</p>
                  </button>
                </div>
              </div>
            )}

            {curriculumStep === 3 && (
              <form onSubmit={handleSaveFullCurriculum} className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="text-xs font-bold text-emerald-400">الخطوة الثالثة والأخيرة: صياغة المحتوى وإدراج التفاصيل</span>
                  <button type="button" onClick={() => setCurriculumStep(2)} className="text-xs flex items-center gap-1 text-blue-400 hover:underline"><ArrowLeft className="w-3.5 h-3.5" /> العودة للخطوة السابقة</button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-[#0f172a] border-slate-800">
                  <div>
                    <label className="text-xs font-bold block mb-1.5">الفصل الدراسي:</label>
                    <select value={curriculumSemester} onChange={(e) => setCurriculumSemester(e.target.value)} className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] text-white border-slate-700">
                      <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                      <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                    </select>
                  </div>
                  {curriculumMode === 'lesson' && (
                    <>
                      <div>
                        <label className="text-xs font-bold block mb-1.5">رقم الوحدة الأكاديمية:</label>
                        <input type="number" value={curriculumUnit} onChange={(e) => setCurriculumUnit(e.target.value)} className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] border-slate-700" />
                      </div>
                      <div>
                        <label className="text-xs font-bold block mb-1.5">رقم الدرس المنهجي:</label>
                        <input type="number" value={curriculumLessonNum} onChange={(e) => setCurriculumLessonNum(e.target.value)} className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] border-slate-700" />
                      </div>
                    </>
                  )}
                  <div className={curriculumMode === 'exam' ? 'sm:col-span-2' : ''}>
                    <label className="text-xs font-bold block mb-1.5">{curriculumMode === 'lesson' ? 'عنوان الدرس:' : 'عنوان الامتحان الاستدلالي:'}</label>
                    <input type="text" value={curriculumTitle} onChange={(e) => setCurriculumTitle(e.target.value)} placeholder="مثال: البوابات المنطقية المشتقة NAND / NOR" className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] border-slate-700" required />
                  </div>
                </div>

                {curriculumMode === 'exam' && (
                  <div className="p-4 rounded-xl border bg-[#0f172a] border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5"><Clock className="w-4 h-4" /> إعدادات التحكم الزمني ومكافحة الغش:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold block mb-1">مدة الامتحان (بالدقائق):</label>
                        <input type="number" value={examDuration} onChange={(e) => setExamDuration(e.target.value)} className="w-full p-2 rounded text-xs bg-[#1e293b] border-slate-700 text-emerald-400 font-bold" min="1" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold block mb-1">تاريخ ووقت إتاحة البدء (اختياري):</label>
                        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2 rounded text-xs bg-[#1e293b] border-slate-700" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold block mb-1">تاريخ ووقت انتهاء الصلاحية (اختياري):</label>
                        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2 rounded text-xs bg-[#1e293b] border-slate-700" />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-800 text-xs text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-purple-600" />
                        <span>خلط مبعثر لترتيب الأسئلة لكل طالب مستقل</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={shuffleChoices} onChange={(e) => setShuffleChoices(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-purple-600" />
                        <span>خلط عشوائي داخلي للخيارات الأربعة لكل سؤال</span>
                      </label>
                    </div>
                  </div>
                )}

                {curriculumMode === 'lesson' && (
                  <>
                    <div className="p-4 rounded-xl border bg-[#0f172a] border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-blue-400">1. مقدمة الدرس والتهيئة الأكاديمية:</h4>
                      <textarea rows={2} value={curriculumIntro} onChange={(e) => setCurriculumIntro(e.target.value)} placeholder="اكتب سؤالاً تفكيرياً أو نصاً جاذباً للتهيئة..." className="w-full p-3 rounded-lg text-xs bg-[#1e293b] border-slate-700" />
                    </div>

                    <div className="p-4 rounded-xl border bg-[#0f172a] border-slate-800 space-y-4">
                      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-bold text-blue-400">2. محتوى الشرح والأدوات التفاعلية المضافة (شرائح العرض):</h4>
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button" onClick={() => addCurriculumBlock('text')} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">+ فقرة شرح</button>
                          <button type="button" onClick={() => addCurriculumBlock('note')} className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">+ تنبيه هام</button>
                          <button type="button" onClick={() => addCurriculumBlock('image')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"><ImageIcon className="w-3 h-3" /> + صورة تعليمية</button>
                          <button type="button" onClick={() => addCurriculumBlock('link')} className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"><Link className="w-3 h-3" /> + رابط تفاعلي</button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {curriculumBlocks.map((block, i) => (
                          <div key={i} className="flex gap-2 items-start p-3 rounded-lg border border-slate-800 bg-[#1e293b]">
                            <span className="text-[10px] font-bold shrink-0 mt-2.5 px-2 py-0.5 rounded bg-slate-900 text-slate-400">#{i+1} {block.type === 'text' ? 'نص' : block.type === 'note' ? 'تنبيه' : block.type === 'image' ? 'صورة' : 'رابط'}</span>
                            <div className="flex-1 space-y-2">
                              {(block.type === 'image' || block.type === 'link') ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input type="text" value={block.url || ''} onChange={(e) => updateBlockField(i, 'url', e.target.value)} placeholder={block.type === 'image' ? "رابط مسار الصورة URL..." : "رابط موقع المحاكاة أو الويب خارجي..."} className="p-2 rounded text-xs bg-[#0f172a] text-white border-slate-880 font-mono" required />
                                  <input type="text" value={block.title || ''} onChange={(e) => updateBlockField(i, 'title', e.target.value)} placeholder={block.type === 'image' ? "تعليق توضيحي أسفل الصورة..." : "اسم الزر التفاعلي (مثال: افتح محاكي الدارات)"} className="p-2 rounded text-xs bg-[#0f172a] text-white border-slate-880" required />
                                </div>
                              ) : (
                                <textarea rows={2} value={block.value || ''} onChange={(e) => updateBlockField(i, 'value', e.target.value)} placeholder={block.type === 'note' ? "اكتب التنبيه الهام والملاحظة العريضة هنا للطلاب..." : "اكتب محتوى الشريحة التعليمية هنا بدعم كامل للـ Markdown..."} className="w-full p-2.5 rounded-lg text-xs bg-[#0f172a] border-slate-880 text-white" required />
                              )}
                            </div>
                            <button type="button" onClick={() => setCurriculumBlocks(curriculumBlocks.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-500 text-xs mt-2.5 font-bold hover:underline">حذف</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="p-4 rounded-xl border bg-[#0f172a] border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-purple-400">أسئلة بنك الاختيار من متعدد المقترنة:</h4>
                    <button type="button" onClick={addCurriculumQuestion} className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> إضافة سؤال جديد</button>
                  </div>
                  <div className="space-y-6">
                    {curriculumQuestions.map((q, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-750 bg-[#1e293b] space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-amber-500">سؤال رقم {i + 1}</span>
                          {curriculumQuestions.length > 1 && (
                            <button type="button" onClick={() => setCurriculumQuestions(curriculumQuestions.filter((_, idx) => idx !== i))} className="text-rose-400 text-[11px] font-bold">إزالة</button>
                          )}
                        </div>
                        <input type="text" value={q.questionText} onChange={(e) => { const copy = [...curriculumQuestions]; copy[i].questionText = e.target.value; setCurriculumQuestions(copy); }} placeholder="نص وصيغة السؤال الأكاديمي..." className="w-full p-2.5 rounded-lg text-xs bg-[#0f172a] border-slate-800" required />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input type="text" value={q.choice1} onChange={(e) => { const c = [...curriculumQuestions]; c[i].choice1 = e.target.value; setCurriculumQuestions(c); }} placeholder="خيار 1" className="p-2 rounded text-xs bg-[#0f172a] border-slate-800" required />
                          <input type="text" value={q.choice2} onChange={(e) => { const c = [...curriculumQuestions]; c[i].choice2 = e.target.value; setCurriculumQuestions(c); }} placeholder="خيار 2" className="p-2 rounded text-xs bg-[#0f172a] border-slate-800" required />
                          <input type="text" value={q.choice3} onChange={(e) => { const c = [...curriculumQuestions]; c[i].choice3 = e.target.value; setCurriculumQuestions(c); }} placeholder="خيار 3" className="p-2 rounded text-xs bg-[#0f172a] border-slate-800" required />
                          <input type="text" value={q.choice4} onChange={(e) => { const c = [...curriculumQuestions]; c[i].choice4 = e.target.value; setCurriculumQuestions(c); }} placeholder="خيار 4" className="p-2 rounded text-xs bg-[#0f172a] border-slate-800" required />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <label className="text-xs font-bold">تحديد مفتاح الإجابة الصحيحة:</label>
                          <select value={q.correctAnswer} onChange={(e) => { const copy = [...curriculumQuestions]; copy[i].correctAnswer = e.target.value; setCurriculumQuestions(copy); }} className="p-1.5 rounded text-xs bg-[#0f172a] text-emerald-400 border-slate-850 font-bold">
                            <option value="1">خيار 1</option>
                            <option value="2">خيار 2</option>
                            <option value="3">خيار 3</option>
                            <option value="4">خيار 4</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all">
                  <Check className="w-4 h-4" /> حفظ وإدراج المحتوى في النظام السحابي للمدرسة
                </button>
              </form>
            )}
          </div>
        )}

        {/* ===================== التبويب 3: لوحة التحكم بالامتحانات والنتائج ===================== */}
        {activeMainTab === 'exams' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-xs font-bold text-blue-500 flex items-center gap-1"><ClipboardList className="w-4 h-4" /> الامتحانات الرقمية المستقلة المتاحة</h3>
              {exams.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">لا توجد امتحانات رقمية محفوظة حالياً.</p>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {exams.map(ex => {
                    const targetClass = classes.find(c => c.id === ex.classId);
                    const stats = getExamStats(ex.id);
                    return (
                      <div key={ex.id} className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${selectedExamForStats?.id === ex.id ? 'bg-slate-950 border-purple-500' : 'bg-[#0f172a] border-slate-850'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold">{targetClass ? targetClass.name : 'كل الصفوف'}</span>
                            <h4 className="text-xs font-bold mt-1 text-slate-100">{ex.title}</h4>
                          </div>
                          <button onClick={() => handleDeleteExam(ex.id)} className="text-rose-400 hover:text-rose-500 p-1 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                          <span>⏱️ {ex.duration} دقيقة</span>
                          <span>👥 مسلّمين: {stats.count}</span>
                          <button onClick={() => setSelectedExamForStats(ex)} className="text-blue-400 hover:underline font-bold flex items-center gap-0.5"><BarChart2 className="w-3 h-3" /> تحليل النتائج</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`lg:col-span-2 p-5 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'} space-y-6`}>
              {selectedExamForStats ? (
                <>
                  <div className="border-b border-slate-700 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black text-purple-400">تحليلات ذكية ولوحة نتائج: {selectedExamForStats.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">صف: {classes.find(c => c.id === selectedExamForStats.classId)?.name || 'غير محدد'}</p>
                    </div>
                    <button onClick={() => setSelectedExamForStats(null)} className="text-xs text-blue-400 hover:underline">إغلاق التحليلات</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 text-center">
                      <span className="text-xs text-slate-400 block">المعدل العام لعلامات الطلاب</span>
                      <span className="text-2xl font-black text-emerald-400 mt-1 block">{getExamStats(selectedExamForStats.id).avg} <span className="text-xs text-slate-400">/ {selectedExamForStats.questions?.length || 0}</span></span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 text-center">
                      <span className="text-xs text-slate-400 block">إجمالي عدد الطلاب الذين سلّموا</span>
                      <span className="text-2xl font-black text-blue-400 mt-1 block">{getExamStats(selectedExamForStats.id).count} طلاب</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1">⚠️ ترتيب الأسئلة الأكثر خطأً (تحتاج مراجعة داخل الصف):</h4>
                    {getExamStats(selectedExamForStats.id).hardQuestions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-2">لم يتم رصد أخطاء متكررة بعد.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {getExamStats(selectedExamForStats.id).hardQuestions.map((hq, i) => {
                          const questionObj = selectedExamForStats.questions?.[hq.index];
                          return (
                            <div key={i} className="p-3 rounded-lg bg-[#1e293b] border border-rose-955/40 flex justify-between items-center">
                              <div className="space-y-1">
                                <span className="font-bold text-amber-500">سؤال #{hq.index + 1}:</span>
                                <p className="text-slate-200">{questionObj ? questionObj.text : 'محتوى السؤال غير متوفر'}</p>
                              </div>
                              <span className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded font-bold shrink-0 border border-rose-500/20">{hq.count} أخطاء</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center p-12 text-slate-500 text-xs italic">الرجاء تحديد امتحان من القائمة الجانبية اليمنى لاستعراض متوسط الدرجات والأسئلة الأكثر خطأً للطلاب.</div>
              )}
            </div>
          </div>
        )}

        {/* ===================== التبويب 4: إدارة الطلاب والصفوف ===================== */}
        {activeMainTab === 'management' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-xs font-bold flex items-center gap-1">🏫 إدارة وتصفية الصفوف</h3>
              <form onSubmit={handleAddClass} className="flex gap-2">
                <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="اسم الصف الجديد" className="flex-1 p-2.5 rounded-lg text-xs bg-[#0f172a] border-slate-700 text-white" />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg shadow transition-all"><Plus className="w-4 h-4" /></button>
              </form>
              <div className="space-y-2 pt-2 border-t border-slate-700/30">
                <button onClick={() => setManagementSelectedClass(null)} className={`w-full text-right p-2.5 rounded-xl text-xs font-bold border ${!managementSelectedClass ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#0f172a] border-slate-800 text-slate-300'}`}>🌐 عرض كافة طلاب المدرسة</button>
                {classes.map(c => (
                  <div key={c.id} className="flex gap-1 items-center">
                    <button onClick={() => setManagementSelectedClass(c)} className={`flex-1 text-right p-2.5 rounded-xl text-xs font-bold border ${managementSelectedClass?.id === c.id ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#0f172a] border-slate-800 text-slate-300'}`}>🏫 {c.name}</button>
                    <button type="button" onClick={() => handleDeleteClass(c.id)} className="p-2.5 bg-rose-955/20 hover:bg-rose-900 text-rose-500 border border-rose-900/30 rounded-xl transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`lg:col-span-2 p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-xs font-bold flex items-center gap-1"><UserPlus className="w-4 h-4" /> تسجيل وقيد طالب جديد</h3>
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border bg-slate-900/30 border-slate-800 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">اسم الطالب الكامل:</label>
                  <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="اسم الطالب" className="w-full p-2.5 rounded-lg text-xs bg-[#0f172a] text-white border-slate-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">تسكين الصف المرتبط:</label>
                  <select value={newStudentClassId} onChange={(e) => setNewStudentClassId(e.target.value)} className="w-full p-2.5 rounded-lg text-xs bg-[#0f172a] text-white border-slate-700">
                    <option value="">-- اختر الصف --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all"><Plus className="w-3.5 h-3.5" /> قيد الطالب</button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="p-2.5">اسم الطالب الكامل</th>
                      <th className="p-2.5">الصف الأكاديمي المرتبط</th>
                      <th className="p-2.5 text-center">العمليات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(std => {
                      const associatedClass = classes.find(c => c.id === std.classId);
                      return (
                        <tr key={std.id} className="border-b border-slate-800/60 hover:bg-slate-850/20">
                          <td className="p-2.5 font-bold text-slate-200">{std.fullName}</td>
                          <td className="p-2.5 text-blue-400 font-semibold">{associatedClass ? associatedClass.name : "غير مسكن بصف"}</td>
                          <td className="p-2.5 text-center">
                            <button onClick={async () => { if(confirm("حذف حساب الطالب؟")) await deleteDoc(doc(db, "users", std.id)) }} className="text-rose-400 hover:text-rose-500 font-bold hover:underline transition-all">شطب الحساب</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}