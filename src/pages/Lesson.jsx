import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, rtdb, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { 
  BookOpen, Clock, FileText, AlertTriangle, ExternalLink, 
  HelpCircle, ChevronRight, ChevronLeft, CheckCircle2, XCircle, ArrowRight, Loader2 
} from 'lucide-react';

export default function Lesson() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0); // الشريحة الحالية داخل خطوة الشرح
  const [latestLesson, setLatestLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // 1. الاستماع اللحظي للخطوة والشريحة من RTDB
  useEffect(() => {
    if (!classId) return;

    const lessonStatusRef = ref(rtdb, `lessons/${classId}`);
    const unsubscribeRTDB = onValue(lessonStatusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.currentStep) setCurrentStep(Number(data.currentStep));
        if (data.currentSlide !== undefined) setCurrentSlide(Number(data.currentSlide));
      }
    });

    return () => unsubscribeRTDB();
  }, [classId]);

  // 2. جلب بيانات الدرس من Firestore
  useEffect(() => {
    if (!classId) return;

    const lessonsRef = collection(db, "lessons");
    const q = query(lessonsRef, where("classId", "==", classId));

    const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
      const lessons = [];
      querySnapshot.forEach((doc) => {
        lessons.push({ id: doc.id, ...doc.data() });
      });

      if (lessons.length > 0) {
        lessons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLatestLesson(lessons[0]);
      } else {
        setLatestLesson(null);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [classId]);

  // دالة تنظيف كود المخرجات المشوهة من الذكاء الاصطناعي (مثل لغات البرمجة والرموز الزائدة)
  const formatText = (text) => {
    if (!text) return "";
    return text
      .replace(/\\text\s*\{([^}]+)\}/g, '$1') // تنظيف صيغ LaTeX المستعصية مثل \text{ AND }
      .replace(/[\$\\]/g, ''); // إزالة علامات الدولار والباك-سلاش الزائدة
  };

  const handleSubmitExam = async () => {
    if (!latestLesson || !latestLesson.questions) return;
    let totalCorrect = 0;
    latestLesson.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) totalCorrect++;
    });
    setScore(totalCorrect);
    setExamSubmitted(true);

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await setDoc(doc(db, "submissions", `${currentUser.uid}_${latestLesson.id}`), {
          studentId: currentUser.uid,
          studentName: currentUser.displayName || "طالب محلي",
          lessonId: latestLesson.id,
          lessonTitle: latestLesson.title,
          classId: classId,
          score: totalCorrect,
          totalQuestions: latestLesson.questions.length,
          submittedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">جاري تحميل البيئة التعليمية الرقمية...</p>
      </div>
    );
  }

  if (!latestLesson) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-bold">لا يوجد دروس مفعلة حالياً</h3>
        <button onClick={() => navigate(-1)} className="mt-6 text-xs bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-1"><ArrowRight className="w-4 h-4" /> العودة خلفاً</button>
      </div>
    );
  }

  const currentBlock = latestLesson.blocks && latestLesson.blocks[currentSlide];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16 select-none" dir="rtl">
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] bg-slate-900 text-blue-400 font-bold px-2 py-0.5 rounded border border-slate-700">
                الوحدة {latestLesson.unitNumber} • الدرس {latestLesson.lessonNumber}
              </span>
              <h2 className="text-base font-bold text-slate-200 mt-1">{latestLesson.title}</h2>
            </div>
          </div>
          
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {currentStep === 1 && "مرحلة التمهيد والتهيئة"}
              {currentStep === 2 && `الشرح: شريحة ${currentSlide + 1} من ${latestLesson.blocks?.length || 0}`}
              {currentStep === 3 && "مرحلة التقييم الفوري"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        <AnimatePresence mode="wait">
          
          {/* 1️⃣ التمهيد */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2 text-blue-400 border-b border-slate-700 pb-2.5">
                <Clock className="w-5 h-5" />
                <h3 className="text-sm font-bold">التمهيد والأنشطة الاستهلالية</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/50 p-4 rounded-xl border border-slate-750">
                {formatText(latestLesson.introduction)}
              </p>
            </motion.div>
          )}

          {/* 2️⃣ الشرح مقسّم إلى شرائح بناء على تحكم المعلم */}
          {currentStep === 2 && currentBlock && (
            <motion.div
              key={`slide-${currentSlide}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {currentBlock.type === 'text' && (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                  <div className="flex items-center gap-2 text-blue-400 mb-4 border-b border-slate-750 pb-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold">تفصيل وتوضيح رقم ({currentSlide + 1})</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{formatText(currentBlock.value)}</p>
                </div>
              )}

              {currentBlock.type === 'note' && (
                <div className="bg-amber-950/40 border border-amber-800/70 p-5 rounded-2xl flex items-start gap-3 shadow-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-400 block mb-1">ملاحظة تقنية هامة!</span>
                    <p className="text-xs text-amber-200 leading-relaxed">{formatText(currentBlock.value)}</p>
                  </div>
                </div>
              )}

              {currentBlock.type === 'image' && (
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl space-y-2 text-center">
                  <img 
                    src={currentBlock.url} 
                    alt={currentBlock.title} 
                    className="max-h-80 mx-auto rounded-lg object-contain bg-slate-900 border border-slate-700 w-full"
                  />
                  {currentBlock.title && <p className="text-xs text-slate-400 font-medium mt-1">📊 {currentBlock.title}</p>}
                </div>
              )}

              {currentBlock.type === 'link' && (
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-950 p-2 rounded-lg text-emerald-400 border border-emerald-900">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">أداة تفاعلية خارجية</span>
                      <h4 className="text-xs font-bold text-slate-200">{currentBlock.title || 'رابط محاكاة تفاعلي'}</h4>
                    </div>
                  </div>
                  <a href={currentBlock.url} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1 transition-all shadow-md">
                    ابدأ التجربة والتركيب <ChevronLeft className="w-4 h-4" />
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {/* 3️⃣ الامتحان */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="text-sm font-bold">التقييم التفاعلي الفوري للدرس</h3>
                </div>
              </div>

              {!latestLesson.questions || latestLesson.questions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">لم يدرج المعلم أسئلة تقييمية لهذا الدرس.</p>
              ) : (
                <div className="space-y-6">
                  {latestLesson.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-slate-900/60 p-4 rounded-xl border border-slate-750 space-y-3">
                      <p className="text-xs font-bold text-slate-200 leading-relaxed">
                        <span className="text-purple-400 ml-1">س{qIdx + 1}:</span> {q.text}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[qIdx] === optIdx;
                          const isCorrect = q.correctAnswer === optIdx;
                          let optStyle = "bg-slate-850 border-slate-700 text-slate-300";
                          if (!examSubmitted && isSelected) optStyle = "bg-blue-950 border-blue-500 text-blue-300 shadow";
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
                    <button type="button" onClick={handleSubmitExam} disabled={Object.keys(selectedAnswers).length < latestLesson.questions.length} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-3 rounded-xl transition-all disabled:opacity-40 shadow-lg">
                      تسجيل الإجابات وإرسال التقرير النهائي للأنظمة
                    </button>
                  ) : (
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">تم إنهاء وتصحيح الامتحان بنجاح</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">حصلت على نتيجة {score} من أصل {latestLesson.questions.length} أسئلة متاحة.</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-black text-emerald-400">{((score / latestLesson.questions.length) * 100).toFixed(0)}%</span>
                        <span className="text-xs text-slate-500">معدل النجاح</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}