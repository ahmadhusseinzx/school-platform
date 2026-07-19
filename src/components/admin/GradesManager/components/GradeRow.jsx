// src/components/admin/GradesManager/components/GradeRow.jsx

import React, { memo, useMemo } from 'react';
import { GRADE_FIELDS } from '../constants/gradeFields'; // ✅ الآن يعمل
import { calculateGradeData } from '../utils/gradeCalculations';
import GradeCell from './GradeCell';

const GradeRow = memo(({
  student,
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
  const fields = useMemo(() => {
    const result = {};
    GRADE_FIELDS.forEach(f => {
      result[f.key] = getFieldValue(student.id, f.key);
    });
    return result;
  }, [student.id, getFieldValue]);

  const { total, maxTotal, gradeInfo } = useMemo(() => 
    calculateGradeData(fields, selectedSubject, gradingConfig), 
    [fields, selectedSubject, gradingConfig]
  );

  const hasChanges = useMemo(() => {
    return GRADE_FIELDS.some(f => tempGrades[`${student.id}_${f.key}`] !== undefined);
  }, [student.id, tempGrades]);

  return (
    <tr className={`border-b border-slate-800 hover:bg-slate-800/30 transition-all ${
      hasChanges ? 'bg-amber-500/5' : ''
    }`}>
      <td className="p-3 font-bold text-white sticky right-0 bg-slate-800/50 min-w-[120px]">
        {student.fullName}
      </td>
      {GRADE_FIELDS.map(field => (
        <td key={field.key} className="p-2 text-center">
          <GradeCell
            studentId={student.id}
            field={field.key}
            maxValue={field.max}
            currentValue={fields[field.key]}
            isEditing={editingCell?.studentId === student.id && editingCell?.field === field.key}
            isModified={tempGrades[`${student.id}_${field.key}`] !== undefined}
            isSemesterClosed={isSemesterClosed}
            editingValue={editingValue}
            inputRef={inputRef}
            onStartEdit={startEdit}
            onUpdateTempGrade={updateTempGrade}
            onEditingValueChange={setEditingValue}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        </td>
      ))}
      <td className="p-3 text-center font-bold text-emerald-400">
        {total}
        <span className="text-[9px] text-slate-500 block">من {maxTotal}</span>
      </td>
      <td className="p-3 text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${gradeInfo.color}`}>
          {gradeInfo.label}
        </span>
      </td>
    </tr>
  );
});

GradeRow.displayName = 'GradeRow';

export default GradeRow;