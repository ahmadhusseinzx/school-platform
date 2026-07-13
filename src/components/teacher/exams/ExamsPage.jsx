import React, { useState } from 'react';
import { ClipboardList, Trash2, BarChart2 } from 'lucide-react';
import ExamStatistics from './ExamStatistics';

export default function ExamsPage({
  darkMode,
  exams,
  classes,
  examSubmissions,
  getExamStats,
  handleDeleteExam,
  setSelectedExamForStats,
  selectedExamForStats
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* قائمة الامتحانات */}
      <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`}>
        <h3 className="text-xs font-bold text-blue-500 flex items-center gap-1">
          <ClipboardList className="w-4 h-4" /> الامتحانات الرقمية المستقلة المتاحة
        </h3>
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
                      <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                        {targetClass ? targetClass.name : 'كل الصفوف'}
                      </span>
                      <h4 className="text-xs font-bold mt-1 text-slate-100">{ex.title}</h4>
                    </div>
                    <button onClick={() => handleDeleteExam(ex.id)} className="text-rose-400 hover:text-rose-500 p-1 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                    <span>⏱️ {ex.duration} دقيقة</span>
                    <span>👥 مسلّمين: {stats.count}</span>
                    <button onClick={() => setSelectedExamForStats(ex)} className="text-blue-400 hover:underline font-bold flex items-center gap-0.5">
                      <BarChart2 className="w-3 h-3" /> تحليل النتائج
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* إحصائيات الامتحان المختار */}
      <div className="lg:col-span-2">
        {selectedExamForStats ? (
          <ExamStatistics
            darkMode={darkMode}
            selectedExamForStats={selectedExamForStats}
            classes={classes}
            getExamStats={getExamStats}
            setSelectedExamForStats={setSelectedExamForStats}
          />
        ) : (
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'} text-center p-12 text-slate-500 text-xs italic`}>
            الرجاء تحديد امتحان من القائمة الجانبية اليمنى لاستعراض متوسط الدرجات والأسئلة الأكثر خطأً للطلاب.
          </div>
        )}
      </div>
    </div>
  );
}