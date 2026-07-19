import React, { useEffect, useState } from 'react';
import {
  AlertCircle, AlertTriangle, Bot, ChevronDown, ChevronUp, Info,
  Lightbulb, Loader2, RefreshCw, Target, Users , X
} from 'lucide-react';
export default function SmartAssistant({ 
  classes, teachers, subjects, subjectHours, 
  teacherMaxHours, teacherMaxDailyHours, teacherPreferences,
  teacherPriority, schoolDays, dayPeriods,
  onApplySuggestion, onClose,
  generatedSchedule 
}) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    teachers: true,
    subjects: true,
    schedule: true,
    recommendations: true,
    optimization: true
  });

  // تحليل البيانات
  useEffect(() => {
    const analyzeData = () => {
      const result = {
        overview: {},
        teachers: [],
        subjects: [],
        schedule: {},
        recommendations: [],
        conflicts: [],
        warnings: [],
        tips: [],
        optimization: {
          potential: 0,
          suggestions: []
        }
      };

      const activeDays = schoolDays.filter(d => d.active);
      const totalPeriodsPerDay = activeDays.reduce((sum, day) => sum + (dayPeriods[day.id] || 0), 0);
      const totalPeriodsPerWeek = totalPeriodsPerDay * 7;

      result.overview = {
        totalClasses: classes.length,
        totalTeachers: teachers.length,
        totalSubjects: subjects.length,
        activeDays: activeDays.length,
        totalPeriodsPerWeek: totalPeriodsPerWeek,
        totalSubjectsWithoutTeacher: subjects.filter(s => !s.teacherId).length,
        totalSubjectsWithoutClass: subjects.filter(s => !s.classId).length
      };

      // تحليل المعلمين
      const teacherAnalysis = teachers.map(teacher => {
        const teacherSubjects = subjects.filter(s => s.teacherId === teacher.id);
        const totalHoursNeeded = teacherSubjects.reduce((sum, s) => sum + (subjectHours[s.id] || 2), 0);
        const maxHours = teacherMaxHours[teacher.id] || 20;
        const maxDaily = teacherMaxDailyHours[teacher.id];
        const preferredDays = teacherPreferences[teacher.id]?.preferredDays || [];
        const priority = teacherPriority[teacher.id] || 2;

        const isOverloaded = totalHoursNeeded > maxHours;
        const isUnderloaded = totalHoursNeeded < maxHours * 0.5 && teacherSubjects.length > 0;
        const hasPreferredDays = preferredDays.length > 0;
        const needsMoreDays = preferredDays.length < 3 && totalHoursNeeded > 10;
        const utilization = maxHours > 0 ? (totalHoursNeeded / maxHours * 100) : 0;

        return {
          id: teacher.id,
          name: teacher.fullName,
          subjects: teacherSubjects.map(s => s.name),
          totalHoursNeeded,
          maxHours,
          maxDaily,
          preferredDays,
          priority,
          isOverloaded,
          isUnderloaded,
          hasPreferredDays,
          needsMoreDays,
          subjectsCount: teacherSubjects.length,
          utilization,
          gap: maxHours - totalHoursNeeded,
          canTakeMore: utilization < 85 && totalHoursNeeded > 0
        };
      });

      result.teachers = teacherAnalysis;

      // تحليل المواد
      const subjectAnalysis = subjects.map(subject => {
        const hours = subjectHours[subject.id] || 2;
        const teacher = teachers.find(t => t.id === subject.teacherId);
        const className = classes.find(c => c.id === subject.classId)?.name || 'غير محدد';

        return {
          id: subject.id,
          name: subject.name,
          className,
          hours,
          teacherName: teacher?.fullName || 'غير معين',
          hasTeacher: !!subject.teacherId,
          hasClass: !!subject.classId,
          teacherId: subject.teacherId,
          classId: subject.classId
        };
      });

      result.subjects = subjectAnalysis;

      // اكتشاف المشاكل والتوصيات
      const recommendations = [];
      const conflicts = [];
      const warnings = [];
      const tips = [];
      const optimizationSuggestions = [];

      // 1. معلمين بدون مواد
      const teachersWithoutSubjects = teacherAnalysis.filter(t => t.subjectsCount === 0);
      if (teachersWithoutSubjects.length > 0) {
        warnings.push({
          type: 'no_subjects',
          message: `${teachersWithoutSubjects.length} معلمين ليس لديهم مواد`,
          details: teachersWithoutSubjects.map(t => t.name).join('، ')
        });
        recommendations.push({
          type: 'assign_subjects',
          title: 'توزيع مواد على المعلمين',
          description: `المعلمين التاليين ليس لديهم مواد: ${teachersWithoutSubjects.map(t => t.name).join('، ')}`,
          action: 'توزيع مواد جديدة عليهم',
          priority: 'high'
        });
      }

      // 2. مواد بدون معلمين
      const subjectsWithoutTeacher = subjectAnalysis.filter(s => !s.hasTeacher);
      if (subjectsWithoutTeacher.length > 0) {
        conflicts.push({
          type: 'no_teacher',
          message: `${subjectsWithoutTeacher.length} مواد بدون معلم`,
          details: subjectsWithoutTeacher.map(s => `${s.name} (${s.className})`).join('، ')
        });
        recommendations.push({
          type: 'assign_teachers',
          title: 'تعيين معلمين للمواد',
          description: `المواد التالية بدون معلم: ${subjectsWithoutTeacher.map(s => s.name).join('، ')}`,
          action: 'تعيين معلم لكل مادة',
          priority: 'critical'
        });
      }

      // 3. مواد بدون صف
      const subjectsWithoutClass = subjectAnalysis.filter(s => !s.hasClass);
      if (subjectsWithoutClass.length > 0) {
        conflicts.push({
          type: 'no_class',
          message: `${subjectsWithoutClass.length} مواد بدون صف`,
          details: subjectsWithoutClass.map(s => s.name).join('، ')
        });
        recommendations.push({
          type: 'assign_classes',
          title: 'تعيين صفوف للمواد',
          description: `المواد التالية بدون صف: ${subjectsWithoutClass.map(s => s.name).join('، ')}`,
          action: 'تعيين صف لكل مادة',
          priority: 'critical'
        });
      }

      // 4. معلمين مثقلين
      const overloadedTeachers = teacherAnalysis.filter(t => t.isOverloaded);
      if (overloadedTeachers.length > 0) {
        conflicts.push({
          type: 'overloaded_teachers',
          message: `${overloadedTeachers.length} معلمين مثقلين`,
          details: overloadedTeachers.map(t => `${t.name} (${t.totalHoursNeeded}/${t.maxHours})`).join('، ')
        });
        recommendations.push({
          type: 'reduce_hours',
          title: 'تخفيف عبء المعلمين',
          description: `المعلمين التاليين لديهم حصص أكثر من الحد الأقصى: ${overloadedTeachers.map(t => t.name).join('، ')}`,
          action: 'زيادة الحد الأقصى أو تقليل الحصص',
          priority: 'high'
        });
      }

      // 5. معلمين غير مستغلين بشكل كافٍ
      const underloadedTeachers = teacherAnalysis.filter(t => t.canTakeMore && t.subjectsCount > 0);
      if (underloadedTeachers.length > 0) {
        tips.push({
          type: 'underloaded',
          message: `${underloadedTeachers.length} معلمين لديهم ساعات متاحة`,
          details: underloadedTeachers.map(t => `${t.name} (${t.totalHoursNeeded}/${t.maxHours})`).join('، ')
        });
        recommendations.push({
          type: 'increase_hours',
          title: 'زيادة حصص المعلمين',
          description: `المعلمين التاليين لديهم ساعات متاحة: ${underloadedTeachers.map(t => t.name).join('، ')}`,
          action: 'توزيع مواد إضافية عليهم',
          priority: 'medium'
        });
        optimizationSuggestions.push({
          type: 'utilize_teachers',
          title: 'استغلال المعلمين بشكل أفضل',
          description: `يمكن زيادة استخدام ${underloadedTeachers.length} معلم`,
          action: 'توزيع المواد بالتساوي'
        });
      }

      // 6. توزيع المواد بين الصفوف
      const classSubjectCount = {};
      subjects.forEach(s => {
        const className = classes.find(c => c.id === s.classId)?.name || 'غير محدد';
        if (!classSubjectCount[className]) classSubjectCount[className] = 0;
        classSubjectCount[className]++;
      });

      const avgSubjects = Object.values(classSubjectCount).reduce((a, b) => a + b, 0) / Object.keys(classSubjectCount).length || 0;
      
      Object.keys(classSubjectCount).forEach(className => {
        const count = classSubjectCount[className];
        if (count > avgSubjects * 1.5) {
          warnings.push({
            type: 'uneven_distribution',
            message: `الصف ${className} لديه ${count} مادة (متوسط ${avgSubjects.toFixed(1)})`,
            details: `عدد المواد في هذا الصف أعلى من المتوسط`
          });
          recommendations.push({
            type: 'balance_classes',
            title: `توازن مواد الصف ${className}`,
            description: `الصف ${className} لديه ${count} مادة، والمتوسط ${avgSubjects.toFixed(1)}`,
            action: 'إعادة توزيع المواد بين الصفوف',
            priority: 'medium'
          });
        }
      });

      // 7. تحليل السعات اليومية
      if (generatedSchedule) {
        activeDays.forEach(day => {
          let totalSlots = 0;
          let usedSlots = 0;
          classes.forEach(cls => {
            const daySchedule = generatedSchedule[cls.id]?.[day.id] || [];
            const periods = dayPeriods[day.id] || 0;
            totalSlots += periods;
            usedSlots += daySchedule.length;
          });
          const utilization = totalSlots > 0 ? (usedSlots / totalSlots * 100) : 0;
          
          if (utilization < 50 && classes.length > 0) {
            warnings.push({
              type: 'low_utilization',
              message: `يوم ${day.label} لديه استخدام منخفض (${utilization.toFixed(0)}%)`,
              details: `تم استخدام ${usedSlots} من ${totalSlots} حصة`
            });
          }
        });
      }

      // 8. توصيات التحسين
      const totalTeacherCapacity = teacherAnalysis.reduce((sum, t) => sum + t.maxHours, 0);
      const totalHoursNeeded = subjectAnalysis.reduce((sum, s) => sum + s.hours, 0);
      const optimizationPotential = totalTeacherCapacity > 0 ? (totalHoursNeeded / totalTeacherCapacity * 100) : 0;

      result.optimization = {
        potential: Math.min(optimizationPotential, 100),
        suggestions: optimizationSuggestions,
        totalCapacity: totalTeacherCapacity,
        totalNeeded: totalHoursNeeded
      };

      // ترتيب التوصيات حسب الأولوية
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      result.recommendations = recommendations;
      result.conflicts = conflicts;
      result.warnings = warnings;
      result.tips = tips;

      setAnalysis(result);
      setLoading(false);
    };

    analyzeData();
  }, [classes, teachers, subjects, subjectHours, teacherMaxHours, 
      teacherMaxDailyHours, teacherPreferences, teacherPriority, 
      schoolDays, dayPeriods, generatedSchedule]);

  // تطبيق التوصية
  const applyRecommendation = (recommendation) => {
    setSelectedSuggestion(recommendation);
    
    if (onApplySuggestion) {
      onApplySuggestion(recommendation);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-3">جاري تحليل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full mx-4 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* الرأس */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                المساعد الذكي المحسن
                <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">AI Pro</span>
              </h3>
              <p className="text-xs text-slate-400">تحليل ذكي متقدم وتوصيات دقيقة للوصول إلى 100%</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ملخص سريع */}
        {analysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <div className="text-[8px] text-slate-400">الصفوف</div>
              <div className="text-lg font-bold text-white">{analysis.overview.totalClasses}</div>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <div className="text-[8px] text-slate-400">المعلمين</div>
              <div className="text-lg font-bold text-white">{analysis.overview.totalTeachers}</div>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <div className="text-[8px] text-slate-400">المواد</div>
              <div className="text-lg font-bold text-white">{analysis.overview.totalSubjects}</div>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <div className="text-[8px] text-slate-400">أيام الدوام</div>
              <div className="text-lg font-bold text-white">{analysis.overview.activeDays}</div>
            </div>
          </div>
        )}

        {/* مؤشر التحسين */}
        {analysis && (
          <div className="mb-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                إمكانية التحسين
              </span>
              <span className={`text-sm font-bold ${
                analysis.optimization.potential >= 90 ? 'text-emerald-400' :
                analysis.optimization.potential >= 70 ? 'text-blue-400' :
                'text-amber-400'
              }`}>
                {analysis.optimization.potential.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  analysis.optimization.potential >= 90 ? 'bg-emerald-500' :
                  analysis.optimization.potential >= 70 ? 'bg-blue-500' :
                  'bg-amber-500'
                }`}
                style={{ width: `${analysis.optimization.potential}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[8px] text-slate-500">
              <span>السعة: {analysis.optimization.totalCapacity} حصة</span>
              <span>المطلوب: {analysis.optimization.totalNeeded} حصة</span>
            </div>
          </div>
        )}

        {/* المشاكل الحرجة */}
        {analysis && analysis.conflicts.length > 0 && (
          <div className="mb-4 p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
            <div className="flex items-center gap-2 text-rose-400 text-sm mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-bold">مشاكل حرجة ({analysis.conflicts.length})</span>
            </div>
            <div className="space-y-1">
              {analysis.conflicts.map((conflict, index) => (
                <div key={index} className="text-xs text-rose-300/80 flex items-start gap-2">
                  <span className="text-rose-500">•</span>
                  <span>
                    <strong>{conflict.message}</strong>
                    {conflict.details && <span className="text-rose-400/60">: {conflict.details}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* التحذيرات */}
        {analysis && analysis.warnings.length > 0 && (
          <div className="mb-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-bold">تحذيرات ({analysis.warnings.length})</span>
            </div>
            <div className="space-y-1">
              {analysis.warnings.map((warning, index) => (
                <div key={index} className="text-xs text-amber-300/80 flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>
                    <strong>{warning.message}</strong>
                    {warning.details && <span className="text-amber-400/60">: {warning.details}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* التوصيات */}
        {analysis && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
              <Lightbulb className="w-4 h-4" />
              <span className="font-bold">توصيات ذكية ({analysis.recommendations.length})</span>
            </div>
            <div className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                          rec.priority === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                          rec.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          rec.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {rec.priority === 'critical' ? '⚠️ حرج' :
                           rec.priority === 'high' ? '🔴 عالي' :
                           rec.priority === 'medium' ? '🟡 متوسط' :
                           '🟢 منخفض'}
                        </span>
                        <h5 className="text-xs font-bold text-white">{rec.title}</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{rec.description}</p>
                      <p className="text-[9px] text-blue-400 mt-1">💡 {rec.action}</p>
                    </div>
                    <button
                      onClick={() => applyRecommendation(rec)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all flex-shrink-0"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* نصائح */}
        {analysis && analysis.tips.length > 0 && (
          <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
              <Info className="w-4 h-4" />
              <span className="font-bold">نصائح مفيدة</span>
            </div>
            <div className="space-y-1">
              {analysis.tips.map((tip, index) => (
                <div key={index} className="text-xs text-blue-300/80 flex items-start gap-2">
                  <span className="text-blue-500">✦</span>
                  <span>
                    <strong>{tip.message}</strong>
                    {tip.details && <span className="text-blue-400/60">: {tip.details}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* تحليل المعلمين */}
        {analysis && (
          <div className="mb-4">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, teachers: !prev.teachers }))}
              className="flex items-center justify-between w-full p-2 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
            >
              <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                تحليل المعلمين ({analysis.teachers.length})
              </span>
              <span>{expandedSections.teachers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
            </button>
            {expandedSections.teachers && (
              <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                {analysis.teachers.sort((a, b) => a.name.localeCompare(b.name, 'ar')).map((teacher, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-white truncate">{teacher.name}</span>
                      <span className="text-[8px] text-slate-500 mr-2">
                        {teacher.subjectsCount} مواد - {teacher.totalHoursNeeded} حصة
                      </span>
                      {teacher.gap > 0 && (
                        <span className="text-[8px] text-emerald-400 mr-1">
                          (متاح: {teacher.gap})
                        </span>
                      )}
                      {teacher.isOverloaded && (
                        <span className="text-[8px] text-rose-400 mr-1">⚠️ مثقل</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            teacher.utilization > 90 ? 'bg-rose-500' :
                            teacher.utilization > 75 ? 'bg-amber-500' :
                            teacher.utilization > 50 ? 'bg-emerald-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(teacher.utilization, 100)}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-400 min-w-[30px]">
                        {teacher.utilization.toFixed(0)}%
                      </span>
                      {teacher.isOverloaded && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* زر الإغلاق */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all"
          >
            إغلاق المساعد
          </button>
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
              }, 500);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث التحليل
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ المكون الرئيسي المحسن ============