import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle, Users, Plus } from 'lucide-react';

export default function AskQuestion({ studentId }) {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // جلب المواد (سيتم ربطها لاحقاً)
    setSubjects([
      { id: '1', name: 'الرياضيات' },
      { id: '2', name: 'العلوم' },
      { id: '3', name: 'اللغة العربية' }
    ]);

    // الاستماع للأسئلة
    const q = query(collection(db, 'questions'), where('studentId', '==', studentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsList = [];
      snapshot.forEach(doc => {
        questionsList.push({ id: doc.id, ...doc.data() });
      });
      setQuestions(questionsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    return () => unsubscribe();
  }, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !subjectId) {
      alert('الرجاء كتابة السؤال واختيار المادة');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'questions'), {
        studentId: studentId,
        subjectId: subjectId,
        question: newQuestion,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setNewQuestion('');
      alert('تم إرسال السؤال بنجاح!');
    } catch (error) {
      alert('خطأ في إرسال السؤال: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'answered':
        return <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" /> تمت الإجابة</span>;
      case 'pending':
        return <span className="flex items-center gap-1 text-amber-400 text-xs"><Clock className="w-3 h-3" /> قيد الانتظار</span>;
      default:
        return <span className="text-slate-400 text-xs">غير محدد</span>;
    }
  };

  const getSubjectName = (id) => {
    const subject = subjects.find(s => s.id === id);
    return subject?.name || 'غير محدد';
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          أسئلتي للمعلم
        </h2>
        <span className="text-xs text-slate-400">
          {questions.filter(q => q.status === 'pending').length} في الانتظار
        </span>
      </div>

      {/* نموذج إرسال سؤال */}
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-6">
        <div className="flex flex-wrap gap-3 mb-3">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            required
          >
            <option value="">اختر المادة</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'جاري الإرسال...' : <><Send className="w-4 h-4" /> إرسال</>}
          </button>
        </div>
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="اكتب سؤالك هنا..."
          className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
          rows={3}
          required
        />
      </form>

      {/* قائمة الأسئلة */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {questions.map((q) => (
          <div key={q.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-purple-400">
                    {getSubjectName(q.subjectId)}
                  </span>
                  {getStatusBadge(q.status)}
                </div>
                <p className="text-sm text-white">{q.question}</p>
                {q.answer && (
                  <div className="mt-2 p-3 bg-slate-800 rounded-lg border-r-4 border-emerald-500">
                    <p className="text-xs text-slate-400 font-bold mb-1">📝 إجابة المعلم:</p>
                    <p className="text-sm text-slate-200">{q.answer}</p>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-2">
                  {new Date(q.createdAt).toLocaleString('ar')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">لا توجد أسئلة</p>
          <p className="text-xs text-slate-500">اطرح سؤالك الأول للمعلم</p>
        </div>
      )}
    </div>
  );
}