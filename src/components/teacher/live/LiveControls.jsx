import React from 'react';

export default function LiveControls({ currentStep, setCurrentStep, syncLiveStatus, currentSlide }) {
  return (
    <div className={`p-4 rounded-2xl border space-y-4 bg-[#1e293b] border-slate-700/80`}>
      <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">🎬 مسار التحكم اللحظي النشط للحصة:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => { setCurrentStep(1); syncLiveStatus(1, 0); }}
          className={`p-3.5 rounded-xl border text-center transition-all font-bold text-xs ${
            currentStep === 1
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
              : 'bg-[#0f172a] border-slate-880 text-slate-300 hover:bg-slate-800'
          }`}
        >
          1. التمهيد ومقدمة المادة
        </button>
        <button
          onClick={() => { setCurrentStep(2); syncLiveStatus(2, currentSlide); }}
          className={`p-3.5 rounded-xl border text-center transition-all font-bold text-xs ${
            currentStep === 2
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
              : 'bg-[#0f172a] border-slate-880 text-slate-300 hover:bg-slate-800'
          }`}
        >
          2. العرض والتنقل بالشرائح
        </button>
        <button
          onClick={() => { setCurrentStep(3); syncLiveStatus(3, 0); }}
          className={`p-3.5 rounded-xl border text-center transition-all font-bold text-xs ${
            currentStep === 3
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
              : 'bg-[#0f172a] border-slate-880 text-slate-300 hover:bg-slate-800'
          }`}
        >
          3. التقييم والامتحانات الفورية
        </button>
      </div>
      {currentStep === 2 && (
        <div className="flex items-center justify-between p-2 rounded-xl border bg-[#0f172a] border-slate-800">
          {/* سيتم تمرير دوال التنقل من المكون الأب */}
        </div>
      )}
    </div>
  );
}