// src/components/admin/calculations.js

// ============ دوال حساب العلامات ============
export const calculateMidtermTotal = (grades) => {
  const {
    dailyExam1 = 0,
    participation1 = 0,
    midtermExam = 0
  } = grades || {};
  return dailyExam1 + participation1 + midtermExam;
};

export const calculateFinalTotal = (grades) => {
  const {
    dailyExam1 = 0,
    participation1 = 0,
    midtermExam = 0,
    dailyExam2 = 0,
    participation2 = 0,
    finalExam = 0
  } = grades || {};
  return dailyExam1 + participation1 + midtermExam + dailyExam2 + participation2 + finalExam;
};

export const getGradeLabel = (percentage, gradeLevel) => {
  if (gradeLevel <= 4) {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 75) return 'جيد جداً';
    if (percentage >= 60) return 'جيد';
    if (percentage >= 50) return 'مقبول';
    return 'ضعيف';
  }
  return percentage.toFixed(1);
};

export const getGradeColor = (percentage, gradeLevel) => {
  if (gradeLevel <= 4) {
    if (percentage >= 90) return 'text-emerald-600 bg-emerald-100';
    if (percentage >= 75) return 'text-blue-600 bg-blue-100';
    if (percentage >= 60) return 'text-amber-600 bg-amber-100';
    if (percentage >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-rose-600 bg-rose-100';
  }
  return 'text-blue-600 bg-blue-100';
};

// ============ حساب إحصائيات الحضور للطالب ============
export const getStudentAttendanceStats = (attendance, studentId) => {
  const studentAttendance = attendance.filter(a => a.studentId === studentId);
  
  const total = studentAttendance.length;
  const present = studentAttendance.filter(a => a.status === 'present').length;
  const absent = studentAttendance.filter(a => a.status === 'absent').length;
  const late = studentAttendance.filter(a => a.status === 'late').length;
  const excused = studentAttendance.filter(a => a.status === 'excused').length;
  const left = studentAttendance.filter(a => a.status === 'left').length;

  const allDates = [...new Set(attendance.filter(a => a.studentId === studentId).map(a => a.date))];
  const totalDays = allDates.length || 1;
  const recordedDays = studentAttendance.length;
  const autoPresentDays = Math.max(0, totalDays - recordedDays + present);
  
  const attendanceRate = totalDays > 0 
    ? ((present + autoPresentDays) / totalDays * 100).toFixed(1)
    : 0;

  const absenceDays = absent + late + left;

  return {
    total: total,
    present: present,
    absent: absent,
    late: late,
    excused: excused,
    left: left,
    autoPresent: autoPresentDays,
    totalDays: totalDays,
    attendanceRate: attendanceRate,
    absenceDays: absenceDays
  };
};

// ============ الحصول على ملاحظات الطالب ============
export const getStudentNotes = (studentNotes, studentId, semester) => {
  const notes = studentNotes.filter(n => 
    n.studentId === studentId && 
    n.semester === semester
  );
  
  const teacherNotes = notes.filter(n => n.type === 'teacher');
  const principalNotes = notes.filter(n => n.type === 'principal');
  
  return {
    teacher: teacherNotes.map(n => n.content).join('\n'),
    principal: principalNotes.map(n => n.content).join('\n'),
    all: notes
  };
};

// ============ الحصول على تقييم السلوك للطالب ============
export const getStudentBehavior = (behaviors, studentId, semester, ratings) => {
  const behavior = behaviors.find(b => 
    b.studentId === studentId && 
    b.semester === semester
  );
  
  if (!behavior) {
    return {
      respect: ratings['good'] || 'جيد جداً',
      cleanliness: ratings['good'] || 'جيد جداً',
      cooperation: ratings['good'] || 'جيد جداً',
      responsibility: ratings['good'] || 'جيد جداً',
      initiative: ratings['good'] || 'جيد جداً'
    };
  }

  const behaviorValues = {
    respect: behavior?.criteria?.respect || 'good',
    cleanliness: behavior?.criteria?.cleanliness || 'good',
    cooperation: behavior?.criteria?.cooperation || 'good',
    responsibility: behavior?.criteria?.responsibility || 'good',
    initiative: behavior?.criteria?.initiative || 'good'
  };

  return {
    respect: ratings[behaviorValues.respect] || 'جيد جداً',
    cleanliness: ratings[behaviorValues.cleanliness] || 'جيد جداً',
    cooperation: ratings[behaviorValues.cooperation] || 'جيد جداً',
    responsibility: ratings[behaviorValues.responsibility] || 'جيد جداً',
    initiative: ratings[behaviorValues.initiative] || 'جيد جداً'
  };
};