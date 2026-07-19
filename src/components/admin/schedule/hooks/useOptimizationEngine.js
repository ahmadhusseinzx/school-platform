// src/components/admin/schedule/hooks/useOptimizationEngine.js

/**
 * محرك التحسين المتكامل
 * يدمج جميع وحدات التحسين في محرك واحد قابل لإعادة الاستخدام
 */

import { useCallback, useState, useRef } from 'react';
import { calculateScheduleScore } from '../optimization/scheduleScoring';
import { compactAllSchedules, compactClassSchedule } from '../optimization/compactSchedule';
import { swapOptimizer } from '../optimization/swapOptimizer';
import { repairSchedule } from '../optimization/repairSchedule';
import { balanceTeacherLoad, balanceDailyTeacherLoad } from '../optimization/teacherBalancer';
import { distributeSubjectSmart } from '../optimization/subjectDistributor';
import { finalOptimizer } from '../optimization/finalOptimizer';

export function useOptimizationEngine({
  classes,
  teachers,
  subjects,
  subjectHours,
  teacherMaxHours,
  teacherMaxDailyHours,
  teacherPreferences,
  teacherPriority,
  getSubjectColor,
  getDayPeriodCount,
  periodLabels, // ✅ تأكد من وجود periodLabels هنا
  getActiveDays,
  getScheduleStats,
  getSortedClasses,
  getSortedTeachers,
  getTeacherName,
  getClassName,
  checkTeacherAvailability,
  getFirstEmptyPeriod,
  getRemainingSubjectHours,
  onProgress,
  onComplete
}) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [bestResult, setBestResult] = useState(null);
  const abortControllerRef = useRef(null);

  // ============ توليد بذرة عشوائية ============
  const generateRandomSeed = useCallback(() => {
    return Math.floor(Math.random() * 1000000) + Date.now();
  }, []);

  // ============ دالة مساعدة للعشوائية ============
  const seededRandom = useCallback((seed, max) => {
    const x = Math.sin(seed + max + Math.floor(Math.random() * 100)) * 10000;
    return Math.abs(Math.floor(x) % max);
  }, []);

  // ============ تهيئة الجدول ============
  const initializeSchedule = useCallback(() => {
    const schedule = {};
    const activeDays = getActiveDays();
    const sortedClasses = getSortedClasses();
    
    sortedClasses.forEach(cls => {
      schedule[cls.id] = {};
      activeDays.forEach(day => {
        schedule[cls.id][day.id] = [];
      });
    });
    
    return schedule;
  }, [getActiveDays, getSortedClasses]);

  // ============ الخوارزمية الرئيسية ============
  const runOptimization = useCallback(async (config = {}) => {
    const {
      seed = generateRandomSeed(),
      maxAttempts = 100,
      optimizationLevel = 'balanced',
      stopOnPerfect = true,
      maxIterations = 50
    } = config;

    // إلغاء أي عملية سابقة
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsOptimizing(true);
    setProgress(0);
    setCurrentPhase('بدء التحسين...');

    try {
      const sortedClasses = getSortedClasses();
      const sortedTeachers = getSortedTeachers();
      const activeDays = getActiveDays();
      
      let bestSchedule = null;
      let bestScoreResult = null;
      let allAttempts = [];

      // ============ مرحلة 1: التوزيع الأولي ============
      setCurrentPhase('مرحلة 1: التوزيع الأولي للصفوف');
      setProgress(10);

      let schedule = initializeSchedule();
      let conflicts = [];

      // تجميع المواد لكل صف
      const classSubjects = {};
      sortedClasses.forEach(cls => {
        classSubjects[cls.id] = subjects.filter(s => s.classId === cls.id);
      });

      // التوزيع حسب الصف
      for (const cls of sortedClasses) {
        if (signal.aborted) throw new Error('تم إلغاء العملية');
        
        const subjectsList = classSubjects[cls.id] || [];
        const sortedSubjects = [...subjectsList].sort((a, b) => {
          const hoursA = subjectHours[a.id] || 2;
          const hoursB = subjectHours[b.id] || 2;
          return hoursB - hoursA;
        });

        for (const subject of sortedSubjects) {
          if (signal.aborted) throw new Error('تم إلغاء العملية');
          
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
              getTeacherName,
              getClassName,
              getSubjectColor,
              periodLabels,
              checkTeacherAvailability
            }
          );

          schedule = distributionResult.schedule;
        }

        // ضغط جدول الصف
        schedule = compactAllSchedules(schedule, {
          classes: [cls],
          getActiveDays,
          getDayPeriodCount,
          periodLabels,
          checkTeacherAvailability,
          getTeacherName
        });

        // تحديث التقدم
        const classProgress = 10 + (sortedClasses.indexOf(cls) / sortedClasses.length) * 30;
        setProgress(classProgress);
        if (onProgress) {
          onProgress(classProgress, `توزيع الصف ${cls.name}`);
        }
      }

      setProgress(40);
      setCurrentPhase('مرحلة 2: إصلاح التعارضات');

      // ============ مرحلة 2: إصلاح التعارضات ============
      let repairAttempts = 0;
      let hasConflicts = true;

      while (hasConflicts && repairAttempts < 10) {
        if (signal.aborted) throw new Error('تم إلغاء العملية');
        
        repairAttempts++;
        const teacherConflicts = findTeacherConflicts(schedule, teachers, getActiveDays);
        
        if (teacherConflicts.length === 0) {
          hasConflicts = false;
          break;
        }

        const swapResult = swapOptimizer(schedule, teacherConflicts, {
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
          schedule = swapResult.schedule;
        }

        schedule = compactAllSchedules(schedule, {
          classes,
          getActiveDays,
          getDayPeriodCount,
          periodLabels,
          checkTeacherAvailability,
          getTeacherName
        });

        const progressStep = 40 + (repairAttempts / 10) * 20;
        setProgress(progressStep);
        if (onProgress) {
          onProgress(progressStep, `إصلاح التعارضات - المحاولة ${repairAttempts}`);
        }
      }

      setProgress(60);
      setCurrentPhase('مرحلة 3: العلاج النهائي');

      // ============ مرحلة 3: العلاج النهائي ============
      const remainingSubjects = findRemainingSubjects(schedule, subjects, subjectHours);
      
      if (remainingSubjects.length > 0) {
        const repairResult = repairSchedule(schedule, remainingSubjects, {
          classes,
          teachers,
          getActiveDays,
          getDayPeriodCount,
          getTeacherName,
          getClassName,
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

      setProgress(70);
      setCurrentPhase('مرحلة 4: موازنة المعلمين');

      // ============ مرحلة 4: موازنة المعلمين ============
      const balanceResult = balanceTeacherLoad(schedule, {
        teachers,
        teacherMaxHours,
        teacherMaxDailyHours,
        getActiveDays,
        getDayPeriodCount,
        getTeacherName,
        getClassName,
        periodLabels, // ✅ تمرير periodLabels
        checkTeacherAvailability,
        swapWithOtherClass: (schedule, slot) => {
          return { schedule, success: false };
        }
      });

      if (balanceResult.improved) {
        schedule = balanceResult.schedule;
      }

      // موازنة يومية
      const dailyBalanceResult = balanceDailyTeacherLoad(schedule, {
        teachers,
        teacherMaxDailyHours,
        getActiveDays,
        getDayPeriodCount,
        checkTeacherAvailability,
        periodLabels // ✅ تمرير periodLabels
      });

      if (dailyBalanceResult.improved) {
        schedule = dailyBalanceResult.schedule;
      }

      setProgress(80);
      setCurrentPhase('مرحلة 5: ضغط الجداول النهائي');

      // ============ مرحلة 5: ضغط الجداول النهائي ============
      schedule = compactAllSchedules(schedule, {
        classes,
        getActiveDays,
        getDayPeriodCount,
        periodLabels,
        checkTeacherAvailability,
        getTeacherName
      });

      setProgress(85);
      setCurrentPhase('مرحلة 6: التحسين النهائي');

      // ============ مرحلة 6: التحسين النهائي ============
      const finalResult = finalOptimizer(schedule, {
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
        swapWithOtherClass: (schedule, slot) => {
          return { schedule, success: false };
        }
      });

      schedule = finalResult.schedule;

      setProgress(90);
      setCurrentPhase('مرحلة 7: حساب النتيجة');

      // ============ مرحلة 7: حساب النتيجة ============
      const scoreResult = calculateScheduleScore(schedule, {
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
      });

      // ============ مرحلة 8: البحث عن أفضل نتيجة ============
      const finalConflicts = findTeacherConflicts(schedule, teachers, getActiveDays);
      const classGaps = findClassGaps(schedule, classes, getActiveDays, getDayPeriodCount);

      if (classGaps > 0) {
        finalConflicts.push({
          reason: `يوجد ${classGaps} فراغ في جداول الصفوف`,
          type: 'gap'
        });
      }

      const result = {
        schedule,
        conflicts: finalConflicts,
        score: scoreResult.score,
        percentage: scoreResult.percentage,
        stats: scoreResult,
        seed: seed,
        isPerfect: scoreResult.isPerfect,
        iterations: finalResult.iterations || 0,
        details: {
          totalSlots: scoreResult.details.utilization ? 
            (scoreResult.details.utilization / 100 * calculateTotalSlots(schedule)) : 0,
          filledSlots: calculateFilledSlots(schedule),
          teacherConflicts: finalConflicts.filter(c => c.reason === 'تعارض معلم').length,
          classGaps,
          forcedCount: scoreResult.details.forcedCount || 0
        }
      };

      setBestResult(result);
      setProgress(100);
      setCurrentPhase('اكتمل التحسين!');

      if (onComplete) {
        onComplete(result);
      }

      return result;

    } catch (error) {
      if (error.message === 'تم إلغاء العملية') {
        setCurrentPhase('تم إلغاء العملية');
      } else {
        console.error('❌ خطأ في محرك التحسين:', error);
        setCurrentPhase(`خطأ: ${error.message}`);
      }
      throw error;
    } finally {
      setIsOptimizing(false);
      abortControllerRef.current = null;
    }
  }, [
    classes, teachers, subjects, subjectHours, teacherMaxHours,
    teacherMaxDailyHours, teacherPreferences, teacherPriority,
    getSubjectColor, getDayPeriodCount, periodLabels, getActiveDays,
    getScheduleStats, getSortedClasses, getSortedTeachers,
    getTeacherName, getClassName, checkTeacherAvailability,
    getFirstEmptyPeriod, getRemainingSubjectHours,
    generateRandomSeed, initializeSchedule
  ]);

  // ============ توليد متعدد المحاولات ============
  const runMultiAttempt = useCallback(async (config = {}) => {
    const {
      maxAttempts = 100,
      optimizationLevel = 'balanced',
      stopOnPerfect = true,
      ...restConfig
    } = config;

    const results = [];
    let bestResult = null;
    let bestScore = -1;

    const attemptsMap = {
      fast: Math.min(maxAttempts, 50),
      balanced: maxAttempts,
      thorough: Math.max(maxAttempts * 2, 200)
    };
    const totalAttempts = attemptsMap[optimizationLevel] || maxAttempts;

    setIsOptimizing(true);

    try {
      for (let i = 0; i < totalAttempts; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('تم إلغاء العملية');
        }

        const progress = ((i + 1) / totalAttempts) * 100;
        setProgress(progress);
        setCurrentPhase(`محاولة ${i + 1} من ${totalAttempts}`);

        if (onProgress) {
          onProgress(progress, `محاولة ${i + 1} من ${totalAttempts}`);
        }

        const seed = generateRandomSeed();
        const result = await runOptimization({
          ...restConfig,
          seed,
          maxAttempts: 1,
          optimizationLevel
        });

        results.push({
          attempt: i + 1,
          ...result
        });

        if (result.score > bestScore) {
          bestScore = result.score;
          bestResult = result;
        }

        if (stopOnPerfect && result.isPerfect) {
          break;
        }

        // تأخير بسيط بين المحاولات
        if (i < totalAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setBestResult(bestResult);
      setCurrentPhase(`اكتمل! أفضل نتيجة: ${bestScore}/1000`);

      return {
        bestResult,
        allResults: results,
        totalAttempts: results.length
      };

    } catch (error) {
      if (error.message !== 'تم إلغاء العملية') {
        console.error('❌ خطأ في المحاولات المتعددة:', error);
      }
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  }, [runOptimization, generateRandomSeed]);

  // ============ إلغاء العملية ============
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // ============ إعادة تعيين الحالة ============
  const reset = useCallback(() => {
    abort();
    setIsOptimizing(false);
    setProgress(0);
    setCurrentPhase('');
    setBestResult(null);
  }, [abort]);

  // ============ حفظ النتيجة ============
  const saveResult = useCallback(async (scheduleData) => {
    try {
      const result = {
        schedule: scheduleData || bestResult?.schedule,
        timestamp: new Date().toISOString(),
        score: bestResult?.score,
        isPerfect: bestResult?.isPerfect
      };
      
      localStorage.setItem('optimization_result', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('❌ خطأ في حفظ النتيجة:', error);
      return null;
    }
  }, [bestResult]);

  // ============ تحميل نتيجة محفوظة ============
  const loadSavedResult = useCallback(() => {
    try {
      const saved = localStorage.getItem('optimization_result');
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch (error) {
      console.error('❌ خطأ في تحميل النتيجة:', error);
      return null;
    }
  }, []);

  return {
    // الحالة
    isOptimizing,
    progress,
    currentPhase,
    bestResult,
    
    // العمليات
    runOptimization,
    runMultiAttempt,
    abort,
    reset,
    saveResult,
    loadSavedResult,
    
    // دوال مساعدة
    generateRandomSeed,
    initializeSchedule
  };
}

// ============ دوال مساعدة ============

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

function calculateTotalSlots(schedule) {
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