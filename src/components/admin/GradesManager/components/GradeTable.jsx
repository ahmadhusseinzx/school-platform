// src/components/admin/GradesManager/components/GradeTable.jsx

import React, { memo, useMemo } from 'react';
import { GRADE_FIELDS } from '../constants/gradeFields'; // ✅ الآن يعمل
import GradeRow from './GradeRow';

const GradeTable = memo(({
  students,
  getFieldValue,
  startEdit,
  updateTempGrade,
  editingCell,
  editingValue,
  setEditingValue,
  inputRef,
  handleKeyDown,
  handleBlur,
  isSemesterClosed,
  tempGrades,
  selectedSubject,
  gradingConfig
}) => {
  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        لا يوجد طلاب في هذا الصف
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm border-collapse">
        <thead>
          <tr className="bg-slate-900 border-b border-slate-700">
            <th className="p-3 text-center font-bold text-slate-300 sticky right-0 bg-slate-900 min-w-[120px]">
              اسم الطالب
            </th>
            {GRADE_FIELDS.map(field => (
              <th key={field.key} className={`p-3 text-center font-bold text-${field.color} min-w-[80px]`}>
                <div>{field.label}</div>
                <div className="text-[9px] text-slate-500">({field.max})</div>
              </th>
            ))}
            <th className="p-3 text-center font-bold text-emerald-400 min-w-[80px]">
              <div>المجموع</div>
              <div className="text-[9px] text-slate-500">(من {gradingConfig?.subjects?.[selectedSubject]?.total || 100})</div>
            </th>
            <th className="p-3 text-center font-bold text-slate-400 min-w-[80px]">
              التقدير
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <GradeRow
              key={student.id}
              student={student}
              getFieldValue={getFieldValue}
              startEdit={startEdit}
              updateTempGrade={updateTempGrade}
              editingCell={editingCell}
              editingValue={editingValue}
              setEditingValue={setEditingValue}
              inputRef={inputRef}
              handleKeyDown={handleKeyDown}
              handleBlur={handleBlur}
              isSemesterClosed={isSemesterClosed}
              tempGrades={tempGrades}
              selectedSubject={selectedSubject}
              gradingConfig={gradingConfig}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

GradeTable.displayName = 'GradeTable';

export default GradeTable;