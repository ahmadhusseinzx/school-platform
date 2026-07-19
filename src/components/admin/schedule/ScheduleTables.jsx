import React from 'react';
import { AlertTriangle, School, User } from 'lucide-react';
export function ClassSchedule({ classId, schedule, getClassName, getActiveDays, getDayPeriodCount, getSortedClasses }) {
    if (!schedule || !schedule[classId]) return null;
    const classSchedule = schedule[classId];
    const className = getClassName(classId);
    const activeDays = getActiveDays();
    const sortedClasses = getSortedClasses();

    return (
      <div key={classId} className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-6 transition-all hover:border-blue-500/30">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
            <School className="w-4 h-4" />
            {className}
          </h4>
          <div className="flex gap-1">
            {activeDays.map(day => (
              <span key={day.id} className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                {day.short}: {classSchedule[day.id]?.length || 0}/{getDayPeriodCount(day.id)}
              </span>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-2 text-center text-slate-400 min-w-[50px]">#</th>
                {activeDays.map(day => {
                  const count = getDayPeriodCount(day.id);
                  return (
                    <th key={day.id} className="p-2 text-center text-blue-400 min-w-[110px]">
                      {day.label}
                      <span className="block text-[8px] text-slate-500 font-normal">
                        ({classSchedule[day.id]?.length || 0}/{count} ح)
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const maxPeriods = Math.max(...activeDays.map(day => getDayPeriodCount(day.id)));
                const rows = [];
                for (let p = 1; p <= maxPeriods; p++) {
                  rows.push(p);
                }
                return rows.map(periodNumber => (
                  <tr key={periodNumber} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="p-2 text-center text-slate-400 font-mono text-[10px]">
                      {periodNumber}
                    </td>
                    {activeDays.map(day => {
                      const dayPeriodsCount = getDayPeriodCount(day.id);
                      if (periodNumber > dayPeriodsCount) {
                        return (
                          <td key={day.id} className="p-2 text-center text-slate-700 text-xs">
                            —
                          </td>
                        );
                      }
                      const slot = classSchedule[day.id]?.find(s => s.period === periodNumber);
                      return (
                        <td key={day.id} className="p-2 text-center">
                          {slot ? (
                            <div 
                              className={`p-1.5 rounded border transition-all hover:scale-105 cursor-default ${slot.isForced ? 'border-amber-500/50 bg-amber-500/10' : ''}`}
                              style={{ 
                                backgroundColor: `${slot.color || '#3B82F6'}20`,
                                borderColor: slot.isForced ? '#F59E0B' : `${slot.color || '#3B82F6'}40`
                              }}
                            >
                              <div className="text-[10px] font-bold text-white truncate">{slot.subjectName}</div>
                              <div className="text-[8px] text-slate-400 truncate">{slot.teacherName}</div>
                              {slot.isForced && (
                                <div className="text-[6px] text-amber-400">⚠️ إجباري</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-700 text-xs">•</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    );
}

  // ============ عرض جدول المعلم المحسن ============
export function TeacherSchedule({ teacherId, schedule, teachers, teacherMaxHours, teacherMaxDailyHours, showTeacherConflicts, getActiveDays, getDayPeriodCount, getSortedClasses }) {
    if (!schedule) return null;
    
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return null;
    
    const activeDays = getActiveDays();
    const sortedClasses = getSortedClasses();

    const teacherSchedule = {};
    activeDays.forEach(day => {
      teacherSchedule[day.id] = [];
    });

    sortedClasses.forEach(cls => {
      if (!schedule[cls.id]) return;
      activeDays.forEach(day => {
        const daySchedule = schedule[cls.id][day.id] || [];
        daySchedule.forEach(slot => {
          if (slot.teacherId === teacherId) {
            teacherSchedule[day.id].push({
              ...slot,
              className: cls.name
            });
          }
        });
      });
    });

    activeDays.forEach(day => {
      teacherSchedule[day.id].sort((a, b) => a.period - b.period);
    });

    const totalHours = Object.values(teacherSchedule).reduce((sum, day) => sum + day.length, 0);
    const maxHours = teacherMaxHours[teacherId] || 20;
    const isOverloaded = totalHours > maxHours;
    const maxDaily = teacherMaxDailyHours[teacherId];

    return (
      <div key={teacherId} className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-6 transition-all hover:border-emerald-500/30">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              {teacher.fullName}
            </h4>
            <span className={`text-[10px] px-2 py-0.5 rounded ${isOverloaded ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {totalHours} / {maxHours} حصة
              {isOverloaded && ' ⚠️'}
            </span>
            {maxDaily && (
              <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                حد يومي: {maxDaily}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {activeDays.map(day => (
              <span key={day.id} className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                {day.short}: {teacherSchedule[day.id]?.length || 0}
              </span>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-2 text-center text-slate-400 min-w-[50px]">#</th>
                {activeDays.map(day => (
                  <th key={day.id} className="p-2 text-center text-emerald-400 min-w-[110px]">
                    {day.label}
                    <span className="block text-[8px] text-slate-500 font-normal">
                      ({getDayPeriodCount(day.id)} ح)
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const maxPeriods = Math.max(...activeDays.map(day => getDayPeriodCount(day.id)));
                const rows = [];
                for (let p = 1; p <= maxPeriods; p++) {
                  rows.push(p);
                }
                return rows.map(periodNumber => {
                  let hasConflict = false;
                  const conflictList = [];
                  
                  activeDays.forEach(day => {
                    const slotsInDay = teacherSchedule[day.id]?.filter(s => s.period === periodNumber) || [];
                    if (slotsInDay.length > 1) {
                      hasConflict = true;
                      conflictList.push({
                        day: day.label,
                        count: slotsInDay.length,
                        subjects: slotsInDay.map(s => s.subjectName).join('، ')
                      });
                    }
                  });
                  
                  return (
                    <tr key={periodNumber} className={`border-b border-slate-800 ${hasConflict ? 'bg-rose-500/5' : ''}`}>
                      <td className="p-2 text-center text-slate-400 font-mono text-[10px]">
                        {periodNumber}
                      </td>
                      {activeDays.map(day => {
                        const dayPeriodsCount = getDayPeriodCount(day.id);
                        if (periodNumber > dayPeriodsCount) {
                          return (
                            <td key={day.id} className="p-2 text-center text-slate-700 text-xs">
                              —
                            </td>
                          );
                        }
                        const slot = teacherSchedule[day.id]?.find(s => s.period === periodNumber);
                        const slotsInSameDay = teacherSchedule[day.id]?.filter(s => s.period === periodNumber) || [];
                        const isConflictInSameDay = slotsInSameDay.length > 1;
                        
                        return (
                          <td key={day.id} className="p-2 text-center">
                            {slot ? (
                              <div 
                                className={`p-1.5 rounded border transition-all hover:scale-105 cursor-default ${
                                  isConflictInSameDay ? 'border-rose-500/50 bg-rose-500/20' : 
                                  slot.isForced ? 'border-amber-500/50 bg-amber-500/10' : ''
                                }`}
                                style={{ 
                                  backgroundColor: isConflictInSameDay ? 'rgba(244,63,94,0.2)' : 
                                    slot.isForced ? 'rgba(245,158,11,0.1)' : `${slot.color || '#10B981'}20`,
                                  borderColor: isConflictInSameDay ? '#F43F5E' : 
                                    slot.isForced ? '#F59E0B' : `${slot.color || '#10B981'}40`
                                }}
                              >
                                <div className="text-[10px] font-bold text-white truncate">{slot.subjectName}</div>
                                <div className="text-[8px] text-slate-400 truncate">🏫 {slot.className}</div>
                                {isConflictInSameDay && <div className="text-[6px] text-rose-400">⚠️ تعارض</div>}
                                {slot.isForced && !isConflictInSameDay && (
                                  <div className="text-[6px] text-amber-400">⚠️ إجباري</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-slate-700 text-xs">•</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        
        {showTeacherConflicts && (
          <div className="mt-2 p-2 bg-amber-500/10 rounded border border-amber-500/20">
            <div className="flex items-center gap-2 flex-wrap">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] text-amber-400">
                {activeDays.map(day => {
                  const conflictsList = [];
                  const daySlots = teacherSchedule[day.id] || [];
                  const periodCounts = {};
                  daySlots.forEach(s => {
                    periodCounts[s.period] = (periodCounts[s.period] || 0) + 1;
                  });
                  
                  Object.keys(periodCounts).forEach(period => {
                    if (periodCounts[period] > 1) {
                      conflictsList.push(`الحصة ${period} (${periodCounts[period]} حصص)`);
                    }
                  });
                  
                  if (conflictsList.length > 0) {
                    return `يوم ${day.label}: ${conflictsList.join('، ')}`;
                  }
                  return null;
                }).filter(c => c).join(' | ')}
                {Object.values(teacherSchedule).every(day => day.length === 0) && 'لا توجد حصص'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
}