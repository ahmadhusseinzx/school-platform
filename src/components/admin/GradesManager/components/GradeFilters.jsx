// src/components/admin/GradesManager/components/GradeFilters.jsx

import React, { memo } from 'react';
import { Search, Calendar } from 'lucide-react';

const GradeFilters = memo(({
  selectedClass,
  setSelectedClass,
  selectedSubject,
  setSelectedSubject,
  selectedSemester,
  setSelectedSemester,
  academicYear,
  searchQuery,
  setSearchQuery,
  classes,
  subjects,
  isYearActive,
  isYearClosed
}) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs text-slate-400 mb-1">الصف</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">جميع الصفوف</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs text-slate-400 mb-1">المادة *</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">جميع المواد</option>
          {subjects.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
      </div>

      <div className="min-w-[120px]">
        <label className="block text-xs text-slate-400 mb-1">الفصل</label>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(Number(e.target.value))}
          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value={1}>الفصل الأول</option>
          <option value={2}>الفصل الثاني</option>
        </select>
      </div>

      <div className="min-w-[150px]">
        <label className="block text-xs text-slate-400 mb-1">العام الدراسي</label>
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={academicYear}
            disabled
            className="w-full p-2.5 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm cursor-not-allowed opacity-70"
          />
          {isYearActive && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
              نشط
            </span>
          )}
          {isYearClosed && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">
              مغلق
            </span>
          )}
        </div>
        <p className="text-[9px] text-slate-500 mt-1">🔒 مثبت للعام الحالي</p>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs text-slate-400 mb-1">بحث</label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن طالب..."
            className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
});

GradeFilters.displayName = 'GradeFilters';

export default GradeFilters;