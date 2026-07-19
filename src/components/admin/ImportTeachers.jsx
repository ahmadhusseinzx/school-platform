// src/components/admin/ImportTeachers.jsx

import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, doc, setDoc, getDocs, query, where 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import * as XLSX from 'xlsx';
import { 
  Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, 
  Download, X, Users, School, Eye, EyeOff, Trash2,
  User, Key, Phone, Mail
} from 'lucide-react';

// ============ دوال مساعدة (نفس المستخدمة في TeachersManager) ============
const arabicToEnglish = (text) => {
  const charMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a',
    'ب': 'b', 'ت': 't', 'ة': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ى': 'a', 'ء': 'a', 'ئ': 'a', 'ؤ': 'a',
    'َ': '', 'ُ': '', 'ِ': '', 'ّ': '', 'ْ': '', 'ً': '', 'ٌ': '', 'ٍ': '', 'ـ': '',
    'لا': 'la', 'لآ': 'laa'
  };

  let result = '';
  let i = 0;
  while (i < text.length) {
    if (i + 1 < text.length) {
      const twoChars = text[i] + text[i + 1];
      if (charMap[twoChars] !== undefined) {
        result += charMap[twoChars];
        i += 2;
        continue;
      }
    }
    const char = text[i];
    result += charMap[char] || char;
    i++;
  }
  return result;
};

// ============ توليد اسم مستخدم للمعلم ============
const generateUsername = (fullName) => {
  if (!fullName || !fullName.trim()) {
    return 'teacher_' + Math.floor(Math.random() * 10000);
  }

  const cleanName = fullName.trim().replace(/\s+/g, ' ').replace(/[^ء-ي\s]/g, '');
  if (!cleanName) return 'teacher_' + Math.floor(Math.random() * 10000);

  const parts = cleanName.split(' ');
  const englishParts = parts.map(p => arabicToEnglish(p)).filter(p => p.length > 0);

  if (englishParts.length === 0) {
    return 'teacher_' + Math.floor(Math.random() * 10000);
  }

  let username = '';
  const firstName = englishParts[0];
  const lastName = englishParts.length > 1 ? englishParts[englishParts.length - 1] : '';

  if (lastName) {
    username = firstName.slice(0, 5) + lastName.slice(0, 4);
  } else {
    username = firstName.slice(0, 8);
  }

  username = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

  if (username.length < 3) {
    username = 'teacher_' + Math.floor(Math.random() * 10000);
  }

  if (username.length > 15) {
    username = username.slice(0, 15);
  }

  username = username + Math.floor(Math.random() * 100);
  return username.toLowerCase();
};

// ============ توليد كلمة مرور (6 أرقام) ============
const generatePassword = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export default function ImportTeachers({ onImportComplete }) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [results, setResults] = useState({ success: 0, failed: 0, details: [] });
  const [showResults, setShowResults] = useState(false);
  const [showPassword, setShowPassword] = useState({});

  // ============ تحميل النموذج ============
  const downloadTemplate = () => {
    const template = [
      { 
        'الاسم الكامل': 'أحمد محمد المعلم',
        'رقم الهاتف': '0591234567'
      },
      { 
        'الاسم الكامل': 'سارة خالد المعلمة',
        'رقم الهاتف': '0592345678'
      },
      { 
        'الاسم الكامل': 'محمد عبد الله المعلم',
        'رقم الهاتف': '0593456789'
      },
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
    XLSX.writeFile(wb, 'استيراد_معلمين_مثال.xlsx');
  };

  // ============ قراءة الملف ============
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setMessage({ type: '', text: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('📊 بيانات الملف:', jsonData);
        setPreviewData(jsonData);
        setMessage({ type: 'info', text: `✅ تم قراءة ${jsonData.length} معلم من الملف` });
      } catch (err) {
        setMessage({ type: 'error', text: '❌ خطأ في قراءة الملف: ' + err.message });
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // ============ التحقق من البيانات ============
  const validateData = (data) => {
    const errors = [];
    data.forEach((row, index) => {
      if (!row['الاسم الكامل'] || row['الاسم الكامل'].trim() === '') {
        errors.push({ index: index + 1, reason: 'الاسم الكامل مطلوب' });
      }
    });
    return errors;
  };

  // ============ استيراد المعلمين ============
  const handleImport = async () => {
    if (previewData.length === 0) {
      setMessage({ type: 'error', text: '❌ لا توجد بيانات للاستيراد' });
      return;
    }

    // التحقق من البيانات
    const validationErrors = validateData(previewData);
    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.map(e => `صف ${e.index}: ${e.reason}`).join('\n');
      setMessage({ type: 'error', text: `❌ أخطاء في البيانات:\n${errorMsg}` });
      return;
    }

    setImporting(true);
    setMessage({ type: '', text: '' });
    
    // ✅ حفظ بيانات المدير الحالي
    const adminUser = auth.currentUser;
    const adminEmail = adminUser?.email;

    const results = { success: 0, failed: 0, details: [] };

    for (const row of previewData) {
      const fullName = row['الاسم الكامل']?.trim() || '';
      const phone = row['رقم الهاتف']?.toString().trim() || '';

      // توليد اسم المستخدم وكلمة المرور
      let username = generateUsername(fullName);
      const password = generatePassword();
      const email = `${username}@school.local`;

      try {
        // التحقق من عدم وجود اسم مستخدم مكرر
        const existingQuery = query(collection(db, 'users'), where('username', '==', username));
        const existingSnapshot = await getDocs(existingQuery);
        
        let finalUsername = username;
        if (!existingSnapshot.empty) {
          finalUsername = username + Math.floor(Math.random() * 1000);
        }

        const finalEmail = `${finalUsername}@school.local`;
        
        // ✅ إنشاء حساب في Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, finalEmail, password);
        
        // ✅ تسجيل الخروج من الحساب الجديد فوراً
        await auth.signOut();

        // ✅ حفظ بيانات المعلم في Firestore (مطابق لـ TeachersManager)
        const teacherData = {
          fullName: fullName,
          username: finalUsername,
          email: finalEmail,
          phone: phone,
          password: password,
          role: 'teacher',
          uid: userCredential.user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), teacherData);

        results.success++;
        results.details.push({ 
          name: fullName, 
          username: finalUsername, 
          password: password,
          phone: phone,
          status: 'success' 
        });
      } catch (error) {
        results.failed++;
        results.details.push({ 
          name: fullName, 
          username: username, 
          password: password,
          status: 'failed',
          error: error.message 
        });
        console.error(`❌ خطأ في إضافة ${fullName}:`, error);
      }
    }

    setResults(results);
    setShowResults(true);
    setMessage({ 
      type: results.failed === 0 ? 'success' : 'warning',
      text: `✅ تم استيراد ${results.success} معلم${results.failed > 0 ? `، فشل ${results.failed} معلم` : ''}\n⚠️ تم تسجيل الخروج، الرجاء تسجيل الدخول مرة أخرى كمدير`
    });

    setImporting(false);
    
    if (onImportComplete) {
      onImportComplete();
    }
  };

  // ============ إعادة تعيين ============
  const resetAll = () => {
    setFile(null);
    setPreviewData([]);
    setResults({ success: 0, failed: 0, details: [] });
    setShowResults(false);
    setMessage({ type: '', text: '' });
    document.getElementById('file-upload-teachers').value = '';
  };

  // ============ تصدير نتائج الاستيراد ============
  const exportResults = () => {
    const exportData = results.details.map(item => ({
      'اسم المعلم': item.name,
      'اسم المستخدم': item.username,
      'كلمة المرور': item.password,
      'رقم الهاتف': item.phone || '',
      'الحالة': item.status === 'success' ? '✅ تم الاستيراد' : '❌ فشل'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'نتائج_استيراد_المعلمين.xlsx');
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            استيراد المعلمين من Excel
          </h2>
          <p className="text-xs text-slate-400">قم بتحميل ملف Excel يحتوي على بيانات المعلمين للاستيراد التلقائي</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل نموذج
          </button>
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
          >
            <X className="w-3.5 h-3.5" />
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* ====== عرض الرسائل ====== */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm whitespace-pre-line ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : message.type === 'warning'
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            : message.type === 'info'
            ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ====== تحميل الملف ====== */}
      <div className="mb-4">
        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          file ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600'
        }`}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload-teachers"
          />
          <label htmlFor="file-upload-teachers" className="cursor-pointer">
            <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">
              {file ? file.name : 'اختر ملف Excel أو CSV'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              الصيغ المدعومة: .xlsx, .xls
            </p>
            {file && (
              <p className="text-xs text-emerald-400 mt-2">
                ✅ تم تحميل الملف: {previewData.length} معلم
              </p>
            )}
          </label>
        </div>
      </div>

      {/* ====== معاينة البيانات ====== */}
      {previewData.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-400 mb-2">
            معاينة البيانات ({previewData.length} معلم)
          </h3>
          <div className="overflow-x-auto max-h-40">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-2 text-slate-400">#</th>
                  <th className="p-2 text-slate-400">الاسم الكامل</th>
                  <th className="p-2 text-slate-400">رقم الهاتف</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-b border-slate-800">
                    <td className="p-2 text-slate-500">{index + 1}</td>
                    <td className="p-2 text-slate-300">{row['الاسم الكامل'] || '-'}</td>
                    <td className="p-2 text-slate-300">{row['رقم الهاتف'] || '-'}</td>
                  </tr>
                ))}
                {previewData.length > 10 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-slate-500">
                      ... و {previewData.length - 10} معلم آخر
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====== تنبيه مهم للمستخدم ====== */}
      {previewData.length > 0 && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
          ⚠️ بعد استيراد المعلمين، سيتم تسجيل الخروج من حساب المدير. الرجاء تسجيل الدخول مرة أخرى.
        </div>
      )}

      {/* ====== زر الاستيراد ====== */}
      {previewData.length > 0 && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري استيراد {previewData.length} معلم...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              استيراد {previewData.length} معلم
            </>
          )}
        </button>
      )}

      {/* ====== عرض النتائج ====== */}
      {showResults && results.details.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              نتائج الاستيراد
              <span className="text-emerald-400">({results.success} نجاح)</span>
              {results.failed > 0 && (
                <span className="text-rose-400">({results.failed} فشل)</span>
              )}
            </h3>
            <button
              onClick={exportResults}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              تصدير النتائج
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-2 text-slate-400">#</th>
                  <th className="p-2 text-slate-400">اسم المعلم</th>
                  <th className="p-2 text-slate-400">اسم المستخدم</th>
                  <th className="p-2 text-slate-400">كلمة المرور</th>
                  <th className="p-2 text-slate-400">رقم الهاتف</th>
                  <th className="p-2 text-slate-400">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {results.details.map((item, index) => (
                  <tr key={index} className="border-b border-slate-800">
                    <td className="p-2 text-slate-500">{index + 1}</td>
                    <td className="p-2 text-slate-300">{item.name}</td>
                    <td className="p-2 text-slate-300">{item.username}</td>
                    <td className="p-2">
                      <button
                        onClick={() => setShowPassword(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        {showPassword[index] ? (
                          <><EyeOff className="w-3 h-3" /> {item.password}</>
                        ) : (
                          <><Eye className="w-3 h-3" /> إظهار</>
                        )}
                      </button>
                    </td>
                    <td className="p-2 text-slate-300">{item.phone || '-'}</td>
                    <td className="p-2">
                      {item.status === 'success' ? (
                        <span className="text-emerald-400">✅ نجاح</span>
                      ) : (
                        <span className="text-rose-400" title={item.error}>
                          ❌ فشل
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}