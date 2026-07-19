// src/utils/helpers.js

// ============================================
// دوال مساعدة عامة
// ============================================

import { GRADES, ATTENDANCE_LABELS, ATTENDANCE_COLORS } from './constants';

// ============ تنسيق التاريخ ============

/**
 * تنسيق التاريخ إلى صيغة مقروءة
 * @param {string|Date} date - التاريخ
 * @param {string} format - صيغة التنسيق (اختياري)
 * @returns {string} - التاريخ المنسق
 */
export const formatDate = (date, format = 'ar') => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  if (format === 'ar') {
    return d.toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return d.toLocaleDateString('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * تنسيق الوقت
 * @param {string|Date} date - التاريخ
 * @returns {string} - الوقت المنسق
 */
export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleTimeString('ar', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * تنسيق التاريخ والوقت معاً
 * @param {string|Date} date - التاريخ
 * @returns {string} - التاريخ والوقت المنسقان
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return `${formatDate(date)} - ${formatTime(date)}`;
};

/**
 * الحصول على الفرق بين تاريخين
 * @param {string|Date} date1 - التاريخ الأول
 * @param {string|Date} date2 - التاريخ الثاني
 * @returns {Object} - الفرق بالأيام والساعات والدقائق
 */
export const getDateDifference = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d2 - d1);
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, totalMilliseconds: diff };
};

/**
 * الحصول على نص "منذ" بالعربية
 * @param {string|Date} date - التاريخ
 * @returns {string} - نص "منذ"
 */
export const timeAgo = (date) => {
  if (!date) return '';
  const { days, hours, minutes } = getDateDifference(date);
  
  if (days > 30) return formatDate(date);
  if (days > 0) return `منذ ${days} يوم${days > 1 ? 'ين' : ''}`;
  if (hours > 0) return `منذ ${hours} ساعة${hours > 1 ? 'ات' : ''}`;
  if (minutes > 0) return `منذ ${minutes} دقيقة${minutes > 1 ? 'ق' : ''}`;
  return 'الآن';
};

// ============ معالجة النصوص ============

/**
 * تحويل الاسم إلى أحرف كبيرة (Capitalize)
 * @param {string} text - النص
 * @returns {string} - النص بعد التحويل
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

/**
 * اختصار النص
 * @param {string} text - النص
 * @param {number} maxLength - الحد الأقصى للطول
 * @param {string} suffix - النهاية (اختياري)
 * @returns {string} - النص المختصر
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
};

/**
 * إزالة التشكيل من النص العربي
 * @param {string} text - النص
 * @returns {string} - النص بدون تشكيل
 */
export const removeDiacritics = (text) => {
  if (!text) return '';
  return text.replace(/[\u064B-\u0652]/g, '');
};

/**
 * البحث في النص (مقارنة غير حساسة لحالة الأحرف والتشكيل)
 * @param {string} text - النص المراد البحث فيه
 * @param {string} query - النص المراد البحث عنه
 * @returns {boolean} - هل النص يحتوي على الكلمة المبحوث عنها
 */
export const containsText = (text, query) => {
  if (!text || !query) return false;
  const normalizedText = removeDiacritics(text).toLowerCase();
  const normalizedQuery = removeDiacritics(query).toLowerCase();
  return normalizedText.includes(normalizedQuery);
};

// ============ معالجة الأرقام ============

/**
 * تحويل الرقم إلى نص عربي
 * @param {number} num - الرقم
 * @returns {string} - الرقم بالعربية
 */
export const toArabicNumber = (num) => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map(d => arabicDigits[parseInt(d)] || d).join('');
};

/**
 * تنسيق الرقم مع الفواصل
 * @param {number} num - الرقم
 * @param {string} locale - اللغة (اختياري)
 * @returns {string} - الرقم المنسق
 */
export const formatNumber = (num, locale = 'ar') => {
  if (num === undefined || num === null) return '';
  return num.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
};

/**
 * حساب النسبة المئوية
 * @param {number} value - القيمة
 * @param {number} total - المجموع الكلي
 * @param {number} decimals - عدد الأرقام العشرية
 * @returns {number} - النسبة المئوية
 */
export const calculatePercentage = (value, total, decimals = 0) => {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
};

/**
 * الحصول على التقدير بناءً على النسبة المئوية
 * @param {number} percentage - النسبة المئوية
 * @returns {Object} - التقدير
 */
export const getGrade = (percentage) => {
  if (percentage >= 90) return { ...GRADES.A, key: 'A' };
  if (percentage >= 80) return { ...GRADES.B, key: 'B' };
  if (percentage >= 70) return { ...GRADES.C, key: 'C' };
  if (percentage >= 60) return { ...GRADES.D, key: 'D' };
  return { ...GRADES.F, key: 'F' };
};

// ============ معالجة المصفوفات ============

/**
 * ترتيب المصفوفة حسب حقل معين
 * @param {Array} array - المصفوفة
 * @param {string} field - الحقل
 * @param {string} order - 'asc' أو 'desc'
 * @returns {Array} - المصفوفة المرتبة
 */
export const sortByField = (array, field, order = 'asc') => {
  if (!array || !array.length) return array;
  return [...array].sort((a, b) => {
    const valA = a[field] || '';
    const valB = b[field] || '';
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * فلترة المصفوفة حسب كلمة البحث
 * @param {Array} array - المصفوفة
 * @param {string} query - كلمة البحث
 * @param {Array} fields - الحقول المراد البحث فيها
 * @returns {Array} - المصفوفة المفلترة
 */
export const filterArray = (array, query, fields = ['name', 'title']) => {
  if (!array || !array.length || !query) return array;
  return array.filter(item => 
    fields.some(field => 
      containsText(String(item[field] || ''), query)
    )
  );
};

/**
 * تجميع المصفوفة حسب حقل معين
 * @param {Array} array - المصفوفة
 * @param {string} field - الحقل
 * @returns {Object} - الكائن المجمع
 */
export const groupBy = (array, field) => {
  if (!array || !array.length) return {};
  return array.reduce((acc, item) => {
    const key = item[field] || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

// ============ التحقق من البيانات ============

/**
 * التحقق من البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} - هل البريد صحيح
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * التحقق من رقم الهاتف (السوري)
 * @param {string} phone - رقم الهاتف
 * @returns {boolean} - هل الرقم صحيح
 */
export const isValidPhone = (phone) => {
  const regex = /^(09|0[1-9])\d{8}$/;
  return regex.test(phone);
};

/**
 * التحقق من حقل فارغ
 * @param {*} value - القيمة
 * @returns {boolean} - هل الحقل فارغ
 */
export const isEmpty = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * التحقق من كلمة مرور قوية
 * @param {string} password - كلمة المرور
 * @returns {Object} - { isValid, score, message }
 */
export const validatePassword = (password) => {
  if (!password) return { isValid: false, score: 0, message: 'كلمة المرور مطلوبة' };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  let message = 'ضعيفة';
  if (score >= 5) message = 'قوية جداً';
  else if (score >= 4) message = 'قوية';
  else if (score >= 3) message = 'متوسطة';
  else if (score >= 2) message = 'ضعيفة';
  
  return { isValid: score >= 3, score, message };
};

// ============ معالجة الملفات ============

/**
 * تحويل البيانات إلى CSV
 * @param {Array} data - البيانات
 * @param {Array} headers - العناوين
 * @returns {string} - نص CSV
 */
export const toCSV = (data, headers = null) => {
  if (!data || !data.length) return '';
  
  const keys = headers || Object.keys(data[0]);
  const headerRow = keys.join(',');
  const rows = data.map(item => 
    keys.map(key => `"${String(item[key] || '').replace(/"/g, '""')}"`).join(',')
  );
  
  return [headerRow, ...rows].join('\n');
};

/**
 * تحميل ملف CSV
 * @param {Array} data - البيانات
 * @param {string} filename - اسم الملف
 * @param {Array} headers - العناوين
 */
export const downloadCSV = (data, filename = 'data.csv', headers = null) => {
  const csv = toCSV(data, headers);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// ============ توليد المعرفات ============

/**
 * توليد معرف فريد
 * @param {number} length - طول المعرف
 * @returns {string} - معرف فريد
 */
export const generateId = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * توليد رقم عشوائي
 * @param {number} min - الحد الأدنى
 * @param {number} max - الحد الأقصى
 * @returns {number} - رقم عشوائي
 */
export const randomNumber = (min = 0, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ============ دوال أخرى مفيدة ============

/**
 * نسخ النص إلى الحافظة
 * @param {string} text - النص
 * @returns {Promise} - Promise
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('خطأ في نسخ النص:', error);
    return false;
  }
};

/**
 * الحصول على معلمات URL
 * @returns {Object} - معلمات URL
 */
export const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

/**
 * إضافة معلمات إلى URL
 * @param {Object} params - المعلمات
 * @param {string} baseUrl - الرابط الأساسي (اختياري)
 * @returns {string} - الرابط مع المعلمات
 */
export const addUrlParams = (params, baseUrl = window.location.pathname) => {
  const url = new URL(baseUrl, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
};

/**
 * الحصول على اسم اليوم بالعربية
 * @param {number} dayIndex - رقم اليوم (0-6)
 * @returns {string} - اسم اليوم
 */
export const getDayName = (dayIndex) => {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[dayIndex] || '';
};

/**
 * الحصول على اسم الشهر بالعربية
 * @param {number} monthIndex - رقم الشهر (0-11)
 * @returns {string} - اسم الشهر
 */
export const getMonthName = (monthIndex) => {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return months[monthIndex] || '';
};

// ============ تصدير الدوال ============

export default {
  formatDate,
  formatTime,
  formatDateTime,
  getDateDifference,
  timeAgo,
  capitalize,
  truncateText,
  removeDiacritics,
  containsText,
  toArabicNumber,
  formatNumber,
  calculatePercentage,
  getGrade,
  sortByField,
  filterArray,
  groupBy,
  isValidEmail,
  isValidPhone,
  isEmpty,
  validatePassword,
  toCSV,
  downloadCSV,
  generateId,
  randomNumber,
  copyToClipboard,
  getUrlParams,
  addUrlParams,
  getDayName,
  getMonthName
};