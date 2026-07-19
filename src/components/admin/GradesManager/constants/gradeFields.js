// src/components/admin/GradesManager/constants/gradeFields.js

// ============ الحقول الأساسية ============
export const GRADE_FIELD_KEYS = [
  'dailyExam1',
  'participation1',
  'midtermExam',
  'dailyExam2',
  'participation2',
  'finalExam'
];

export const GRADE_FIELD_LABELS = {
  dailyExam1: 'امتحان يومي 1',
  participation1: 'مشاركة 1',
  midtermExam: 'امتحان شهري',
  dailyExam2: 'امتحان يومي 2',
  participation2: 'مشاركة 2',
  finalExam: 'امتحان فصلي'
};

export const GRADE_FIELD_COLORS = {
  dailyExam1: 'blue-400',
  participation1: 'emerald-400',
  midtermExam: 'amber-400',
  dailyExam2: 'purple-400',
  participation2: 'rose-400',
  finalExam: 'orange-400'
};

// ============ تصدير GRADE_FIELDS للتوافق ============
export const GRADE_FIELDS = [
  { key: 'dailyExam1', label: 'امتحان يومي 1', max: 10, color: 'blue-400' },
  { key: 'participation1', label: 'مشاركة 1', max: 10, color: 'emerald-400' },
  { key: 'midtermExam', label: 'امتحان شهري', max: 20, color: 'amber-400' },
  { key: 'dailyExam2', label: 'امتحان يومي 2', max: 10, color: 'purple-400' },
  { key: 'participation2', label: 'مشاركة 2', max: 10, color: 'rose-400' },
  { key: 'finalExam', label: 'امتحان فصلي', max: 40, color: 'orange-400' }
];

// ============ التوزيع الافتراضي ============
export const DEFAULT_GRADING_CONFIG = {
  dailyExam1: 10,
  participation1: 10,
  midtermExam: 20,
  dailyExam2: 10,
  participation2: 10,
  finalExam: 40,
  total: 100
};

// ============ ✅ دوال مساعدة ديناميكية ============

// ✅ الحصول على إعدادات المادة مع مراعاة الصف
export const getGradeFieldsForSubject = (subjectId, classId, gradingConfig) => {
  if (!subjectId || !gradingConfig) {
    return GRADE_FIELD_KEYS.map(key => ({
      key,
      label: GRADE_FIELD_LABELS[key] || key,
      max: DEFAULT_GRADING_CONFIG[key] || 0,
      color: GRADE_FIELD_COLORS[key] || 'slate-400'
    }));
  }

  // ✅ محاولة الحصول على توزيع للمادة + الصف أولاً
  const configKey = classId ? `${subjectId}_${classId}` : subjectId;
  const config = gradingConfig.subjects?.[configKey] || 
                 gradingConfig.subjects?.[subjectId] || 
                 gradingConfig.default || 
                 DEFAULT_GRADING_CONFIG;
  
  return GRADE_FIELD_KEYS.map(key => ({
    key,
    label: GRADE_FIELD_LABELS[key] || key,
    max: config[key] || 0,
    color: GRADE_FIELD_COLORS[key] || 'slate-400'
  }));
};

// ✅ الحصول على المجموع الكلي للمادة مع مراعاة الصف
export const getTotalMaxForSubject = (subjectId, classId, gradingConfig) => {
  if (!subjectId || !gradingConfig) {
    return DEFAULT_GRADING_CONFIG.total || 100;
  }
  
  const configKey = classId ? `${subjectId}_${classId}` : subjectId;
  const config = gradingConfig.subjects?.[configKey] || 
                 gradingConfig.subjects?.[subjectId] || 
                 gradingConfig.default || 
                 DEFAULT_GRADING_CONFIG;
  return config.total || 100;
};

// ✅ حساب المجموع من القيم
export const calculateTotalFromFields = (fields, subjectId, classId, gradingConfig) => {
  const config = gradingConfig?.subjects?.[subjectId] || gradingConfig?.default || DEFAULT_GRADING_CONFIG;
  
  let total = 0;
  GRADE_FIELD_KEYS.forEach(key => {
    total += (fields[key] || 0);
  });
  return total;
};

// ✅ الحصول على الحقول مع القيم الحالية
export const getFieldsWithValues = (fields, subjectId, classId, gradingConfig) => {
  const fieldsConfig = getGradeFieldsForSubject(subjectId, classId, gradingConfig);
  return fieldsConfig.map(field => ({
    ...field,
    value: fields[field.key] || 0
  }));
};

// ✅ التحقق من صحة القيمة
export const isValidGradeValue = (value, maxValue) => {
  const numValue = Number(value);
  return !isNaN(numValue) && numValue >= 0 && numValue <= maxValue;
};