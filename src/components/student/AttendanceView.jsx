import React, { useState } from 'react';
import { UserCheck, Calendar, CheckCircle, XCircle, Clock, AlertCircle, BarChart3 } from 'lucide-react';

export default function AttendanceView({ attendance }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'present':
        return <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" /> حاضر</span>;
      case 'absent':
        return <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" /> غائب</span>;
      case 'late':
        return <span className="flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3" /> متأخر</span>;
      case 'excused':
        return <span className="flex items-center gap-1 text-blue-400"><AlertCircle className="w-3 h-3" /> مبرر</span>;
      default:
        return <span className="text-slate-400">غير محدد</span>;
    }
  };

  const getStats = () => {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const excused = attendance.filter(a => a.status === 'excused').length;
    return { total, present, absent, late, excused, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const stats = getStats();

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-400" />
          سجل الحضور
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">الشهر:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-xl font-black text-white">{stats.total}</span>
          <p className="text-[10px] text-slate-400">الإجمالي</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-xl font-black text-emerald-400">{stats.present}</span>
          <p className="text-[10px] text-slate-400">حاضر</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-xl font-black text-rose-400">{stats.absent}</span>
          <p className="text-[10px] text-slate-400">غائب</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-xl font-black text-amber-400">{stats.late}</span>
          <p className="text-[10px] text-slate-400">متأخر</p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-xl font-black text-blue-400">{stats.excused}</span>
          <p className="text-[10px] text-slate-400">مبرر</p>
        </div>
      </div>

      {/* شريط النسبة */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>نسبة الحضور</span>
          <span className="font-bold text-white">{stats.percentage}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              stats.percentage >= 85 ? 'bg-emerald-500' :
              stats.percentage >= 70 ? 'bg-blue-500' :
              stats.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>

      {/* قائمة الحضور */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {attendance.length > 0 ? (
          attendance.map((record, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-white">{record.date || 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold">
                  {getStatusBadge(record.status)}
                </span>
                {record.note && (
                  <span className="text-[10px] text-slate-500">📝 {record.note}</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">لا توجد سجلات حضور</p>
          </div>
        )}
      </div>
    </div>
  );
}