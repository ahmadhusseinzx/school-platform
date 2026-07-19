// src/components/admin/CertificateGenerator.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, getDocs, query, where, onSnapshot, doc, getDoc 
} from 'firebase/firestore';
import { 
  FileText, Printer, Download, Users, School, BookOpen, 
  Search, Loader2, CheckCircle, AlertCircle, Filter,
  ChevronDown, ChevronUp, RefreshCw, Settings, Calendar,
  Award, Star, User, GraduationCap, FileCheck, Image
} from 'lucide-react';

// ============ ثوابت أنواع الشهادات ============
const CERTIFICATE_TYPES = [
  { 
    id: 'midterm1', 
    label: 'شهادة شهرين الفصل الأول',
    description: 'تشمل الامتحان اليومي والمشاركة وامتحان الشهرين (40 علامة)',
    semester: 1,
    type: 'midterm'
  },
  { 
    id: 'final1', 
    label: 'شهادة نهاية الفصل الأول',
    description: 'تشمل جميع علامات الفصل الأول كاملة',
    semester: 1,
    type: 'final'
  },
  { 
    id: 'midterm2', 
    label: 'شهادة شهرين الفصل الثاني',
    description: 'تشمل الامتحان اليومي والمشاركة وامتحان الشهرين (40 علامة)',
    semester: 2,
    type: 'midterm'
  },
  { 
    id: 'final2', 
    label: 'شهادة نهاية العام الدراسي',
    description: 'تشمل جميع علامات الفصل الثاني ومتوسط الفصلين',
    semester: 2,
    type: 'final'
  }
];

// ============ دوال حساب العلامات ============
const calculateMidtermTotal = (grades) => {
  const {
    dailyExam1 = 0,
    participation1 = 0,
    midtermExam = 0
  } = grades || {};
  return dailyExam1 + participation1 + midtermExam;
};

const calculateFinalTotal = (grades) => {
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

const getGradeLabel = (percentage, gradeLevel) => {
  if (gradeLevel <= 4) {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 75) return 'جيد جداً';
    if (percentage >= 60) return 'جيد';
    if (percentage >= 50) return 'مقبول';
    return 'ضعيف';
  }
  return percentage.toFixed(1);
};

const getGradeColor = (percentage, gradeLevel) => {
  if (gradeLevel <= 4) {
    if (percentage >= 90) return 'text-emerald-600 bg-emerald-100';
    if (percentage >= 75) return 'text-blue-600 bg-blue-100';
    if (percentage >= 60) return 'text-amber-600 bg-amber-100';
    if (percentage >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-rose-600 bg-rose-100';
  }
  return 'text-blue-600 bg-blue-100';
};

// ============ المكون الرئيسي ============
export default function CertificateGenerator() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [behaviors, setBehaviors] = useState([]);
  const [studentNotes, setStudentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ====== خيارات الشهادة ======
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [certificateType, setCertificateType] = useState('final1');
  const [generateForAll, setGenerateForAll] = useState(false);
  const [academicYear, setAcademicYear] = useState('');

  // ====== حالة الشهادات ======
  const [certificates, setCertificates] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // ====== إعدادات المدرسة ======
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

  // ============ حساب إحصائيات الحضور للطالب ============
  const getStudentAttendanceStats = useCallback((studentId) => {
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
  }, [attendance]);

  // ============ الحصول على تقييم السلوك للطالب ============
  const getStudentBehavior = useCallback((studentId, semester) => {
    const behavior = behaviors.find(b => 
      b.studentId === studentId && 
      b.semester === semester
    );
    return behavior || null;
  }, [behaviors]);

  // ============ الحصول على ملاحظات الطالب ============
  const getStudentNotes = useCallback((studentId, semester) => {
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
  }, [studentNotes]);

  // ============ توليد شهادة لطالب واحد ============
  const generateSingleCertificate = useCallback(async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const classInfo = classes.find(c => c.id === student.classId);
    const studentSubjects = getClassSubjects(student.classId);
    const semester = CERTIFICATE_TYPES.find(t => t.id === certificateType)?.semester || 1;
    const studentGrades = getStudentGrades(studentId, semester);
    
    const attendanceStats = getStudentAttendanceStats(studentId);
    const behavior = getStudentBehavior(studentId, semester);
    const notes = getStudentNotes(studentId, semester);

    const behaviorValues = {
      respect: behavior?.criteria?.respect || 'good',
      cleanliness: behavior?.criteria?.cleanliness || 'good',
      cooperation: behavior?.criteria?.cooperation || 'good',
      responsibility: behavior?.criteria?.responsibility || 'good',
      initiative: behavior?.criteria?.initiative || 'good'
    };

    const ratingLabels = {
      'excellent': 'ممتاز',
      'good': 'جيد جداً',
      'satisfactory': 'جيد',
      'needs_improvement': 'بحاجة لتحسين',
      'poor': 'ضعيف'
    };

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
      behavior: {
        respect: ratingLabels[behaviorValues.respect] || 'جيد جداً',
        cleanliness: ratingLabels[behaviorValues.cleanliness] || 'جيد جداً',
        cooperation: ratingLabels[behaviorValues.cooperation] || 'جيد جداً',
        responsibility: ratingLabels[behaviorValues.responsibility] || 'جيد جداً',
        initiative: ratingLabels[behaviorValues.initiative] || 'جيد جداً'
      },
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
  }, [students, classes, subjects, grades, certificateType, academicYear, schoolSettings, 
      getClassSubjects, getStudentGrades, getStudentAttendanceStats, getStudentBehavior, getStudentNotes]);

  // ============ توليد الشهادات ============
  const handleGenerate = async () => {
    setGenerating(true);
    setMessage({ type: '', text: '' });

    try {
      let targetStudents = [];

      if (generateForAll && selectedClass) {
        targetStudents = students.filter(s => s.classId === selectedClass);
      } else if (selectedStudent) {
        const student = students.find(s => s.id === selectedStudent);
        if (student) targetStudents = [student];
      } else {
        setMessage({ type: 'error', text: '❌ الرجاء اختيار طالب أو صف' });
        setGenerating(false);
        return;
      }

      if (targetStudents.length === 0) {
        setMessage({ type: 'error', text: '❌ لا يوجد طلاب للإنشاء' });
        setGenerating(false);
        return;
      }

      const results = [];
      for (const student of targetStudents) {
        const certificate = await generateSingleCertificate(student.id);
        if (certificate) {
          results.push(certificate);
        }
      }

      setCertificates(results);
      
      if (results.length === 1) {
        setSelectedCertificate(results[0]);
      }

      setMessage({ 
        type: 'success', 
        text: `✅ تم إنشاء ${results.length} شهادة بنجاح` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('❌ خطأ:', error);
      setMessage({ type: 'error', text: '❌ خطأ في إنشاء الشهادات: ' + error.message });
    } finally {
      setGenerating(false);
    }
  };

  // ============ طباعة الشهادة مع الشعار ============
  const printCertificate = (certificate) => {
    if (!certificate) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const { student, classInfo, subjects, total, maxTotal, gradeLabel, schoolInfo, attendance, behavior, teacherNotes, principalNotes } = certificate;

    // ✅ استخدام schoolInfo من قاعدة البيانات
    const schoolName = schoolInfo?.schoolName || 'مدرسة الجيل الجديد';
    const schoolAddress = schoolInfo?.schoolAddress || 'حافظة القدس - أبو ديس';
    const establishmentYear = schoolInfo?.establishmentYear || '1999';
    const principalName = schoolInfo?.principalName || 'مدير المدرسة';
    const headerText = schoolInfo?.headerText || 'النتائج المدرسية';
    const footerText = schoolInfo?.footerText || 'معاً نحو مستقبل أفضل';
    const motto = schoolInfo?.motto || '';
    const phone = schoolInfo?.phone || '';
    const email = schoolInfo?.email || '';
    const logoUrl = schoolInfo?.logo || null;

    const attendanceDays = attendance?.present || 0;
    const totalDays = attendance?.totalDays || 95;
    const attendanceRate = attendance?.rate || 0;
    const absenceDays = attendance?.absenceDays || 0;

    const subjectsRows = subjects.map(sub => `
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #ddd; text-align: center;">${sub.name}</td>
        <td style="padding: 6px 10px; border: 1px solid #ddd; text-align: center;">${sub.total}</td>
        <td style="padding: 6px 10px; border: 1px solid #ddd; text-align: center;">${sub.max}</td>
        <td style="padding: 6px 10px; border: 1px solid #ddd; text-align: center;">
          <span style="padding: 2px 10px; border-radius: 12px; background: ${sub.color?.split(' ')[1] || '#f0f0f0'}; color: ${sub.color?.split(' ')[0]?.replace('text-', '') || '#333'};">
            ${sub.grade}
          </span>
        </td>
      </tr>
    `).join('');

    const certificateTypeLabel = CERTIFICATE_TYPES.find(t => t.id === certificateType)?.label || 'شهادة';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>شهادة ${student.fullName}</title>
          <meta charset="UTF-8">
          <style>
            @page { margin: 20px; }
            body { 
              font-family: 'Segoe UI', 'Arial', sans-serif; 
              padding: 30px; 
              background: #f5f5f5;
              margin: 0;
            }
            .certificate-container {
              max-width: 850px;
              margin: 0 auto;
              background: white;
              padding: 30px 40px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.15);
              border: 2px solid #1a237e;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #1a237e;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header-logo {
              max-height: 80px;
              width: auto;
              object-fit: contain;
              margin-bottom: 8px;
            }
            .school-name {
              font-size: 26px;
              font-weight: 900;
              color: #1a237e;
              letter-spacing: 1px;
            }
            .school-address {
              font-size: 13px;
              color: #555;
              margin: 3px 0;
            }
            .establishment {
              font-size: 12px;
              color: #777;
            }
            ${motto ? `.school-motto { font-size: 14px; color: #1a237e; margin-top: 3px; font-style: italic; }` : ''}
            ${phone ? `.school-phone { font-size: 12px; color: #888; }` : ''}
            ${email ? `.school-email { font-size: 12px; color: #888; }` : ''}
            .title {
              font-size: 22px;
              font-weight: 800;
              color: #1a237e;
              text-align: center;
              margin: 15px 0 10px;
              padding: 8px;
              background: #e8eaf6;
              border-radius: 8px;
            }
            .sub-title {
              text-align: center;
              color: #555;
              font-size: 14px;
              margin-bottom: 15px;
              border-bottom: 1px dashed #ddd;
              padding-bottom: 10px;
            }
            .student-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 30px;
              background: #f8f9fa;
              padding: 15px 20px;
              border-radius: 8px;
              margin: 15px 0;
              border: 1px solid #e0e0e0;
            }
            .student-info-item {
              display: flex;
              gap: 8px;
              font-size: 14px;
            }
            .student-info-item .label {
              color: #666;
              font-weight: 600;
              min-width: 80px;
            }
            .student-info-item .value {
              color: #1a237e;
              font-weight: 700;
            }
            .subjects-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 14px;
            }
            .subjects-table th {
              background: #1a237e;
              color: white;
              padding: 10px;
              text-align: center;
              font-weight: 700;
            }
            .subjects-table td {
              padding: 8px 10px;
              border: 1px solid #ddd;
              text-align: center;
            }
            .subjects-table tr:nth-child(even) {
              background: #f8f9fa;
            }
            .total-row {
              background: #e8eaf6 !important;
              font-weight: 700;
            }
            .total-row td {
              border-top: 2px solid #1a237e;
            }
            .extra-info {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 10px;
              margin: 15px 0;
              padding: 12px;
              background: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
            }
            .extra-info-item {
              text-align: center;
              font-size: 13px;
            }
            .extra-info-item .label {
              color: #666;
              font-weight: 600;
            }
            .extra-info-item .value {
              color: #1a237e;
              font-weight: 700;
            }
            .behavior-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin: 15px 0;
              padding: 12px;
              background: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
            }
            .behavior-item {
              text-align: center;
              font-size: 13px;
            }
            .behavior-item .label {
              color: #666;
              font-weight: 600;
            }
            .behavior-item .value {
              color: #1a237e;
              font-weight: 700;
            }
            .notes-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 15px 0;
              padding: 12px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              background: #fafafa;
            }
            .notes-section .note-box {
              padding: 5px 10px;
            }
            .notes-section .note-box .label {
              font-weight: 700;
              color: #1a237e;
              font-size: 13px;
              display: block;
              margin-bottom: 3px;
            }
            .notes-section .note-box .value {
              font-size: 13px;
              color: #333;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 3px;
              min-height: 20px;
              white-space: pre-line;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 25px;
              padding-top: 20px;
              border-top: 2px solid #1a237e;
            }
            .footer-left {
              text-align: center;
            }
            .footer-left .signature-line {
              width: 150px;
              border-top: 1px solid #333;
              margin: 5px auto 0;
            }
            .footer-right {
              text-align: center;
            }
            .stamp {
              width: 80px;
              height: 80px;
              border: 3px solid #1a237e;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: 700;
              color: #1a237e;
              text-align: center;
              line-height: 1.3;
              margin: 0 auto;
            }
            .stamp .year {
              font-size: 16px;
            }
            .footer-text {
              text-align: center;
              font-size: 12px;
              color: #888;
              margin-top: 10px;
            }
            @media print {
              body { background: white; padding: 0; }
              .certificate-container { box-shadow: none; border: 2px solid #1a237e; border-radius: 0; padding: 20px 30px; }
              .no-print { display: none; }
            }
            @media (max-width: 600px) {
              .certificate-container { padding: 15px; }
              .student-info { grid-template-columns: 1fr; }
              .extra-info { grid-template-columns: 1fr; }
              .behavior-section { grid-template-columns: 1fr; }
              .notes-section { grid-template-columns: 1fr; }
              .footer { flex-direction: column; align-items: center; gap: 20px; }
              .school-name { font-size: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <!-- ✅ الهيدر مع بيانات المدرسة والشعار -->
            <div class="header">
              ${logoUrl ? `
                <div style="text-align: center; margin-bottom: 8px;">
                  <img src="${logoUrl}" alt="شعار المدرسة" class="header-logo" />
                </div>
              ` : ''}
              <div class="school-name">${schoolName}</div>
              <div class="school-address">${schoolAddress}</div>
              <div class="establishment">تأسست سنة ${establishmentYear}</div>
              ${motto ? `<div class="school-motto">"${motto}"</div>` : ''}
              ${phone ? `<div class="school-phone">📞 ${phone}</div>` : ''}
              ${email ? `<div class="school-email">📧 ${email}</div>` : ''}
            </div>

            <!-- ✅ العنوان مع العام الدراسي -->
            <div class="title">${headerText}</div>
            <div class="sub-title">
              ${certificateTypeLabel} - للعام الدراسي ${academicYear}
            </div>

            <!-- معلومات الطالب -->
            <div class="student-info">
              <div class="student-info-item">
                <span class="label">الاسم:</span>
                <span class="value">${student.fullName}</span>
              </div>
              <div class="student-info-item">
                <span class="label">مكان الولادة:</span>
                <span class="value">${student.birthPlace || 'القدس'}</span>
              </div>
              <div class="student-info-item">
                <span class="label">الجنسية:</span>
                <span class="value">${student.nationality || 'فلسطين'}</span>
              </div>
              <div class="student-info-item">
                <span class="label">الصف:</span>
                <span class="value">${classInfo?.name || 'غير محدد'}</span>
              </div>
              <div class="student-info-item">
                <span class="label">رقم الهوية:</span>
                <span class="value">${student.idNumber || '-------'}</span>
              </div>
              <div class="student-info-item">
                <span class="label">تاريخ الولادة:</span>
                <span class="value">${student.dateOfBirth || '----/--/--'}</span>
              </div>
              <div class="student-info-item" style="grid-column: 1/-1;">
                <span class="label">مكان السكن:</span>
                <span class="value">${student.address || 'العيزرية'}</span>
              </div>
            </div>

            <!-- جدول العلامات -->
            <table class="subjects-table">
              <thead>
                <tr>
                  <th>المبحث</th>
                  <th>العلامة المستحقة</th>
                  <th>النهاية العظمى</th>
                  <th>التقدير السنوي</th>
                </tr>
              </thead>
              <tbody>
                ${subjectsRows}
                <tr class="total-row">
                  <td colspan="3" style="text-align: left; padding-right: 20px;">
                    <strong>المجموع العام: ${total} من ${maxTotal}</strong>
                  </td>
                  <td>
                    <span style="padding: 4px 15px; border-radius: 20px; background: ${gradeLabel === 'ممتاز' ? '#e8f5e9' : gradeLabel === 'جيد جداً' ? '#e3f2fd' : gradeLabel === 'جيد' ? '#fff3e0' : '#ffebee'}; color: ${gradeLabel === 'ممتاز' ? '#2e7d32' : gradeLabel === 'جيد جداً' ? '#1565c0' : gradeLabel === 'جيد' ? '#e65100' : '#c62828'}; font-weight: 700;">
                      ${gradeLabel}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- معلومات الحضور -->
            <div class="extra-info">
              <div class="extra-info-item">
                <span class="label">عدد أيام الحضور</span>
                <div class="value">${attendanceDays}</div>
              </div>
              <div class="extra-info-item">
                <span class="label">عدد أيام القياس</span>
                <div class="value">${totalDays}</div>
              </div>
              <div class="extra-info-item">
                <span class="label">نسبة الحضور</span>
                <div class="value">${attendanceRate}%</div>
              </div>
              <div class="extra-info-item">
                <span class="label">أيام الغياب</span>
                <div class="value" style="color: ${absenceDays > 0 ? '#ef4444' : '#22c55e'};">${absenceDays}</div>
              </div>
            </div>

            <!-- السلوك -->
            <div class="behavior-section">
              <div class="behavior-item">
                <span class="label">احترام النظام</span>
                <div class="value">${behavior?.respect || 'جيد جداً'}</div>
              </div>
              <div class="behavior-item">
                <span class="label">النظافة والترتيب</span>
                <div class="value">${behavior?.cleanliness || 'جيد جداً'}</div>
              </div>
              <div class="behavior-item">
                <span class="label">التعاون مع الآخرين</span>
                <div class="value">${behavior?.cooperation || 'جيد جداً'}</div>
              </div>
              <div class="behavior-item">
                <span class="label">المبادرة والإيجابية</span>
                <div class="value">${behavior?.initiative || 'جيد جداً'}</div>
              </div>
            </div>

            <!-- الملاحظات -->
            <div class="notes-section">
              <div class="note-box">
                <span class="label">📝 ملحوظات مربية الصف:</span>
                <div class="value">${teacherNotes || 'لا توجد ملاحظات'}</div>
              </div>
              <div class="note-box">
                <span class="label">📝 ملحوظات مديرة المدرسة:</span>
                <div class="value">${principalNotes || 'لا توجد ملاحظات'}</div>
              </div>
            </div>

            <!-- ✅ التوقيعات مع اسم المدير -->
            <div class="footer">
              <div class="footer-left">
                <div><strong>تاريخ إصدار الشهادة:</strong></div>
                <div style="font-size: 14px; margin-top: 5px;">${certificate.issuedDate}</div>
              </div>
              <div class="footer-right">
                <div class="stamp">
                  <div>${schoolName}</div>
                  <div>${establishmentYear}</div>
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">
              <div style="text-align: center;">
                <div><strong>توقيع مديرة المدرسة</strong></div>
                <div style="margin-top: 5px;">___________________</div>
                <div style="font-size: 12px; color: #555;">${principalName}</div>
              </div>
              <div style="text-align: center;">
                <div><strong>ختم المدرسة</strong></div>
                <div style="font-size: 12px; color: #555; margin-top: 5px;">${schoolName}</div>
              </div>
            </div>

            ${footerText ? `<div class="footer-text">${footerText}</div>` : ''}

            <!-- زر الطباعة -->
            <div style="text-align: center; margin-top: 20px;" class="no-print">
              <button onclick="window.print()" style="padding: 12px 40px; background: #1a237e; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 700;">
                🖨️ طباعة الشهادة
              </button>
            </div>
          </div>
          <script>
            document.querySelectorAll('.certificate-container').forEach(el => {
              el.style.direction = 'rtl';
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ============ طباعة شهادة مفردة ============
  const handlePrintSingle = () => {
    if (selectedCertificate) {
      printCertificate(selectedCertificate);
    }
  };

  // ============ طباعة جميع الشهادات ============
  const handlePrintAll = () => {
    if (certificates.length === 0) return;
    certificates.forEach((cert, index) => {
      setTimeout(() => {
        printCertificate(cert);
      }, index * 1000);
    });
  };

  // ============ عرض حالة التحميل ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل البيانات...</p>
      </div>
    );
  }

  const selectedType = CERTIFICATE_TYPES.find(t => t.id === certificateType);

  if (!academicYear) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل العام الدراسي...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            إنشاء الشهادات المدرسية
          </h2>
          <p className="text-xs text-slate-400">
            إنشاء شهادات تقديرية للطلاب - العام الدراسي: <span className="text-emerald-400 font-bold">{academicYear}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">📄 عدد الشهادات: {certificates.length}</span>
          {schoolSettings.logo && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Image className="w-3 h-3" /> شعار المدرسة موجود
            </span>
          )}
          <button
            onClick={() => {
              setCertificates([]);
              setSelectedCertificate(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            مسح الكل
          </button>
        </div>
      </div>

      {/* ====== عرض الرسائل ====== */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ====== خيارات إنشاء الشهادة ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
        {/* نوع الشهادة */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">نوع الشهادة</label>
          <select
            value={certificateType}
            onChange={(e) => setCertificateType(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            {CERTIFICATE_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1">{selectedType?.description}</p>
        </div>

        {/* الصف */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">الصف</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">اختر الصف</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        {/* الطالب */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">الطالب</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            disabled={generateForAll}
          >
            <option value="">اختر الطالب</option>
            {students
              .filter(s => !selectedClass || s.classId === selectedClass)
              .map(student => (
                <option key={student.id} value={student.id}>{student.fullName}</option>
              ))}
          </select>
        </div>

        {/* خيارات إضافية */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 block mb-1">خيارات</label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={generateForAll}
                onChange={(e) => {
                  setGenerateForAll(e.target.checked);
                  if (e.target.checked) setSelectedStudent('');
                }}
                className="rounded bg-slate-700 border-slate-600 text-emerald-500"
              />
              جميع طلاب الصف
            </label>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || (!selectedStudent && !generateForAll)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</>
            ) : (
              <><FileText className="w-4 h-4" /> إنشاء الشهادة</>
            )}
          </button>
        </div>
      </div>

      {/* ====== معاينة الشهادات ====== */}
      {certificates.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              الشهادات المُنشأة ({certificates.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrintAll}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة الكل
              </button>
            </div>
          </div>

          {/* قائمة الشهادات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {certificates.map((cert, index) => (
              <div
                key={index}
                className={`p-3 bg-slate-900 rounded-xl border cursor-pointer transition-all ${
                  selectedCertificate === cert 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => setSelectedCertificate(cert)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{cert.student.fullName}</p>
                    <p className="text-xs text-slate-400">{cert.classInfo?.name}</p>
                    <p className="text-xs text-slate-500">المجموع: {cert.total} / {cert.maxTotal}</p>
                    <p className="text-xs text-slate-500">👨‍🎓 نسبة الحضور: {cert.attendance?.rate || 0}%</p>
                    <p className="text-xs text-slate-500">⭐ السلوك: {cert.behavior?.respect || 'جيد جداً'}</p>
                  </div>
                  <div className="text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      cert.gradeLabel === 'ممتاز' ? 'bg-emerald-100 text-emerald-700' :
                      cert.gradeLabel === 'جيد جداً' ? 'bg-blue-100 text-blue-700' :
                      cert.gradeLabel === 'جيد' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {cert.gradeLabel}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        printCertificate(cert);
                      }}
                      className="block mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Printer className="w-3 h-3 inline ml-1" />
                      طباعة
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== معاينة الشهادة المختارة ====== */}
      {selectedCertificate && (
        <div className="bg-white text-slate-900 rounded-xl p-6 border border-slate-200 max-h-[600px] overflow-y-auto">
          {/* ✅ معاينة مع الشعار */}
          <div className="border-b-2 border-blue-900 pb-3 mb-3 text-center">
            {schoolSettings.logo && (
              <div className="flex justify-center mb-2">
                <img 
                  src={schoolSettings.logo} 
                  alt="شعار المدرسة" 
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <h2 className="text-xl font-bold text-blue-900">
              {schoolSettings.schoolName || 'مدرسة الجيل الجديد'}
            </h2>
            <p className="text-center text-slate-500 text-sm">
              {schoolSettings.schoolAddress || 'حافظة القدس - أبو ديس'}
            </p>
          </div>

          <h3 className="text-lg font-bold text-center text-blue-900 mb-3">
            {CERTIFICATE_TYPES.find(t => t.id === certificateType)?.label}
            <span className="block text-sm font-normal text-slate-500">العام الدراسي: {academicYear}</span>
          </h3>

          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div><span className="text-slate-500">الاسم:</span> <span className="font-bold">{selectedCertificate.student.fullName}</span></div>
            <div><span className="text-slate-500">الصف:</span> <span className="font-bold">{selectedCertificate.classInfo?.name}</span></div>
            <div><span className="text-slate-500">رقم الهوية:</span> <span className="font-bold">{selectedCertificate.student.idNumber || '-------'}</span></div>
            <div><span className="text-slate-500">تاريخ الولادة:</span> <span className="font-bold">{selectedCertificate.student.dateOfBirth || '----/--/--'}</span></div>
            <div><span className="text-slate-500">نسبة الحضور:</span> <span className="font-bold">{selectedCertificate.attendance?.rate || 0}%</span></div>
            <div><span className="text-slate-500">أيام الغياب:</span> <span className="font-bold text-rose-600">{selectedCertificate.attendance?.absenceDays || 0}</span></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="border p-2 text-center">المبحث</th>
                  <th className="border p-2 text-center">العلامة المستحقة</th>
                  <th className="border p-2 text-center">النهاية العظمى</th>
                  <th className="border p-2 text-center">التقدير السنوي</th>
                </tr>
              </thead>
              <tbody>
                {selectedCertificate.subjects.map((sub, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-slate-50' : ''}>
                    <td className="border p-2 text-center">{sub.name}</td>
                    <td className="border p-2 text-center">{sub.total}</td>
                    <td className="border p-2 text-center">{sub.max}</td>
                    <td className="border p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sub.color}`}>
                        {sub.grade}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-bold">
                  <td colSpan="2" className="border p-2 text-left">المجموع العام: {selectedCertificate.total}</td>
                  <td className="border p-2 text-center">من {selectedCertificate.maxTotal}</td>
                  <td className="border p-2 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedCertificate.gradeColor}`}>
                      {selectedCertificate.gradeLabel}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 mb-2">⭐ تقييم السلوك</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">احترام النظام:</span> <span className="font-bold">{selectedCertificate.behavior?.respect || 'جيد جداً'}</span></div>
              <div><span className="text-slate-500">النظافة والترتيب:</span> <span className="font-bold">{selectedCertificate.behavior?.cleanliness || 'جيد جداً'}</span></div>
            </div>
            
            <h4 className="text-xs font-bold text-slate-500 mt-3 mb-1">📝 الملاحظات</h4>
            <div className="text-sm">
              <p><span className="text-slate-500">مربية الصف:</span> {selectedCertificate.teacherNotes || 'لا توجد ملاحظات'}</p>
              <p><span className="text-slate-500">مديرة المدرسة:</span> {selectedCertificate.principalNotes || 'لا توجد ملاحظات'}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handlePrintSingle}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
            >
              <Printer className="w-4 h-4" />
              طباعة الشهادة
            </button>
          </div>
        </div>
      )}

      {certificates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">اختر طالب أو صف واضغط "إنشاء الشهادة"</p>
        </div>
      )}
    </div>
  );
}