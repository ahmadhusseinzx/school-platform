// src/components/admin/CertificatePreview.jsx

import React from 'react';
import { Printer } from 'lucide-react';
import { CERTIFICATE_TYPES } from './constants';
import { printCertificate } from './certificatePrinter';

export default function CertificatePreview({ 
  certificate, 
  certificateType, 
  academicYear, 
  schoolSettings,
  onPrint 
}) {
  if (!certificate) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-slate-400 text-sm">اختر طالب أو صف واضغط "إنشاء الشهادة"</p>
      </div>
    );
  }

  const typeLabel = CERTIFICATE_TYPES.find(t => t.id === certificateType)?.label || 'شهادة';

  return (
    <div className="bg-white text-slate-900 rounded-xl p-6 border border-slate-200 max-h-[600px] overflow-y-auto">
      {/* معاينة مع الشعار */}
      <div className="border-b-2 border-blue-900 pb-3 mb-3 text-center">
        {schoolSettings.logo && (
          <div className="flex justify-center mb-2">
            <img 
              src={schoolSettings.logo} 
              alt="شعار المدرسة" 
              className="h-16 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <h2 className="text-xl font-bold text-blue-900">
          {schoolSettings.schoolName || 'مدرسة الجيل الجديد'}
        </h2>
        <p className="text-center text-slate-500 text-sm">
          {schoolSettings.schoolAddress || 'حافظة القدس - أبو ديس'}
        </p>
      </div>

      <h3 className="text-lg font-bold text-center text-blue-900 mb-3">
        {typeLabel}
        <span className="block text-sm font-normal text-slate-500">العام الدراسي: {academicYear}</span>
      </h3>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div><span className="text-slate-500">الاسم:</span> <span className="font-bold">{certificate.student.fullName}</span></div>
        <div><span className="text-slate-500">الصف:</span> <span className="font-bold">{certificate.classInfo?.name}</span></div>
        <div><span className="text-slate-500">رقم الهوية:</span> <span className="font-bold">{certificate.student.idNumber || '-------'}</span></div>
        <div><span className="text-slate-500">تاريخ الولادة:</span> <span className="font-bold">{certificate.student.dateOfBirth || '----/--/--'}</span></div>
        <div><span className="text-slate-500">نسبة الحضور:</span> <span className="font-bold">{certificate.attendance?.rate || 0}%</span></div>
        <div><span className="text-slate-500">أيام الغياب:</span> <span className="font-bold text-rose-600">{certificate.attendance?.absenceDays || 0}</span></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="border p-2 text-center">المبحث</th>
              <th className="border p-2 text-center">العلامة المستحقة</th>
              <th className="border p-2 text-center">النهاية العظمى</th>
              <th className="border p-2 text-center">التقدير السنوي</th>
            </tr>
          </thead>
          <tbody>
            {certificate.subjects.map((sub, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-slate-50' : ''}>
                <td className="border p-2 text-center">{sub.name}</td>
                <td className="border p-2 text-center">{sub.total}</td>
                <td className="border p-2 text-center">{sub.max}</td>
                <td className="border p-2 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sub.color}`}>
                    {sub.grade}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="bg-blue-50 font-bold">
              <td colSpan="2" className="border p-2 text-left">المجموع العام: {certificate.total}</td>
              <td className="border p-2 text-center">من {certificate.maxTotal}</td>
              <td className="border p-2 text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${certificate.gradeColor}`}>
                  {certificate.gradeLabel}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-500 mb-2">⭐ تقييم السلوك</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-slate-500">احترام النظام:</span> <span className="font-bold">{certificate.behavior?.respect || 'جيد جداً'}</span></div>
          <div><span className="text-slate-500">النظافة والترتيب:</span> <span className="font-bold">{certificate.behavior?.cleanliness || 'جيد جداً'}</span></div>
          <div><span className="text-slate-500">التعاون مع الآخرين:</span> <span className="font-bold">{certificate.behavior?.cooperation || 'جيد جداً'}</span></div>
          <div><span className="text-slate-500">المبادرة والإيجابية:</span> <span className="font-bold">{certificate.behavior?.initiative || 'جيد جداً'}</span></div>
        </div>
        
        <h4 className="text-xs font-bold text-slate-500 mt-3 mb-1">📝 الملاحظات</h4>
        <div className="text-sm">
          <p><span className="text-slate-500">مربية الصف:</span> {certificate.teacherNotes || 'لا توجد ملاحظات'}</p>
          <p><span className="text-slate-500">مديرة المدرسة:</span> {certificate.principalNotes || 'لا توجد ملاحظات'}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onPrint}
          className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
        >
          <Printer className="w-4 h-4" />
          طباعة الشهادة
        </button>
      </div>
    </div>
  );
}