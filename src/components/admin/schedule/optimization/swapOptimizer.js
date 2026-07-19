// src/components/admin/schedule/optimization/swapOptimizer.js

/**
 * وحدة تبادل الحصص لحل التعارضات
 */

export function swapOptimizer(schedule, conflicts, {
  teachers,
  classes,
  getActiveDays,
  getDayPeriodCount,
  getTeacherName,
  getClassName,
  periodLabels,
  checkTeacherAvailability
}) {
  let improved = false;
  let attempts = 0;
  const maxAttempts = 1000;
  let currentSchedule = { ...schedule };
  
  // تجميع التعارضات حسب اليوم والمعلم
  const conflictMap = {};
  conflicts.forEach(conflict => {
    const key = `${conflict.day}_${conflict.teacher}`;
    if (!conflictMap[key]) {
      conflictMap[key] = [];
    }
    conflictMap[key].push(conflict);
  });
  
  while (attempts < maxAttempts) {
    attempts++;
    let swapped = false;
    
    // معالجة كل تعارض
    for (const [key, conflictList] of Object.entries(conflictMap)) {
      if (swapped) break;
      
      const [day, teacherName] = key.split('_');
      const conflict = conflictList[0];
      
      // العثور على المعلم
      const teacher = teachers.find(t => t.fullName === teacherName);
      if (!teacher) continue;
      
      // العثور على اليوم
      const activeDays = getActiveDays();
      const dayObj = activeDays.find(d => d.label === day);
      if (!dayObj) continue;
      
      // العثور على الحصص المتعارضة
      const conflictingSlots = [];
      classes.forEach(cls => {
        const daySchedule = currentSchedule[cls.id]?.[dayObj.id] || [];
        daySchedule.forEach(slot => {
          if (slot.teacherId === teacher.id) {
            conflictingSlots.push({
              ...slot,
              className: getClassName(cls.id)
            });
          }
        });
      });
      
      // محاولة تبديل كل حصة متعارضة
      for (const slot of conflictingSlots) {
        if (swapped) break;
        
        const classId = slot.classId;
        const period = slot.period;
        
        // البحث عن حصة أخرى في نفس الصف يمكن تبديلها
        const daySchedule = currentSchedule[classId]?.[dayObj.id] || [];
        
        for (let p = 1; p <= getDayPeriodCount(dayObj.id); p++) {
          if (p === period) continue;
          
          const otherSlot = daySchedule.find(s => s.period === p);
          if (!otherSlot) continue;
          
          // التحقق من أن المعلم الآخر ليس مشغولاً في الفترة الحالية
          const teacherBusyAtCurrent = checkTeacherAvailability(
            currentSchedule,
            otherSlot.teacherId,
            dayObj.id,
            period,
            classId
          );
          
          if (teacherBusyAtCurrent) continue;
          
          // التحقق من أن المعلم الحالي ليس مشغولاً في الفترة الأخرى
          const teacherBusyAtOther = checkTeacherAvailability(
            currentSchedule,
            teacher.id,
            dayObj.id,
            p,
            classId
          );
          
          if (teacherBusyAtOther) continue;
          
          // تنفيذ التبادل
          const tempTeacherId = slot.teacherId;
          const tempTeacherName = slot.teacherName;
          
          slot.teacherId = otherSlot.teacherId;
          slot.teacherName = otherSlot.teacherName;
          slot.period = p;
          slot.periodLabel = periodLabels[String(p)] || `الحصة ${p}`;
          slot.swapped = true;
          
          otherSlot.teacherId = tempTeacherId;
          otherSlot.teacherName = tempTeacherName;
          otherSlot.period = period;
          otherSlot.periodLabel = periodLabels[String(period)] || `الحصة ${period}`;
          otherSlot.swapped = true;
          
          swapped = true;
          improved = true;
          break;
        }
      }
    }
    
    if (!swapped) break;
  }
  
  return { schedule: currentSchedule, improved };
}

/**
 * محاولة تبديل مع صف آخر
 */
export function swapWithOtherClass(schedule, slot, {
  classes,
  getActiveDays,
  getDayPeriodCount,
  getTeacherName,
  getClassName,
  periodLabels,
  checkTeacherAvailability
}) {
  const activeDays = getActiveDays();
  const dayObj = activeDays.find(d => d.id === slot.dayId);
  if (!dayObj) return { schedule, success: false };
  
  // البحث عن صف آخر لديه حصة في نفس الفترة مع معلم مختلف
  for (const cls of classes) {
    if (cls.id === slot.classId) continue;
    
    const daySchedule = schedule[cls.id]?.[dayObj.id] || [];
    const targetSlot = daySchedule.find(s => s.period === slot.period);
    
    if (targetSlot && targetSlot.teacherId !== slot.teacherId) {
      // التحقق من إمكانية التبادل
      const teacher1Available = checkTeacherAvailability(
        schedule,
        slot.teacherId,
        dayObj.id,
        targetSlot.period,
        slot.classId
      );
      
      const teacher2Available = checkTeacherAvailability(
        schedule,
        targetSlot.teacherId,
        dayObj.id,
        slot.period,
        cls.id
      );
      
      if (teacher1Available && teacher2Available) {
        // تنفيذ التبادل
        const tempTeacherId = slot.teacherId;
        const tempTeacherName = slot.teacherName;
        
        slot.teacherId = targetSlot.teacherId;
        slot.teacherName = targetSlot.teacherName;
        
        targetSlot.teacherId = tempTeacherId;
        targetSlot.teacherName = tempTeacherName;
        
        return { schedule, success: true };
      }
    }
  }
  
  return { schedule, success: false };
}