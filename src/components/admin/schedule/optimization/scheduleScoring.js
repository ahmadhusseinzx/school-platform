// src/components/admin/schedule/optimization/scheduleScoring.js

/**
 * نظام التقييم الشامل للجدول الدراسي
 * يحسب نقاط الجودة بناءً على معايير متعددة
 */

export function calculateScheduleScore(schedule, {
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
  periodLabels
}) {
  let score = 1000; // النقاط الأساسية
  const penalties = [];
  const details = {};

  // ============ 1. تعارضات المعلمين (-50 نقطة لكل تعارض) ============
  const teacherConflicts = findTeacherConflicts(schedule, teachers, getActiveDays);
  const teacherConflictCount = teacherConflicts.length;
  if (teacherConflictCount > 0) {
    const penalty = teacherConflictCount * 50;
    score -= penalty;
    penalties.push(`تعارضات معلمين: ${teacherConflictCount} (${penalty}- نقطة)`);
    details.teacherConflicts = teacherConflictCount;
  } else {
    details.teacherConflicts = 0;
  }

  // ============ 2. فراغات الصف (-30 نقطة لكل فراغ) ============
  const classGaps = findClassGaps(schedule, classes, getActiveDays, getDayPeriodCount);
  if (classGaps > 0) {
    const penalty = classGaps * 30;
    score -= penalty;
    penalties.push(`فراغات صفوف: ${classGaps} (${penalty}- نقطة)`);
    details.classGaps = classGaps;
  } else {
    details.classGaps = 0;
  }

  // ============ 3. تجاوز الحد اليومي للمعلم (-20 لكل تجاوز) ============
  const dailyOverloads = findDailyOverloads(schedule, teachers, teacherMaxDailyHours, getActiveDays);
  if (dailyOverloads > 0) {
    const penalty = dailyOverloads * 20;
    score -= penalty;
    penalties.push(`تجاوزات يومية: ${dailyOverloads} (${penalty}- نقطة)`);
    details.dailyOverloads = dailyOverloads;
  } else {
    details.dailyOverloads = 0;
  }

  // ============ 4. تجاوز الحد الأسبوعي (-15 لكل تجاوز) ============
  const weeklyOverloads = findWeeklyOverloads(schedule, teachers, teacherMaxHours);
  if (weeklyOverloads > 0) {
    const penalty = weeklyOverloads * 15;
    score -= penalty;
    penalties.push(`تجاوزات أسبوعية: ${weeklyOverloads} (${penalty}- نقطة)`);
    details.weeklyOverloads = weeklyOverloads;
  } else {
    details.weeklyOverloads = 0;
  }

  // ============ 5. حصص إجبارية (Forced) (-30 لكل حصة) ============
  let forcedCount = 0;
  Object.values(schedule).forEach(classSchedule => {
    if (!classSchedule) return;
    Object.values(classSchedule).forEach(daySchedule => {
      if (!daySchedule) return;
      daySchedule.forEach(slot => {
        if (slot.isForced) forcedCount++;
      });
    });
  });
  
  if (forcedCount > 0) {
    const penalty = forcedCount * 30;
    score -= penalty;
    penalties.push(`حصص إجبارية: ${forcedCount} (${penalty}- نقطة)`);
    details.forcedCount = forcedCount;
  } else {
    details.forcedCount = 0;
  }

  // ============ 6. توزيع غير متوازن للمعلمين (-10 لكل معلم غير متوازن) ============
  const teacherBalancePenalty = calculateTeacherBalance(schedule, teachers);
  if (teacherBalancePenalty > 0) {
    score -= teacherBalancePenalty;
    penalties.push(`عدم توازن معلمين: ${teacherBalancePenalty}- نقطة`);
    details.teacherBalancePenalty = teacherBalancePenalty;
  } else {
    details.teacherBalancePenalty = 0;
  }

  // ============ 7. توزيع غير متوازن للمواد (-5 لكل مادة غير متوازنة) ============
  const subjectBalancePenalty = calculateSubjectBalance(schedule, subjects);
  if (subjectBalancePenalty > 0) {
    score -= subjectBalancePenalty;
    details.subjectBalancePenalty = subjectBalancePenalty;
  } else {
    details.subjectBalancePenalty = 0;
  }

  // ============ 8. مكافآت ============

  // 8.1 نسبة الإشغال (مكافأة)
  const totalSlots = calculateTotalSlots(schedule, classes, getActiveDays, getDayPeriodCount);
  const filledSlots = calculateFilledSlots(schedule);
  const utilization = totalSlots > 0 ? (filledSlots / totalSlots * 100) : 0;
  
  let utilizationBonus = 0;
  if (utilization >= 100) {
    utilizationBonus = 200;
    score += utilizationBonus;
    penalties.push(`✅ إشغال 100%: +${utilizationBonus} نقطة`);
  } else if (utilization >= 95) {
    utilizationBonus = 100;
    score += utilizationBonus;
    penalties.push(`✅ إشغال 95%+: +${utilizationBonus} نقطة`);
  } else if (utilization >= 90) {
    utilizationBonus = 50;
    score += utilizationBonus;
    penalties.push(`✅ إشغال 90%+: +${utilizationBonus} نقطة`);
  }
  details.utilization = utilization;
  details.utilizationBonus = utilizationBonus;

  // 8.2 عدم وجود فراغات (مكافأة)
  if (classGaps === 0 && forcedCount === 0) {
    const bonus = 100;
    score += bonus;
    penalties.push(`✅ جدول مثالي بدون فراغات: +${bonus} نقطة`);
    details.gapFreeBonus = 100;
  } else {
    details.gapFreeBonus = 0;
  }

  // 8.3 توازن المعلمين الممتاز
  if (teacherBalancePenalty === 0 && teacherConflictCount === 0) {
    const bonus = 50;
    score += bonus;
    penalties.push(`✅ توازن معلمين ممتاز: +${bonus} نقطة`);
    details.teacherBalanceBonus = 50;
  } else {
    details.teacherBalanceBonus = 0;
  }

  // ============ 9. النتيجة النهائية ============
  const finalScore = Math.max(0, Math.min(1000, score));
  const percentage = (finalScore / 1000) * 100;

  return {
    score: finalScore,
    percentage: percentage,
    penalties,
    details,
    utilization,
    teacherConflicts: teacherConflictCount,
    classGaps,
    forcedCount,
    isPerfect: finalScore >= 950 && teacherConflictCount === 0 && classGaps === 0 && forcedCount === 0
  };
}

// ============ دوال مساعدة للتقييم ============

function findTeacherConflicts(schedule, teachers, getActiveDays) {
  const conflicts = [];
  const activeDays = getActiveDays();
  
  teachers.forEach(teacher => {
    const teacherSlots = {};
    activeDays.forEach(day => {
      teacherSlots[day.id] = {};
    });
    
    // جمع جميع حصص المعلم
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
                class1: teacherSlots[day.id][period].className,
                class2: slot.className,
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

function findClassGaps(schedule, classes, getActiveDays, getDayPeriodCount) {
  let gaps = 0;
  const activeDays = getActiveDays();
  
  classes.forEach(cls => {
    activeDays.forEach(day => {
      const daySchedule = schedule[cls.id]?.[day.id] || [];
      if (daySchedule.length === 0) return;
      
      const periods = daySchedule.map(s => s.period).sort((a, b) => a - b);
      let expectedPeriod = 1;
      
      for (const period of periods) {
        if (period > expectedPeriod) {
          gaps += (period - expectedPeriod);
        }
        expectedPeriod = period + 1;
      }
    });
  });
  
  return gaps;
}

function findDailyOverloads(schedule, teachers, teacherMaxDailyHours, getActiveDays) {
  let overloads = 0;
  const activeDays = getActiveDays();
  
  teachers.forEach(teacher => {
    const maxDaily = teacherMaxDailyHours[teacher.id];
    if (!maxDaily) return;
    
    activeDays.forEach(day => {
      let count = 0;
      Object.values(schedule).forEach(classSchedule => {
        if (!classSchedule) return;
        const daySchedule = classSchedule[day.id] || [];
        daySchedule.forEach(slot => {
          if (slot.teacherId === teacher.id) count++;
        });
      });
      
      if (count > maxDaily) {
        overloads += (count - maxDaily);
      }
    });
  });
  
  return overloads;
}

function findWeeklyOverloads(schedule, teachers, teacherMaxHours) {
  let overloads = 0;
  
  teachers.forEach(teacher => {
    const maxWeekly = teacherMaxHours[teacher.id] || 20;
    let count = 0;
    
    Object.values(schedule).forEach(classSchedule => {
      if (!classSchedule) return;
      Object.values(classSchedule).forEach(daySchedule => {
        if (!daySchedule) return;
        daySchedule.forEach(slot => {
          if (slot.teacherId === teacher.id) count++;
        });
      });
    });
    
    if (count > maxWeekly) {
      overloads += (count - maxWeekly);
    }
  });
  
  return overloads;
}

function calculateTeacherBalance(schedule, teachers) {
  const loads = teachers.map(teacher => {
    let count = 0;
    Object.values(schedule).forEach(classSchedule => {
      if (!classSchedule) return;
      Object.values(classSchedule).forEach(daySchedule => {
        if (!daySchedule) return;
        daySchedule.forEach(slot => {
          if (slot.teacherId === teacher.id) count++;
        });
      });
    });
    return count;
  });
  
  const activeTeachers = loads.filter(l => l > 0);
  if (activeTeachers.length < 2) return 0;
  
  const avg = activeTeachers.reduce((a, b) => a + b, 0) / activeTeachers.length;
  const variance = activeTeachers.reduce((sum, load) => sum + Math.pow(load - avg, 2), 0) / activeTeachers.length;
  
  // عقوبة تزيد كلما زاد التباين
  const penalty = Math.min(variance * 2, 50);
  return Math.round(penalty);
}

function calculateSubjectBalance(schedule, subjects) {
  // حساب توزيع المواد بين الصفوف
  const subjectDistribution = {};
  
  Object.values(schedule).forEach(classSchedule => {
    if (!classSchedule) return;
    Object.values(classSchedule).forEach(daySchedule => {
      if (!daySchedule) return;
      daySchedule.forEach(slot => {
        if (!subjectDistribution[slot.subjectId]) {
          subjectDistribution[slot.subjectId] = 0;
        }
        subjectDistribution[slot.subjectId]++;
      });
    });
  });
  
  const counts = Object.values(subjectDistribution);
  if (counts.length < 2) return 0;
  
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
  
  return Math.min(variance * 2, 30);
}

function calculateTotalSlots(schedule, classes, getActiveDays, getDayPeriodCount) {
  const activeDays = getActiveDays();
  let total = 0;
  
  classes.forEach(cls => {
    activeDays.forEach(day => {
      total += getDayPeriodCount(day.id);
    });
  });
  
  return total;
}

function calculateFilledSlots(schedule) {
  let count = 0;
  Object.values(schedule).forEach(classSchedule => {
    if (!classSchedule) return;
    Object.values(classSchedule).forEach(daySchedule => {
      if (!daySchedule) return;
      count += daySchedule.length;
    });
  });
  return count;
}