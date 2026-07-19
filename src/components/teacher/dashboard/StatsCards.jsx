// src/components/teacher/dashboard/StatsCards.jsx
import React from 'react';
import { Clock, Edit3, Percent, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';

export default function StatsCards({ darkMode, statsData, setActiveMainTab }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* بطاقة الحصص المتبقية */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">الحصص اليومية</span>
        </div>
        <div>
          <h4 className="text-xl font-black text-blue-500">{statsData.remainingClasses} حصص متبقية</h4>
          <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>من أصل {statsData.totalClasses} حصص مجدولة لليوم</p>
        </div>
        <div className="mt-4">
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((statsData.totalClasses - statsData.remainingClasses) / statsData.totalClasses) * 100}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
            <span>تم إنجاز 50%</span>
            <span>المتبقي 50%</span>
          </div>
        </div>
      </div>

      {/* بطاقة الواجبات */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500">
            <Edit3 className="w-5 h-5" />
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">التقييمات</span>
        </div>
        <div>
          <h4 className="text-xl font-black text-amber-500">{statsData.pendingHomeworks} واجبات بانتظار التصحيح</h4>
          <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>تطلب رصداً عاجلاً في دفتر العلامات</p>
        </div>
        <button
          onClick={() => setActiveMainTab('exams')}
          className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
        >
          <CheckCircle className="w-3.5 h-3.5" /> ابدأ التصحيح الآن
        </button>
      </div>

      {/* بطاقة الحضور */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
            <Percent className="w-5 h-5" />
          </div>
          <div className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${statsData.attendanceStatus === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {statsData.attendanceStatus === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            <span>مقارنة بالأسبوع الماضي</span>
          </div>
        </div>
        <div>
          <h4 className="text-xl font-black text-emerald-500">{statsData.attendanceRate}% نسبة الحضور اليومي</h4>
          <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>مؤشر التزام الطلاب ممتاز ومستقر</p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>أعلى صف حضوراً: 11 علمي - أ</span>
          <span className="text-emerald-400 font-bold">مستقر</span>
        </div>
      </div>
    </div>
  );
}