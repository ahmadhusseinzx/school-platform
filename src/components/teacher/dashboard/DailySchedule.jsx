import React from 'react';
import { Calendar, ExternalLink } from 'lucide-react';

export default function DailySchedule({ darkMode, schedule }) {
  return (
    <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
        <Calendar className="w-4 h-4" /> الجدول الدراسي اليومي والمرتب زمنياً (Timeline)
      </h3>

      <div className="space-y-3">
        {schedule.map((session) => (
          <div
            key={session.id}
            className={`p-4 rounded-xl border transition-all duration-300 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              session.status === 'current'
                ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                : session.status === 'completed'
                ? 'bg-slate-800/40 border-slate-800 opacity-60'
                : 'bg-[#0f172a] border-slate-800 hover:bg-slate-800/80'
            }`}
          >
            {session.status === 'current' && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow animate-pulse">
                نشط حالياً
              </span>
            )}

            <div className="flex gap-3 items-start">
              <div className={`p-2 rounded-lg text-center min-w-[65px] font-mono text-xs ${session.status === 'current' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                <div>{session.timeFrom}</div>
                <div className="text-[9px] opacity-60 border-t border-slate-755/50 mt-0.5 pt-0.5">{session.timeTo}</div>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-100">{session.subject}</h4>
                <span className="text-[10px] text-slate-400 mt-1 block">🏫 الصف: {session.class}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {session.status === 'completed' ? (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">✓ انتهت الحصة</span>
              ) : (
                <a
                  href={session.link}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full sm:w-auto text-center px-4 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    session.status === 'current'
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      : 'bg-slate-700 text-slate-300 pointer-events-none opacity-50'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> دخول البث المباشر
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}