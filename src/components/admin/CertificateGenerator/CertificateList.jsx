// src/components/admin/CertificateList.jsx

import React from 'react';
import { Printer, FileCheck } from 'lucide-react';
import { printCertificate } from './certificatePrinter';

export default function CertificateList({ 
  certificates, 
  selectedCertificate, 
  setSelectedCertificate, 
  certificateType,
  academicYear,
  onPrintAll 
}) {
  if (certificates.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <FileCheck className="w-4 h-4" />
          الشهادات المُنشأة ({certificates.length})
        </h3>
        <button
          onClick={onPrintAll}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          طباعة الكل
        </button>
      </div>

      {/* قائمة الشهادات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {certificates.map((cert, index) => (
          <div
            key={index}
            className={`p-3 bg-slate-900 rounded-xl border cursor-pointer transition-all ${
              selectedCertificate === cert 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
            onClick={() => setSelectedCertificate(cert)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{cert.student.fullName}</p>
                <p className="text-xs text-slate-400">{cert.classInfo?.name}</p>
                <p className="text-xs text-slate-500">المجموع: {cert.total} / {cert.maxTotal}</p>
                <p className="text-xs text-slate-500">👨‍🎓 نسبة الحضور: {cert.attendance?.rate || 0}%</p>
                <p className="text-xs text-slate-500">⭐ السلوك: {cert.behavior?.respect || 'جيد جداً'}</p>
              </div>
              <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  cert.gradeLabel === 'ممتاز' ? 'bg-emerald-100 text-emerald-700' :
                  cert.gradeLabel === 'جيد جداً' ? 'bg-blue-100 text-blue-700' :
                  cert.gradeLabel === 'جيد' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {cert.gradeLabel}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    printCertificate(cert, certificateType, academicYear);
                  }}
                  className="block mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Printer className="w-3 h-3 inline ml-1" />
                  طباعة
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}