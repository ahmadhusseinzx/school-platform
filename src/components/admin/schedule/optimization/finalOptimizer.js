// src/components/admin/schedule/optimization/finalOptimizer.js

/**
 * وحدة التحسين النهائي - دورات متعددة حتى استقرار النتيجة
 */

import { calculateScheduleScore } from './scheduleScoring';
import { compactAllSchedules } from './compactSchedule';
import { swapOptimizer } from './swapOptimizer';
import { repairSchedule } from './repairSchedule';
import { balanceTeacherLoad, balanceDailyTeacherLoad } from './teacherBalancer';

export function finalOptimizer(schedule, {
  classes,
  teachers,
  subjects,
  subjectHours,
  teacherMaxHours,
  teacherMaxDailyHours,
  getActiveDays,
  getDayPeriodCount,
  getTeacherName,
  getClassName,
  getSubjectColor,
  periodLabels,
  checkTeacherAvailability,
  swapWithOtherClass
}) {
  const maxIterations = 50;
  let currentSchedule = { ...schedule };
  let bestSchedule = { ...schedule };
  let bestScore = -1;
  let iterations = 0;
  
  const context = {
    classes,
    teachers,
    subjects,
    subjectHours,
    teacherMaxHours,
    teacherMaxDailyHours,
    getActiveDays,
    getDayPeriodCount,
    getTeacherName,
    getClassName,
    getSubjectColor,
    periodLabels,
    checkTeacherAvailability,
    swapWithOtherClass
  };
  
  while (iterations < maxIterations) {
    iterations++;
    let changed = false;
    
    // ============ 1. ضغط الجداول ============
    const compacted = compactAllSchedules(currentSchedule, {
      classes,
      getActiveDays,
      getDayPeriodCount,
      periodLabels,
      checkTeacherAvailability,
      getTeacherName
    });
    
    if (JSON.stringify(compacted) !== JSON.stringify(currentSchedule)) {
      currentSchedule = compacted;
      changed = true;
    }
    
    // ============ 2. إصلاح التعارضات ============
    const scoreResult = calculateScheduleScore(currentSchedule, context);
    const conflicts = scoreResult.details.teacherConflicts > 0 ? 
      findConflicts(currentSchedule, teachers, getActiveDays) : [];
    
    if (conflicts.length > 0) {
      const swapResult = swapOptimizer(currentSchedule, conflicts, {
        teachers,
        classes,
        getActiveDays,
        getDayPeriodCount,
        getTeacherName,
        getClassName,
        periodLabels,
        checkTeacherAvailability
      });
      
      if (swapResult.improved) {
        currentSchedule = swapResult.schedule;
        changed = true;
      }
    }
    
    // ============ 3. موازنة المعلمين ============
    const balanceResult = balanceTeacherLoad(currentSchedule, {
      teachers,
      teacherMaxHours,
      teacherMaxDailyHours,
      getActiveDays,
      getDayPeriodCount,
      getTeacherName,
      getClassName,
      periodLabels,
      checkTeacherAvailability,
      swapWithOtherClass
    });
    
    if (balanceResult.improved) {
      currentSchedule = balanceResult.schedule;
      changed = true;
    }
    
    // ============ 4. موازنة يومية ============
    const dailyBalanceResult = balanceDailyTeacherLoad(currentSchedule, {
      teachers,
      teacherMaxDailyHours,
      getActiveDays,
      getDayPeriodCount,
      checkTeacherAvailability
    });
    
    if (dailyBalanceResult.improved) {
      currentSchedule = dailyBalanceResult.schedule;
      changed = true;
    }
    
    // ============ 5. تقييم النتيجة ============
    const newScore = calculateScheduleScore(currentSchedule, context);
    
    if (newScore.score > bestScore) {
      bestScore = newScore.score;
      bestSchedule = { ...currentSchedule };
    }
    
    // ============ 6. إذا لم يتغير شيء، توقف ============
    if (!changed) break;
  }
  
  // ============ 7. التقييم النهائي ============
  const finalScore = calculateScheduleScore(bestSchedule, context);
  
  return {
    schedule: bestSchedule,
    score: finalScore,
    iterations,
    isPerfect: finalScore.isPerfect,
    details: finalScore.details
  };
}

/**
 * العثور على التعارضات
 */
function findConflicts(schedule, teachers, getActiveDays) {
  const conflicts = [];
  const activeDays = getActiveDays();
  
  teachers.forEach(teacher => {
    const teacherSlots = {};
    activeDays.forEach(day => {
      teacherSlots[day.id] = {};
    });
    
    Object.values(schedule).forEach(classSchedule => {
      if (!classSchedule) return;
      activeDays.forEach(day => {
        const daySchedule = classSchedule[day.id] || [];
        daySchedule.forEach(slot => {
          if (slot.teacherId === teacher.id) {
            const period = slot.period;
            if (teacherSlots[day.id][period]) {
              conflicts.push({
                teacher: teacher.fullName,
                day: day.label,
                period: period,
                reason: 'تعارض معلم'
              });
            } else {
              teacherSlots[day.id][period] = slot;
            }
          }
        });
      });
    });
  });
  
  return conflicts;
}