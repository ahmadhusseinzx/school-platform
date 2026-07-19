// src/components/admin/schedule/optimization/compactSchedule.js

/**
 * وحدة ضغط جداول الصفوف
 * تقوم بإزالة الفراغات وجعل الحصص متجاورة
 */

export function compactClassSchedule(schedule, classId, {
  getActiveDays,
  getDayPeriodCount,
  periodLabels,
  checkTeacherAvailability,
  getTeacherName
}) {
  const compacted = { ...schedule };
  const activeDays = getActiveDays();
  
  if (!compacted[classId]) {
    compacted[classId] = {};
  }

  activeDays.forEach(day => {
    const daySchedule = compacted[classId]?.[day.id] || [];
    if (daySchedule.length === 0) return;
    
    // ترتيب الحصص حسب الفترة
    const sorted = [...daySchedule].sort((a, b) => a.period - b.period);
    
    // إعادة توزيع الحصص لتكون متجاورة من البداية
    const newDaySchedule = [];
    let currentPeriod = 1;
    const maxPeriods = getDayPeriodCount(day.id);
    
    for (const slot of sorted) {
      // التحقق من عدم وجود تعارض مع المعلم
      const hasConflict = checkTeacherAvailability(
        compacted,
        slot.teacherId,
        day.id,
        currentPeriod,
        classId
      );
      
      if (!hasConflict) {
        newDaySchedule.push({
          ...slot,
          period: currentPeriod,
          periodLabel: periodLabels[String(currentPeriod)] || `الحصة ${currentPeriod}`,
          compacted: true
        });
        currentPeriod++;
      } else {
        // إذا كان هناك تعارض، حاول العثور على فترة أخرى قريبة
        let found = false;
        for (let p = currentPeriod; p <= maxPeriods; p++) {
          const teacherConflict = checkTeacherAvailability(
            compacted,
            slot.teacherId,
            day.id,
            p,
            classId
          );
          
          if (!teacherConflict) {
            newDaySchedule.push({
              ...slot,
              period: p,
              periodLabel: periodLabels[String(p)] || `الحصة ${p}`,
              compacted: true
            });
            if (p === currentPeriod) currentPeriod++;
            found = true;
            break;
          }
        }
        
        if (!found) {
          // إضافة في النهاية
          const lastPeriod = Math.max(...newDaySchedule.map(s => s.period), 0) + 1;
          if (lastPeriod <= maxPeriods) {
            newDaySchedule.push({
              ...slot,
              period: lastPeriod,
              periodLabel: periodLabels[String(lastPeriod)] || `الحصة ${lastPeriod}`,
              compacted: true,
              isForced: true
            });
          } else {
            // إذا لم يكن هناك مكان، احتفظ بالفترة الأصلية
            newDaySchedule.push({
              ...slot,
              compacted: true
            });
          }
        }
      }
    }
    
    // ترتيب نهائي
    newDaySchedule.sort((a, b) => a.period - b.period);
    compacted[classId][day.id] = newDaySchedule;
  });
  
  return compacted;
}

/**
 * ضغط جميع جداول الصفوف
 */
export function compactAllSchedules(schedule, {
  classes,
  getActiveDays,
  getDayPeriodCount,
  periodLabels,
  checkTeacherAvailability,
  getTeacherName
}) {
  let result = { ...schedule };
  
  classes.forEach(cls => {
    result = compactClassSchedule(result, cls.id, {
      getActiveDays,
      getDayPeriodCount,
      periodLabels,
      checkTeacherAvailability,
      getTeacherName
    });
  });
  
  return result;
}

/**
 * حساب عدد الفراغات في جدول الصف
 */
export function countClassGaps(schedule, classId, {
  getActiveDays,
  getDayPeriodCount
}) {
  let gaps = 0;
  const activeDays = getActiveDays();
  const daySchedule = schedule[classId] || {};
  
  activeDays.forEach(day => {
    const slots = daySchedule[day.id] || [];
    if (slots.length === 0) return;
    
    const periods = slots.map(s => s.period).sort((a, b) => a - b);
    let expected = 1;
    
    for (const period of periods) {
      if (period > expected) {
        gaps += (period - expected);
      }
      expected = period + 1;
    }
  });
  
  return gaps;
}

/**
 * التحقق من أن جدول الصف مضغوط بشكل مثالي
 */
export function isClassCompact(schedule, classId, getActiveDays) {
  const activeDays = getActiveDays();
  
  for (const day of activeDays) {
    const slots = schedule[classId]?.[day.id] || [];
    if (slots.length === 0) continue;
    
    const periods = slots.map(s => s.period).sort((a, b) => a - b);
    let expected = 1;
    
    for (const period of periods) {
      if (period !== expected) return false;
      expected++;
    }
  }
  
  return true;
}