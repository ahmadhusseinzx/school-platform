import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, BookOpen, Clock, FileText, Plus, Trash2, 
  Edit3, Save, X, Loader2, AlertCircle, CheckCircle 
} from 'lucide-react';
import {
  getTeacherProfile,
  updateTeacherProfile,
  getTeacherSchedule,
  saveTeacherSchedule,
  getTeacherCurriculum,
  saveTeacherCurriculum,
  subscribeToTeacher,
  subscribeToScheduleStatus,
  ensureTeacherExists,
  createDefaultTeacherData
} from '../../services/teacherService';

// ============================================
// بيانات ثابتة للجدول الدراسي
// ============================================

// أيام الأسبوع
const WEEK_DAYS = [
  { id: 1, name: 'الأحد', ar: 'الأحد' },
  { id: 2, name: 'الاثنين', ar: 'الاثنين' },
  { id: 3, name: 'الثلاثاء', ar: 'الثلاثاء' },
  { id: 4, name: 'الأربعاء', ar: 'الأربعاء' },
  { id: 5, name: 'الخميس', ar: 'الخميس' }
];

// أوقات الحصص حسب الجدول الجديد (7 حصص رئيسية مع فترات استراحة)
const PERIOD_TIMES = [
  { period: 1, from: '8:00', to: '8:40' },
  { period: 2, from: '8:45', to: '9:25' },
  { period: 3, from: '9:30', to: '10:10' },
  // الفسحة الأولى (10:10 - 10:30) - لا تحتسب كحصة
  { period: '4a', from: '10:10', to: '10:30', label: 'فسحة 1', isBreak: true },
  { period: 4, from: '10:35', to: '11:15' },
  // الفسحة الثانية (11:15 - 12:00) - لا تحتسب كحصة
  { period: 'break2', from: '11:15', to: '12:00', label: 'فسحة 2', isBreak: true },
  { period: 5, from: '12:00', to: '12:45' },
  { period: 6, from: '12:50', to: '1:30' },
  { period: 7, from: '1:35', to: '2:15' }
];

// الحصص الرئيسية فقط (للعرض في الجدول)
const MAIN_PERIODS = [
  { period: 1, from: '8:00', to: '8:40' },
  { period: 2, from: '8:45', to: '9:25' },
  { period: 3, from: '9:30', to: '10:10' },
  { period: 4, from: '10:35', to: '11:15' },
  { period: 5, from: '12:00', to: '12:45' },
  { period: 6, from: '12:50', to: '1:30' },
  { period: 7, from: '1:35', to: '2:15' }
];

// إنشاء جدول فارغ بالأيام والحصص
const createEmptySchedule = () => {
  return WEEK_DAYS.map(day => ({
    id: day.id,
    day: day.ar,
    periods: MAIN_PERIODS.map(pt => ({
      period: pt.period,
      subject: '',
      class: '',
      timeFrom: pt.from,
      timeTo: pt.to,
      isActive: false,
      hasExam: false,
      notes: ''
    }))
  }));
};

// ============================================
// المكون الرئيسي
// ============================================

export default function TeacherInfo({ darkMode, classes, teacherId, currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // حالات البيانات
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);

  // حالات التحرير
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(false);
  const [tempSchedule, setTempSchedule] = useState([]);
  const [tempCurriculum, setTempCurriculum] = useState([]);
  const [tempProfile, setTempProfile] = useState(null);

  // ============ جلب البيانات من Firebase ============
  useEffect(() => {
    if (!teacherId) {
      setError('معرف المعلم غير موجود');
      setLoading(false);
      return;
    }

    let unsubscribeTeacher = null;
    let unsubscribeStatus = null;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. التأكد من وجود بيانات المعلم
        const defaultData = createDefaultTeacherData(
          teacherId,
          currentUser?.displayName || 'المعلم',
          currentUser?.email || ''
        );
        const teacher = await ensureTeacherExists(teacherId, defaultData);
        setTeacherInfo(teacher);
        setTempProfile(teacher);

        // 2. جلب جدول الحصص
        let scheduleData = await getTeacherSchedule(teacherId);
        if (scheduleData.length === 0) {
          // إنشاء جدول افتراضي إذا كان فارغاً
          scheduleData = createEmptySchedule();
          setSchedule(scheduleData);
          setTempSchedule(scheduleData);
        } else {
          // التأكد من أن الجدول يحتوي على جميع الحصص (7 حصص)
          const fullSchedule = WEEK_DAYS.map(day => {
            const existingDay = scheduleData.find(d => d.id === day.id);
            if (existingDay) {
              const periods = MAIN_PERIODS.map(pt => {
                const existingPeriod = existingDay.periods.find(p => p.period === pt.period);
                return existingPeriod || {
                  period: pt.period,
                  subject: '',
                  class: '',
                  timeFrom: pt.from,
                  timeTo: pt.to,
                  isActive: false,
                  hasExam: false,
                  notes: ''
                };
              });
              return { ...existingDay, periods };
            }
            return {
              id: day.id,
              day: day.ar,
              periods: MAIN_PERIODS.map(pt => ({
                period: pt.period,
                subject: '',
                class: '',
                timeFrom: pt.from,
                timeTo: pt.to,
                isActive: false,
                hasExam: false,
                notes: ''
              }))
            };
          });
          setSchedule(fullSchedule);
          setTempSchedule(fullSchedule);
        }

        // 3. جلب الخطة الدراسية
        const curriculumData = await getTeacherCurriculum(teacherId);
        if (curriculumData.length === 0) {
          const defaultCurriculum = classes.map(cls => ({
            classId: cls.id,
            className: cls.name,
            units: [
              { unit: 1, title: `الوحدة الأولى - ${cls.name}`, weeks: 3, status: 'pending' },
              { unit: 2, title: `الوحدة الثانية - ${cls.name}`, weeks: 4, status: 'pending' },
              { unit: 3, title: `الوحدة الثالثة - ${cls.name}`, weeks: 4, status: 'pending' }
            ]
          }));
          setCurriculum(defaultCurriculum);
          setTempCurriculum(defaultCurriculum);
        } else {
          setCurriculum(curriculumData);
          setTempCurriculum(curriculumData);
        }

        // 4. الاستماع للتغييرات اللحظية (Realtime)
        unsubscribeTeacher = subscribeToTeacher(teacherId, (updatedTeacher) => {
          if (updatedTeacher) {
            setTeacherInfo(updatedTeacher);
            setTempProfile(updatedTeacher);
          }
        });

        unsubscribeStatus = subscribeToScheduleStatus(teacherId, (status) => {
          if (status) {
            setCurrentStatus(status);
          }
        });

      } catch (err) {
        console.error('خطأ في تحميل البيانات:', err);
        setError('حدث خطأ أثناء تحميل البيانات: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribeTeacher) unsubscribeTeacher();
      if (unsubscribeStatus) unsubscribeStatus();
    };
  }, [teacherId, currentUser, classes]);

  // ============ دوال حفظ البيانات ============

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      await updateTeacherProfile(teacherId, tempProfile);
      setTeacherInfo(tempProfile);
      setEditingProfile(false);
      setSuccess('تم حفظ الملف الشخصي بنجاح!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('خطأ في حفظ الملف الشخصي: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      setError(null);
      await saveTeacherSchedule(teacherId, tempSchedule);
      setSchedule(tempSchedule);
      setEditingSchedule(false);
      setSuccess('تم حفظ جدول الحصص بنجاح!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('خطأ في حفظ جدول الحصص: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurriculum = async () => {
    try {
      setSaving(true);
      setError(null);
      await saveTeacherCurriculum(teacherId, tempCurriculum);
      setCurriculum(tempCurriculum);
      setEditingCurriculum(false);
      setSuccess('تم حفظ الخطة الدراسية بنجاح!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('خطأ في حفظ الخطة الدراسية: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============ دوال إدارة الجدول ============

  const handleUpdatePeriod = (dayIndex, periodIndex, field, value) => {
    const newSchedule = [...tempSchedule];
    newSchedule[dayIndex].periods[periodIndex][field] = value;
    setTempSchedule(newSchedule);
  };

  const handleToggleActive = (dayIndex, periodIndex) => {
    const newSchedule = [...tempSchedule];
    const current = newSchedule[dayIndex].periods[periodIndex].isActive;
    newSchedule[dayIndex].periods[periodIndex].isActive = !current;
    setTempSchedule(newSchedule);
  };

  // ============ دوال إدارة الخطة الدراسية ============

  const handleUpdateUnitStatus = (classIndex, unitIndex, status) => {
    const newCurriculum = [...tempCurriculum];
    newCurriculum[classIndex].units[unitIndex].status = status;
    setTempCurriculum(newCurriculum);
  };

  // ============ عرض حالة التحميل ============

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400 mt-4">جاري تحميل بيانات المعلم...</p>
      </div>
    );
  }

  // ============ عرض الأخطاء ============

  if (error && !teacherInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-sm text-rose-400 mt-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-bold"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ============ عرض رسائل النجاح ============

  const renderSuccessMessage = () => {
    if (!success) return null;
    return (
      <div className="fixed top-4 right-4 z-50 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-bold">{success}</span>
      </div>
    );
  };

  // ============ دوال عرض البيانات ============

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-500/30">✓ منجز</span>;
      case 'in-progress':
        return <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[9px] font-bold border border-blue-500/30 animate-pulse">● قيد التنفيذ</span>;
      case 'pending':
        return <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[9px] font-bold border border-amber-500/30">⏳ قادم</span>;
      default:
        return null;
    }
  };

  // ============================================
  // عرض جدول الحصص مع 7 حصص
  // ============================================

  const renderScheduleTable = (scheduleData, isEditing) => {
    const periods = MAIN_PERIODS.map(pt => pt.period);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <th className="p-2 text-center font-bold text-slate-400 min-w-[60px] sticky right-0 bg-[#1e293b]">
                الحصة
              </th>
              <th className="p-2 text-center font-bold text-slate-400 min-w-[80px]">
                الوقت
              </th>
              {WEEK_DAYS.map(day => (
                <th key={day.id} className="p-2 text-center font-bold text-blue-400 min-w-[100px]">
                  {day.ar}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((periodNum) => {
              const timeInfo = MAIN_PERIODS.find(pt => pt.period === periodNum);
              return (
                <tr key={periodNum} className={`border-b ${darkMode ? 'border-slate-800/50' : 'border-slate-200/50'} hover:bg-slate-800/30 transition-colors`}>
                  <td className="p-2 text-center font-bold text-slate-400 sticky right-0 bg-[#1e293b]">
                    {periodNum}
                  </td>
                  <td className="p-2 text-center text-[10px] text-slate-500 whitespace-nowrap">
                    {timeInfo?.from} - {timeInfo?.to}
                  </td>
                  {WEEK_DAYS.map((day, dayIndex) => {
                    const dayData = scheduleData.find(d => d.id === day.id);
                    const period = dayData?.periods?.find(p => p.period === periodNum);
                    const currentSchedule = isEditing ? tempSchedule : schedule;
                    const currentDay = currentSchedule.find(d => d.id === day.id);
                    const currentPeriod = currentDay?.periods?.find(p => p.period === periodNum);
                    
                    return (
                      <td key={day.id} className="p-1">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 p-1 rounded-lg bg-[#0f172a] border border-slate-800">
                            <input
                              type="text"
                              value={currentPeriod?.subject || ''}
                              onChange={(e) => handleUpdatePeriod(dayIndex, periodNum - 1, 'subject', e.target.value)}
                              className="w-full p-1 rounded bg-[#1e293b] border border-slate-700 text-white text-[10px] text-center"
                              placeholder="المادة"
                            />
                            <input
                              type="text"
                              value={currentPeriod?.class || ''}
                              onChange={(e) => handleUpdatePeriod(dayIndex, periodNum - 1, 'class', e.target.value)}
                              className="w-full p-1 rounded bg-[#1e293b] border border-slate-700 text-white text-[9px] text-center"
                              placeholder="الصف"
                            />
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <label className="flex items-center gap-1 text-[8px] text-slate-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={currentPeriod?.isActive || false}
                                  onChange={() => handleToggleActive(dayIndex, periodNum - 1)}
                                  className="w-3 h-3 rounded bg-slate-800 border-slate-700 text-blue-500"
                                />
                                نشط
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className={`p-1.5 rounded-lg text-center transition-all ${
                            period?.subject ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-800/30 border border-slate-800/50'
                          } ${period?.isActive ? 'ring-2 ring-blue-500/30' : ''}`}>
                            {period?.subject ? (
                              <>
                                <div className="text-[10px] font-bold text-slate-200">{period.subject}</div>
                                <div className="text-[8px] text-slate-400">{period.class}</div>
                                {period.isActive && (
                                  <div className="mt-0.5">
                                    <span className="text-[7px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">● نشط</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-[9px] text-slate-600">-</span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ============================================
  // عرض الجدول الزمني للأسبوع (Timeline View)
  // ============================================

  const renderTimelineView = () => {
    const allPeriods = [
      { period: 1, from: '8:00', to: '8:40' },
      { period: 2, from: '8:45', to: '9:25' },
      { period: 3, from: '9:30', to: '10:10' },
      { period: 'break1', from: '10:10', to: '10:30', label: '☕ فسحة', isBreak: true },
      { period: 4, from: '10:35', to: '11:15' },
      { period: 'break2', from: '11:15', to: '12:00', label: '☕ فسحة', isBreak: true },
      { period: 5, from: '12:00', to: '12:45' },
      { period: 6, from: '12:50', to: '1:30' },
      { period: 7, from: '1:35', to: '2:15' }
    ];

    return (
      <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-[#0f172a]">
        <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> الجدول الزمني للحصص والفسحات
        </h4>
        <div className="flex flex-wrap gap-1">
          {allPeriods.map((p, index) => (
            <div
              key={index}
              className={`px-2 py-1 rounded text-[9px] font-bold ${
                p.isBreak
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {p.isBreak ? p.label : `${p.period} (${p.from}-${p.to})`}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================
  // الواجهة الرئيسية
  // ============================================

  return (
    <div className="space-y-6 relative">
      {renderSuccessMessage()}

      {/* عرض الأخطاء في الأعلى */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="mr-auto text-rose-400/60 hover:text-rose-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* التبويبات الفرعية */}
      <div className={`flex p-1 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-700/50' : 'bg-slate-200/60 border-slate-300'}`}>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-1 justify-center ${
            activeSubTab === 'profile' ? 'bg-blue-600 text-white shadow' : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" /> الملف الشخصي
        </button>
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-1 justify-center ${
            activeSubTab === 'schedule' ? 'bg-blue-600 text-white shadow' : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> برنامج الحصص
        </button>
        <button
          onClick={() => setActiveSubTab('curriculum')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-1 justify-center ${
            activeSubTab === 'curriculum' ? 'bg-blue-600 text-white shadow' : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> الخطة الدراسية
        </button>
      </div>

      {/* ========== الملف الشخصي ========== */}
      {activeSubTab === 'profile' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-lg flex-shrink-0">
              {teacherInfo?.name?.split(' ').map(n => n[0]).join('') || 'M'}
            </div>
            <div className="flex-1 space-y-2">
              {editingProfile ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={tempProfile?.name || ''}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-white text-sm"
                    placeholder="الاسم الكامل"
                  />
                  <input
                    type="text"
                    value={tempProfile?.title || ''}
                    onChange={(e) => setTempProfile({ ...tempProfile, title: e.target.value })}
                    className="w-full p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-white text-sm"
                    placeholder="اللقب الوظيفي"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={tempProfile?.email || ''}
                      onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                      className="p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-white text-sm"
                      placeholder="البريد الإلكتروني"
                    />
                    <input
                      type="text"
                      value={tempProfile?.phone || ''}
                      onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                      className="p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-white text-sm"
                      placeholder="رقم الهاتف"
                    />
                  </div>
                  <input
                    type="text"
                    value={tempProfile?.office || ''}
                    onChange={(e) => setTempProfile({ ...tempProfile, office: e.target.value })}
                    className="w-full p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-white text-sm"
                    placeholder="المكتب"
                  />
                  <textarea
                    value={tempProfile?.bio || ''}
                    onChange={(e) => setTempProfile({ ...tempProfile, bio: e.target.value })}
                    className="w-full p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-white text-sm"
                    placeholder="السيرة الذاتية"
                    rows={3}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-black">{teacherInfo?.name}</h2>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                      {teacherInfo?.title}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>📧</span> {teacherInfo?.email || 'غير محدد'}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>📱</span> {teacherInfo?.phone || 'غير محدد'}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>📍</span> {teacherInfo?.office || 'غير محدد'}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>📅</span> تم التحديث: {new Date(teacherInfo?.updatedAt).toLocaleDateString('ar')}
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 border-t border-slate-700/50 pt-3 mt-2">
                    {teacherInfo?.bio || 'لا توجد سيرة ذاتية'}
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {!editingProfile ? (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  disabled={saving}
                >
                  <Edit3 className="w-3.5 h-3.5" /> تعديل الملف
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveProfile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    حفظ
                  </button>
                  <button
                    onClick={() => { setTempProfile(teacherInfo); setEditingProfile(false); }}
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" /> إلغاء
                  </button>
                </>
              )}
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
            <div className="text-center p-3 rounded-xl bg-[#0f172a] border border-slate-800">
              <span className="text-2xl font-black text-blue-400 block">{classes.length}</span>
              <span className="text-[10px] text-slate-400">صفوف يدرسها</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-[#0f172a] border border-slate-800">
              <span className="text-2xl font-black text-emerald-400 block">
                {schedule.reduce((acc, day) => acc + day.periods.filter(p => p.subject).length, 0)}
              </span>
              <span className="text-[10px] text-slate-400">حصص أسبوعية</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-[#0f172a] border border-slate-800">
              <span className="text-2xl font-black text-purple-400 block">
                {curriculum.reduce((acc, c) => acc + c.units.length, 0)}
              </span>
              <span className="text-[10px] text-slate-400">وحدات دراسية</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-[#0f172a] border border-slate-800">
              <span className="text-2xl font-black text-amber-400 block">
                {curriculum.reduce((acc, c) => acc + c.units.filter(u => u.status === 'in-progress').length, 0)}
              </span>
              <span className="text-[10px] text-slate-400">وحدات قيد التنفيذ</span>
            </div>
          </div>
        </div>
      )}

      {/* ========== برنامج الحصص ========== */}
      {activeSubTab === 'schedule' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> برنامج الحصص الأسبوعي
              <span className="text-[10px] text-slate-400 font-normal">
                (7 حصص + فسحتان)
              </span>
            </h3>
            <div className="flex gap-2">
              {!editingSchedule ? (
                <button
                  onClick={() => setEditingSchedule(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  disabled={saving}
                >
                  <Edit3 className="w-3.5 h-3.5" /> تعديل الجدول
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveSchedule}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    حفظ
                  </button>
                  <button
                    onClick={() => { setTempSchedule(schedule); setEditingSchedule(false); }}
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" /> إلغاء
                  </button>
                </>
              )}
            </div>
          </div>

          {/* عرض الجدول الزمني */}
          {renderTimelineView()}

          {/* عرض الجدول الأسبوعي */}
          {renderScheduleTable(editingSchedule ? tempSchedule : schedule, editingSchedule)}

          {/* ملخص الجدول */}
          {!editingSchedule && (
            <div className="mt-4 p-3 rounded-xl bg-[#0f172a] border border-slate-800 text-[10px] text-slate-400 flex flex-wrap justify-between items-center gap-2">
              <span>
                📊 إجمالي الحصص: <span className="text-emerald-400 font-bold">
                  {schedule.reduce((acc, day) => acc + day.periods.filter(p => p.subject).length, 0)}
                </span> حصة
              </span>
              <span>
                🟢 الحصص النشطة: <span className="text-blue-400 font-bold">
                  {schedule.reduce((acc, day) => acc + day.periods.filter(p => p.isActive).length, 0)}
                </span>
              </span>
              <span>
                ⏰ بداية اليوم: <span className="text-amber-400 font-bold">8:00 صباحاً</span>
              </span>
              <span className="text-emerald-400">🟢 تم الحفظ في السحابة</span>
            </div>
          )}

          {editingSchedule && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 text-center">
              ⚠️ قم بتعبئة المواد والصفوف لكل حصة، ثم اضغط "حفظ" لتحديث الجدول
            </div>
          )}
        </div>
      )}

      {/* ========== الخطة الدراسية ========== */}
      {activeSubTab === 'curriculum' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" /> الخطة الدراسية السنوية
            </h3>
            <div className="flex gap-2">
              {!editingCurriculum ? (
                <button
                  onClick={() => setEditingCurriculum(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  disabled={saving}
                >
                  <Edit3 className="w-3.5 h-3.5" /> تعديل الخطة
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveCurriculum}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    حفظ
                  </button>
                  <button
                    onClick={() => { setTempCurriculum(curriculum); setEditingCurriculum(false); }}
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" /> إلغاء
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {(editingCurriculum ? tempCurriculum : curriculum).map((classPlan, classIndex) => (
              <div key={classPlan.classId} className={`p-4 rounded-xl border ${darkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                    🏫 {classPlan.className}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {classPlan.units.filter(u => u.status === 'completed').length} / {classPlan.units.length} وحدات منجزة
                  </span>
                </div>

                <div className="space-y-2">
                  {classPlan.units.map((unit, unitIndex) => (
                    <div
                      key={unitIndex}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                        darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-[10px] font-black text-slate-500 w-8">#{unit.unit}</span>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-200 block">{unit.title}</span>
                          <span className="text-[10px] text-slate-400">🕐 {unit.weeks} أسبوع</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {editingCurriculum ? (
                          <select
                            value={unit.status}
                            onChange={(e) => handleUpdateUnitStatus(classIndex, unitIndex, e.target.value)}
                            className="text-[10px] p-1 rounded bg-[#1e293b] border border-slate-700 text-white"
                          >
                            <option value="completed">منجز</option>
                            <option value="in-progress">قيد التنفيذ</option>
                            <option value="pending">قادم</option>
                          </select>
                        ) : (
                          getStatusBadge(unit.status)
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* شريط التقدم */}
                <div className="mt-3">
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(classPlan.units.filter(u => u.status === 'completed').length / classPlan.units.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!editingCurriculum && (
            <div className="mt-4 p-3 rounded-xl bg-[#0f172a] border border-slate-800 text-[10px] text-slate-400 text-center flex justify-between items-center">
              <span>📊 إجمالي الوحدات: {curriculum.reduce((acc, c) => acc + c.units.length, 0)} وحدة</span>
              <span className="text-emerald-400">🟢 تم الحفظ في السحابة</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}