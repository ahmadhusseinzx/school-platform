// src/services/certificateService.js

import { db } from './firebase';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { getStudentGrades, calculateTotalGrade } from './gradeService';
import { getClassById } from './classService';
import { getSchoolInfo } from './userService';

// ============ خدمات الشهادات ============

// ✅ جلب إعدادات المدرسة
const getSchoolSettings = async () => {
  try {
    const docRef = doc(db, 'schoolSettings', 'settings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().schoolInfo || {};
    }
    return {};
  } catch (error) {
    console.error('❌ خطأ في جلب إعدادات المدرسة:', error);
    return {};
  }
};

// ✅ إنشاء شهادة طالب مع دعم بيانات المدرسة
export const generateCertificate = async (studentId, semester, academicYear) => {
  try {
    // جلب بيانات الطالب
    const userDoc = await getDoc(doc(db, "users", studentId));
    if (!userDoc.exists()) {
      throw new Error("الطالب غير موجود");
    }
    const student = userDoc.data();
    
    // جلب بيانات الصف
    const classData = await getClassById(student.classId);
    if (!classData) {
      throw new Error("الصف غير موجود");
    }
    
    // جلب إعدادات المدرسة
    const schoolInfo = await getSchoolSettings();
    
    // جلب العلامات
    const grades = await getStudentGrades(studentId, semester);
    
    // حساب المجاميع لكل مادة
    const subjectGrades = {};
    let totalPoints = 0;
    let subjectCount = 0;
    
    for (const grade of grades) {
      const subjectDoc = await getDoc(doc(db, "subjects", grade.subjectId));
      if (subjectDoc.exists()) {
        const subject = subjectDoc.data();
        const { total, percentage, grade: letterGrade } = calculateTotalGrade(grade, {
          dailyExam1: 10,
          participation1: 10,
          midtermExam: 20,
          dailyExam2: 10,
          participation2: 10,
          finalExam: 40
        });
        subjectGrades[subject.name] = {
          total,
          percentage,
          grade: letterGrade,
          details: grade
        };
        totalPoints += total;
        subjectCount++;
      }
    }
    
    // حساب المعدل العام
    const average = subjectCount > 0 ? totalPoints / subjectCount : 0;
    
    // تحديد التقدير العام
    let overallGrade = 'F';
    if (average >= 90) overallGrade = 'A';
    else if (average >= 80) overallGrade = 'B';
    else if (average >= 70) overallGrade = 'C';
    else if (average >= 60) overallGrade = 'D';
    
    const gradeLabels = {
      'A': 'ممتاز',
      'B': 'جيد جداً',
      'C': 'جيد',
      'D': 'مقبول',
      'F': 'ضعيف'
    };
    
    // تحضير بيانات الشهادة مع بيانات المدرسة
    const certificate = {
      schoolName: schoolInfo.schoolName || "مدرستك الثانوية",
      schoolAddress: schoolInfo.schoolAddress || "",
      establishmentYear: schoolInfo.establishmentYear || "",
      principalName: schoolInfo.principalName || "مدير المدرسة",
      headerText: schoolInfo.headerText || "النتائج المدرسية",
      footerText: schoolInfo.footerText || "معاً نحو مستقبل أفضل",
      studentName: student.fullName,
      studentId: student.studentId || student.uid,
      className: classData.name,
      semester: semester === 1 ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني',
      academicYear: academicYear || '2024/2025',
      subjects: subjectGrades,
      average: average.toFixed(2),
      totalPoints: totalPoints,
      grade: gradeLabels[overallGrade] || 'غير محدد',
      gradeLetter: overallGrade,
      issuedAt: new Date().toISOString(),
      studentInfo: {
        birthPlace: student.birthPlace || '',
        nationality: student.nationality || '',
        address: student.address || '',
        idNumber: student.idNumber || '',
        dateOfBirth: student.dateOfBirth || ''
      }
    };
    
    return certificate;
  } catch (error) {
    console.error("❌ خطأ في إنشاء الشهادة:", error);
    throw error;
  }
};

// ✅ إنشاء شهادات لجميع طلاب الصف
export const generateClassCertificates = async (classId, semester, academicYear) => {
  try {
    const studentsQuery = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("classId", "==", classId)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    
    const certificates = [];
    for (const doc of studentsSnapshot.docs) {
      const student = doc.data();
      const certificate = await generateCertificate(doc.id, semester, academicYear);
      certificates.push(certificate);
    }
    
    return certificates;
  } catch (error) {
    console.error("❌ خطأ في إنشاء شهادات الصف:", error);
    throw error;
  }
};

// ✅ طباعة الشهادة (محسّنة)
export const printCertificate = (certificate) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  
  const subjectsHtml = Object.entries(certificate.subjects).map(([name, data]) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.details.dailyExam1 || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.details.participation1 || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.details.midtermExam || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.details.dailyExam2 || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.details.participation2 || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.details.finalExam || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${data.total}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
        <span style="padding: 2px 12px; border-radius: 12px; background: ${data.percentage >= 90 ? '#e8f5e9' : data.percentage >= 80 ? '#e3f2fd' : data.percentage >= 70 ? '#fff3e0' : data.percentage >= 60 ? '#fff8e1' : '#ffebee'}; color: ${data.percentage >= 90 ? '#2e7d32' : data.percentage >= 80 ? '#1565c0' : data.percentage >= 70 ? '#e65100' : data.percentage >= 60 ? '#f57f17' : '#c62828'};">
          ${data.grade}
        </span>
      </td>
    </tr>
  `).join('');

  const gradeColors = {
    'A': '#2e7d32',
    'B': '#1565c0',
    'C': '#e65100',
    'D': '#f57f17',
    'F': '#c62828'
  };

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <title>شهادة مدرسية</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 40px; }
          .certificate {
            max-width: 950px;
            margin: 0 auto;
            background: white;
            padding: 40px 45px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border: 3px solid #1a237e;
          }
          .header { text-align: center; border-bottom: 2px solid #1a237e; padding-bottom: 20px; margin-bottom: 20px; }
          .school-name { font-size: 28px; font-weight: 900; color: #1a237e; }
          .school-address { color: #666; font-size: 14px; margin: 3px 0; }
          .school-establishment { color: #888; font-size: 12px; }
          .title { text-align: center; font-size: 22px; font-weight: 800; color: #1a237e; margin: 15px 0; padding: 10px; background: #e8eaf6; border-radius: 8px; }
          .sub-title { text-align: center; color: #555; font-size: 14px; margin-bottom: 15px; border-bottom: 1px dashed #ddd; padding-bottom: 10px; }
          .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 30px; background: #f8f9fa; padding: 15px 20px; border-radius: 8px; margin: 15px 0; border: 1px solid #e0e0e0; }
          .student-info-item { display: flex; gap: 8px; font-size: 14px; }
          .student-info-item .label { color: #666; font-weight: 600; min-width: 80px; }
          .student-info-item .value { color: #1a237e; font-weight: 700; }
          .subjects-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
          .subjects-table th { background: #1a237e; color: white; padding: 10px; border: 1px solid #1a237e; text-align: center; font-weight: 700; }
          .subjects-table td { padding: 8px; border: 1px solid #ddd; text-align: center; }
          .subjects-table tr:nth-child(even) { background: #f8f9fa; }
          .total-row { background: #e8eaf6 !important; font-weight: 700; }
          .total-row td { border-top: 2px solid #1a237e; }
          .summary { text-align: center; margin: 20px 0; padding: 15px; background: #e8eaf6; border-radius: 8px; }
          .summary .avg { font-size: 22px; font-weight: 900; color: #1a237e; }
          .grade-badge { display: inline-block; padding: 8px 35px; border-radius: 25px; font-size: 20px; font-weight: 800; margin: 10px 0; }
          .grade-A { background: #e8f5e9; color: #2e7d32; border: 2px solid #2e7d32; }
          .grade-B { background: #e3f2fd; color: #1565c0; border: 2px solid #1565c0; }
          .grade-C { background: #fff3e0; color: #e65100; border: 2px solid #e65100; }
          .grade-D { background: #fff8e1; color: #f57f17; border: 2px solid #f57f17; }
          .grade-F { background: #ffebee; color: #c62828; border: 2px solid #c62828; }
          .footer { text-align: center; margin-top: 25px; padding-top: 20px; border-top: 2px solid #1a237e; display: flex; justify-content: space-between; align-items: center; }
          .footer .signature { text-align: center; }
          .footer .stamp { width: 80px; height: 80px; border: 3px solid #1a237e; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #1a237e; text-align: center; line-height: 1.3; }
          .footer .stamp .year { font-size: 16px; }
          .signature-line { width: 150px; border-bottom: 1px solid #333; margin: 5px auto 0; }
          @media print {
            body { background: white; padding: 20px; }
            .certificate { box-shadow: none; border: 3px solid #1a237e; }
            .no-print { display: none; }
          }
          @media (max-width: 600px) {
            .certificate { padding: 20px; }
            .student-info { grid-template-columns: 1fr; }
            .footer { flex-direction: column; gap: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="school-name">${certificate.schoolName}</div>
            <div class="school-address">${certificate.schoolAddress}</div>
            <div class="school-establishment">${certificate.establishmentYear ? `تأسست سنة ${certificate.establishmentYear}` : ''}</div>
          </div>
          
          <div class="title">${certificate.headerText || 'شهادة تقديرية'}</div>
          <div class="sub-title">${certificate.semester} - العام الدراسي ${certificate.academicYear}</div>
          
          <div class="student-info">
            <div class="student-info-item"><span class="label">الاسم:</span><span class="value">${certificate.studentName}</span></div>
            <div class="student-info-item"><span class="label">مكان الولادة:</span><span class="value">${certificate.studentInfo.birthPlace || '---'}</span></div>
            <div class="student-info-item"><span class="label">الجنسية:</span><span class="value">${certificate.studentInfo.nationality || '---'}</span></div>
            <div class="student-info-item"><span class="label">الصف:</span><span class="value">${certificate.className}</span></div>
            <div class="student-info-item"><span class="label">رقم الهوية:</span><span class="value">${certificate.studentInfo.idNumber || '---'}</span></div>
            <div class="student-info-item"><span class="label">مكان السكن:</span><span class="value">${certificate.studentInfo.address || '---'}</span></div>
          </div>
          
          <table class="subjects-table">
            <thead>
              <tr>
                <th>المادة</th>
                <th>امتحان يومي 1</th>
                <th>مشاركة 1</th>
                <th>امتحان شهري</th>
                <th>امتحان يومي 2</th>
                <th>مشاركة 2</th>
                <th>امتحان نهائي</th>
                <th>المجموع</th>
                <th>التقدير</th>
              </tr>
            </thead>
            <tbody>
              ${subjectsHtml}
              <tr class="total-row">
                <td colspan="7" style="text-align: left; padding-right: 20px;"><strong>المجموع العام: ${certificate.totalPoints}</strong></td>
                <td style="font-weight: bold;">${certificate.totalPoints}</td>
                <td><span style="font-weight: 700; color: ${gradeColors[certificate.gradeLetter] || '#333'};">${certificate.grade}</span></td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary">
            <div class="avg">المعدل العام: ${certificate.average}%</div>
            <div>
              <span class="grade-badge grade-${certificate.gradeLetter}">التقدير العام: ${certificate.grade}</span>
            </div>
          </div>
          
          <div class="footer">
            <div class="signature">
              <div style="font-weight: 700;">توقيع مدير المدرسة</div>
              <div class="signature-line"></div>
              <div style="font-size: 14px; color: #555;">${certificate.principalName}</div>
            </div>
            <div class="stamp">
              <div>${certificate.schoolName}</div>
              <div>${certificate.establishmentYear ? certificate.establishmentYear : ''}</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #999;">
            تم الإصدار بتاريخ: ${new Date(certificate.issuedAt).toLocaleDateString('ar')}
          </div>
          
          <div style="text-align: center; margin-top: 20px;" class="no-print">
            <button onclick="window.print()" style="padding: 12px 40px; background: #1a237e; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 700;">
              🖨️ طباعة الشهادة
            </button>
          </div>
        </div>
        <script>
          window.onload = function() { 
            // تصحيح التوجيه
            document.querySelectorAll('.certificate').forEach(el => el.style.direction = 'rtl');
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};