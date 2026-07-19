// src/components/admin/GradesManager/utils/printUtils.js

import { calculateTotal, getGrade, getTotalMaxForSubject } from './gradeCalculations';

export const printGradeSheet = (
  classData, 
  studentsData, 
  gradesData, 
  subjectData, 
  semesterData, 
  academicYearData,
  gradingConfig  // ✅ جديد
) => {
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) return;
  
  // ✅ الحصول على المجموع الكلي للمادة
  const subjectId = subjectData?.id;
  const maxTotal = getTotalMaxForSubject(subjectId, gradingConfig);
  
  const rows = studentsData.map(student => {
    const grade = gradesData.find(g => 
      g.studentId === student.id && 
      g.subjectId === subjectData?.id && 
      g.semester === semesterData &&
      g.academicYear === academicYearData
    );
    
    const fields = {
      dailyExam1: grade?.dailyExam1 || 0,
      participation1: grade?.participation1 || 0,
      midtermExam: grade?.midtermExam || 0,
      dailyExam2: grade?.dailyExam2 || 0,
      participation2: grade?.participation2 || 0,
      finalExam: grade?.finalExam || 0
    };
    const total = calculateTotal(fields, subjectId, gradingConfig);
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    const gradeInfo = getGrade(percentage);
    
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${student.fullName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.dailyExam1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.participation1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.midtermExam}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.dailyExam2}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.participation2}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fields.finalExam}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #2e7d32;">${total} / ${maxTotal}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          <span style="padding: 2px 8px; border-radius: 12px; background: ${percentage >= 90 ? '#e8f5e9' : percentage >= 80 ? '#e3f2fd' : percentage >= 70 ? '#fff3e0' : percentage >= 60 ? '#fff8e1' : '#ffebee'}; color: ${percentage >= 90 ? '#2e7d32' : percentage >= 80 ? '#1565c0' : percentage >= 70 ? '#e65100' : percentage >= 60 ? '#f57f17' : '#c62828'};">
            ${gradeInfo.label}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const semesterLabel = semesterData === 1 ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني';
  const className = classData?.name || 'غير محدد';
  const subjectName = subjectData?.name || 'غير محدد';
  const schoolName = 'مدرستك الثانوية';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <title>كشف العلامات - ${className}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #fff; margin: 0; }
          .container { max-width: 1100px; margin: 0 auto; direction: rtl; }
          .header { text-align: center; border-bottom: 3px solid #1a237e; padding-bottom: 15px; margin-bottom: 20px; }
          .school-name { font-size: 24px; font-weight: bold; color: #1a237e; }
          .title { font-size: 20px; font-weight: bold; margin: 10px 0; color: #1a237e; }
          .info { text-align: center; color: #555; font-size: 14px; margin-bottom: 15px; }
          .info span { margin: 0 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
          th { background: #1a237e; color: white; padding: 10px 8px; border: 1px solid #1a237e; text-align: center; font-weight: bold; }
          td { padding: 8px; border: 1px solid #ddd; text-align: center; }
          tr:nth-child(even) { background: #f8f9fa; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #1a237e; font-size: 12px; color: #888; }
          .sub-title { font-size: 14px; font-weight: bold; color: #1a237e; margin: 5px 0; }
          .max-total { font-size: 12px; color: #555; }
          @media print { body { padding: 10px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="school-name">${schoolName}</div>
            <div class="title">كشف العلامات</div>
            <div class="sub-title">الصف: ${className}</div>
            <div class="info">
              <span>📚 المادة: ${subjectName}</span>
              <span>📅 الفصل: ${semesterLabel}</span>
              <span>📆 العام الدراسي: ${academicYearData}</span>
              <span>👨‍🎓 عدد الطلاب: ${studentsData.length}</span>
              <span class="max-total">📊 المجموع الكلي: ${maxTotal} علامة</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>امتحان يومي 1<br><span style="font-size:10px;font-weight:normal;">(10)</span></th>
                <th>مشاركة 1<br><span style="font-size:10px;font-weight:normal;">(10)</span></th>
                <th>امتحان شهري<br><span style="font-size:10px;font-weight:normal;">(20)</span></th>
                <th>امتحان يومي 2<br><span style="font-size:10px;font-weight:normal;">(10)</span></th>
                <th>مشاركة 2<br><span style="font-size:10px;font-weight:normal;">(10)</span></th>
                <th>امتحان فصلي<br><span style="font-size:10px;font-weight:normal;">(40)</span></th>
                <th>المجموع<br><span style="font-size:10px;font-weight:normal;">(${maxTotal})</span></th>
                <th>التقدير</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; display: flex; justify-content: space-around; flex-wrap: wrap;">
            <div><strong>عدد الطلاب:</strong> ${studentsData.length}</div>
            <div><strong>المعدل العام:</strong> ${studentsData.length > 0 ? (studentsData.reduce((sum, s) => {
              const grade = gradesData.find(g => g.studentId === s.id && g.subjectId === subjectData?.id && g.semester === semesterData && g.academicYear === academicYearData);
              return sum + (grade ? calculateTotal(grade, subjectId, gradingConfig) : 0);
            }, 0) / studentsData.length).toFixed(1) : 0}</div>
          </div>
          <div class="footer">
            تم إنشاء هذا التقرير بواسطة المنصة التعليمية الذكية<br>
            تاريخ الطباعة: ${new Date().toLocaleDateString('ar')}
          </div>
          <div style="text-align: center; margin-top: 20px;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 30px; background: #1a237e; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
              🖨️ طباعة الكشف
            </button>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
};