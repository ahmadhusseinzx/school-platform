import React, { useState, useEffect, useRef } from 'react';
import { db, rtdb } from '../services/firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { GraduationCap, Sun, Moon, Video, BookOpen, ClipboardList, Users, BarChart2, User } from 'lucide-react';

// استيراد المكونات الجديدة
import DashboardHome from '../components/teacher/dashboard/DashboardHome';
import LiveSidebar from '../components/teacher/live/LiveSidebar';
import LiveControls from '../components/teacher/live/LiveControls';
import Presentation from '../components/teacher/live/Presentation';
import LessonEditor from '../components/teacher/live/LessonEditor';
import LessonPreview from '../components/teacher/live/LessonPreview';
import CurriculumWizard from '../components/teacher/curriculum/CurriculumWizard';
import ExamsPage from '../components/teacher/exams/ExamsPage';
import ClassesManager from '../components/teacher/management/ClassesManager';
import StudentsManager from '../components/teacher/management/StudentsManager';
import TeacherInfo from '../components/teacher/TeacherInfo'; // ⭐ التبويب الجديد
export default function TeacherDashboard() {
  // --- حالات التحكم الأساسية ---
  const [darkMode, setDarkMode] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('dashboard');

  // --- بيانات Firestore ---
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [examSubmissions, setExamSubmissions] = useState([]);

  // --- بيانات المعلم ---
  const [teacherId, setTeacherId] = useState('teacher_001'); // سيتم جلبها من المصادقة
  const [currentUser, setCurrentUser] = useState({
    displayName: 'المهندس أحمد حسين',
    email: 'ahmed.hussein@school.com'
  });

  // --- حالات البث والتحكم اللحظي ---
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editIntro, setEditIntro] = useState("");
  const [editBlocks, setEditBlocks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newLiveBlockType, setNewLiveBlockType] = useState('text');
  const [presentFullscreen, setPresentFullscreen] = useState(false);
  const presentRef = useRef(null);

  // --- حالات إدارة الصفوف والطلاب ---
  const [managementSelectedClass, setManagementSelectedClass] = useState(null);

  // --- حالات الامتحانات ---
  const [selectedExamForStats, setSelectedExamForStats] = useState(null);

  // --- جلب البيانات من Firestore ---
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
      unsubClasses();
      unsubUsers();
      unsubLessons();
      unsubExams();
      unsubSubmissions();
    };
  }, []);

  // --- دوال مساعدة للبث ---
  const filteredLessons = lessons.filter(l => l.classId === selectedClass?.id)
    .sort((a, b) => a.lessonNumber - b.lessonNumber);

  const syncLiveStatus = (step, slide) => {
    if (!selectedClass || !selectedLesson) return;
    set(ref(rtdb, `lessons/${selectedClass.id}`), {
      lessonId: selectedLesson.id,
      currentStep: step,
      currentSlide: slide
    });
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setEditTitle(lesson.title);
    setEditIntro(lesson.introduction || "");
    setEditBlocks(lesson.blocks || []);
    setCurrentStep(1);
    setCurrentSlide(0);
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

  // --- دوال الامتحانات ---
  const getExamStats = (examId) => {
    const subs = examSubmissions.filter(s => s.examId === examId);
    if (subs.length === 0) return { count: 0, avg: 0, hardQuestions: [] };

    const totalScore = subs.reduce((acc, curr) => acc + curr.score, 0);
    const avg = (totalScore / subs.length).toFixed(1);

    const exam = exams.find(e => e.id === examId);
    const wrongCounts = {};
    if (exam && exam.questions) {
      exam.questions.forEach((_, idx) => wrongCounts[idx] = 0);
      subs.forEach(sub => {
        if (sub.wrongQuestionIndexes) {
          sub.wrongQuestionIndexes.forEach(idx => {
            if (wrongCounts[idx] !== undefined) wrongCounts[idx]++;
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

  const handleDeleteExam = async (examId) => {
    if (!confirm("هل أنت متأكد من حذف هذا الامتحان نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "exams", examId));
      if (selectedExamForStats?.id === examId) setSelectedExamForStats(null);
    } catch (error) {
      alert("خطأ في حذف الامتحان: " + error.message);
    }
  };

  // --- التبديل بين علامات التبويب ---
  const renderMainContent = () => {
    switch (activeMainTab) {
      case 'dashboard':
        return <DashboardHome darkMode={darkMode} setActiveMainTab={setActiveMainTab} />;

      case 'live':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <LiveSidebar
              classes={classes}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              selectedLesson={selectedLesson}
              handleSelectLesson={handleSelectLesson}
              filteredLessons={filteredLessons}
            />

            <div className="lg:col-span-3 space-y-6">
              {selectedLesson ? (
                <>
                  <div className="p-4 rounded-2xl border flex flex-wrap gap-3 items-center justify-between bg-[#1e293b] border-slate-700">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                        {selectedClass?.name}
                      </span>
                      <h2 className="text-xs font-bold mt-1 text-slate-300">
                        الدرس النشط حالياً: <span className="text-white font-black">{selectedLesson.title}</span>
                      </h2>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
                    >
                      {isEditing ? "إلغاء التعديل" : "تعديل السلايدات الفوري"}
                    </button>
                  </div>

                  {isEditing ? (
                    <LessonEditor
                      editBlocks={editBlocks}
                      setEditBlocks={setEditBlocks}
                      currentSlide={currentSlide}
                      setCurrentSlide={setCurrentSlide}
                      newLiveBlockType={newLiveBlockType}
                      setNewLiveBlockType={setNewLiveBlockType}
                      saveLessonUpdates={saveLessonUpdates}
                      selectedLesson={selectedLesson}
                    />
                  ) : (
                    <>
                      <LiveControls
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        syncLiveStatus={syncLiveStatus}
                        currentSlide={currentSlide}
                        handleNextSlide={handleNextSlide}
                        handlePrevSlide={handlePrevSlide}
                        editBlocks={editBlocks}
                      />

                      <Presentation
                        currentStep={currentStep}
                        editIntro={editIntro}
                        editBlocks={editBlocks}
                        currentSlide={currentSlide}
                        presentFullscreen={presentFullscreen}
                        setPresentFullscreen={setPresentFullscreen}
                        presentRef={presentRef}
                      />

                      <LessonPreview
                        darkMode={darkMode}
                        editIntro={editIntro}
                        editBlocks={editBlocks}
                      />
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
        );

      case 'curriculum':
        return (
          <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="border-b border-slate-700 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black">إعداد وتحضير المناهج والوحدات التفاعلية المستدامة</h3>
                <p className="text-xs text-slate-400 mt-1">اضغط على أرقام الخطوات بالدائرة العلوية للانتقال والرجوع بحرية بأي وقت</p>
              </div>
            </div>
            <CurriculumWizard classes={classes} darkMode={darkMode} />
          </div>
        );

      case 'exams':
        return (
          <ExamsPage
            darkMode={darkMode}
            exams={exams}
            classes={classes}
            examSubmissions={examSubmissions}
            getExamStats={getExamStats}
            handleDeleteExam={handleDeleteExam}
            setSelectedExamForStats={setSelectedExamForStats}
            selectedExamForStats={selectedExamForStats}
          />
        );

      case 'management':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ClassesManager
              darkMode={darkMode}
              classes={classes}
              managementSelectedClass={managementSelectedClass}
              setManagementSelectedClass={setManagementSelectedClass}
            />
            <StudentsManager
              darkMode={darkMode}
              classes={classes}
              students={students}
              managementSelectedClass={managementSelectedClass}
            />
          </div>
        );

      // ⭐ تبويب معلومات المعلم الجديد
      case 'teacher':
        return (
          <TeacherInfo
            darkMode={darkMode}
            classes={classes}
            teacherId={teacherId}
            currentUser={currentUser}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-800'}`} dir="rtl">

      {/* الهيدر */}
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

          {/* أزرار التبويبات */}
          <div className={`flex p-1 rounded-xl border flex-wrap justify-center ${darkMode ? 'bg-slate-950/40 border-slate-700/50' : 'bg-slate-200/60 border-slate-300'}`}>
            <button
              onClick={() => setActiveMainTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> لوحة التحكم
            </button>
            <button
              onClick={() => setActiveMainTab('live')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'live' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
            >
              <Video className="w-3.5 h-3.5" /> البث والتحكم اللحظي
            </button>
            <button
              onClick={() => setActiveMainTab('curriculum')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'curriculum' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
            >
              <BookOpen className="w-3.5 h-3.5" /> إعداد وتحضير المناهج
            </button>
            <button
              onClick={() => setActiveMainTab('exams')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'exams' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> الامتحانات والنتائج
            </button>
            <button
              onClick={() => setActiveMainTab('management')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'management' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
            >
              <Users className="w-3.5 h-3.5" /> إدارة الصفوف والطلاب
            </button>
            {/* ⭐ تبويب معلومات المعلم الجديد */}
            <button
              onClick={() => setActiveMainTab('teacher')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeMainTab === 'teacher' ? 'bg-blue-600 text-white shadow' : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
            >
              <User className="w-3.5 h-3.5" /> معلومات المعلم
            </button>
          </div>

          {/* زر الـ Dark Mode */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-amber-400' : 'bg-slate-100 border-slate-300 text-purple-700'}`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {renderMainContent()}
      </main>

    </div>
  );
}