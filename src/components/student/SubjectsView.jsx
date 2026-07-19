import React, { useState } from 'react';
import { BookOpen, Award, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function SubjectsView({ subjects, grades }) {
  const [selectedSubject, setSelectedSubject] = useState(null);

  const getGrade = (subjectId) => {
    const grade = grades.find(g => g.subjectId === subjectId);
    if (!grade) return { total: 0, grade: 'F', percentage: 0 };
    return grade;
  };

  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'B': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'C': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'D': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'F': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getGradeLabel = (grade) => {
    switch(grade) {
      case 'A': return 'ممتاز';
      case 'B': return 'جيد جداً';
      case 'C': return 'جيد';
      case 'D': return 'مقبول';
      case 'F': return 'ضعيف';
      default: return 'غير محدد';
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (selectedSubject) {
    const grade = getGrade(selectedSubject.id);
    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 fade-in">
        <button
          onClick={() => setSelectedSubject(null)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-bold mb-4"
        >
          <ChevronRight className="w-4 h-4" />
          العودة إلى المواد
        </button>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-white">{selectedSubject.name}</h3>
              <p className="text-sm text-slate-400">{selectedSubject.description || 'مادة دراسية'}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-sm border ${getGradeColor(grade.grade)}`}>
              {grade.grade} - {getGradeLabel(grade.grade)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-center">
              <span className="text-2xl font-black text-white">{grade.total || 0}</span>
              <p className="text-xs text-slate-400">المجموع</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-center">
              <span className="text-2xl font-black text-white">{grade.percentage || 0}%</span>
              <p className="text-xs text-slate-400">النسبة المئوية</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-center">
              <span className="text-2xl font-black text-white">{getGradeLabel(grade.grade)}</span>
              <p className="text-xs text-slate-400">التقدير</p>
            </div>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${getProgressColor(grade.percentage)}`}
              style={{ width: `${Math.min(grade.percentage, 100)}%` }}
            />
          </div>

          {/* تفاصيل العلامات */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-center">
              <p className="text-[10px] text-slate-400">امتحان يومي 1</p>
              <span className="text-sm font-bold text-white">{grade.dailyExam1 || 0} / 10</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-center">
              <p className="text-[10px] text-slate-400">مشاركة 1</p>
              <span className="text-sm font-bold text-white">{grade.participation1 || 0} / 10</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-center">
              <p className="text-[10px] text-slate-400">امتحان شهري</p>
              <span className="text-sm font-bold text-white">{grade.midtermExam || 0} / 20</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-center">
              <p className="text-[10px] text-slate-400">امتحان يومي 2</p>
              <span className="text-sm font-bold text-white">{grade.dailyExam2 || 0} / 10</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-center">
              <p className="text-[10px] text-slate-400">مشاركة 2</p>
              <span className="text-sm font-bold text-white">{grade.participation2 || 0} / 10</span>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-center">
              <p className="text-[10px] text-slate-400">امتحان نهائي</p>
              <span className="text-sm font-bold text-white">{grade.finalExam || 0} / 40</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          المواد الدراسية
        </h2>
        <span className="text-xs text-slate-400">عدد المواد: {subjects.length}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => {
          const grade = getGrade(subject.id);
          return (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject)}
              className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all text-right"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-white">{subject.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getGradeColor(grade.grade)}`}>
                  {grade.grade}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{subject.description || 'مادة دراسية'}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">المجموع: {grade.total || 0}</span>
                <div className="w-16 h-1.5 bg-slate-700 rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${getProgressColor(grade.percentage)}`}
                    style={{ width: `${Math.min(grade.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">لا توجد مواد مسجلة</p>
        </div>
      )}
    </div>
  );
}