// src/components/admin/certificatePrinter.js

import { CERTIFICATE_TYPES } from './constants';

// ============ طباعة الشهادة مع الشعار ============
export const printCertificate = (certificate, certificateType, academicYear) => {
  if (!certificate) return;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const { student, classInfo, subjects, total, maxTotal, gradeLabel, schoolInfo, attendance, behavior, teacherNotes, principalNotes } = certificate;

  // استخدام schoolInfo من قاعدة البيانات
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
          <!-- الهيدر مع بيانات المدرسة والشعار -->
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

          <!-- العنوان مع العام الدراسي -->
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

          <!-- التوقيعات مع اسم المدير -->
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

// ============ طباعة جميع الشهادات ============
export const printAllCertificates = (certificates, certificateType, academicYear) => {
  if (certificates.length === 0) return;
  certificates.forEach((cert, index) => {
    setTimeout(() => {
      printCertificate(cert, certificateType, academicYear);
    }, index * 1000);
  });
};