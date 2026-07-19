// src/components/admin/CertificateGenerator.jsx

import React, { useState, useEffect } from 'react';
import { 
  FileText, Loader2, CheckCircle, AlertCircle, RefreshCw, Image
} from 'lucide-react';

// استيراد المكونات والملفات المساعدة
import { CERTIFICATE_TYPES } from './constants';
import { useSchoolData } from './useSchoolData';
import { printCertificate, printAllCertificates } from './certificatePrinter';
import CertificateList from './CertificateList';
import CertificatePreview from './CertificatePreview';

export default function CertificateGenerator() {
  // ====== استيراد البيانات من Hook ======
  const {
    students,
    classes,
    loading,
    schoolSettings,
    academicYear,
    generateSingleCertificate
  } = useSchoolData();

  // ====== حالات المكون ======
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [certificateType, setCertificateType] = useState('final1');
  const [generateForAll, setGenerateForAll] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ====== تنظيف الرسائل تلقائياً ======
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ====== توليد الشهادات ======
  const handleGenerate = async () => {
    setGenerating(true);
    setMessage({ type: '', text: '' });

    try {
      let targetStudents = [];

      if (generateForAll && selectedClass) {
        targetStudents = students.filter(s => s.classId === selectedClass);
      } else if (selectedStudent) {
        const student = students.find(s => s.id === selectedStudent);
        if (student) targetStudents = [student];
      } else {
        setMessage({ type: 'error', text: '❌ الرجاء اختيار طالب أو صف' });
        setGenerating(false);
        return;
      }

      if (targetStudents.length === 0) {
        setMessage({ type: 'error', text: '❌ لا يوجد طلاب للإنشاء' });
        setGenerating(false);
        return;
      }

      const results = [];
      for (const student of targetStudents) {
        const certificate = await generateSingleCertificate(student.id, certificateType);
        if (certificate) {
          results.push(certificate);
        }
      }

      setCertificates(results);
      
      if (results.length === 1) {
        setSelectedCertificate(results[0]);
      }

      setMessage({ 
        type: 'success', 
        text: `✅ تم إنشاء ${results.length} شهادة بنجاح` 
      });

    } catch (error) {
      console.error('❌ خطأ:', error);
      setMessage({ type: 'error', text: '❌ خطأ في إنشاء الشهادات: ' + error.message });
    } finally {
      setGenerating(false);
    }
  };

  // ====== طباعة شهادة مفردة ======
  const handlePrintSingle = () => {
    if (selectedCertificate) {
      printCertificate(selectedCertificate, certificateType, academicYear);
    }
  };

  // ====== طباعة جميع الشهادات ======
  const handlePrintAll = () => {
    printAllCertificates(certificates, certificateType, academicYear);
  };

  // ====== مسح الكل ======
  const handleClearAll = () => {
    setCertificates([]);
    setSelectedCertificate(null);
    setMessage({ type: '', text: '' });
  };

  // ====== عرض حالة التحميل ======
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (!academicYear) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل العام الدراسي...</p>
      </div>
    );
  }

  const selectedType = CERTIFICATE_TYPES.find(t => t.id === certificateType);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            إنشاء الشهادات المدرسية
          </h2>
          <p className="text-xs text-slate-400">
            إنشاء شهادات تقديرية للطلاب - العام الدراسي: <span className="text-emerald-400 font-bold">{academicYear}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">📄 عدد الشهادات: {certificates.length}</span>
          {schoolSettings.logo && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Image className="w-3 h-3" /> شعار المدرسة موجود
            </span>
          )}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            مسح الكل
          </button>
        </div>
      </div>

      {/* ====== عرض الرسائل ====== */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ====== خيارات إنشاء الشهادة ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
        {/* نوع الشهادة */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">نوع الشهادة</label>
          <select
            value={certificateType}
            onChange={(e) => setCertificateType(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            {CERTIFICATE_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1">{selectedType?.description}</p>
        </div>

        {/* الصف */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">الصف</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">اختر الصف</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        {/* الطالب */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">الطالب</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            disabled={generateForAll}
          >
            <option value="">اختر الطالب</option>
            {students
              .filter(s => !selectedClass || s.classId === selectedClass)
              .map(student => (
                <option key={student.id} value={student.id}>{student.fullName}</option>
              ))}
          </select>
        </div>

        {/* خيارات إضافية */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 block mb-1">خيارات</label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={generateForAll}
                onChange={(e) => {
                  setGenerateForAll(e.target.checked);
                  if (e.target.checked) setSelectedStudent('');
                }}
                className="rounded bg-slate-700 border-slate-600 text-emerald-500"
              />
              جميع طلاب الصف
            </label>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || (!selectedStudent && !generateForAll)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</>
            ) : (
              <><FileText className="w-4 h-4" /> إنشاء الشهادة</>
            )}
          </button>
        </div>
      </div>

      {/* ====== قائمة الشهادات ====== */}
      <CertificateList
        certificates={certificates}
        selectedCertificate={selectedCertificate}
        setSelectedCertificate={setSelectedCertificate}
        certificateType={certificateType}
        academicYear={academicYear}
        onPrintAll={handlePrintAll}
      />

      {/* ====== معاينة الشهادة ====== */}
      <CertificatePreview
        certificate={selectedCertificate}
        certificateType={certificateType}
        academicYear={academicYear}
        schoolSettings={schoolSettings}
        onPrint={handlePrintSingle}
      />
    </div>
  );
}