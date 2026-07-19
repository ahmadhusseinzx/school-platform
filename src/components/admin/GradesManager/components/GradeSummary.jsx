// src/components/admin/GradesManager/components/GradeSummary.jsx

import React, { memo, useMemo } from 'react';
import { calculateTotal, getTotalMaxForSubject } from '../utils/gradeCalculations';

const GradeSummary = memo(({ 
  students, 
  grades, 
  selectedSubject, 
  selectedSemester,
  gradingConfig 
}) => {
  const summary = useMemo(() => {
    if (!selectedSubject || students.length === 0) {
      return { count: students.length, average: 0, max: 0, min: 0, maxTotal: 0 };
    }

    const maxTotal = getTotalMaxForSubject(selectedSubject, gradingConfig);
    const totals = students.map(student => {
      const grade = grades.find(g => 
        g.studentId === student.id && 
        g.subjectId === selectedSubject && 
        g.semester === selectedSemester
      );
      return grade ? calculateTotal(grade, selectedSubject, gradingConfig) : 0;
    });

    const validTotals = totals.filter(t => t > 0);
    const average = validTotals.length > 0 
      ? (validTotals.reduce((sum, t) => sum + t, 0) / validTotals.length).toFixed(1)
      : 0;

    return {
      count: students.length,
      average,
      max: validTotals.length > 0 ? Math.max(...validTotals) : 0,
      min: validTotals.length > 0 ? Math.min(...validTotals) : 0,
      maxTotal: maxTotal,
      percentage: maxTotal > 0 ? (average / maxTotal * 100).toFixed(1) : 0
    };
  }, [students, grades, selectedSubject, selectedSemester, gradingConfig]);

  if (!selectedSubject || students.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
      <h4 className="text-xs font-bold text-slate-400 mb-3">📊 ملخص العلامات</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <p className="text-xs text-slate-400">عدد الطلاب</p>
          <p className="text-lg font-bold text-white">{summary.count}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">المعدل العام</p>
          <p className="text-lg font-bold text-emerald-400">
            {summary.average}
            <span className="text-xs text-slate-500 block">من {summary.maxTotal}</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">النسبة المئوية</p>
          <p className="text-lg font-bold text-emerald-400">{summary.percentage}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">أعلى علامة</p>
          <p className="text-lg font-bold text-emerald-400">{summary.max}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">أدنى علامة</p>
          <p className="text-lg font-bold text-rose-400">{summary.min}</p>
        </div>
      </div>
    </div>
  );
});

GradeSummary.displayName = 'GradeSummary';

export default GradeSummary;