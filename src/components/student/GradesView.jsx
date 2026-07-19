import React, { useState } from 'react';
import { Award, BarChart3, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';

export default function GradesView({ grades, subjects }) {
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'غير محدد';
  };

  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'B': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'C': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'D': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'F': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
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

  const filteredGrades = grades.filter(g => g.semester === selectedSemester);

  const calculateAverage = () => {
    if (filteredGrades.length === 0) return 0;
    const total = filteredGrades.reduce((sum, g) => sum + (g.total || 0), 0);
    return Math.round(total / filteredGrades.length);
  };

  const getOverallGrade = (avg) => {
    if (avg >= 90) return { grade: 'A', label: 'ممتاز' };
    if (avg >= 80) return { grade: 'B', label: 'جيد جداً' };
    if (avg >= 70) return { grade: 'C', label: 'جيد' };
    if (avg >= 60) return { grade: 'D', label: 'مقبول' };
    return { grade: 'F', label: 'ضعيف' };
  };

  const avg = calculateAverage();
  const overall = getOverallGrade(avg);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          علاماتي
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">الفصل:</span>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value={1}>الفصل الأول</option>
            <option value={2}>الفصل الثاني</option>
          </select>
        </div>
      </div>

      {/* الملخص العام */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-2xl font-black text-white">{avg}</span>
          <p className="text-xs text-slate-400">المعدل</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className={`text-2xl font-black ${getGradeColor(overall.grade)}`}>
            {overall.grade}
          </span>
          <p className="text-xs text-slate-400">{overall.label}</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-2xl font-black text-white">{filteredGrades.length}</span>
          <p className="text-xs text-slate-400">المواد</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className={`text-2xl font-black ${avg >= 80 ? 'text-emerald-400' : avg >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
            {avg >= 80 ? '✓' : avg >= 60 ? '⚠️' : '✗'}
          </span>
          <p className="text-xs text-slate-400">الحالة</p>
        </div>
      </div>

      {/* قائمة العلامات */}
      <div className="space-y-3">
        {filteredGrades.map((grade) => {
          const isExpanded = expandedSubject === grade.subjectId;
          return (
            <div key={grade.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : grade.subjectId)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-lg font-bold text-xs border ${getGradeColor(grade.grade)}`}>
                    {grade.grade}
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-bold text-white">{getSubjectName(grade.subjectId)}</h4>
                    <p className="text-xs text-slate-400">المجموع: {grade.total || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${grade.percentage >= 80 ? 'text-emerald-400' : grade.percentage >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {grade.percentage || 0}%
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 pt-0 border-t border-slate-800">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400">امتحان يومي 1</p>
                      <span className="text-sm font-bold text-white">{grade.dailyExam1 || 0} / 10</span>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400">مشاركة 1</p>
                      <span className="text-sm font-bold text-white">{grade.participation1 || 0} / 10</span>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400">امتحان شهري</p>
                      <span className="text-sm font-bold text-white">{grade.midtermExam || 0} / 20</span>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400">امتحان يومي 2</p>
                      <span className="text-sm font-bold text-white">{grade.dailyExam2 || 0} / 10</span>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400">مشاركة 2</p>
                      <span className="text-sm font-bold text-white">{grade.participation2 || 0} / 10</span>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400">امتحان نهائي</p>
                      <span className="text-sm font-bold text-white">{grade.finalExam || 0} / 40</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredGrades.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">لا توجد علامات مسجلة</p>
        </div>
      )}
    </div>
  );
}