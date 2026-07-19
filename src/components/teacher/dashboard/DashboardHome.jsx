// src/components/teacher/dashboard/DashboardHome.jsx
import React, { useState } from 'react';
import StatsCards from './StatsCards';
import DailySchedule from './DailySchedule';
import Notifications from './Notifications';

export default function DashboardHome({ darkMode, setActiveMainTab }) {
  // بيانات محاكاة للوحة التحكم
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'critical', text: 'قام الطالب (أحمد) بتسليم واجب (الشبكات) متأخراً', time: 'منذ 5 دقائق', read: false },
    { id: 2, type: 'medium', text: 'لديك استفسار جديد من طالب في ساحة نقاش (بوابة المنطق)', time: 'منذ 20 دقيقة', read: false },
    { id: 3, type: 'medium', text: 'طلب انضمام جديد من الطالبة (سارة) لصف الحادي عشر', time: 'منذ ساعة', read: true }
  ]);

  const [dailySchedule] = useState([
    { id: 1, subject: 'هندسة حاسوب وعمارة الحاسوب', class: 'الحادي عشر علمي - أ', timeFrom: '08:00', timeTo: '08:45', status: 'completed', link: 'https://teams.microsoft.com' },
    { id: 2, subject: 'الشبكات والاتصالات الرقمية', class: 'الثاني عشر علمي - ب', timeFrom: '09:00', timeTo: '09:45', status: 'current', link: 'https://teams.microsoft.com' },
    { id: 3, subject: 'أنظمة التحكم والميكروكنترولر', class: 'العاشر التكنولوجي', timeFrom: '10:00', timeTo: '10:45', status: 'upcoming', link: 'https://teams.microsoft.com' },
    { id: 4, subject: 'مبادئ البرمجة والمنطق الرقمي', class: 'الحادي عشر علمي - ب', timeFrom: '11:00', timeTo: '11:45', status: 'upcoming', link: 'https://teams.microsoft.com' }
  ]);

  const statsData = {
    remainingClasses: 2,
    totalClasses: 4,
    pendingHomeworks: 7,
    attendanceRate: 92,
    attendanceStatus: 'up'
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const snoozeNotification = (id) => {
    alert("تم تأجيل التنبيه لمراجعته لاحقاً.");
  };

  return (
    <div className="space-y-6">
      <StatsCards darkMode={darkMode} statsData={statsData} setActiveMainTab={setActiveMainTab} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailySchedule darkMode={darkMode} schedule={dailySchedule} />
        </div>
        <div>
          <Notifications
            darkMode={darkMode}
            notifications={notifications}
            markNotificationAsRead={markNotificationAsRead}
            snoozeNotification={snoozeNotification}
          />
        </div>
      </div>
    </div>
  );
}