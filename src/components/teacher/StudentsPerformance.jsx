import React, { useState } from 'react';
import { Users, TrendingUp, TrendingDown, BarChart3, Award, AlertCircle } from 'lucide-react';

export default function StudentsPerformance({ darkMode, students }) {
  const [selectedSubject, setSelectedSubject] = useState('all');

  const performanceData = students.map(student => ({
    name: student.fullName,
    attendance: Math.floor(Math.random() * 30) + 70,
    grades: Math.floor(Math.random() * 30) + 65,
    behavior: Math.floor(Math.random() * 20) + 75,
    progress: Math.random() > 0.5 ? 'up' : 'down'
  }));

  const getStatusColor = (value) => {
    if (value >= 85) return 'text-emerald-400';
    if (value >= 70) return 'text-blue-400';
    if (value >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getProgressBadge = (progress) => {
    return progress === 'up' 
      ? <TrendingUp className="w-4 h-4 text-emerald-400" />
      : <TrendingDown className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          أداء الطلاب
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">المادة:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">جميع المواد</option>
            <option value="math">رياضيات</option>
            <option value="science">علوم</option>
            <option value="arabic">لغة عربية</option>
          </select>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-2xl font-black text-emerald-400">
            {Math.floor(Math.random() * 10) + 90}%
          </span>
          <p className="text-xs text-slate-400">معدل الحضور</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-2xl font-black text-blue-400">
            {Math.floor(Math.random() * 10) + 85}%
          </span>
          <p className="text-xs text-slate-400">معدل العلامات</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-2xl font-black text-purple-400">
            {Math.floor(Math.random() * 10) + 80}%
          </span>
          <p className="text-xs text-slate-400">معدل السلوك</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-2xl font-black text-amber-400">
            {Math.floor(Math.random() * 5) + 95}%
          </span>
          <p className="text-xs text-slate-400">معدل التقدم</p>
        </div>
      </div>

      {/* قائمة الطلاب */}
      <div className="space-y-3">
        {performanceData.map((student, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {student.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{student.name}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">📚 {student.grades}%</span>
                  <span className="flex items-center gap-1">✅ {student.attendance}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className={`text-sm font-bold ${getStatusColor(student.grades)}`}>
                  {student.grades}%
                </span>
                <p className="text-[10px] text-slate-500">العلامات</p>
              </div>
              <div className="text-center">
                <span className={`text-sm font-bold ${getStatusColor(student.attendance)}`}>
                  {student.attendance}%
                </span>
                <p className="text-[10px] text-slate-500">الحضور</p>
              </div>
              <div className="text-center">
                <span className={`text-sm font-bold ${getStatusColor(student.behavior)}`}>
                  {student.behavior}%
                </span>
                <p className="text-[10px] text-slate-500">السلوك</p>
              </div>
              <div className="text-center">
                {getProgressBadge(student.progress)}
                <p className="text-[10px] text-slate-500">التقدم</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {performanceData.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">لا يوجد طلاب لعرض أدائهم</p>
        </div>
      )}
    </div>
  );
}