import { useCallback } from 'react';

export function useScheduleHelpers({ classes, teachers, subjects, schoolDays, dayPeriods, periodLabels, subjectColors, generatedSchedule }) {
  const getActiveDays = useCallback(() => schoolDays.filter((day) => day.active), [schoolDays]);

  const getDayPeriodCount = useCallback((dayId) => dayPeriods[dayId] || 7, [dayPeriods]);

  const getPeriodsListForDay = useCallback((dayId) => {
    const count = getDayPeriodCount(dayId);
    return Array.from({ length: count }, (_, index) => {
      const id = index + 1;
      return { id, label: periodLabels[String(id)] || `الحصة ${id}`, order: id };
    });
  }, [getDayPeriodCount, periodLabels]);

  const getTeacherName = useCallback((id) => {
    return teachers.find((teacher) => teacher.id === id)?.fullName || 'غير محدد';
  }, [teachers]);

  const getSubjectName = useCallback((id) => {
    return subjects.find((subject) => subject.id === id)?.name || 'غير محدد';
  }, [subjects]);

  const getClassName = useCallback((id) => {
    return classes.find((schoolClass) => schoolClass.id === id)?.name || 'غير محدد';
  }, [classes]);

  const getSubjectColor = useCallback((subjectId) => {
    const index = subjects.findIndex((subject) => subject.id === subjectId);
    return subjectColors[index % subjectColors.length];
  }, [subjects, subjectColors]);

  const getSortedClasses = useCallback(() => [...classes].sort((a, b) => {
    const numberA = parseInt(a.name?.match(/\d+/)?.[0] || 0);
    const numberB = parseInt(b.name?.match(/\d+/)?.[0] || 0);
    return numberA !== numberB ? numberA - numberB : a.name.localeCompare(b.name, 'ar');
  }), [classes]);

  const getSortedTeachers = useCallback(() => [...teachers].sort((a, b) => (
    (a.fullName || '').localeCompare(b.fullName || '', 'ar')
  )), [teachers]);

  const getSortedSubjectsByClass = useCallback(() => [...subjects].sort((a, b) => {
    const classA = classes.find((schoolClass) => schoolClass.id === a.classId);
    const classB = classes.find((schoolClass) => schoolClass.id === b.classId);
    const numberA = parseInt(classA?.name?.match(/\d+/)?.[0] || 0);
    const numberB = parseInt(classB?.name?.match(/\d+/)?.[0] || 0);
    return numberA !== numberB
      ? numberA - numberB
      : (classA?.name || '').localeCompare(classB?.name || '', 'ar');
  }), [subjects, classes]);

  const getScheduleStats = useCallback((scheduleData) => {
    const schedule = scheduleData || generatedSchedule;
    if (!schedule) return null;

    const activeDays = getActiveDays();
    let totalSlots = 0;
    let filledSlots = 0;
    const teacherStats = {};
    const classStats = {};
    const dayStats = {};
    const sortedClasses = getSortedClasses();
    const sortedTeachers = getSortedTeachers();

    sortedClasses.forEach((schoolClass) => {
      classStats[schoolClass.id] = 0;
      activeDays.forEach((day) => {
        const daySchedule = schedule[schoolClass.id]?.[day.id] || [];
        const periodCount = getDayPeriodCount(day.id);
        totalSlots += periodCount;
        classStats[schoolClass.id] += daySchedule.length;
        filledSlots += daySchedule.length;
        dayStats[day.id] ||= { filled: 0, total: 0 };
        dayStats[day.id].total += periodCount;
        dayStats[day.id].filled += daySchedule.length;
      });
    });

    sortedTeachers.forEach((teacher) => { teacherStats[teacher.id] = 0; });
    sortedClasses.forEach((schoolClass) => activeDays.forEach((day) => {
      (schedule[schoolClass.id]?.[day.id] || []).forEach((slot) => {
        if (slot.teacherId) teacherStats[slot.teacherId] = (teacherStats[slot.teacherId] || 0) + 1;
      });
    }));

    const emptySlots = totalSlots - filledSlots;
    const utilization = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;
    const teacherLoads = Object.values(teacherStats);
    const averageLoad = teacherLoads.length
      ? teacherLoads.reduce((sum, load) => sum + load, 0) / teacherLoads.length
      : 0;
    const loadVariance = teacherLoads.length
      ? teacherLoads.reduce((sum, load) => sum + Math.pow(load - averageLoad, 2), 0) / teacherLoads.length
      : 0;
    const balanceScore = Math.max(0, 100 - (loadVariance / (averageLoad + 1)) * 10);

    return {
      totalSlots, filledSlots, emptySlots, utilization, teacherStats, classStats, dayStats,
      score: utilization, balanceScore: Math.min(balanceScore, 100),
      avgTeacherLoad: averageLoad, loadVariance
    };
  }, [generatedSchedule, getActiveDays, getDayPeriodCount, getSortedClasses, getSortedTeachers]);

  return {
    getActiveDays, getDayPeriodCount, getPeriodsListForDay, getTeacherName, getSubjectName,
    getClassName, getSubjectColor, getSortedClasses, getSortedTeachers,
    getSortedSubjectsByClass, getScheduleStats
  };
}