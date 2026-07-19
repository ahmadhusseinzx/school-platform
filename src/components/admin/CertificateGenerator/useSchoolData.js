// src/components/admin/useSchoolData.js

import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../services/firebase';
import { 
  collection, getDocs, query, where, onSnapshot, doc, getDoc 
} from 'firebase/firestore';
import { 
  getStudentAttendanceStats, 
  getStudentNotes, 
  getStudentBehavior,
  calculateMidtermTotal,
  calculateFinalTotal,
  getGradeLabel,
  getGradeColor
} from './calculations';
import { CERTIFICATE_TYPES, BEHAVIOR_RATINGS } from './constants';

export const useSchoolData = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [behaviors, setBehaviors] = useState([]);
  const [studentNotes, setStudentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: '',
    schoolAddress: '',
    establishmentYear: '',
    principalName: '',
    headerText: '',
    footerText: '',
    motto: '',
    phone: '',
    email: '',
    website: '',
    logo: null,
    gender: '',
    gradeLevels: '',
    mission: ''
  });
  const [academicYear, setAcademicYear] = useState('');

  // ============ جلب إعدادات المدرسة والعام الدراسي ============
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialData = async () => {
      try {
        console.log('📡 جلب إعدادات المدرسة...');
        
        const settingsDoc = await getDoc(doc(db, 'schoolSettings', 'settings'));
        
        if (settingsDoc.exists() && isMounted) {
          const data = settingsDoc.data();
          console.log('📄 تم جلب المستند: settings');
          
          const schoolInfo = data.schoolInfo || {};
          
          setSchoolSettings(prev => ({
            ...prev,
            schoolName: schoolInfo.schoolName || '',
            schoolAddress: schoolInfo.schoolAddress || '',
            establishmentYear: schoolInfo.establishmentYear || '',
            principalName: schoolInfo.principalName || '',
            headerText: schoolInfo.headerText || '',
            footerText: schoolInfo.footerText || '',
            motto: schoolInfo.motto || '',
            phone: schoolInfo.phone || '',
            email: schoolInfo.email || '',
            website: schoolInfo.website || '',
            gender: schoolInfo.gender || '',
            gradeLevels: schoolInfo.gradeLevels || '',
            mission: schoolInfo.mission || '',
            logo: schoolInfo.logo || null
          }));
          
          if (data.academicYear?.current) {
            setAcademicYear(data.academicYear.current);
          } else {
            const currentYear = new Date().getFullYear();
            setAcademicYear(`${currentYear}-${currentYear + 1}`);
          }
          return;
        }
        
        console.log('⚠️ لم يتم العثور على مستند settings');
        const currentYear = new Date().getFullYear();
        setAcademicYear(`${currentYear}-${currentYear + 1}`);
        
      } catch (error) {
        console.error('❌ خطأ في جلب البيانات:', error);
        if (isMounted) {
          const currentYear = new Date().getFullYear();
          setAcademicYear(`${currentYear}-${currentYear + 1}`);
        }
      }
    };

    // الاستماع للتغييرات في الوقت الفعلي
    const unsubscribe = onSnapshot(
      doc(db, 'schoolSettings', 'settings'),
      (docSnap) => {
        if (docSnap.exists() && isMounted) {
          const data = docSnap.data();
          const schoolInfo = data.schoolInfo || {};
          
          setSchoolSettings(prev => ({
            ...prev,
            schoolName: schoolInfo.schoolName || '',
            schoolAddress: schoolInfo.schoolAddress || '',
            establishmentYear: schoolInfo.establishmentYear || '',
            principalName: schoolInfo.principalName || '',
            headerText: schoolInfo.headerText || '',
            footerText: schoolInfo.footerText || '',
            motto: schoolInfo.motto || '',
            phone: schoolInfo.phone || '',
            email: schoolInfo.email || '',
            website: schoolInfo.website || '',
            gender: schoolInfo.gender || '',
            gradeLevels: schoolInfo.gradeLevels || '',
            mission: schoolInfo.mission || '',
            logo: schoolInfo.logo || null
          }));
          
          if (data.academicYear?.current) {
            setAcademicYear(data.academicYear.current);
          }
        }
      },
      (error) => {
        console.error('❌ خطأ في الاستماع:', error);
      }
    );

    fetchInitialData();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // ============ جلب البيانات الأساسية ============
  useEffect(() => {
    // جلب الطلاب
    const unsubscribeStudents = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'student')),
      (snapshot) => {
        const studentList = [];
        snapshot.forEach(doc => {
          studentList.push({ id: doc.id, ...doc.data() });
        });
        setStudents(studentList);
        setLoading(false);
      }
    );

    // جلب الصفوف
    const unsubscribeClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const classList = [];
      snapshot.forEach(doc => {
        classList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classList);
    });

    // جلب المواد
    const unsubscribeSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      const subjectList = [];
      snapshot.forEach(doc => {
        subjectList.push({ id: doc.id, ...doc.data() });
      });
      setSubjects(subjectList);
    });

    // جلب العلامات
    const unsubscribeGrades = onSnapshot(collection(db, 'grades'), (snapshot) => {
      const gradeList = [];
      snapshot.forEach(doc => {
        gradeList.push({ id: doc.id, ...doc.data() });
      });
      setGrades(gradeList);
    });

    // جلب سجلات الحضور
    const unsubscribeAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const attendanceList = [];
      snapshot.forEach(doc => {
        attendanceList.push({ id: doc.id, ...doc.data() });
      });
      setAttendance(attendanceList);
    });

    // جلب سجلات السلوك
    const unsubscribeBehaviors = onSnapshot(collection(db, 'behaviors'), (snapshot) => {
      const behaviorList = [];
      snapshot.forEach(doc => {
        behaviorList.push({ id: doc.id, ...doc.data() });
      });
      setBehaviors(behaviorList);
    });

    // جلب ملاحظات الطلاب
    const unsubscribeNotes = onSnapshot(collection(db, 'studentNotes'), (snapshot) => {
      const noteList = [];
      snapshot.forEach(doc => {
        noteList.push({ id: doc.id, ...doc.data() });
      });
      setStudentNotes(noteList);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeClasses();
      unsubscribeSubjects();
      unsubscribeGrades();
      unsubscribeAttendance();
      unsubscribeBehaviors();
      unsubscribeNotes();
    };
  }, []);

  // ============ الحصول على علامات الطالب ============
  const getStudentGrades = useCallback((studentId, semester) => {
    return grades.filter(g => 
      g.studentId === studentId && 
      g.semester === semester
    );
  }, [grades]);

  // ============ الحصول على مواد الصف ============
  const getClassSubjects = useCallback((classId) => {
    return subjects.filter(s => s.classId === classId);
  }, [subjects]);

  // ============ توليد شهادة لطالب واحد ============
  const generateSingleCertificate = useCallback(async (studentId, certificateType) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const classInfo = classes.find(c => c.id === student.classId);
    const studentSubjects = getClassSubjects(student.classId);
    const semester = CERTIFICATE_TYPES.find(t => t.id === certificateType)?.semester || 1;
    const studentGrades = getStudentGrades(studentId, semester);
    
    const attendanceStats = getStudentAttendanceStats(attendance, studentId);
    const behavior = getStudentBehavior(behaviors, studentId, semester, BEHAVIOR_RATINGS);
    const notes = getStudentNotes(studentNotes, studentId, semester);

    const certificateData = {
      student: student,
      classInfo: classInfo,
      semester: semester,
      type: certificateType,
      academicYear: academicYear,
      schoolInfo: schoolSettings,
      subjects: [],
      total: 0,
      maxTotal: 0,
      percentage: 0,
      gradeLabel: '',
      attendance: {
        total: attendanceStats.total,
        present: attendanceStats.present,
        absent: attendanceStats.absent,
        late: attendanceStats.late,
        excused: attendanceStats.excused,
        left: attendanceStats.left,
        autoPresent: attendanceStats.autoPresent,
        totalDays: attendanceStats.totalDays,
        rate: attendanceStats.attendanceRate,
        absenceDays: attendanceStats.absenceDays
      },
      behavior: behavior,
      teacherNotes: notes.teacher || 'لا توجد ملاحظات',
      principalNotes: notes.principal || 'لا توجد ملاحظات',
      issuedDate: new Date().toLocaleDateString('ar')
    };

    // حساب العلامات لكل مادة
    let total = 0;
    let maxTotal = 0;

    studentSubjects.forEach(subject => {
      const grade = studentGrades.find(g => g.subjectId === subject.id);
      let subjectTotal = 0;
      let subjectMax = 0;

      const isMidterm = certificateType.includes('midterm');
      
      if (isMidterm) {
        subjectTotal = calculateMidtermTotal(grade || {});
        subjectMax = 40;
      } else {
        subjectTotal = calculateFinalTotal(grade || {});
        subjectMax = 100;
      }

      const percentage = subjectMax > 0 ? (subjectTotal / subjectMax) * 100 : 0;
      const gradeLevel = parseInt(classInfo?.name?.split(' ')[0]) || 1;

      certificateData.subjects.push({
        name: subject.name,
        total: subjectTotal,
        max: subjectMax,
        percentage: percentage,
        grade: getGradeLabel(percentage, gradeLevel),
        color: getGradeColor(percentage, gradeLevel)
      });

      total += subjectTotal;
      maxTotal += subjectMax;
    });

    certificateData.total = total;
    certificateData.maxTotal = maxTotal;
    certificateData.percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    
    const gradeLevel = parseInt(classInfo?.name?.split(' ')[0]) || 1;
    certificateData.gradeLabel = getGradeLabel(certificateData.percentage, gradeLevel);
    certificateData.gradeColor = getGradeColor(certificateData.percentage, gradeLevel);

    return certificateData;
  }, [students, classes, subjects, grades, attendance, behaviors, studentNotes, academicYear, schoolSettings, getClassSubjects, getStudentGrades]);

  return {
    students,
    classes,
    grades,
    subjects,
    attendance,
    behaviors,
    studentNotes,
    loading,
    schoolSettings,
    academicYear,
    getStudentGrades,
    getClassSubjects,
    generateSingleCertificate
  };
};