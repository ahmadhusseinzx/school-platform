import React, { useState, useEffect } from 'react';
import { db, rtdb, auth } from '../services/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { BookOpen, Radio, Award, ChevronLeft, ChevronRight, HelpCircle, AlertCircle, LogOut, CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function StudentDashboard({ userProfile }) {
  const [studentData, setStudentData] = useState(userProfile || null);
  const [activeTab, setActiveTab] = useState('live'); // live, archive, performance
  
  // حالات البث اللحظي
  const [liveStep, setLiveStep] = useState(1);
  const [liveSlide, setLiveSlide] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(null);

  // حالات الامتحانات والحل الفوري للطالب
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // حالات الأرشيف والدراسة الذاتية
  const [archiveLessons, setArchiveLessons] = useState([]);
  const [selectedArchiveLesson, setSelectedArchiveLesson] = useState(null);
  const [archiveSlideIndex, setArchiveSlideIndex] = useState(0);

  // جلب وتأكيد تفاصيل الملف الشخصي
  useEffect(() => {
    if (!studentData) {
      const fetchStudentProfile = async () => {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) setStudentData(userDoc.data());
        }
      };
      fetchStudentProfile();
    }
  }, [studentData]);

  // المزامنة اللحظية مع RTDB والـ Firestore للصف المرتبط
  useEffect(() => {
    if (studentData?.classId) {
      const liveRef = ref(rtdb, `lessons/${studentData.classId}`);
      const unsubscribeRTDB = onValue(liveRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setLiveStep(Number(data.currentStep || 1));
          setLiveSlide(Number(data.currentSlide || 0));
        }
      });

      const lessonsQuery = query(collection(db, "lessons"), where("classId", "==", studentData.classId));
      const unsubscribeLessons = onSnapshot(lessonsQuery, (snapshot) => {
        const lessons = [];
        snapshot.forEach(doc => lessons.push({ id: doc.id, ...doc.data() }));
        if (lessons.length > 0) {
          lessons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setCurrentLesson(lessons[0]);
          setArchiveLessons(lessons);
        }
      });

      return () => {
        unsubscribeRTDB();
        unsubscribeLessons();
      };
    }
  }, [studentData]);

  // تصفير خيارات الإجابة في حال غيّر المعلم الدرس أو الخطوة الحية
  useEffect(() => {
    setSelectedAnswers({});
    setExamSubmitted(false);
    setScore(0);
  }, [liveStep, currentLesson]);

  // تسليم ورقة التقييم لـ Firestore
  const handleSubmitExam = async () => {
    if (!currentLesson || !currentLesson.questions) return;
    let totalCorrect = 0;
    currentLesson.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) totalCorrect++;
    });
    setScore(totalCorrect);
    setExamSubmitted(true);

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await setDoc(doc(db, "submissions", `${currentUser.uid}_${currentLesson.id}`), {
          studentId: currentUser.uid,
          studentName: studentData?.fullName || "طالب مسجل",
          lessonId: currentLesson.id,
          lessonTitle: currentLesson.title,
          classId: studentData.classId,
          score: totalCorrect,
          totalQuestions: currentLesson.questions.length,
          submittedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("خطأ في تسجيل النتيجة بالخادم:", err);
      }
    }
  };

  const handleLogout = () => auth.signOut();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans select-none" dir="rtl">
      
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-6 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold">{studentData?.fullName || "جاري التحميل..."}</h1>
              <p className="text-xs text-slate-400">بوابة التعلم الرقمي المباشر والأرشيف</p>
            </div>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button onClick={() => setActiveTab('live')} className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" /> الحصة المباشرة
            </button>
            <button onClick={() => setActiveTab('archive')} className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${activeTab === 'archive' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              📚 أرشيف المذاكرة
            </button>
            <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${activeTab === 'performance' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              🏅 سجل تحصيلي
            </button>
          </div>

          <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* 1️⃣ الحصة المباشرة */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            {!currentLesson ? (
              <div className="text-center p-12 bg-slate-800 rounded-2xl border border-slate-700">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">ينتظر النظام بث المعلم لأولى الحصص التفاعلية...</p>
              </div>
            ) : (
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                  <div>
                    <span className="text-[10px] bg-blue-900/40 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-md font-bold">الوحدة {currentLesson.unitNumber} • الدرس {currentLesson.lessonNumber}</span>
                    <h2 className="text-base font-bold text-slate-200 mt-1">{currentLesson.title}</h2>
                  </div>
                  <div className="text-xs bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-750">
                    {liveStep === 1 && <span className="text-amber-400 font-semibold">وضع: التمهيد والأنشطة</span>}
                    {liveStep === 2 && <span className="text-blue-400 font-semibold">وضع: الشرح (شريحة {liveSlide + 1})</span>}
                    {liveStep === 3 && <span className="text-purple-400 font-semibold">وضع: التقييم التفاعلي</span>}
                  </div>
                </div>

                <div className="min-h-[200px]">
                  {liveStep === 1 && (
                    <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-750 whitespace-pre-line leading-relaxed text-xs text-slate-300">
                      <h4 className="font-bold text-amber-400 mb-2">نشاط استهلالي وتمهيد:</h4>
                      {currentLesson.introduction}
                    </div>
                  )}

                  {liveStep === 2 && currentLesson.blocks?.[liveSlide] && (
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-750 space-y-4">
                      {currentLesson.blocks[liveSlide].type === 'note' && (
                        <div className="bg-amber-950/40 text-amber-300 p-4 rounded-lg border border-amber-900/60 flex gap-2 items-start text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>{currentLesson.blocks[liveSlide].value}</p>
                        </div>
                      )}
                      
                      {(currentLesson.blocks[liveSlide].type === 'text' || !currentLesson.blocks[liveSlide].type) && (
                        <div className="prose prose-invert max-w-none text-right leading-relaxed text-slate-300 text-xs">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {currentLesson.blocks[liveSlide].value}
                          </ReactMarkdown>
                        </div>
                      )}

                      {currentLesson.blocks[liveSlide].type === 'image' && (
                        <div className="text-center space-y-2">
                          <img src={currentLesson.blocks[liveSlide].url} alt={currentLesson.blocks[liveSlide].title} className="max-h-80 mx-auto rounded-lg object-contain bg-slate-950 border border-slate-700" />
                          {currentLesson.blocks[liveSlide].title && <p className="text-xs text-slate-400 font-medium">📊 {currentLesson.blocks[liveSlide].title}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {liveStep === 3 && (
                    <div className="space-y-6">
                      <p className="text-xs text-purple-400 font-bold">البدء بحل الأسئلة التقييمية الفورية التالية:</p>
                      {currentLesson.questions?.map((q, qIdx) => (
                        <div key={qIdx} className="bg-slate-900 p-4 rounded-xl border border-slate-750 space-y-3 text-xs">
                          <p className="font-bold text-slate-200"><span className="text-purple-400 ml-1">س{qIdx + 1}:</span> {q.text}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedAnswers[qIdx] === optIdx;
                              const isCorrect = q.correctAnswer === optIdx;
                              let optStyle = "bg-slate-850 border-slate-700 text-slate-300";
                              if (!examSubmitted && isSelected) optStyle = "bg-blue-950 border-blue-500 text-blue-300";
                              if (examSubmitted) {
                                if (isCorrect) optStyle = "bg-emerald-950 border-emerald-500 text-emerald-400 font-semibold";
                                else if (isSelected && !isCorrect) optStyle = "bg-rose-950 border-rose-500 text-rose-400";
                              }
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={examSubmitted}
                                  onClick={() => setSelectedAnswers({ ...selectedAnswers, [qIdx]: optIdx })}
                                  className={`w-full text-right p-3 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 ${optStyle}`}
                                >
                                  <span>{opt}</span>
                                  {examSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                                  {examSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {!examSubmitted ? (
                        <button type="button" onClick={handleSubmitExam} disabled={Object.keys(selectedAnswers).length < (currentLesson.questions?.length || 0)} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-3 rounded-xl transition-all disabled:opacity-40 shadow-lg">
                          إرسال التقرير النهائي للأنظمة
                        </button>
                      ) : (
                        <div className="bg-slate-900 border border-slate-750 p-4 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">تم إنهاء وتصحيح الامتحان بنجاح</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">حصلت على نتيجة {score} من أصل {currentLesson.questions?.length || 0} أسئلة.</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-base font-black text-emerald-400">{(((score / (currentLesson.questions?.length || 1)) * 100)).toFixed(0)}%</span>
                            <span className="text-xs text-slate-500">النتيجة</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2️⃣ أرشيف المذاكرة والدراسة الذاتية */}
        {activeTab === 'archive' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 h-fit space-y-3">
              <h3 className="text-xs font-bold text-slate-400 border-b border-slate-700 pb-2">📚 الفهرس والمراجع الذاتية</h3>
              {archiveLessons.map((les) => (
                <div 
                  key={les.id}
                  onClick={() => { setSelectedArchiveLesson(les); setArchiveSlideIndex(0); }}
                  className={`p-3 rounded-xl cursor-pointer border text-right transition-all ${selectedArchiveLesson?.id === les.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900/60 border-slate-750 text-slate-300 hover:border-slate-600'}`}
                >
                  <p className="text-[10px] opacity-70">الوحدة {les.unitNumber} • الدرس {les.lessonNumber}</p>
                  <p className="text-xs font-bold mt-0.5">{les.title}</p>
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              {selectedArchiveLesson ? (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-6 shadow-xl">
                  <div className="border-b border-slate-700 pb-4">
                    <h2 className="text-sm font-bold text-blue-400">{selectedArchiveLesson.title}</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">أنت الآن في وضع المراجعة الذاتية المستقلة.</p>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-xl border border-slate-750 min-h-[150px]">
                    {selectedArchiveLesson.blocks?.[archiveSlideIndex] ? (
                      <div className="prose prose-invert max-w-none text-right text-xs leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedArchiveLesson.blocks[archiveSlideIndex].value}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">لا يوجد محتوى مدرج في هذه الشريحة.</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button 
                      disabled={archiveSlideIndex === 0}
                      onClick={() => setArchiveSlideIndex(p => p - 1)}
                      className="bg-slate-900 hover:bg-slate-750 disabled:opacity-20 border border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" /> الشريحة السابقة
                    </button>
                    <span className="text-xs text-slate-400">شريحة {archiveSlideIndex + 1} من {selectedArchiveLesson.blocks?.length || 1}</span>
                    <button 
                      disabled={archiveSlideIndex === (selectedArchiveLesson.blocks?.length || 1) - 1}
                      onClick={() => setArchiveSlideIndex(p => p + 1)}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-20 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      الشريحة التالية <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 bg-slate-800 rounded-2xl border border-slate-700 border-dashed">
                  <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">الرجاء اختيار أحد الدروس من الفهرس الجانبي لبدء المذاكرة.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3️⃣ السجل الأكاديمي والتحصيل */}
        {activeTab === 'performance' && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200">سجل الدرجات والتحصيل الأكاديمي</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">يتم هنا حفظ كافة علاماتك المستلمة فورياً من الامتحانات التفاعلية لمراجعة أدائك المستمر.</p>
            
            <div className="bg-slate-900 border border-slate-750 rounded-xl p-4 text-center text-xs text-slate-500 italic">
              سيتم عرض قائمة كاملة بالدرجات المخزنة في حقل الإرساليات (Submissions) قريباً.
            </div>
          </div>
        )}

      </main>
    </div>
  );
}