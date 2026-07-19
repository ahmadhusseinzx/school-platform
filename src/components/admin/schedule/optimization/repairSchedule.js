// src/components/admin/schedule/optimization/repairSchedule.js

/**
 * وحدة إصلاح الحصص غير الموزعة
 */

export function repairSchedule(schedule, remainingSubjects, {
  classes,
  teachers,
  getActiveDays,
  getDayPeriodCount,
  getTeacherName,
  getClassName,
  getSubjectColor,
  periodLabels,
  subjectHours,
  checkTeacherAvailability,
  placeForcedSlot
}) {
  let repaired = { ...schedule };
  let remaining = [...remainingSubjects];
  let repairedCount = 0;
  
  // ============ 1. محاولة التوزيع العادي ============
  for (const subject of remaining) {
    const classId = subject.classId;
    const teacherId = subject.teacherId;
    const hoursNeeded = subjectHours[subject.id] || 2;
    let placed = 0;
    
    // البحث عن أي يوم وفترة متاحة
    const activeDays = getActiveDays();
    const sortedDays = activeDays.sort((a, b) => {
      const loadA = getClassDailyLoad(repaired, classId, a.id);
      const loadB = getClassDailyLoad(repaired, classId, b.id);
      return loadA - loadB;
    });
    
    for (const day of sortedDays) {
      if (placed >= hoursNeeded) break;
      
      const dayPeriods = getDayPeriodCount(day.id);
      const daySchedule = repaired[classId]?.[day.id] || [];
      
      // البحث عن أول فترة فارغة
      for (let p = 1; p <= dayPeriods; p++) {
        if (placed >= hoursNeeded) break;
        
        const existing = daySchedule.find(s => s.period === p);
        if (!existing) {
          const teacherBusy = checkTeacherAvailability(
            repaired,
            teacherId,
            day.id,
            p,
            classId
          );
          
          if (!teacherBusy) {
            const slot = {
              period: p,
              periodLabel: periodLabels[String(p)] || `الحصة ${p}`,
              subjectId: subject.id,
              classId: classId,
              teacherId: teacherId,
              subjectName: subject.name,
              className: getClassName(classId),
              teacherName: getTeacherName(teacherId),
              color: getSubjectColor(subject.id),
              isRepaired: true
            };
            
            if (!repaired[classId]) repaired[classId] = {};
            if (!repaired[classId][day.id]) repaired[classId][day.id] = [];
            repaired[classId][day.id].push(slot);
            placed++;
            repairedCount++;
          }
        }
      }
    }
    
    if (placed < hoursNeeded) {
      // ============ 2. محاولة التوزيع مع التبادل ============
      const swapResult = repairWithSwap(repaired, subject, hoursNeeded - placed, {
        classes,
        getActiveDays,
        getDayPeriodCount,
        getTeacherName,
        getClassName,
        getSubjectColor,
        periodLabels,
        checkTeacherAvailability
      });
      
      repaired = swapResult.schedule;
      repairedCount += swapResult.placed;
      placed += swapResult.placed;
    }
    
    if (placed < hoursNeeded) {
      // ============ 3. التوزيع الإجباري ============
      const forcedResult = placeForced(repaired, subject, hoursNeeded - placed, {
        classes,
        getActiveDays,
        getDayPeriodCount,
        getTeacherName,
        getClassName,
        getSubjectColor,
        periodLabels
      });
      
      repaired = forcedResult.schedule;
      repairedCount += forcedResult.placed;
    }
  }
  
  return {
    schedule: repaired,
    repairedCount,
    remainingCount: remaining.length - Math.min(repairedCount, remaining.length)
  };
}

/**
 * إصلاح باستخدام التبادل
 */
function repairWithSwap(schedule, subject, hoursNeeded, {
  classes,
  getActiveDays,
  getDayPeriodCount,
  getTeacherName,
  getClassName,
  getSubjectColor,
  periodLabels,
  checkTeacherAvailability
}) {
  let currentSchedule = { ...schedule };
  let placed = 0;
  const activeDays = getActiveDays();
  
  for (const day of activeDays) {
    if (placed >= hoursNeeded) break;
    
    // البحث عن صفوف لديها حصص يمكن تبديلها
    for (const cls of classes) {
      if (placed >= hoursNeeded) break;
      if (cls.id === subject.classId) continue;
      
      const daySchedule = currentSchedule[cls.id]?.[day.id] || [];
      
      // البحث عن حصة يمكن تبديلها مع مادة أخرى
      for (const slot of daySchedule) {
        if (placed >= hoursNeeded) break;
        
        // محاولة تبديل مع صف المادة المستهدفة
        const targetDaySchedule = currentSchedule[subject.classId]?.[day.id] || [];
        const targetSlot = targetDaySchedule.find(s => s.period === slot.period);
        
        if (targetSlot) {
          // تبديل المعلمين
          const tempTeacherId = slot.teacherId;
          const tempTeacherName = slot.teacherName;
          
          slot.teacherId = targetSlot.teacherId;
          slot.teacherName = targetSlot.teacherName;
          
          targetSlot.teacherId = tempTeacherId;
          targetSlot.teacherName = tempTeacherName;
          
          placed++;
        }
      }
    }
  }
  
  return { schedule: currentSchedule, placed };
}

/**
 * التوزيع الإجباري
 */
function placeForced(schedule, subject, hoursNeeded, {
  classes,
  getActiveDays,
  getDayPeriodCount,
  getTeacherName,
  getClassName,
  getSubjectColor,
  periodLabels
}) {
  let currentSchedule = { ...schedule };
  let placed = 0;
  const activeDays = getActiveDays();
  
  for (const day of activeDays) {
    if (placed >= hoursNeeded) break;
    
    const dayPeriods = getDayPeriodCount(day.id);
    const daySchedule = currentSchedule[subject.classId]?.[day.id] || [];
    
    for (let p = 1; p <= dayPeriods; p++) {
      if (placed >= hoursNeeded) break;
      
      const existing = daySchedule.find(s => s.period === p);
      if (!existing) {
        const slot = {
          period: p,
          periodLabel: periodLabels[String(p)] || `الحصة ${p}`,
          subjectId: subject.id,
          classId: subject.classId,
          teacherId: subject.teacherId,
          subjectName: subject.name,
          className: getClassName(subject.classId),
          teacherName: getTeacherName(subject.teacherId),
          color: getSubjectColor(subject.id),
          isForced: true,
          isRepaired: true
        };
        
        if (!currentSchedule[subject.classId]) {
          currentSchedule[subject.classId] = {};
        }
        if (!currentSchedule[subject.classId][day.id]) {
          currentSchedule[subject.classId][day.id] = [];
        }
        currentSchedule[subject.classId][day.id].push(slot);
        placed++;
      }
    }
  }
  
  return { schedule: currentSchedule, placed };
}

/**
 * حساب الحمل اليومي للصف
 */
function getClassDailyLoad(schedule, classId, dayId) {
  return schedule[classId]?.[dayId]?.length || 0;
}