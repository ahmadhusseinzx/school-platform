// src/components/admin/schedule/hooks/useScheduleGenerationV2.js

/**
 * الإصدار المحسن بالكامل من خوارزمية الجدول
 * يستخدم جميع وحدات التحسين
 */

import { calculateScheduleScore } from '../optimization/scheduleScoring';
import { compactAllSchedules } from '../optimization/compactSchedule';
import { swapOptimizer } from '../optimization/swapOptimizer';
import { repairSchedule } from '../optimization/repairSchedule';
import { balanceTeacherLoad, balanceDailyTeacherLoad } from '../optimization/teacherBalancer';
import { distributeSubjectSmart } from '../optimization/subjectDistributor';
import { finalOptimizer } from '../optimization/finalOptimizer';

export function generateOptimizedScheduleV2({
  seed,
  classes,
  teachers,
  subjects,
  subjectHours,
  teacherMaxHours,
  teacherPreferences,
  teacherMaxDailyHours,
  teacherPriority,
  getSubjectColor,
  getDayPeriodCount,
  periodLabels,
  getActiveDays,
  getScheduleStats,
  getSortedClasses,
  getSortedTeachers,
  checkTeacherAvailability,
  getFirstEmptyPeriod,
  getRemainingSubjectHours,
  maxAttemptsPerSubject = 500,
  optimizationLevel = 'balanced'
}) {
  const randomSeed = seed || generateRandomSeed();
  const seededRandom = (max) => {
    const x = Math.sin(randomSeed + max + Math.floor(Math.random() * 100)) * 10000;
    return Math.abs(Math.floor(x) % max);
  };

  if (classes.length === 0 || teachers.length === 0) {
    return null;
  }

  try {
    const sortedClasses = getSortedClasses();
    const sortedTeachers = getSortedTeachers();
    const activeDays = getActiveDays();
    
    // ============ 1. تهيئة الجدول ============
    let schedule = {};
    const teacherLoad = {};
    const teacherDailyLoad = {};
    const classDailyLoad = {};

    sortedClasses.forEach(cls => {
      schedule[cls.id] = {};
      activeDays.forEach(day => {
        schedule[cls.id][day.id] = [];
      });
    });

    sortedTeachers.forEach(teacher => {
      teacherLoad[teacher.id] = 0;
      teacherDailyLoad[teacher.id] = {};
      activeDays.forEach(day => {
        teacherDailyLoad[teacher.id][day.id] = 0;
      });
    });

    sortedClasses.forEach(cls => {
      classDailyLoad[cls.id] = {};
      activeDays.forEach(day => {
        classDailyLoad[cls.id][day.id] = 0;
      });
    });

    // ============ 2. تجميع المواد لكل صف ============
    const classSubjects = {};
    sortedClasses.forEach(cls => {
      classSubjects[cls.id] = subjects.filter(s => s.classId === cls.id);
    });

    // ============ 3. التوزيع حسب الصف ============
    let conflicts = [];
    let totalPlaced = 0;

    for (const cls of sortedClasses) {
      const subjectsList = classSubjects[cls.id] || [];
      
      // ترتيب المواد حسب الوزن (الثقيلة أولاً)
      const sortedSubjects = [...subjectsList].sort((a, b) => {
        const hoursA = subjectHours[a.id] || 2;
        const hoursB = subjectHours[b.id] || 2;
        return hoursB - hoursA;
      });

      for (const subject of sortedSubjects) {
        const teacherId = subject.teacherId;
        if (!teacherId) {
          conflicts.push({
            teacher: 'غير معين',
            subject: subject.name,
            class: cls.name,
            remaining: subjectHours[subject.id] || 2,
            reason: 'مادة بدون معلم'
          });
          continue;
        }

        const hoursPerWeek = subjectHours[subject.id] || 2;
        
        // ============ 4. توزيع حصص المادة ============
        const distributionResult = distributeSubjectSmart(
          subject,
          hoursPerWeek,
          schedule,
          cls.id,
          {
            getActiveDays,
            getDayPeriodCount,
            teacherMaxDailyHours,
            teacherId,
            getTeacherName: (id) => teachers.find(t => t.id === id)?.fullName || 'غير محدد',
            getClassName: (id) => classes.find(c => c.id === id)?.name || 'غير محدد',
            getSubjectColor,
            periodLabels,
            checkTeacherAvailability
          }
        );

        schedule = distributionResult.schedule;
        totalPlaced += distributionResult.placed;

        // تسجيل أي حصص متبقية
        if (distributionResult.placed < hoursPerWeek) {
          conflicts.push({
            teacher: teachers.find(t => t.id === teacherId)?.fullName || 'غير معين',
            subject: subject.name,
            class: cls.name,
            remaining: hoursPerWeek - distributionResult.placed,
            reason: 'لم يتم توزيع جميع الحصص'
          });
        }
      }

      // ============ 5. ضغط جدول الصف ============
      schedule = compactAllSchedules(schedule, {
        classes: [cls],
        getActiveDays,
        getDayPeriodCount,
        periodLabels,
        checkTeacherAvailability,
        getTeacherName: (id) => teachers.find(t => t.id === id)?.fullName || 'غير محدد'
      });
    }

    // ============ 6. إصلاح التعارضات ============
    let repairAttempts = 0;
    let hasConflicts = true;

    while (hasConflicts && repairAttempts < 10) {
      repairAttempts++;
      
      const teacherConflicts = findTeacherConflicts(schedule, teachers, getActiveDays);
      if (teacherConflicts.length === 0) {
        hasConflicts = false;
        break;
      }

      // استخدام Swap Optimizer
      const swapResult = swapOptimizer(schedule, teacherConflicts, {
        teachers,
        classes,
        getActiveDays,
        getDayPeriodCount,
        getTeacherName: (id) => teachers.find(t => t.id === id)?.fullName || 'غير محدد',
        getClassName: (id) => classes.find(c => c.id === id)?.name || 'غير محدد',
        periodLabels,
        checkTeacherAvailability
      });

      if (swapResult.improved) {
        schedule = swapResult.schedule;
      }

      // إعادة ضغط الجداول
      schedule = compactAllSchedules(schedule, {
        classes,
        getActiveDays,
        getDayPeriodCount,
        periodLabels,
        checkTeacherAvailability,
        getTeacherName: (id) => teachers.find(t => t.id === id)?.fullName || 'غير محدد'
      });
    }

    // ============ 7. العلاج النهائي ============
    // معالجة الحصص المتبقية
    const remainingSubjects = findRemainingSubjects(schedule, subjects, subjectHours);
    if (remainingSubjects.length > 0) {
      const repairResult = repairSchedule(schedule, remainingSubjects, {
        classes,
        teachers,
        getActiveDays,
        getDayPeriodCount,
        getTeacherName: (id) => teachers.find(t => t.id === id)?.fullName || 'غير محدد',
        getClassName: (id) => classes.find(c => c.id === id)?.name || 'غير محدد',
        getSubjectColor,
        periodLabels,
        subjectHours,
        checkTeacherAvailability
      });
      
      schedule = repairResult.schedule;
      conflicts.push({
        reason: `تم إصلاح ${repairResult.repairedCount} حصة متبقية`
      });
    }

    // ============ 8. التحسين النهائي ============
    const finalResult = finalOptimizer(schedule, {
      classes,
      teachers,
      subjects,
      subjectHours,
      teacherMaxHours,
      teacherMaxDailyHours,
      getActiveDays,
      getDayPeriodCount,
      getTeacherName: (id) => teachers.find(t => t.id === id)?.fullName || 'غير محدد',
      getClassName: (id) => classes.find(c => c.id === id)?.name || 'غير محدد',
      getSubjectColor,
      periodLabels,
      checkTeacherAvailability,
      swapWithOtherClass: (schedule, slot) => {
        // دالة تبديل مع صف آخر
        return { schedule, success: false };
      }
    });

    schedule = finalResult.schedule;

    // ============ 9. حساب النتيجة النهائية ============
    const scoreResult = calculateScheduleScore(schedule, {
      classes,
      teachers,
      subjects,
      subjectHours,
      teacherMaxHours,
      teacherMaxDailyHours,
      getActiveDays,
      getDayPeriodCount,
      getTeacherName: (id) => teachers.find(t => t.id === id)?.fullName || 'غير محدد',
      getClassName: (id) => classes.find(c => c.id === id)?.name || 'غير محدد',
      periodLabels
    });

    // ============ 10. تجميع التعارضات النهائية ============
    const finalConflicts = findTeacherConflicts(schedule, teachers, getActiveDays);
    const classGaps = findClassGaps(schedule, classes, getActiveDays, getDayPeriodCount);

    if (classGaps > 0) {
      finalConflicts.push({
        reason: `يوجد ${classGaps} فراغ في جداول الصفوف`,
        type: 'gap'
      });
    }

    return {
      schedule,
      conflicts: finalConflicts,
      score: scoreResult.score,
      percentage: scoreResult.percentage,
      stats: scoreResult,
      seed: randomSeed,
      isPerfect: scoreResult.isPerfect
    };

  } catch (error) {
    console.error('❌ خطأ في إنشاء الجدول:', error);
    return null;
  }
}

// ============ دوال مساعدة ============

function generateRandomSeed() {
  return Math.floor(Math.random() * 1000000) + Date.now();
}

function findTeacherConflicts(schedule, teachers, getActiveDays) {
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

function findRemainingSubjects(schedule, subjects, subjectHours) {
  const remaining = [];
  
  subjects.forEach(subject => {
    const classId = subject.classId;
    if (!classId) {
      remaining.push(subject);
      return;
    }
    
    const classSchedule = schedule[classId];
    if (!classSchedule) {
      remaining.push(subject);
      return;
    }
    
    let placed = 0;
    Object.values(classSchedule).forEach(daySchedule => {
      if (!daySchedule) return;
      daySchedule.forEach(slot => {
        if (slot.subjectId === subject.id) placed++;
      });
    });
    
    const needed = subjectHours[subject.id] || 2;
    if (placed < needed) {
      remaining.push({
        ...subject,
        remainingHours: needed - placed
      });
    }
  });
  
  return remaining;
}