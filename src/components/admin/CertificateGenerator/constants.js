// src/components/admin/constants.js

// ============ ثوابت أنواع الشهادات ============
export const CERTIFICATE_TYPES = [
  { 
    id: 'midterm1', 
    label: 'شهادة شهرين الفصل الأول',
    description: 'تشمل الامتحان اليومي والمشاركة وامتحان الشهرين (40 علامة)',
    semester: 1,
    type: 'midterm'
  },
  { 
    id: 'final1', 
    label: 'شهادة نهاية الفصل الأول',
    description: 'تشمل جميع علامات الفصل الأول كاملة',
    semester: 1,
    type: 'final'
  },
  { 
    id: 'midterm2', 
    label: 'شهادة شهرين الفصل الثاني',
    description: 'تشمل الامتحان اليومي والمشاركة وامتحان الشهرين (40 علامة)',
    semester: 2,
    type: 'midterm'
  },
  { 
    id: 'final2', 
    label: 'شهادة نهاية العام الدراسي',
    description: 'تشمل جميع علامات الفصل الثاني ومتوسط الفصلين',
    semester: 2,
    type: 'final'
  }
];

// ============ تقييمات السلوك ============
export const BEHAVIOR_RATINGS = {
  'excellent': 'ممتاز',
  'good': 'جيد جداً',
  'satisfactory': 'جيد',
  'needs_improvement': 'بحاجة لتحسين',
  'poor': 'ضعيف'
};

// ============ ألوان التقييم ============
export const GRADE_COLORS = {
  'excellent': 'text-emerald-600 bg-emerald-100',
  'very_good': 'text-blue-600 bg-blue-100',
  'good': 'text-amber-600 bg-amber-100',
  'satisfactory': 'text-orange-600 bg-orange-100',
  'weak': 'text-rose-600 bg-rose-100'
};