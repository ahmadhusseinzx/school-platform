// src/services/index.js

// ============================================
// تصدير جميع الخدمات - موحد
// ============================================

// Firebase الأساسية
export * from './firebase';

// خدمات المصادقة
export * from './auth';

// خدمات المستخدمين
export * from './userService';

// خدمات الأدمن
export * from './adminService';

// خدمات المعلم
export * from './teacherService';

// خدمات الطالب
export * from './studentService';

// خدمات الصفوف
export * from './classService';

// خدمات المواد
export * from './subjectService';

// خدمات الدروس
export * from './lessonService';

// خدمات الجدول الزمني
export * from './scheduleService';

// خدمات العلامات
export * from './gradeService';

// خدمات الحضور
export * from './attendanceService';

// خدمات الامتحانات
export * from './examService';

// خدمات الشهادات
export * from './certificateService';

// خدمات الذكاء الاصطناعي
export * from './aiService';