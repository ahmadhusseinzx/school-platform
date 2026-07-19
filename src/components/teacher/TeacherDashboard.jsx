// src/components/teacher/TeacherDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db, rtdb } from '../../services/firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { 
  GraduationCap, Sun, Moon, Video, BookOpen, ClipboardList, 
  Users, BarChart2, User, LayoutDashboard, LogOut
} from 'lucide-react';

// استيراد المكونات
import DashboardHome from './dashboard/DashboardHome';
import LiveSidebar from './live/LiveSidebar';
import LiveControls from './live/LiveControls';
import Presentation from './live/Presentation';
import LessonEditor from './live/LessonEditor';
import LessonPreview from './live/LessonPreview';
import CurriculumWizard from './curriculum/CurriculumWizard';
import ExamsPage from './exams/ExamsPage';
import ClassesManager from './management/ClassesManager';
import StudentsManager from './management/StudentsManager';

export default function TeacherDashboard() {
  const { userData, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('dashboard');

  // --- البيانات ---
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [examSubmissions, setExamSubmissions] = useState([]);

  // --- البث المباشر ---
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editIntro, setEditIntro] = useState("");
  const [editBlocks, setEditBlocks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newLiveBlockType, setNewLiveBlockType] = useState('text');
  const [presentFontSize, setPresentFontSize] = useState(24);
  const [presentFullscreen, setPresentFullscreen] = useState(false);
  const presentRef = useRef(null);

  // --- إدارة ---
  const [managementSelectedClass, setManagementSelectedClass] = useState(null);

  // --- الامتحانات ---
  const [selectedExamForStats, setSelectedExamForStats] = useState(null);

  // ============ جلب البيانات ============
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

  // ============ دوال البث المباشر ============
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

  // ============ دوال الامتحانات ============
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

  const handleDeleteExam = async (examId) => {
    if(!confirm("هل أنت متأكد من حذف هذا الامتحان نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "exams", examId));
      if(selectedExamForStats?.id === examId) setSelectedExamForStats(null);
    } catch (error) {
      alert("خطأ في حذف الامتحان: " + error.message);
    }
  };

  // ============ دوال المناهج ============
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

  // ============ دوال التحرير ============
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

  // ============ عرض التبويبات ============
  const renderContent = () => {
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
                  <div className={`p-4 rounded-2xl border flex flex-wrap gap-3 items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">{selectedClass?.name}</span>
                      <h2 className="text-xs font-bold mt-1 text-slate-300">الدرس النشط: <span className="text-white font-black">{selectedLesson.title}</span></h2>
                    </div>
                    <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all">
                      {isEditing ? "إلغاء التعديل" : "تعديل السلايدات"}
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
                      moveBlock={moveBlock}
                      updateBlockValue={updateBlockValue}
                      updateEditBlockField={updateEditBlockField}
                      addBlockToLiveLesson={addBlockToLiveLesson}
                      deleteLiveBlock={deleteLiveBlock}
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
                        presentFontSize={presentFontSize}
                        setPresentFontSize={setPresentFontSize}
                        togglePresentFullscreen={togglePresentFullscreen}
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
                <div className="text-center p-16 border border-dashed border-slate-700 rounded-2xl text-slate-500">
                  الرجاء اختيار صف ودرس لبدء البث المباشر
                </div>
              )}
            </div>
          </div>
        );

      case 'curriculum':
        return (
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="border-b border-slate-700 pb-3 mb-6">
              <h3 className="text-sm font-black">إعداد وتحضير المناهج</h3>
              <p className="text-xs text-slate-400">أنشئ دروساً وامتحانات تفاعلية</p>
            </div>
            <CurriculumWizard 
              classes={classes} 
              darkMode={darkMode}
              curriculumStep={curriculumStep}
              setCurriculumStep={setCurriculumStep}
              curriculumMode={curriculumMode}
              setCurriculumMode={setCurriculumMode}
              curriculumClassId={curriculumClassId}
              setCurriculumClassId={setCurriculumClassId}
              curriculumSemester={curriculumSemester}
              setCurriculumSemester={setCurriculumSemester}
              curriculumUnit={curriculumUnit}
              setCurriculumUnit={setCurriculumUnit}
              curriculumLessonNum={curriculumLessonNum}
              setCurriculumLessonNum={setCurriculumLessonNum}
              curriculumTitle={curriculumTitle}
              setCurriculumTitle={setCurriculumTitle}
              curriculumIntro={curriculumIntro}
              setCurriculumIntro={setCurriculumIntro}
              examDuration={examDuration}
              setExamDuration={setExamDuration}
              startTime={startTime}
              setStartTime={setStartTime}
              endTime={endTime}
              setEndTime={setEndTime}
              shuffleQuestions={shuffleQuestions}
              setShuffleQuestions={setShuffleQuestions}
              shuffleChoices={shuffleChoices}
              setShuffleChoices={setShuffleChoices}
              curriculumBlocks={curriculumBlocks}
              setCurriculumBlocks={setCurriculumBlocks}
              curriculumQuestions={curriculumQuestions}
              setCurriculumQuestions={setCurriculumQuestions}
              addCurriculumBlock={addCurriculumBlock}
              updateBlockField={updateBlockField}
              addCurriculumQuestion={addCurriculumQuestion}
              handleSaveFullCurriculum={handleSaveFullCurriculum}
            />
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

      default:
        return <DashboardHome darkMode={darkMode} setActiveMainTab={setActiveMainTab} />;
    }
  };

  // ============ التبويبات ============
  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'live', label: 'البث المباشر', icon: Video },
    { id: 'curriculum', label: 'المناهج', icon: BookOpen },
    { id: 'exams', label: 'الامتحانات', icon: ClipboardList },
    { id: 'management', label: 'الإدارة', icon: Users },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`} dir="rtl">
      
      <header className={`sticky top-0 z-50 border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold flex items-center gap-2">
                بوابة المعلم
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {userData?.fullName || 'معلم'}
                </span>
              </h1>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>المنصة التعليمية الذكية</p>
            </div>
          </div>

          <div className={`flex p-1 rounded-xl border flex-wrap ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMainTab === tab.id
                    ? 'bg-blue-600 text-white shadow'
                    : darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-amber-400' : 'bg-slate-200 border-slate-300 text-purple-700'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-rose-400 hover:bg-rose-900/20' : 'bg-slate-200 border-slate-300 text-rose-600 hover:bg-rose-100'}`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {renderContent()}
      </main>
    </div>
  );
}