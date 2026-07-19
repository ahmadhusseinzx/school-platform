// src/utils/constants.js

// ============================================
// الثوابت العامة للتطبيق
// ============================================

// ============ أدوار المستخدمين ============
export const ROLES = {
  ADMIN: 'admin',
  ADMIN_ASSISTANT: 'admin_assistant',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

// ============ أيام الأسبوع ============
export const WEEK_DAYS = [
  { id: 1, name: 'الأحد', short: 'أحد', en: 'Sunday' },
  { id: 2, name: 'الاثنين', short: 'اثن', en: 'Monday' },
  { id: 3, name: 'الثلاثاء', short: 'ثلث', en: 'Tuesday' },
  { id: 4, name: 'الأربعاء', short: 'أرب', en: 'Wednesday' },
  { id: 5, name: 'الخميس', short: 'خمي', en: 'Thursday' },
  { id: 6, name: 'الجمعة', short: 'جمع', en: 'Friday' },
  { id: 7, name: 'السبت', short: 'سبت', en: 'Saturday' }
];

// ============ الحصص الدراسية ============
export const PERIODS = [
  { id: 1, from: '8:00', to: '8:40', label: 'الحصة الأولى' },
  { id: 2, from: '8:45', to: '9:25', label: 'الحصة الثانية' },
  { id: 3, from: '9:30', to: '10:10', label: 'الحصة الثالثة' },
  { id: 4, from: '10:35', to: '11:15', label: 'الحصة الرابعة' },
  { id: 5, from: '12:00', to: '12:45', label: 'الحصة الخامسة' },
  { id: 6, from: '12:50', to: '1:30', label: 'الحصة السادسة' },
  { id: 7, from: '1:35', to: '2:15', label: 'الحصة السابعة' }
];

// ============ الفواصل (الفسحات) ============
export const BREAKS = [
  { id: 'break1', from: '10:10', to: '10:30', label: 'الفسحة الأولى' },
  { id: 'break2', from: '11:15', to: '12:00', label: 'الفسحة الثانية' }
];

// ============ نظام العلامات الافتراضي ============
export const DEFAULT_GRADING_SYSTEM = {
  semester1: {
    dailyExam1: 10,
    participation1: 10,
    midtermExam: 20,
    dailyExam2: 10,
    participation2: 10,
    finalExam: 40
  },
  semester2: {
    dailyExam1: 10,
    participation1: 10,
    midtermExam: 20,
    dailyExam2: 10,
    participation2: 10,
    finalExam: 40
  }
};

// ============ حالات الحضور ============
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused'
};

// ============ تسميات حالات الحضور ============
export const ATTENDANCE_LABELS = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  excused: 'مبرر'
};

// ============ ألوان حالات الحضور ============
export const ATTENDANCE_COLORS = {
  present: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  absent: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  late: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  excused: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
};

// ============ حالات الامتحانات ============
export const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  CLOSED: 'closed'
};

export const EXAM_STATUS_LABELS = {
  draft: 'مسودة',
  published: 'منشور',
  active: 'نشط',
  closed: 'مغلق'
};

// ============ حالات الدروس ============
export const LESSON_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  LIVE: 'live',
  ARCHIVED: 'archived'
};

export const LESSON_STATUS_LABELS = {
  draft: 'مسودة',
  published: 'منشور',
  live: 'مباشر',
  archived: 'مؤرشف'
};

// ============ التقديرات والعلامات ============
export const GRADES = {
  A: { label: 'ممتاز', min: 90, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  B: { label: 'جيد جداً', min: 80, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  C: { label: 'جيد', min: 70, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  D: { label: 'مقبول', min: 60, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  F: { label: 'ضعيف', min: 0, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' }
};

// ============ أنواع المحتوى في الدروس ============
export const BLOCK_TYPES = {
  TEXT: 'text',
  NOTE: 'note',
  IMAGE: 'image',
  LINK: 'link',
  VIDEO: 'video',
  QUIZ: 'quiz'
};

export const BLOCK_TYPE_LABELS = {
  text: 'فقرة شرح',
  note: 'تنبيه هام',
  image: 'صورة تعليمية',
  link: 'رابط تفاعلي',
  video: 'فيديو',
  quiz: 'اختبار'
};

// ============ أنواع الامتحانات ============
export const EXAM_TYPES = {
  DAILY_1: 'daily1',
  DAILY_2: 'daily2',
  MIDTERM: 'midterm',
  FINAL: 'final'
};

export const EXAM_TYPE_LABELS = {
  daily1: 'امتحان يومي 1',
  daily2: 'امتحان يومي 2',
  midterm: 'امتحان شهري',
  final: 'امتحان نهائي'
};

// ============ رسائل النظام ============
export const MESSAGES = {
  // أخطاء
  ERROR: {
    GENERIC: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
    NETWORK: 'خطأ في الاتصال بالشبكة',
    UNAUTHORIZED: 'غير مصرح لك بالوصول إلى هذه الصفحة',
    NOT_FOUND: 'الصفحة غير موجودة',
    VALIDATION: 'يرجى التحقق من البيانات المدخلة'
  },
  // نجاح
  SUCCESS: {
    SAVED: 'تم الحفظ بنجاح',
    DELETED: 'تم الحذف بنجاح',
    UPDATED: 'تم التحديث بنجاح',
    CREATED: 'تم الإنشاء بنجاح'
  }
};

// ============ إعدادات التطبيق ============
export const APP_CONFIG = {
  APP_NAME: 'المنصة التعليمية الذكية',
  APP_VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'ar',
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm'
};

// ============ الروابط الأساسية ============
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings'
};