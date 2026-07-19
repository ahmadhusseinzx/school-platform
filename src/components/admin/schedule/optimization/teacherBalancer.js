// src/components/admin/schedule/optimization/teacherBalancer.js

/**
 * وحدة موازنة أحمال المعلمين
 */

export function balanceTeacherLoad(schedule, {
  teachers,
  teacherMaxHours,
  teacherMaxDailyHours,
  getActiveDays,
  getDayPeriodCount,
  getTeacherName,
  getClassName,
  periodLabels, // ✅ إضافة periodLabels كمعامل
  checkTeacherAvailability,
  swapWithOtherClass
}) {
  let balanced = { ...schedule };
  let improved = false;
  let attempts = 0;
  const maxAttempts = 500;
  
  while (attempts < maxAttempts) {
    attempts++;
    let balancedSomething = false;
    
    // حساب أحمال المعلمين
    const teacherLoads = calculateTeacherLoads(balanced, teachers);
    
    // العثور على المعلم الأكثر حملاً والأقل حملاً
    const sortedTeachers = teachers
      .filter(t => teacherLoads[t.id] > 0)
      .sort((a, b) => teacherLoads[b.id] - teacherLoads[a.id]);
    
    if (sortedTeachers.length < 2) break;
    
    const maxTeacher = sortedTeachers[0];
    const minTeacher = sortedTeachers[sortedTeachers.length - 1];
    const maxLoad = teacherLoads[maxTeacher.id];
    const minLoad = teacherLoads[minTeacher.id];
    
    // إذا كان الفرق أقل من 2، توقف
    if (maxLoad - minLoad < 2) break;
    
    // محاولة نقل حصة من المعلم الأكثر حملاً إلى الأقل حملاً
    const maxTeacherSlots = findTeacherSlots(balanced, maxTeacher.id);
    const activeDays = getActiveDays();
    
    for (const slot of maxTeacherSlots) {
      if (balancedSomething) break;
      
      // التحقق من إمكانية نقل الحصة
      for (const day of activeDays) {
        if (balancedSomething) break;
        
        const daySchedule = balanced[slot.classId]?.[day.id] || [];
        const periodExists = daySchedule.find(s => s.period === slot.period);
        
        if (!periodExists) {
          // التحقق من أن المعلم الآخر ليس مشغولاً
          const teacherBusy = checkTeacherAvailability(
            balanced,
            minTeacher.id,
            day.id,
            slot.period,
            slot.classId
          );
          
          if (!teacherBusy) {
            // نقل الحصة
            const originalSlot = balanced[slot.classId]?.[slot.dayId]?.find(
              s => s.period === slot.period && s.teacherId === maxTeacher.id
            );
            
            if (originalSlot) {
              originalSlot.teacherId = minTeacher.id;
              originalSlot.teacherName = getTeacherName(minTeacher.id);
              originalSlot.balanced = true;
              
              balancedSomething = true;
              improved = true;
            }
          }
        }
      }
    }
    
    if (!balancedSomething) break;
  }
  
  return { schedule: balanced, improved };
}

function calculateTeacherLoads(schedule, teachers) {
  const loads = {};
  teachers.forEach(t => { loads[t.id] = 0; });
  
  Object.values(schedule).forEach(classSchedule => {
    if (!classSchedule) return;
    Object.values(classSchedule).forEach(daySchedule => {
      if (!daySchedule) return;
      daySchedule.forEach(slot => {
        if (slot.teacherId && loads[slot.teacherId] !== undefined) {
          loads[slot.teacherId]++;
        }
      });
    });
  });
  
  return loads;
}

function findTeacherSlots(schedule, teacherId) {
  const slots = [];
  
  Object.entries(schedule).forEach(([classId, classSchedule]) => {
    if (!classSchedule) return;
    Object.entries(classSchedule).forEach(([dayId, daySchedule]) => {
      if (!daySchedule) return;
      daySchedule.forEach(slot => {
        if (slot.teacherId === teacherId) {
          slots.push({
            ...slot,
            classId,
            dayId
          });
        }
      });
    });
  });
  
  return slots;
}

/**
 * موازنة التوزيع اليومي للمعلمين
 */
export function balanceDailyTeacherLoad(schedule, {
  teachers,
  teacherMaxDailyHours,
  getActiveDays,
  getDayPeriodCount,
  checkTeacherAvailability,
  periodLabels // ✅ إضافة periodLabels كمعامل
}) {
  let balanced = { ...schedule };
  let improved = false;
  const activeDays = getActiveDays();
  
  teachers.forEach(teacher => {
    const maxDaily = teacherMaxDailyHours[teacher.id];
    if (!maxDaily) return;
    
    // حساب الحمل اليومي
    const dailyLoads = {};
    activeDays.forEach(day => {
      dailyLoads[day.id] = 0;
    });
    
    Object.values(balanced).forEach(classSchedule => {
      if (!classSchedule) return;
      activeDays.forEach(day => {
        const daySchedule = classSchedule[day.id] || [];
        daySchedule.forEach(slot => {
          if (slot.teacherId === teacher.id) {
            dailyLoads[day.id]++;
          }
        });
      });
    });
    
    // العثور على الأيام التي تتجاوز الحد
    const overloadedDays = activeDays.filter(day => dailyLoads[day.id] > maxDaily);
    
    for (const day of overloadedDays) {
      const excess = dailyLoads[day.id] - maxDaily;
      
      // محاولة نقل بعض الحصص إلى أيام أقل حملاً
      const daySlots = findTeacherSlotsForDay(balanced, teacher.id, day.id);
      
      for (const slot of daySlots) {
        if (excess <= 0) break;
        
        // العثور على يوم آخر أقل حملاً
        const targetDay = activeDays
          .filter(d => d.id !== day.id && dailyLoads[d.id] < maxDaily)
          .sort((a, b) => dailyLoads[a.id] - dailyLoads[b.id])[0];
        
        if (!targetDay) continue;
        
        // التحقق من إمكانية النقل
        const teacherBusy = checkTeacherAvailability(
          balanced,
          teacher.id,
          targetDay.id,
          slot.period,
          slot.classId
        );
        
        if (!teacherBusy) {
          const originalSlot = balanced[slot.classId]?.[day.id]?.find(
            s => s.period === slot.period && s.teacherId === teacher.id
          );
          
          if (originalSlot) {
            // ✅ استخدام periodLabels مع التحقق من وجوده
            const periodLabel = periodLabels ? 
              (periodLabels[String(slot.period)] || `الحصة ${slot.period}`) : 
              `الحصة ${slot.period}`;
            
            originalSlot.dayId = targetDay.id;
            originalSlot.periodLabel = periodLabel;
            originalSlot.balanced = true;
            
            // نقل إلى اليوم الجديد
            if (!balanced[slot.classId]) balanced[slot.classId] = {};
            if (!balanced[slot.classId][targetDay.id]) {
              balanced[slot.classId][targetDay.id] = [];
            }
            
            // إزالة من اليوم القديم
            balanced[slot.classId][day.id] = balanced[slot.classId][day.id].filter(
              s => !(s.period === slot.period && s.teacherId === teacher.id)
            );
            
            // إضافة إلى اليوم الجديد
            balanced[slot.classId][targetDay.id].push(originalSlot);
            
            dailyLoads[day.id]--;
            dailyLoads[targetDay.id]++;
            improved = true;
          }
        }
      }
    }
  });
  
  return { schedule: balanced, improved };
}

function findTeacherSlotsForDay(schedule, teacherId, dayId) {
  const slots = [];
  
  Object.entries(schedule).forEach(([classId, classSchedule]) => {
    if (!classSchedule) return;
    const daySchedule = classSchedule[dayId] || [];
    daySchedule.forEach(slot => {
      if (slot.teacherId === teacherId) {
        slots.push({ ...slot, classId, dayId });
      }
    });
  });
  
  return slots;
}