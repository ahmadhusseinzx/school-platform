import { useCallback } from 'react';

export function useScheduleGeneration({
  classes, teachers, subjects, subjectHours, teacherMaxHours, teacherPreferences,
  teacherMaxDailyHours, teacherPriority, maxAttempts, optimizationLevel,
  getSubjectColor, getDayPeriodCount, periodLabels, getActiveDays, getScheduleStats,
  getSortedClasses, getSortedTeachers, setMessage, setProcessing, setAllAttempts,
  setBestSchedule, setBestConflicts, setBestScore, setAttemptCount, setAttemptProgress,
  setGeneratedSchedule, setConflictList, setOptimizationStats
}) {const generateRandomSeed = () => {
    return Math.floor(Math.random() * 1000000) + Date.now();
  };

  // ============ الخوارزمية المحسنة للوصول إلى 100% ============
  const generateOptimizedSchedule = useCallback((seed = null, maxAttemptsPerSubject = 500) => {
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
      
      // ====== 1. هيكل البيانات ======
      const schedule = {};
      const teacherLoad = {};
      const teacherDailyLoad = {};
      const classDailyLoad = {};
      const conflicts = [];

      // تهيئة الجدول
      sortedClasses.forEach(cls => {
        schedule[cls.id] = {};
        activeDays.forEach(day => {
          schedule[cls.id][day.id] = [];
        });
      });

      // تهيئة أحمال المعلمين
      sortedTeachers.forEach(teacher => {
        teacherLoad[teacher.id] = 0;
        teacherDailyLoad[teacher.id] = {};
        activeDays.forEach(day => {
          teacherDailyLoad[teacher.id][day.id] = 0;
        });
      });

      // تهيئة أحمال الصفوف
      sortedClasses.forEach(cls => {
        classDailyLoad[cls.id] = {};
        activeDays.forEach(day => {
          classDailyLoad[cls.id][day.id] = 0;
        });
      });

      // ====== 2. تجميع المواد لكل معلم ======
      const teacherSubjects = {};
      sortedClasses.forEach(cls => {
        const classSubjects = subjects.filter(s => s.classId === cls.id);
        classSubjects.forEach(subject => {
          const teacherId = subject.teacherId;
          if (!teacherId) {
            conflicts.push({
              teacher: 'غير معين',
              subject: subject.name,
              class: cls.name,
              remaining: subjectHours[subject.id] || 2,
              reason: 'مادة بدون معلم'
            });
            return;
          }
          if (!teacherSubjects[teacherId]) {
            teacherSubjects[teacherId] = [];
          }
          teacherSubjects[teacherId].push({
            ...subject,
            className: cls.name,
            classId: cls.id,
            hours: subjectHours[subject.id] || 2
          });
        });
      });

      // ====== 3. حساب الحمل المتوقع لكل معلم ======
      const teacherWorkload = {};
      sortedTeachers.forEach(teacher => {
        const subjects = teacherSubjects[teacher.id] || [];
        let totalHours = 0;
        subjects.forEach(s => { totalHours += s.hours; });
        teacherWorkload[teacher.id] = {
          totalHours,
          subjectCount: subjects.length,
          maxHours: teacherMaxHours[teacher.id] || 20,
          maxDaily: teacherMaxDailyHours[teacher.id],
          preferredDays: teacherPreferences[teacher.id]?.preferredDays || [],
          priority: teacherPriority[teacher.id] || 2,
          subjects: subjects,
          gap: (teacherMaxHours[teacher.id] || 20) - totalHours
        };
      });

      // ====== 4. الترتيب الذكي للمعلمين ======
      const orderedTeachers = [...sortedTeachers].sort((a, b) => {
        const loadA = teacherWorkload[a.id];
        const loadB = teacherWorkload[b.id];
        if (!loadA || !loadB) return 0;
        
        if (loadA.priority !== loadB.priority) {
          return loadA.priority - loadB.priority;
        }
        
        const ratioA = loadA.totalHours / loadA.maxHours;
        const ratioB = loadB.totalHours / loadB.maxHours;
        if (ratioA !== ratioB) {
          return ratioB - ratioA;
        }
        
        const prefA = loadA.preferredDays.length;
        const prefB = loadB.preferredDays.length;
        if (prefA !== prefB) {
          return prefA - prefB;
        }
        
        return seededRandom(3) - 1;
      });

      // ====== 5. توزيع المعلمين ======
      let totalAttempts = 0;
      const maxTotalAttempts = maxAttemptsPerSubject * 10;

      for (const teacher of orderedTeachers) {
        const workload = teacherWorkload[teacher.id];
        if (!workload || workload.subjects.length === 0) continue;
        
        const maxWeeklyHours = workload.maxHours;
        const preferredDays = workload.preferredDays;
        const maxDailyHours = workload.maxDaily;
        
        const sortedSubjects = [...workload.subjects].sort((a, b) => {
          return b.hours - a.hours;
        });
        
        for (const subject of sortedSubjects) {
          if (totalAttempts > maxTotalAttempts) break;
          
          const hoursPerWeek = subject.hours;
          const classId = subject.classId;
          const className = subject.className;
          
          let remainingHours = hoursPerWeek;
          let attempts = 0;
          
          while (remainingHours > 0 && attempts < maxAttemptsPerSubject) {
            attempts++;
            totalAttempts++;
            
            const dayDensity = activeDays.map(day => ({
              ...day,
              classLoad: classDailyLoad[classId]?.[day.id] || 0,
              teacherLoad: teacherDailyLoad[teacher.id]?.[day.id] || 0,
              totalPeriods: getDayPeriodCount(day.id),
              currentPeriods: schedule[classId]?.[day.id]?.length || 0,
              isPreferred: preferredDays.includes(day.id),
              remainingCapacity: getDayPeriodCount(day.id) - (schedule[classId]?.[day.id]?.length || 0)
            }));
            
            const sortedDays = [...dayDensity].sort((a, b) => {
              if (a.isPreferred && !b.isPreferred) return -1;
              if (!a.isPreferred && b.isPreferred) return 1;
              
              if (a.remainingCapacity !== b.remainingCapacity) {
                return b.remainingCapacity - a.remainingCapacity;
              }
              
              if (a.teacherLoad !== b.teacherLoad) {
                return a.teacherLoad - b.teacherLoad;
              }
              
              if (a.classLoad !== b.classLoad) {
                return a.classLoad - b.classLoad;
              }
              
              return seededRandom(3) - 1;
            });
            
            let placed = false;
            
            for (const dayInfo of sortedDays) {
              if (placed) break;
              
              const day = dayInfo;
              const daySchedule = schedule[classId]?.[day.id];
              if (!daySchedule) continue;
              
              const currentTeacherDayLoad = teacherDailyLoad[teacher.id]?.[day.id] || 0;
              
              if (maxDailyHours && currentTeacherDayLoad >= maxDailyHours) {
                continue;
              }
              
              if (teacherLoad[teacher.id] >= maxWeeklyHours) {
                continue;
              }
              
              const dayPeriodsCount = getDayPeriodCount(day.id);
              const availablePeriods = [];
              
              for (let p = 1; p <= dayPeriodsCount; p++) {
                const existing = daySchedule.find(s => s.period === p);
                if (!existing) {
                  let teacherBusy = false;
                  for (const otherClass of sortedClasses) {
                    if (otherClass.id === classId) continue;
                    const otherSchedule = schedule[otherClass.id]?.[day.id] || [];
                    const teacherSlot = otherSchedule.find(s => s.period === p && s.teacherId === teacher.id);
                    if (teacherSlot) {
                      teacherBusy = true;
                      break;
                    }
                  }
                  
                  if (!teacherBusy) {
                    availablePeriods.push(p);
                  }
                }
              }
              
              if (availablePeriods.length > 0) {
                let bestPeriod;
                
                if (availablePeriods.length === 1) {
                  bestPeriod = availablePeriods[0];
                } else {
                  const midPoint = dayPeriodsCount / 2;
                  const sortedPeriods = [...availablePeriods].sort((a, b) => {
                    const distA = Math.abs(a - midPoint);
                    const distB = Math.abs(b - midPoint);
                    if (distA !== distB) return distA - distB;
                    return seededRandom(3) - 1;
                  });
                  bestPeriod = sortedPeriods[0];
                }
                
                const periodLabel = periodLabels[String(bestPeriod)] || `الحصة ${bestPeriod}`;
                
                const slot = {
                  period: bestPeriod,
                  periodLabel: periodLabel,
                  subjectId: subject.id,
                  classId: classId,
                  teacherId: teacher.id,
                  subjectName: subject.name,
                  className: className,
                  teacherName: teacher.fullName,
                  color: getSubjectColor(subject.id),
                  priority: teacherPriority[teacher.id] || 2
                };
                
                daySchedule.push(slot);
                
                teacherLoad[teacher.id] = (teacherLoad[teacher.id] || 0) + 1;
                teacherDailyLoad[teacher.id][day.id] = (teacherDailyLoad[teacher.id][day.id] || 0) + 1;
                classDailyLoad[classId][day.id] = (classDailyLoad[classId][day.id] || 0) + 1;
                remainingHours--;
                placed = true;
              }
            }
            
            // ====== 7. محاولة التوزيع الإجباري ======
            if (!placed && remainingHours > 0) {
              for (const dayInfo of sortedDays) {
                if (placed) break;
                
                const day = dayInfo;
                const daySchedule = schedule[classId]?.[day.id];
                if (!daySchedule) continue;
                
                const dayPeriodsCount = getDayPeriodCount(day.id);
                for (let p = 1; p <= dayPeriodsCount; p++) {
                  if (placed) break;
                  
                  const existing = daySchedule.find(s => s.period === p);
                  if (!existing) {
                    const slot = {
                      period: p,
                      periodLabel: periodLabels[String(p)] || `الحصة ${p}`,
                      subjectId: subject.id,
                      classId: classId,
                      teacherId: teacher.id,
                      subjectName: subject.name,
                      className: className,
                      teacherName: teacher.fullName,
                      color: getSubjectColor(subject.id),
                      priority: teacherPriority[teacher.id] || 2,
                      isForced: true
                    };
                    
                    daySchedule.push(slot);
                    teacherLoad[teacher.id] = (teacherLoad[teacher.id] || 0) + 1;
                    teacherDailyLoad[teacher.id][day.id] = (teacherDailyLoad[teacher.id][day.id] || 0) + 1;
                    classDailyLoad[classId][day.id] = (classDailyLoad[classId][day.id] || 0) + 1;
                    remainingHours--;
                    placed = true;
                    
                    conflicts.push({
                      teacher: teacher.fullName,
                      subject: subject.name,
                      class: className,
                      period: p,
                      day: day.label,
                      reason: 'تم إجبار التوزيع لضمان اكتمال الجدول'
                    });
                  }
                }
              }
            }
            
            if (!placed && remainingHours > 0) {
              conflicts.push({
                teacher: teacher.fullName,
                subject: subject.name,
                class: className,
                remaining: remainingHours,
                reason: 'لا توجد فترات متاحة على الإطلاق'
              });
              break;
            }
          }
          
          if (remainingHours > 0) {
            conflicts.push({
              teacher: teacher.fullName,
              subject: subject.name,
              class: className,
              remaining: remainingHours,
              reason: 'تجاوز الحد الأقصى للمحاولات'
            });
          }
        }
      }

      // ====== 8. إعادة ترتيب الجدول ======
      sortedClasses.forEach(cls => {
        activeDays.forEach(day => {
          if (schedule[cls.id]?.[day.id]) {
            schedule[cls.id][day.id].sort((a, b) => a.period - b.period);
          }
        });
      });

      // ====== 9. حساب النتيجة ======
      const stats = getScheduleStats(schedule);
      const score = stats ? stats.score : 0;

      return {
        schedule,
        conflicts,
        score,
        seed: randomSeed,
        stats
      };

    } catch (error) {
      console.error('❌ خطأ في إنشاء الجدول:', error);
      return null;
    }
  }, [classes, teachers, subjects, subjectHours, teacherMaxHours, teacherPreferences, 
      teacherMaxDailyHours, teacherPriority, getSubjectColor, 
      getDayPeriodCount, periodLabels, getActiveDays, getScheduleStats, getSortedClasses, getSortedTeachers]);

  // ============ توليد جدول متعدد المحاولات المحسن ============
  const generateMultiAttemptSchedule = useCallback(async () => {
    if (classes.length === 0) {
      setMessage({ type: 'error', text: '❌ لا توجد صفوف' });
      return;
    }

    if (teachers.length === 0) {
      setMessage({ type: 'error', text: '❌ لا يوجد معلمين' });
      return;
    }

    setProcessing(true);
    setAllAttempts([]);
    setBestSchedule(null);
    setBestConflicts([]);
    setBestScore(0);
    setAttemptCount(0);
    setAttemptProgress(0);

    let bestResult = null;
    let bestScoreValue = -1;
    const attemptsList = [];
    
    const attemptsMap = {
      fast: Math.min(maxAttempts, 50),
      balanced: maxAttempts,
      thorough: Math.max(maxAttempts * 2, 200)
    };
    const totalAttempts = attemptsMap[optimizationLevel] || maxAttempts;

    try {
      for (let i = 0; i < totalAttempts; i++) {
        setAttemptCount(i + 1);
        setAttemptProgress(((i + 1) / totalAttempts) * 100);
        
        const seed = generateRandomSeed();
        const result = generateOptimizedSchedule(seed, optimizationLevel === 'thorough' ? 1000 : 500);
        
        if (result) {
          attemptsList.push({
            attempt: i + 1,
            score: result.score,
            conflicts: result.conflicts.length,
            seed: result.seed,
            schedule: result.schedule,
            conflictsList: result.conflicts
          });

          if (result.score > bestScoreValue) {
            bestScoreValue = result.score;
            bestResult = result;
            
            if (result.score >= 100) {
              break;
            }
          }
        }

        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      if (bestResult) {
        setBestSchedule(bestResult.schedule);
        setBestConflicts(bestResult.conflicts);
        setBestScore(bestResult.score);
        setAllAttempts(attemptsList);
        setGeneratedSchedule(bestResult.schedule);
        setConflictList(bestResult.conflicts);
        
        const stats = getScheduleStats(bestResult.schedule);
        setOptimizationStats(stats);
        
        if (bestResult.conflicts.length > 0) {
          setMessage({ 
            type: 'warning', 
            text: `✅ تم اختيار أفضل جدول من ${attemptsList.length} محاولة. عدد التعارضات: ${bestResult.conflicts.length} - نسبة الإشغال: ${bestResult.score.toFixed(1)}%` 
          });
        } else if (bestResult.score >= 100) {
          setMessage({ 
            type: 'success', 
            text: `🎉 تم الوصول إلى نسبة 100%! جدول مثالي من ${attemptsList.length} محاولة!` 
          });
        } else {
          setMessage({ 
            type: 'success', 
            text: `✅ تم اختيار الجدول الأمثل من ${attemptsList.length} محاولة! نسبة الإشغال: ${bestResult.score.toFixed(1)}%` 
          });
        }
      } else {
        setMessage({ type: 'error', text: '❌ فشل في إنشاء أي جدول صحيح' });
      }

    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في إنشاء الجدول: ' + error.message });
    } finally {
      setProcessing(false);
    }
  }, [classes.length, teachers.length, maxAttempts, generateOptimizedSchedule, getScheduleStats, optimizationLevel]);

  // ============ إنشاء جدول عادي (محاولة واحدة) ============
  const generateSingleAttemptSchedule = useCallback(() => {
    const result = generateOptimizedSchedule(null, 500);
    if (result) {
      setGeneratedSchedule(result.schedule);
      setConflictList(result.conflicts);
      setBestSchedule(result.schedule);
      setBestConflicts(result.conflicts);
      setBestScore(result.score);
      setAllAttempts([]);
      
      const stats = getScheduleStats(result.schedule);
      setOptimizationStats(stats);
      
      if (result.conflicts.length > 0) {
        setMessage({ 
          type: 'warning', 
          text: `⚠️ تم إنشاء الجدول مع ${result.conflicts.length} تعارض - نسبة الإشغال: ${result.score.toFixed(1)}%` 
        });
      } else if (result.score >= 100) {
        setMessage({ 
          type: 'success', 
          text: `🎉 تم الوصول إلى نسبة 100%! جدول مثالي!` 
        });
      } else {
        setMessage({ 
          type: 'success', 
          text: `✅ تم إنشاء الجدول بنجاح! نسبة الإشغال: ${result.score.toFixed(1)}%` 
        });
      }
    } else {
      setMessage({ type: 'error', text: '❌ فشل في إنشاء الجدول' });
    }
  }, [generateOptimizedSchedule, getScheduleStats]);

  // ============ حفظ الجدول ============
  return { generateMultiAttemptSchedule, generateSingleAttemptSchedule };
}