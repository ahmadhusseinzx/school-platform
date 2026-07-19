// src/components/admin/ScheduleManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDocs, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot, writeBatch 
} from 'firebase/firestore';
import { 
  Calendar, Plus, Trash2, Edit3, Save, X, Search, 
  Loader2, Users, School, BookOpen, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Printer, RefreshCw, Clock,
  User, Settings, Sparkles, ArrowLeft, ArrowRight,
  FileText, Download, Filter, Copy, RotateCw, Ban,
  Eye, EyeOff, Maximize2, Minimize2, Grid, List,
  AlertTriangle, Info, Zap, Hash, Settings2, CalendarDays,
  Shuffle, TrendingUp, Award, Bot, Brain, Lightbulb,
  Target, Gauge, Layers, Equal
} from 'lucide-react';
import { AttemptHistory, ScheduleConflicts, ScheduleStats } from './schedule/ScheduleFeedback';
import SmartAssistant from './schedule/SmartAssistant';
import { ClassSchedule, TeacherSchedule } from './schedule/ScheduleTables';
import { DaySettingsModal, SubjectHoursSettings, TeacherPreferencesSettings } from './schedule/ScheduleSettingsPanels';
import { ALL_WEEK_DAYS, DEFAULT_DAY_PERIODS, DEFAULT_PERIOD_LABELS, DEFAULT_SCHOOL_DAYS, SUBJECT_COLORS } from './schedule/scheduleConstants';
import { useScheduleHelpers } from './schedule/useScheduleHelpers';
import { useScheduleGeneration } from './schedule/useScheduleGeneration';
import ScheduleWorkspace from './schedule/ScheduleWorkspace';

export default function ScheduleManager() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // ====== البيانات الأساسية ======
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [existingSchedules, setExistingSchedules] = useState([]);
  
  // ====== إعدادات أيام الدوام ======
  const [schoolDays, setSchoolDays] = useState(DEFAULT_SCHOOL_DAYS);
  const [dayPeriods, setDayPeriods] = useState(DEFAULT_DAY_PERIODS);
  const [periodLabels, setPeriodLabels] = useState(DEFAULT_PERIOD_LABELS);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [showDaySettings, setShowDaySettings] = useState(false);
  
  // ====== إعدادات التوزيع ======
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [enableAdvancedConstraints, setEnableAdvancedConstraints] = useState(true);
  
  // ====== إعدادات المحاولات المحسنة ======
  const [maxAttempts, setMaxAttempts] = useState(100);
  const [attemptCount, setAttemptCount] = useState(0);
  const [bestSchedule, setBestSchedule] = useState(null);
  const [bestConflicts, setBestConflicts] = useState([]);
  const [bestScore, setBestScore] = useState(0);
  const [isMultiAttempt, setIsMultiAttempt] = useState(false);
  const [attemptProgress, setAttemptProgress] = useState(0);
  const [optimizationLevel, setOptimizationLevel] = useState('balanced');
  
  // ====== بيانات التوزيع مع حفظ في localStorage ======
  const [subjectHours, setSubjectHours] = useState(() => {
    const saved = localStorage.getItem('schedule_subjectHours');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  
  const [teacherMaxHours, setTeacherMaxHours] = useState(() => {
    const saved = localStorage.getItem('schedule_teacherMaxHours');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  
  const [teacherPreferences, setTeacherPreferences] = useState(() => {
    const saved = localStorage.getItem('schedule_teacherPreferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  
  const [teacherMaxDailyHours, setTeacherMaxDailyHours] = useState(() => {
    const saved = localStorage.getItem('schedule_teacherMaxDailyHours');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  
  const [teacherPriority, setTeacherPriority] = useState(() => {
    const saved = localStorage.getItem('schedule_teacherPriority');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [viewType, setViewType] = useState('class');
  const [selectedClassView, setSelectedClassView] = useState('');
  const [selectedTeacherView, setSelectedTeacherView] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTeacherConflicts, setShowTeacherConflicts] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [conflictList, setConflictList] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [showAttemptHistory, setShowAttemptHistory] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState(null);

  // ============ حفظ البيانات في localStorage ============
  useEffect(() => {
    localStorage.setItem('schedule_subjectHours', JSON.stringify(subjectHours));
  }, [subjectHours]);

  useEffect(() => {
    localStorage.setItem('schedule_teacherMaxHours', JSON.stringify(teacherMaxHours));
  }, [teacherMaxHours]);

  useEffect(() => {
    localStorage.setItem('schedule_teacherPreferences', JSON.stringify(teacherPreferences));
  }, [teacherPreferences]);

  useEffect(() => {
    localStorage.setItem('schedule_teacherMaxDailyHours', JSON.stringify(teacherMaxDailyHours));
  }, [teacherMaxDailyHours]);

  useEffect(() => {
    localStorage.setItem('schedule_teacherPriority', JSON.stringify(teacherPriority));
  }, [teacherPriority]);

  // ============ جلب إعدادات المدرسة ============
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const q = query(collection(db, 'schoolSettings'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (data.schoolDays) {
            setSchoolDays(data.schoolDays);
          }
          if (data.dayPeriods) {
            setDayPeriods(data.dayPeriods);
          }
          if (data.periodLabels) {
            setPeriodLabels(data.periodLabels);
          }
          console.log('✅ تم جلب إعدادات المدرسة:', data);
        }
      } catch (error) {
        console.error('❌ خطأ في جلب الإعدادات:', error);
      } finally {
        setPeriodsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ============ الحصول على الأيام النشطة ============
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const classList = [];
      snapshot.forEach(doc => {
        classList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classList);
    });

    const unsubTeachers = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'teacher')),
      (snapshot) => {
        const teacherList = [];
        snapshot.forEach(doc => {
          teacherList.push({ id: doc.id, ...doc.data() });
        });
        teacherList.sort((a, b) => {
          return (a.fullName || '').localeCompare(b.fullName || '', 'ar');
        });
        setTeachers(teacherList);
        
        teacherList.forEach(teacher => {
          if (!(teacher.id in teacherMaxHours)) {
            setTeacherMaxHours(prev => ({ ...prev, [teacher.id]: 20 }));
          }
        });
      }
    );

    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      const subjectList = [];
      snapshot.forEach(doc => {
        subjectList.push({ id: doc.id, ...doc.data() });
      });
      setSubjects(subjectList);
      setLoading(false);
    });

    const unsubSchedules = onSnapshot(collection(db, 'schedule'), (snapshot) => {
      const scheduleList = [];
      snapshot.forEach(doc => {
        scheduleList.push({ id: doc.id, ...doc.data() });
      });
      setExistingSchedules(scheduleList);
    });

    return () => {
      unsubClasses();
      unsubTeachers();
      unsubSubjects();
      unsubSchedules();
    };
  }, []);

  // ============ دوال مساعدة ============
  const {
    getActiveDays, getDayPeriodCount, getPeriodsListForDay, getTeacherName, getSubjectName,
    getClassName, getSubjectColor, getSortedClasses, getSortedTeachers,
    getSortedSubjectsByClass, getScheduleStats
  } = useScheduleHelpers({
    classes, teachers, subjects, schoolDays, dayPeriods, periodLabels,
    subjectColors: SUBJECT_COLORS, generatedSchedule
  });

  const { generateMultiAttemptSchedule, generateSingleAttemptSchedule } = useScheduleGeneration({
    classes,
    teachers,
    subjects,
    subjectHours,
    teacherMaxHours,
    teacherPreferences,
    teacherMaxDailyHours,
    teacherPriority,
    maxAttempts,
    optimizationLevel,
    getSubjectColor,
    getDayPeriodCount,
    periodLabels,
    getActiveDays,
    getScheduleStats,
    getSortedClasses,
    getSortedTeachers,
    setMessage,
    setProcessing,
    setAllAttempts,
    setBestSchedule,
    setBestConflicts,
    setBestScore,
    setAttemptCount,
    setAttemptProgress,
    setGeneratedSchedule,
    setConflictList,
    setOptimizationStats
  });
// ============ توليد بذرة عشوائية جديدة ============
  const saveSchedule = async () => {
    const scheduleToSave = generatedSchedule || bestSchedule;
    if (!scheduleToSave) {
      setMessage({ type: 'error', text: '❌ لا يوجد جدول لحفظه' });
      return;
    }

    try {
      setProcessing(true);

      const scheduleData = {
        academicYear: academicYear,
        semester: selectedSemester,
        schedule: scheduleToSave,
        schoolDays: schoolDays,
        dayPeriods: dayPeriods,
        periodLabels: periodLabels,
        teacherMaxHours: teacherMaxHours,
        teacherMaxDailyHours: teacherMaxDailyHours,
        teacherPreferences: teacherPreferences,
        teacherPriority: teacherPriority,
        subjectHours: subjectHours,
        conflicts: conflictList,
        bestScore: bestScore,
        attempts: maxAttempts,
        optimizationLevel: optimizationLevel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'schedule'), scheduleData);
      setMessage({ type: 'success', text: '✅ تم حفظ الجدول بنجاح!' });

    } catch (error) {
      setMessage({ type: 'error', text: '❌ خطأ في حفظ الجدول: ' + error.message });
    } finally {
      setProcessing(false);
    }
  };

  // ============ عرض التعارضات ============
  if (loading || periodsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* المساعد الذكي */}
      {showAssistant && (
        <SmartAssistant
          classes={classes}
          teachers={teachers}
          subjects={subjects}
          subjectHours={subjectHours}
          teacherMaxHours={teacherMaxHours}
          teacherMaxDailyHours={teacherMaxDailyHours}
          teacherPreferences={teacherPreferences}
          teacherPriority={teacherPriority}
          schoolDays={schoolDays}
          dayPeriods={dayPeriods}
          onClose={() => setShowAssistant(false)}
          onApplySuggestion={(suggestion) => {
            setShowAssistant(false);
            setMessage({
              type: 'info',
              text: `✅ تم تطبيق التوصية: ${suggestion.title}`
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
          }}
          generatedSchedule={generatedSchedule || bestSchedule}
        />
      )}

      {/* نافذة إعدادات الأيام */}
      <DaySettingsModal
        showDaySettings={showDaySettings}
        setShowDaySettings={setShowDaySettings}
        allWeekDays={ALL_WEEK_DAYS}
        schoolDays={schoolDays}
        setSchoolDays={setSchoolDays}
        dayPeriods={dayPeriods}
        setDayPeriods={setDayPeriods}
        periodLabels={periodLabels}
        defaultSchoolDays={DEFAULT_SCHOOL_DAYS}
        defaultDayPeriods={DEFAULT_DAY_PERIODS}
        setMessage={setMessage}
      />

      {/* العنوان */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            الجدول الأسبوعي الذكي المحسن
            <span className="text-[10px] font-normal bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
              v5.0 (100% Optimized)
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            توزيع الحصص مع خوارزمية محسنة للوصول إلى نسبة 100% وتوازن مثالي
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 bg-slate-700 rounded-lg">
            🏫 {classes.length} صف
          </span>
          <span className="px-3 py-1 bg-slate-700 rounded-lg">
            👨‍🏫 {teachers.length} معلم
          </span>
          <span className="px-3 py-1 bg-slate-700 rounded-lg">
            📚 {subjects.length} مادة
          </span>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg">
            📅 {getActiveDays().length} أيام
          </span>
          {bestScore >= 100 && (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-1">
              🎉 100%
            </span>
          )}
        </div>
      </div>

      {/* عرض الرسائل */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : message.type === 'warning'
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            : message.type === 'info'
            ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : 
           message.type === 'info' ? <Info className="w-5 h-5 flex-shrink-0" /> :
           <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
          {message.type !== 'error' && (
            <button onClick={() => setMessage({ type: '', text: '' })} className="mr-auto">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* المحتوى */}
      <ScheduleWorkspace
        model={{
          getActiveDays, getDayPeriodCount, getSortedClasses, getSortedTeachers,
          getSortedSubjectsByClass, getClassName, getSubjectColor, getScheduleStats,
          generatedSchedule, bestSchedule, selectedSemester, setSelectedSemester,
          academicYear, setAcademicYear, optimizationLevel, setOptimizationLevel,
          maxAttempts, setMaxAttempts, generateSingleAttemptSchedule, generateMultiAttemptSchedule,
          processing, attemptCount, attemptProgress, setShowAssistant, setShowDaySettings,
          enableAdvancedConstraints, setEnableAdvancedConstraints,
          teacherPriority, setTeacherPriority, teacherPreferences, setTeacherPreferences,
          teacherMaxDailyHours, setTeacherMaxDailyHours, teacherMaxHours, setTeacherMaxHours,
          subjectHours, setSubjectHours, saveSchedule, setGeneratedSchedule, setBestSchedule,
          setConflictList, setBestConflicts, setAllAttempts, setOptimizationStats,
          bestScore, conflictList, bestConflicts, allAttempts, showAttemptHistory,
          setShowAttemptHistory, isFullscreen, setIsFullscreen, showStats, setShowStats,
          viewType, setViewType, selectedClassView, setSelectedClassView,
          selectedTeacherView, setSelectedTeacherView, showTeacherConflicts,
          setShowTeacherConflicts, classes, teachers, optimizationStats
        }}
      />
    </div>
  );
}