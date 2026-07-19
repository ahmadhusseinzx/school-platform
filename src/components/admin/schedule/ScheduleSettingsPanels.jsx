import React from 'react';
import { addDoc, collection, doc, getDocs, query, updateDoc } from 'firebase/firestore';
import { CalendarDays, CheckCircle, RefreshCw, Save, X } from 'lucide-react';
import { db } from '../../../services/firebase';
export function SubjectHoursSettings({ getSortedSubjectsByClass, getClassName, getSubjectColor, subjectHours, setSubjectHours }) {
    const sortedSubjects = getSortedSubjectsByClass();
    
    const groupedByClass = {};
    sortedSubjects.forEach(subject => {
      const className = getClassName(subject.classId);
      if (!groupedByClass[className]) {
        groupedByClass[className] = [];
      }
      groupedByClass[className].push(subject);
    });

    return (
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {Object.keys(groupedByClass).sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.match(/\d+/)?.[0] || 0);
          if (numA !== numB) return numA - numB;
          return a.localeCompare(b, 'ar');
        }).map(className => (
          <div key={className} className="border-b border-slate-700 pb-2 last:border-0">
            <div className="text-xs font-bold text-blue-400 mb-2">🏫 {className}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {groupedByClass[className].map(subject => (
                <div key={subject.id} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getSubjectColor(subject.id) }}
                  />
                  <span className="text-xs text-white flex-1 truncate" title={subject.name}>
                    {subject.name}
                  </span>
                  <input
                    type="number"
                    value={subjectHours[subject.id] || 2}
                    onChange={(e) => setSubjectHours(prev => ({ 
                      ...prev, 
                      [subject.id]: Number(e.target.value) 
                    }))}
                    className="w-12 p-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center flex-shrink-0"
                    min="0"
                    max="10"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============ عرض تفضيلات المعلمين ============
export function TeacherPreferencesSettings({ getActiveDays, getSortedTeachers, teacherPriority, setTeacherPriority, teacherPreferences, setTeacherPreferences, teacherMaxDailyHours, setTeacherMaxDailyHours, teacherMaxHours, setTeacherMaxHours }) {
    const activeDays = getActiveDays();
    const sortedTeachers = getSortedTeachers();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
        {sortedTeachers.map(teacher => (
          <div key={teacher.id} className="flex flex-col gap-1 p-3 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-bold truncate">{teacher.fullName}</span>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-slate-400">أولوية:</span>
                <select
                  value={teacherPriority[teacher.id] || 1}
                  onChange={(e) => setTeacherPriority(prev => ({
                    ...prev,
                    [teacher.id]: Number(e.target.value)
                  }))}
                  className="w-14 p-0.5 bg-slate-700 border border-slate-600 rounded text-white text-[10px]"
                >
                  <option value={1}>1 (عالية)</option>
                  <option value={2}>2 (متوسطة)</option>
                  <option value={3}>3 (منخفضة)</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-1 flex-wrap">
              {activeDays.map(day => (
                <button
                  key={day.id}
                  onClick={() => {
                    const prefs = teacherPreferences[teacher.id]?.preferredDays || [];
                    const newPrefs = prefs.includes(day.id) 
                      ? prefs.filter(d => d !== day.id)
                      : [...prefs, day.id];
                    setTeacherPreferences(prev => ({
                      ...prev,
                      [teacher.id]: { preferredDays: newPrefs }
                    }));
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                    teacherPreferences[teacher.id]?.preferredDays?.includes(day.id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                  }`}
                >
                  {day.short}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-slate-400">حد يومي:</span>
                <input
                  type="number"
                  value={teacherMaxDailyHours[teacher.id] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTeacherMaxDailyHours(prev => ({
                      ...prev,
                      [teacher.id]: value === '' ? undefined : Number(value)
                    }));
                  }}
                  className="w-12 p-0.5 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center"
                  min="1"
                  max="10"
                  placeholder="∞"
                />
                <span className="text-[8px] text-slate-500">(فارغ = غير محدود)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-slate-400">نصاب:</span>
                <input
                  type="number"
                  value={teacherMaxHours[teacher.id] || 20}
                  onChange={(e) => setTeacherMaxHours(prev => ({ 
                    ...prev, 
                    [teacher.id]: Number(e.target.value) 
                  }))}
                  className="w-14 p-0.5 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center"
                  min="1"
                  max="40"
                />
                <span className="text-[8px] text-slate-500">ح/أسبوع</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============ عرض إعدادات الأيام ============
export function DaySettingsModal({ showDaySettings, setShowDaySettings, allWeekDays, schoolDays, setSchoolDays, dayPeriods, setDayPeriods, periodLabels, defaultSchoolDays, defaultDayPeriods, setMessage }) {
    if (!showDaySettings) return null;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full mx-4 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-400" />
              إعدادات أيام الدوام
            </h3>
            <button
              onClick={() => setShowDaySettings(false)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              حدد أيام الدوام في الأسبوع وعدد الحصص لكل يوم
            </p>

            {allWeekDays.map(day => {
              const isActive = schoolDays.find(d => d.id === day.id)?.active || false;
              const periodCount = dayPeriods[day.id] || 7;

              return (
                <div key={day.id} className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => {
                        setSchoolDays(prev => 
                          prev.map(d => 
                            d.id === day.id ? { ...d, active: !d.active } : d
                          )
                        );
                        if (!isActive) {
                          setSchoolDays(prev => {
                            const exists = prev.find(d => d.id === day.id);
                            if (!exists) {
                              return [...prev, { id: day.id, label: day.label, short: day.short, active: true }];
                            }
                            return prev;
                          });
                        }
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isActive 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {isActive ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                    <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>
                      {day.label}
                    </span>
                  </div>

                  {isActive && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (dayPeriods[day.id] > 3) {
                            setDayPeriods(prev => ({ ...prev, [day.id]: prev[day.id] - 1 }));
                          }
                        }}
                        className="p-1 bg-slate-700 rounded hover:bg-slate-600 text-white text-xs w-6 h-6 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-blue-400 min-w-[24px] text-center">
                        {periodCount}
                      </span>
                      <button
                        onClick={() => {
                          if (dayPeriods[day.id] < 10) {
                            setDayPeriods(prev => ({ ...prev, [day.id]: prev[day.id] + 1 }));
                          }
                        }}
                        className="p-1 bg-slate-700 rounded hover:bg-slate-600 text-white text-xs w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const saveSettings = async () => {
                    try {
                      const q = query(collection(db, 'schoolSettings'));
                      const snapshot = await getDocs(q);
                      const data = {
                        schoolDays: schoolDays,
                        dayPeriods: dayPeriods,
                        periodLabels: periodLabels,
                        updatedAt: new Date().toISOString()
                      };
                      
                      if (!snapshot.empty) {
                        await updateDoc(doc(db, 'schoolSettings', snapshot.docs[0].id), data);
                      } else {
                        await addDoc(collection(db, 'schoolSettings'), {
                          ...data,
                          createdAt: new Date().toISOString()
                        });
                      }
                      setShowDaySettings(false);
                      setMessage({ type: 'success', text: '✅ تم حفظ إعدادات أيام الدوام بنجاح!' });
                      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                    } catch (error) {
                      console.error('❌ خطأ في حفظ الإعدادات:', error);
                      setMessage({ type: 'error', text: '❌ خطأ في حفظ الإعدادات: ' + error.message });
                    }
                  };
                  saveSettings();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> حفظ الإعدادات
              </button>
              <button
                onClick={() => {
                  setSchoolDays(defaultSchoolDays);
                  setDayPeriods(defaultDayPeriods);
                }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all"
              >
                <RefreshCw className="w-4 h-4 inline ml-1" /> إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };