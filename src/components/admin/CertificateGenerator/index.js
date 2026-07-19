// src/components/admin/index.js

// تصدير المكون الرئيسي
export { default as CertificateGenerator } from './CertificateGenerator';

// تصدير المكونات المساعدة
export { default as CertificateList } from './CertificateList';
export { default as CertificatePreview } from './CertificatePreview';

// تصدير الثوابت
export { CERTIFICATE_TYPES, BEHAVIOR_RATINGS, GRADE_COLORS } from './constants';

// تصدير دوال الحسابات
export { 
  calculateMidtermTotal,
  calculateFinalTotal,
  getGradeLabel,
  getGradeColor,
  getStudentAttendanceStats,
  getStudentNotes,
  getStudentBehavior
} from './calculations';

// تصدير Hook
export { useSchoolData } from './useSchoolData';

// تصدير دوال الطباعة
export { printCertificate, printAllCertificates } from './certificatePrinter';