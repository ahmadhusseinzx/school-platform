// src/components/admin/schedule/optimization/subjectDistributor.js

/**
 * وحدة توزيع حصص المادة على أيام الأسبوع
 */

export function distributeSubjectHours(subject, hoursPerWeek, schedule, classId, {
  getActiveDays,
  getDayPeriodCount,
  teacherMaxDailyHours,
  teacherId,
  getTeacherName,
  getClassName,
  getSubjectColor,
  periodLabels,
  checkTeacherAvailability
}) {
  const activeDays = getActiveDays();
  const distribution = {};
  
  // ============ 1. حساب الأيام المتاحة ============
  const availableDays = activeDays.filter(day => {
    const teacherDailyLoad = getTeacherDailyLoad(schedule, teacherId, day.id);
    const maxDaily = teacherMaxDailyHours[teacherId];
    if (maxDaily && teacherDailyLoad >= maxDaily) return false;
    return true;
  });
  
  if (availableDays.length === 0) {
    return { distribution: {}, placed: 0 };
  }
  
  // ============ 2. توزيع الحصص بالتساوي ============
  const daysCount = availableDays.length;
  const basePerDay = Math.floor(hoursPerWeek / daysCount);
  let remaining = hoursPerWeek % daysCount;
  
  // ترتيب الأيام حسب الحمل
  const sortedDays = availableDays.sort((a, b) => {
    const loadA = getClassDailyLoad(schedule, classId, a.id);
    const loadB = getClassDailyLoad(schedule, classId, b.id);
    return loadA - loadB;
  });
  
  // توزيع الحصص
  const dayAllocation = {};
  for (const day of sortedDays) {
    let hoursForDay = basePerDay;
    if (remaining > 0) {
      hoursForDay++;
      remaining--;
    }
    dayAllocation[day.id] = hoursForDay;
  }
  
  // ============ 3. تنفيذ التوزيع ============
  let placed = 0;
  const result = { ...schedule };
  
  for (const [dayId, hours] of Object.entries(dayAllocation)) {
    if (hours === 0) continue;
    
    const day = activeDays.find(d => d.id === dayId);
    if (!day) continue;
    
    const dayPeriods = getDayPeriodCount(dayId);
    const daySchedule = result[classId]?.[dayId] || [];
    const availablePeriods = [];
    
    // العثور على الفترات المتاحة
    for (let p = 1; p <= dayPeriods; p++) {
      const existing = daySchedule.find(s => s.period === p);
      if (!existing) {
        const teacherBusy = checkTeacherAvailability(
          result,
          teacherId,
          dayId,
          p,
          classId
        );
        if (!teacherBusy) {
          availablePeriods.push(p);
        }
      }
    }
    
    // توزيع الحصص في هذا اليوم
    const hoursToPlace = Math.min(hours, availablePeriods.length);
    for (let i = 0; i < hoursToPlace; i++) {
      const period = availablePeriods[i];
      const slot = {
        period: period,
        periodLabel: periodLabels[String(period)] || `الحصة ${period}`,
        subjectId: subject.id,
        classId: classId,
        teacherId: teacherId,
        subjectName: subject.name,
        className: getClassName(classId),
        teacherName: getTeacherName(teacherId),
        color: getSubjectColor(subject.id),
        distributed: true
      };
      
      if (!result[classId]) result[classId] = {};
      if (!result[classId][dayId]) result[classId][dayId] = [];
      result[classId][dayId].push(slot);
      placed++;
    }
  }
  
  return {
    schedule: result,
    distribution: dayAllocation,
    placed
  };
}

/**
 * توزيع متقدم مع مراعاة توزيع المادة على أيام مختلفة
 */
export function distributeSubjectSmart(subject, hoursPerWeek, schedule, classId, {
  getActiveDays,
  getDayPeriodCount,
  teacherMaxDailyHours,
  teacherId,
  getTeacherName,
  getClassName,
  getSubjectColor,
  periodLabels,
  checkTeacherAvailability,
  minDaysForSubject = 3 // الحد الأدنى لعدد الأيام
}) {
  const activeDays = getActiveDays();
  
  // إذا كانت الحصص قليلة، استخدم التوزيع العادي
  if (hoursPerWeek <= 2) {
    return distributeSubjectHours(subject, hoursPerWeek, schedule, classId, {
      getActiveDays,
      getDayPeriodCount,
      teacherMaxDailyHours,
      teacherId,
      getTeacherName,
      getClassName,
      getSubjectColor,
      periodLabels,
      checkTeacherAvailability
    });
  }
  
  // توزيع على أكبر عدد ممكن من الأيام
  const daysToUse = Math.min(hoursPerWeek, activeDays.length, minDaysForSubject);
  const selectedDays = activeDays
    .sort((a, b) => {
      const loadA = getClassDailyLoad(schedule, classId, a.id);
      const loadB = getClassDailyLoad(schedule, classId, b.id);
      return loadA - loadB;
    })
    .slice(0, daysToUse);
  
  const basePerDay = Math.floor(hoursPerWeek / selectedDays.length);
  let remaining = hoursPerWeek % selectedDays.length;
  
  let result = { ...schedule };
  let placed = 0;
  
  for (const day of selectedDays) {
    let hoursForDay = basePerDay;
    if (remaining > 0) {
      hoursForDay++;
      remaining--;
    }
    
    const dayResult = distributeSubjectHours(
      subject,
      hoursForDay,
      result,
      classId,
      {
        getActiveDays,
        getDayPeriodCount,
        teacherMaxDailyHours,
        teacherId,
        getTeacherName,
        getClassName,
        getSubjectColor,
        periodLabels,
        checkTeacherAvailability
      }
    );
    
    result = dayResult.schedule;
    placed += dayResult.placed;
  }
  
  return {
    schedule: result,
    distribution: selectedDays.reduce((acc, day) => {
      acc[day.id] = basePerDay + (remaining > 0 ? 1 : 0);
      return acc;
    }, {}),
    placed
  };
}

function getTeacherDailyLoad(schedule, teacherId, dayId) {
  let count = 0;
  Object.values(schedule).forEach(classSchedule => {
    if (!classSchedule) return;
    const daySchedule = classSchedule[dayId] || [];
    daySchedule.forEach(slot => {
      if (slot.teacherId === teacherId) count++;
    });
  });
  return count;
}

function getClassDailyLoad(schedule, classId, dayId) {
  return schedule[classId]?.[dayId]?.length || 0;
}