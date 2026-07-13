import React from 'react';

export default function ExamStatistics({ darkMode, selectedExamForStats, classes, getExamStats, setSelectedExamForStats }) {
  const stats = getExamStats(selectedExamForStats.id);

  return (
    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'} space-y-6`}>
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
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {stats.avg} <span className="text-xs text-slate-400">/ {selectedExamForStats.questions?.length || 0}</span>
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 text-center">
          <span className="text-xs text-slate-400 block">إجمالي عدد الطلاب الذين سلّموا</span>
          <span className="text-2xl font-black text-blue-400 mt-1 block">{stats.count} طلاب</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1">⚠️ ترتيب الأسئلة الأكثر خطأً (تحتاج مراجعة داخل الصف):</h4>
        {stats.hardQuestions.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">لم يتم رصد أخطاء متكررة بعد.</p>
        ) : (
          <div className="space-y-2 text-xs">
            {stats.hardQuestions.map((hq, i) => {
              const questionObj = selectedExamForStats.questions?.[hq.index];
              return (
                <div key={i} className="p-3 rounded-lg bg-[#1e293b] border border-rose-955/40 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="font-bold text-amber-500">سؤال #{hq.index + 1}:</span>
                    <p className="text-slate-200">{questionObj ? questionObj.text : 'محتوى السؤال غير متوفر'}</p>
                  </div>
                  <span className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded font-bold shrink-0 border border-rose-500/20">
                    {hq.count} أخطاء
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}