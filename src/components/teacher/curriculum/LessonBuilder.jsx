import React, { useState } from 'react';
import { db } from '../../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Plus, ImageIcon, Link, ArrowLeft } from 'lucide-react';

export default function LessonBuilder({ darkMode, curriculumClassId, setCurriculumStep }) {
  const [curriculumSemester, setCurriculumSemester] = useState("الفصل الدراسي الأول");
  const [curriculumUnit, setCurriculumUnit] = useState("1");
  const [curriculumLessonNum, setCurriculumLessonNum] = useState("1");
  const [curriculumTitle, setCurriculumTitle] = useState("");
  const [curriculumIntro, setCurriculumIntro] = useState("");
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
    setCurriculumQuestions([
      ...curriculumQuestions,
      { questionText: '', choice1: '', choice2: '', choice3: '', choice4: '', correctAnswer: '1' }
    ]);
  };

  const handleSaveLesson = async (e) => {
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

      // Reset form
      setCurriculumTitle("");
      setCurriculumIntro("");
      setCurriculumBlocks([{ type: 'text', value: '' }]);
      setCurriculumQuestions([{ questionText: '', choice1: '', choice2: '', choice3: '', choice4: '', correctAnswer: '1' }]);
      setCurriculumStep(1);
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ السحابي: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSaveLesson} className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <span className="text-xs font-bold text-emerald-400">بناء درس تفاعلي جديد</span>
        <button type="button" onClick={() => setCurriculumStep(2)} className="text-xs flex items-center gap-1 text-blue-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> العودة للخطوة السابقة
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-[#0f172a] border-slate-800">
        <div>
          <label className="text-xs font-bold block mb-1.5">الفصل الدراسي:</label>
          <select value={curriculumSemester} onChange={(e) => setCurriculumSemester(e.target.value)} className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] text-white border-slate-700">
            <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
            <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold block mb-1.5">رقم الوحدة الأكاديمية:</label>
          <input type="number" value={curriculumUnit} onChange={(e) => setCurriculumUnit(e.target.value)} className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] border-slate-700" />
        </div>
        <div>
          <label className="text-xs font-bold block mb-1.5">رقم الدرس المنهجي:</label>
          <input type="number" value={curriculumLessonNum} onChange={(e) => setCurriculumLessonNum(e.target.value)} className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] border-slate-700" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold block mb-1.5">عنوان الدرس:</label>
          <input type="text" value={curriculumTitle} onChange={(e) => setCurriculumTitle(e.target.value)} placeholder="مثال: البوابات المنطقية المشتقة NAND / NOR" className="w-full p-2.5 rounded-lg text-xs bg-[#1e293b] border-slate-700" required />
        </div>
      </div>

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
            <button type="button" onClick={() => addCurriculumBlock('image')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> + صورة تعليمية
            </button>
            <button type="button" onClick={() => addCurriculumBlock('link')} className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <Link className="w-3 h-3" /> + رابط تفاعلي
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {curriculumBlocks.map((block, i) => (
            <div key={i} className="flex gap-2 items-start p-3 rounded-lg border border-slate-800 bg-[#1e293b]">
              <span className="text-[10px] font-bold shrink-0 mt-2.5 px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                #{i+1} {block.type === 'text' ? 'نص' : block.type === 'note' ? 'تنبيه' : block.type === 'image' ? 'صورة' : 'رابط'}
              </span>
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

      <div className="p-4 rounded-xl border bg-[#0f172a] border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h4 className="text-xs font-bold text-purple-400">أسئلة بنك الاختيار من متعدد المقترنة:</h4>
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

      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all">
        حفظ وإدراج المحتوى في النظام السحابي للمدرسة
      </button>
    </form>
  );
}