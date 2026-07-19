import React from 'react';
import { AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';

export function ScheduleConflicts({ conflicts = [] }) {
  if (conflicts.length === 0) {
    return (
      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>لا توجد تعارضات في الجدول</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
      <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
        <AlertTriangle className="w-4 h-4" />
        <span>تم العثور على {conflicts.length} تعارض/حصص غير موزعة</span>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {conflicts.map((conflict, index) => (
          <div key={index} className="text-xs text-amber-300/80 flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <span>
              <strong>{conflict.teacher}</strong> - مادة {conflict.subject} في صف {conflict.class}:
              {conflict.remaining ? ` تبقى ${conflict.remaining} حصة` : ''}
              {conflict.period ? ` الحصة ${conflict.period}` : ''}
              {conflict.day ? ` يوم ${conflict.day}` : ''}
              - السبب: {conflict.reason}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-amber-400/60">
        <Info className="w-3 h-3 inline ml-1" />
        يُنصح بزيادة عدد الحصص اليومية للمعلم أو تعديل تفضيلاته
      </div>
    </div>
  );
}

export function AttemptHistory({ attempts = [], bestScore }) {
  if (attempts.length === 0) return null;
  const sortedAttempts = [...attempts].sort((a, b) => b.score - a.score);

  return (
    <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-xs font-bold text-slate-400 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          سجل المحاولات ({attempts.length} محاولة)
        </h5>
        <span className="text-[10px] text-emerald-400">أفضل نسبة: {bestScore.toFixed(1)}%</span>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {sortedAttempts.slice(0, 20).map((attempt) => (
          <div key={attempt.attempt} className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 min-w-[60px]"># {attempt.attempt}</span>
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${attempt.score >= 100 || (attempt.score >= bestScore && attempt.attempt === sortedAttempts[0]?.attempt) ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${attempt.score}%` }}
              />
            </div>
            <span className="text-slate-400 min-w-[60px] text-right">{attempt.score.toFixed(1)}%</span>
            <span className={`text-[8px] ${attempt.conflicts === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>⚠️{attempt.conflicts}</span>
            {attempt.score >= 100 && <span className="text-[8px] text-emerald-400">🎉 مثالي</span>}
          </div>
        ))}
        {attempts.length > 20 && <div className="text-[8px] text-slate-500 text-center">... و {attempts.length - 20} محاولة أخرى</div>}
      </div>
    </div>
  );
}

export function ScheduleStats({ stats }) {
  if (!stats) return null;
  const statsData = [
    { key: 'totalSlots', label: 'إجمالي الحصص', value: stats.totalSlots, color: 'text-white' },
    { key: 'filledSlots', label: 'الحصص المملوءة', value: stats.filledSlots, color: 'text-emerald-400' },
    { key: 'emptySlots', label: 'الحصص الفارغة', value: stats.emptySlots, color: 'text-amber-400' },
    { key: 'utilization', label: 'نسبة الإشغال', value: `${stats.utilization.toFixed(1)}%`, color: stats.utilization >= 100 ? 'text-emerald-400' : 'text-blue-400' },
    { key: 'balanceScore', label: 'توازن التوزيع', value: `${stats.balanceScore.toFixed(1)}%`, color: stats.balanceScore >= 80 ? 'text-emerald-400' : 'text-blue-400' }
  ];

  return <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">{statsData.map((stat) => (
    <div key={stat.key} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
      <div className="text-[8px] text-slate-400">{stat.label}</div>
      <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
    </div>
  ))}</div>;
}