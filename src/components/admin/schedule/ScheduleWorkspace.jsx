import React from 'react';
import {
  AlertTriangle, Award, Brain, Calendar, CalendarDays, Info, Maximize2,
  Minimize2, Printer, Save, School, Settings, Settings2, Shuffle, User, X, Zap
} from 'lucide-react';
import { AttemptHistory, ScheduleConflicts, ScheduleStats } from './ScheduleFeedback';
import { ClassSchedule, TeacherSchedule } from './ScheduleTables';
import { SubjectHoursSettings, TeacherPreferencesSettings } from './ScheduleSettingsPanels';

export default function ScheduleWorkspace({ model }) {
  const {
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
  } = model;

  const activeDays = getActiveDays();
  const currentSchedule = generatedSchedule || bestSchedule;
return (
      <div className="space-y-6">
        {/* عرض أيام الدوام وعدد الحصص */}
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
              أيام الدوام
              <span className="text-[9px] text-slate-500 font-normal">
                ({activeDays.length} أيام)
              </span>
            </h4>
            <button
              onClick={() => setShowDaySettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              <Settings2 className="w-3.5 h-3.5" />
              تعديل الأيام
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {activeDays.map(day => (
              <div key={day.id} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-xs text-white">{day.label}</span>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                  {getDayPeriodCount(day.id)} ح
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* إعدادات التوزيع المحسنة */}
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            إعدادات التوزيع المحسنة
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">الفصل الدراسي</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={1}>الفصل الأول</option>
                <option value={2}>الفصل الثاني</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">العام الدراسي</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="2024/2025"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">مستوى التحسين</label>
              <select
                value={optimizationLevel}
                onChange={(e) => setOptimizationLevel(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="fast">⏱️ سريع (حتى 50 محاولة)</option>
                <option value="balanced">⚖️ متوازن (حتى 100 محاولة)</option>
                <option value="thorough">🔍 شامل (حتى 200 محاولة)</option>
              </select>
            </div>
          </div>

          {/* إعدادات المحاولات المحسنة */}
          <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">عدد المحاولات:</label>
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="p-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={generateSingleAttemptSchedule}
                  disabled={processing}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  محاولة واحدة
                </button>
                <button
                  onClick={generateMultiAttemptSchedule}
                  disabled={processing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  {processing ? `جاري... ${attemptCount}/${maxAttempts}` : `${maxAttempts} محاولة`}
                </button>
                <button
                  onClick={() => setShowAssistant(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Brain className="w-3.5 h-3.5" />
                  المساعد الذكي
                </button>
              </div>
              {processing && (
                <div className="flex-1 min-w-[100px]">
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${attemptProgress}%` }}
                    />
                  </div>
                  <div className="text-[8px] text-slate-500 mt-0.5 text-right">
                    {attemptProgress.toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-[8px] text-slate-500 flex items-center gap-2">
              <Info className="w-3 h-3" />
              كل محاولة تستخدم ترتيباً عشوائياً مختلفاً مع تحسين مستمر للوصول إلى 100%
            </div>
          </div>

          {/* تفضيلات المعلمين */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                👨‍🏫 إعدادات المعلمين
                <span className="text-[9px] text-slate-500 font-normal">(مرتب أبجدياً)</span>
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-400">القيود المتقدمة</label>
                <button
                  onClick={() => setEnableAdvancedConstraints(!enableAdvancedConstraints)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    enableAdvancedConstraints 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {enableAdvancedConstraints ? 'مفعل' : 'معطل'}
                </button>
              </div>
            </div>
            
            <TeacherPreferencesSettings
              getActiveDays={getActiveDays}
              getSortedTeachers={getSortedTeachers}
              teacherPriority={teacherPriority}
              setTeacherPriority={setTeacherPriority}
              teacherPreferences={teacherPreferences}
              setTeacherPreferences={setTeacherPreferences}
              teacherMaxDailyHours={teacherMaxDailyHours}
              setTeacherMaxDailyHours={setTeacherMaxDailyHours}
              teacherMaxHours={teacherMaxHours}
              setTeacherMaxHours={setTeacherMaxHours}
            />
            
            <div className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <p className="text-[9px] text-blue-400 flex items-center gap-2">
                <Info className="w-3 h-3" />
                📌 الأولوية: 1=عالية (يتم توزيع حصصه أولاً)، 2=متوسطة، 3=منخفضة (يتم توزيع حصصه أخيراً)
              </p>
            </div>
          </div>

          {/* عدد حصص المواد */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
              📚 عدد حصص كل مادة في الأسبوع
              <span className="text-[9px] text-slate-500 font-normal">(مرتب حسب الصف)</span>
              <span className="text-[9px] text-emerald-400 font-normal">💾 يُحفظ تلقائياً</span>
            </h4>
            <SubjectHoursSettings
              getSortedSubjectsByClass={getSortedSubjectsByClass}
              getClassName={getClassName}
              getSubjectColor={getSubjectColor}
              subjectHours={subjectHours}
              setSubjectHours={setSubjectHours}
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {currentSchedule && (
              <>
                <button
                  onClick={saveSchedule}
                  disabled={processing}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من إلغاء الجدول الحالي؟')) {
                      setGeneratedSchedule(null);
                      setBestSchedule(null);
                      setConflictList([]);
                      setBestConflicts([]);
                      setAllAttempts([]);
                      setOptimizationStats(null);
                    }
                  }}
                  className="py-2.5 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all"
                >
                  <X className="w-4 h-4 inline" />
                  إلغاء
                </button>
                {bestScore > 0 && (
                  <span className={`py-2.5 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    bestScore >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Award className="w-4 h-4" />
                    أفضل نسبة: {bestScore.toFixed(1)}%
                    {bestScore >= 100 && ' 🎉 مثالي!'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* عرض التعارضات */}
        {currentSchedule && (
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              التعارضات والملاحظات
              {allAttempts.length > 0 && (
                <button
                  onClick={() => setShowAttemptHistory(!showAttemptHistory)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showAttemptHistory ? 'إخفاء السجل' : 'عرض سجل المحاولات'}
                </button>
              )}
            </h4>
            <ScheduleConflicts conflicts={conflictList || bestConflicts || []} />
            {showAttemptHistory && (
              <AttemptHistory attempts={allAttempts} bestScore={bestScore} />
            )}
          </div>
        )}

        {/* عرض الجدول المُنشأ */}
        {currentSchedule && (
          <div className={`p-4 bg-slate-900 rounded-xl border border-slate-800 transition-all ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-slate-900' : ''}`}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                الجدول المُنشأ
                <span className="text-[10px] font-normal text-slate-500">
                  ({Object.keys(currentSchedule).length} صفوف)
                  {bestScore > 0 && ` - نسبة الإشغال: ${bestScore.toFixed(1)}%`}
                  {bestScore >= 100 && ' 🎉 مثالي!'}
                </span>
              </h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    showStats 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Info className="w-3 h-3 inline ml-1" />
                  إحصائيات
                </button>
                <button
                  onClick={() => setViewType('class')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewType === 'class' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <School className="w-3 h-3 inline ml-1" />
                  حسب الصف
                </button>
                <button
                  onClick={() => setViewType('teacher')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewType === 'teacher' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3 inline ml-1" />
                  حسب المعلم
                </button>
                <button
                  onClick={() => setShowTeacherConflicts(!showTeacherConflicts)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    showTeacherConflicts 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 inline ml-1" />
                  التعارضات
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all"
                >
                  {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" />
                  طباعة
                </button>
              </div>
            </div>

            {/* الإحصائيات */}
            {showStats && (
              <ScheduleStats
                stats={optimizationStats || getScheduleStats(generatedSchedule || bestSchedule)}
              />
            )}

            {/* فلتر العرض */}
            {viewType === 'class' ? (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    key="all-classes"
                    onClick={() => setSelectedClassView('')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !selectedClassView 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    جميع الصفوف
                  </button>
                  {getSortedClasses().map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClassView(cls.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedClassView === cls.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>
                {selectedClassView ? (
                  <ClassSchedule
                    classId={selectedClassView}
                    schedule={currentSchedule}
                    getClassName={getClassName}
                    getActiveDays={getActiveDays}
                    getDayPeriodCount={getDayPeriodCount}
                    getSortedClasses={getSortedClasses}
                  />
                ) : (
                  getSortedClasses().map(cls => (
                    <ClassSchedule
                      key={cls.id}
                      classId={cls.id}
                      schedule={currentSchedule}
                      getClassName={getClassName}
                      getActiveDays={getActiveDays}
                      getDayPeriodCount={getDayPeriodCount}
                      getSortedClasses={getSortedClasses}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    key="all-teachers"
                    onClick={() => setSelectedTeacherView('')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !selectedTeacherView 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    جميع المعلمين
                  </button>
                  {getSortedTeachers().map(teacher => (
                    <button
                      key={teacher.id}
                      onClick={() => setSelectedTeacherView(teacher.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedTeacherView === teacher.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {teacher.fullName}
                    </button>
                  ))}
                </div>
                {selectedTeacherView ? (
                  <TeacherSchedule
                    teacherId={selectedTeacherView}
                    schedule={currentSchedule}
                    teachers={teachers}
                    teacherMaxHours={teacherMaxHours}
                    teacherMaxDailyHours={teacherMaxDailyHours}
                    showTeacherConflicts={showTeacherConflicts}
                    getActiveDays={getActiveDays}
                    getDayPeriodCount={getDayPeriodCount}
                    getSortedClasses={getSortedClasses}
                  />
                ) : (
                  getSortedTeachers().map(teacher => (
                    <TeacherSchedule
                      key={teacher.id}
                      teacherId={teacher.id}
                      schedule={currentSchedule}
                      teachers={teachers}
                      teacherMaxHours={teacherMaxHours}
                      teacherMaxDailyHours={teacherMaxDailyHours}
                      showTeacherConflicts={showTeacherConflicts}
                      getActiveDays={getActiveDays}
                      getDayPeriodCount={getDayPeriodCount}
                      getSortedClasses={getSortedClasses}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
}