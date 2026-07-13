import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AIGenerator({ classesList, onLessonGenerated }) {
  const [targetClass, setTargetClass] = useState('');
  const [topic, setTopic] = useState('');
  const [semester, setSemester] = useState('semester-1');
  const [unitNumber, setUnitNumber] = useState(1);
  const [lessonNumber, setLessonNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const generateLessonWithAI = async (e) => {
    e.preventDefault();
    if (!targetClass || !topic.trim()) {
      setStatus({ type: 'error', text: 'الرجاء اختيار الصف وتحديد عنوان الدرس السيرسي.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', text: '' });

    // صياغة الـ Prompt الهندسي الصارم لإجبار النموذج على إخراج JSON متوافق مع بنية قاعدة بياناتك ومناسب للـ Markdown
    const engineeringPrompt = `
      You are an expert Computer Engineering and Technology Professor. 
      Generate a complete interactive and professional lesson about "${topic}" for school students.
      
      CRITICAL: You must respond ONLY with a valid JSON object. Do not include any markdown wrappers like \`\`\`json or \`\`\`.
      
      The text content within "blocks" MUST use markdown formatting for structures like tables, itemized bullet points, bold headers, and code snippets to maintain readability.
      For truth tables, logic gates, or electrical components, use clean markdown tables.
      
      JSON Structure Required:
      {
        "introduction": "A creative, short, engaging introduction to grab student attention in Arabic.",
        "blocks": [
          {
            "type": "text",
            "value": "Detailed explanation section in Arabic using markdown for styling (like bolding, line breaks, bullet points or tables)."
          },
          {
            "type": "note",
            "value": "An important warning, practical advice, or tip related to the topic in Arabic."
          }
        ],
        "questions": [
          {
            "text": "A conceptual multiple choice question in Arabic related to the generated content.",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": 0
          }
        ]
      }
    `;

    try {
      // استدعاء مباشر لـ Gemini API (أو أي بوابة وسيطة تستخدمها)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_API_KEY`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: engineeringPrompt }] }]
        })
      });

      const data = await response.json();
      let rawText = data.candidates[0].content.parts[0].text.trim();
      
      // تنظيف النص في حال أصر النموذج على تضمين وسوم الـ Code Blocks
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }

      const parsedLesson = JSON.parse(rawText);

      // الضخ التلقائي والفوري في Firestore
      const lessonPayload = {
        title: topic,
        classId: targetClass,
        semester: semester,
        unitNumber: Number(unitNumber),
        lessonNumber: Number(lessonNumber),
        introduction: parsedLesson.introduction,
        blocks: parsedLesson.blocks,
        questions: parsedLesson.questions,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "lessons"), lessonPayload);

      setStatus({ type: 'success', text: 'تم طبخ وتوليد الدرس وضخه في السحابة بنجاح بالتنسيق المستدام!' });
      setTopic('');
      if(onLessonGenerated) onLessonGenerated();

    } catch (error) {
      console.error("AI Generation Error:", error);
      setStatus({ type: 'error', text: 'حدث خطأ أثناء معالجة البيانات أو الاتصال بالمحرك الذكي. تأكد من إعدادات الـ API Key.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl max-w-3xl mx-auto space-y-6 text-right" dir="rtl">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
        <div className="bg-gradient-to-tr from-amber-500 to-rose-500 p-2 rounded-xl text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200">مطبخ الذكاء الاصطناعي الخارق ($AI\ Generator$)</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">صياغة وتوليد الدروس، كتل الشرح المنسقة، والامتحانات بضغطة زر واحدة</p>
        </div>
      </div>

      {status.text && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${status.type === 'success' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800' : 'bg-rose-950/40 text-rose-400 border-rose-800'}`}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <p>{status.text}</p>
        </div>
      )}

      <form onSubmit={generateLessonWithAI} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">الصف المستهدف</label>
            <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-blue-500">
              <option value="">اختر صفاً...</option>
              {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">الفصل الدراسي</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 outline-none">
              <option value="semester-1">الفصل الأول</option>
              <option value="semester-2">الفصل الثاني</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">رقم الوحدة</label>
            <input type="number" min="1" value={unitNumber} onChange={(e) => setUnitNumber(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">رقم الدرس</label>
            <input type="number" min="1" value={lessonNumber} onChange={(e) => setLessonNumber(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">موضوع أو عنوان الدرس المطلوب توليده</label>
          <input 
            type="text" 
            value={topic} 
            onChange={(e) => setTopic(e.target.value)} 
            placeholder="مثال: البوابات المنطقية الأساسية وجدول الحقيقة" 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري طبخ المنهج وصياغة التنسيق والامتحانات...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              طبخ وضخ المنهج فورياً بالذكاء الاصطناعي
            </>
          )}
        </button>
      </form>
    </div>
  );
}