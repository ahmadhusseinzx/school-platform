import React, { useState } from 'react';
import { db } from '../../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Plus, Clock, ArrowLeft } from 'lucide-react';

export default function ExamBuilder({ darkMode, curriculumClassId, setCurriculumStep }) {
  const [curriculumSemester, setCurriculumSemester] = useState("الفصل الدراسي الأول");
  const [curriculumTitle, setCurriculumTitle] = useState("");
  const [examDuration, setExamDuration] = useState(30);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleChoices, setShuffleChoices] = useState(true);
  const [curriculumQuestions, setCurriculumQuestions] = useState([
    { questionText: '', choice1: '', choice2: '', choice3: '', choice4: '', correctAnswer: '1' }
  ]);

  const addCurriculumQuestion = () => {
    setCurriculumQuestions([
      ...curriculumQuestions,
      { questionText: '', choice1: '', choice2: '', choice3: '', choice4: '', correctAnswer: '1' }
    ]);
  };

  const handleSaveExam = async (e) => {
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

      // Reset form
      setCurriculumTitle("");
      setCurriculumQuestions([{ questionText: '', choice1: '', choice2: '', choice3: '', choice4: '', correctAnswer: '1' }]);
      setCurriculumStep(1);
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ السحابي: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSaveExam} className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <span className="text-xs font-bold text-purple-400">بناء امتحان رقمي جديد</span>
        <button type="button" onClick={() => setCurriculumStep(2)} className="text-xs flex items-center gap-1 text-blue-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> العودة للخطوة السابقة
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border bg-[#0f172a] border-slate-800">
        <div>
          <label className="text-xs font-bold block mb-1.5">الفصل الدراسي:</label>
          <select value={curriculumSemester} onChange={(e) => setCurriculumSemester(e.target.value)} className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] text-white border-slate-700">
            <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
            <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold block mb-1.5">عنوان الامتحان الاستدلالي:</label>
          <input type="text" value={curriculumTitle} onChange={(e) => setCurriculumTitle(e.target.value)} placeholder="مثال: امتحان منتصف الفصل - الشبكات" className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] border-slate-700" required />
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-[#0f172a] border-slate-800 space-y-4">
        <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
          <Clock className="w-4 h-4" /> إعدادات التحكم الزمني ومكافحة الغش:
        </h4>
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

      <div className="p-4 rounded-xl border bg-[#0f172a] border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h4 className="text-xs font-bold text-purple-400">أسئلة بنك الاختيار من متعدد:</h4>
          <button type="button" onClick={addCurriculumQuestion} className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Plus className="w-3 h-3" /> إضافة سؤال جديد
          </button>
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

      <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all">
        حفظ وإدراج الامتحان في النظام السحابي للمدرسة
      </button>
    </form>
  );
}