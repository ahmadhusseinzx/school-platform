// src/components/admin/GradesManager/components/GradeCell.jsx

import React, { memo, useState } from 'react';

const GradeCell = memo(({ 
  studentId, 
  field, 
  maxValue, 
  currentValue, 
  isEditing, 
  isModified, 
  isSemesterClosed,
  editingValue,
  inputRef,
  onStartEdit,
  onUpdateTempGrade,
  onEditingValueChange,
  onKeyDown,
  onBlur
}) => {
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const val = e.target.value;
    
    // السماح بقيم فارغة أو علامة ناقص
    if (val === '' || val === '-' || val === '.') {
      setLocalError('');
      onEditingValueChange(val);
      onUpdateTempGrade(studentId, field, val);
      return;
    }
    
    const numValue = Number(val);
    
    if (!isNaN(numValue)) {
      // ✅ التحقق من النطاق
      if (numValue < 0) {
        setLocalError(`⚠️ لا يمكن أن تكون أقل من 0`);
        return;
      }
      if (numValue > maxValue) {
        setLocalError(`⚠️ تتجاوز الحد الأقصى (${maxValue})`);
        return;
      }
      setLocalError('');
      onEditingValueChange(val);
      onUpdateTempGrade(studentId, field, val);
    }
  };

  if (isSemesterClosed) {
    return (
      <div className="w-full py-1 px-2 text-center text-slate-500 cursor-not-allowed">
        {currentValue}
      </div>
    );
  }
  
  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          value={editingValue}
          onChange={handleChange}
          onKeyDown={(e) => onKeyDown(e, studentId, field)}
          onBlur={() => {
            if (editingValue !== '') {
              onUpdateTempGrade(studentId, field, editingValue);
            }
            setLocalError('');
            onBlur();
          }}
          className={`w-14 p-1 bg-slate-700 border-2 rounded text-white text-sm text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            localError ? 'border-rose-500' : 'border-blue-500'
          }`}
          min="0"
          max={maxValue}
          step="any"
          inputMode="decimal"
        />
        {localError && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-rose-500 text-white text-[8px] rounded whitespace-nowrap z-10">
            {localError}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <button
      onClick={() => onStartEdit(studentId, field, currentValue)}
      className={`w-full py-1 px-2 rounded transition-all text-center ${
        isModified 
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
          : 'hover:bg-slate-700 text-white'
      }`}
    >
      {currentValue}
      {isModified && <span className="mr-1 text-[8px] text-amber-400">*</span>}
    </button>
  );
});

GradeCell.displayName = 'GradeCell';

export default GradeCell;