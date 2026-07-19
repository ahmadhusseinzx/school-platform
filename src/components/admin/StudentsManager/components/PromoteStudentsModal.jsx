// src/components/admin/StudentsManager/components/PromoteStudentsModal.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../../../services/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { 
  X, Loader2, CheckCircle, AlertCircle, Users, 
  GraduationCap, ArrowUp, School, ChevronRight,
  ChevronDown, Filter
} from 'lucide-react';

const PromoteStudentsModal = ({ students, classes, schoolSettings, onClose, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState({});
  const [promotionResults, setPromotionResults] = useState(null);
  const [error, setError] = useState('');
  
  // ====== ✅ حالة اختيار الصف المستهدف لكل طالب ======
  const [studentTargetClass, setStudentTargetClass] = useState({});

  // ====== الحصول على الصفوف القابلة للترفيع ======
  const promoteableClasses = useMemo(() => {
    const classMap = {};
    classes.forEach(cls => {
      const num = parseInt(cls.name);
      if (num >= 9 && num <= 11) {
        classMap[cls.id] = { ...cls, number: num };
      }
    });
    return classMap;
  }, [classes]);

  // ====== الحصول على خيارات الصفوف المستهدفة ======
  const getTargetClassOptions = (currentClassNumber) => {
    let targetNumber = '';
    if (currentClassNumber === 9) targetNumber = '10';
    else if (currentClassNumber === 10) targetNumber = '11';
    else if (currentClassNumber === 11) return null;
    else return null;

    // البحث عن الصفوف المتاحة
    const availableClasses = classes.filter(c => c.name.startsWith(targetNumber));
    
    if (availableClasses.length === 0) {
      // إذا لم يكن هناك صفوف، نقترح إنشاءها
      return [{ id: 'create', name: `➕ إنشاء الصف ${targetNumber}` }];
    }
    
    return availableClasses.map(c => ({ id: c.id, name: c.name }));
  };

  // ====== الحصول على طلاب كل صف ======
  const getStudentsByClass = (classId) => {
    return students.filter(s => s.classId === classId);
  };

  // ====== الحصول على الصف المستهدف الافتراضي ======
  const getDefaultTargetClass = (currentClassNumber) => {
    if (currentClassNumber === 9) return '10';
    if (currentClassNumber === 10) return '11';
    if (currentClassNumber === 11) return null;
    return null;
  };

  // ====== تبديل اختيار طالب ======
  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // ====== اختيار كل طلاب الصف ======
  const selectAllInClass = (classId) => {
    const studentsInClass = getStudentsByClass(classId);
    const newState = { ...selectedStudents };
    const allSelected = studentsInClass.every(s => newState[s.id]);
    studentsInClass.forEach(s => {
      newState[s.id] = !allSelected;
    });
    setSelectedStudents(newState);
  };

  // ====== تغيير الصف المستهدف لطالب ======
  const handleTargetClassChange = (studentId, targetClassId) => {
    setStudentTargetClass(prev => ({
      ...prev,
      [studentId]: targetClassId
    }));
  };

  // ====== الحصول على عدد الطلاب المختارين ======
  const getSelectedCount = () => {
    return Object.values(selectedStudents).filter(v => v).length;
  };

  // ====== تهيئة الصف المستهدف للطلاب ======
  useEffect(() => {
    const initialTargets = {};
    students.forEach(student => {
      const currentClass = classes.find(c => c.id === student.classId);
      if (currentClass) {
        const num = parseInt(currentClass.name);
        if (num >= 9 && num <= 11) {
          const targetOptions = getTargetClassOptions(num);
          if (targetOptions && targetOptions.length > 0 && targetOptions[0].id !== 'create') {
            initialTargets[student.id] = targetOptions[0].id;
          }
        }
      }
    });
    setStudentTargetClass(initialTargets);
  }, [students, classes]);

  // ====== تنفيذ الترفيع ======
  const handlePromote = async () => {
    setLoading(true);
    setError('');

    try {
      const batch = writeBatch(db);
      const results = {
        promoted: 0,
        failed: 0,
        details: []
      };

      for (const [studentId, selected] of Object.entries(selectedStudents)) {
        if (!selected) continue;

        const student = students.find(s => s.id === studentId);
        if (!student) continue;

        const currentClass = classes.find(c => c.id === student.classId);
        if (!currentClass) continue;

        const currentNumber = parseInt(currentClass.name);
        
        // ✅ التحقق من الصف المستهدف المختار للطالب
        const targetClassId = studentTargetClass[studentId];
        let targetClass = null;
        
        if (targetClassId) {
          targetClass = classes.find(c => c.id === targetClassId);
        }
        
        if (!targetClass) {
          // إذا لم يتم اختيار صف، استخدم الصف الافتراضي
          const defaultTarget = getDefaultTargetClass(currentNumber);
          if (defaultTarget) {
            targetClass = classes.find(c => c.name === defaultTarget);
          }
        }

        if (!targetClass) {
          // لا يوجد صف مستهدف
          if (currentNumber === 11) {
            // طالب في الصف 11 → تخرج
            results.details.push({
              student: student.fullName,
              from: currentClass.name,
              to: 'تخرج 🎓',
              status: 'graduated'
            });
            results.promoted++;
            
            const studentRef = doc(db, 'users', studentId);
            batch.update(studentRef, {
              classId: null,
              isGraduated: true,
              graduationYear: schoolSettings?.academicYear?.current || '',
              updatedAt: new Date().toISOString()
            });
            continue;
          } else {
            results.failed++;
            results.details.push({
              student: student.fullName,
              from: currentClass.name,
              to: 'غير محدد',
              status: 'failed',
              error: 'لا يوجد صف مستهدف متاح'
            });
            continue;
          }
        }

        // ✅ تحديث بيانات الطالب
        const studentRef = doc(db, 'users', studentId);
        const promotionRecord = {
          from: currentClass.name,
          to: targetClass.name,
          date: new Date().toISOString(),
          academicYear: schoolSettings?.academicYear?.current || ''
        };

        batch.update(studentRef, {
          classId: targetClass.id,
          updatedAt: new Date().toISOString(),
          promotionHistory: [...(student.promotionHistory || []), promotionRecord]
        });

        results.promoted++;
        results.details.push({
          student: student.fullName,
          from: currentClass.name,
          to: targetClass.name,
          status: 'success'
        });
      }

      await batch.commit();
      setPromotionResults(results);
      setStep(3);
      onComplete(results);

    } catch (err) {
      setError('❌ خطأ في عملية الترفيع: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== عرض خطوة اختيار الطلاب ======
  const renderSelectionStep = () => {
    const promoteableClassIds = Object.keys(promoteableClasses);
    
    if (promoteableClassIds.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد صفوف قابلة للترفيع</p>
          <p className="text-xs text-slate-500 mt-1">تأكد من وجود طلاب في الصفوف 9-11</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-h-[60vh] overflow-y-auto">
        {promoteableClassIds.map(classId => {
          const classObj = promoteableClasses[classId];
          const studentsInClass = getStudentsByClass(classId);
          const allSelected = studentsInClass.every(s => selectedStudents[s.id]);
          const targetOptions = getTargetClassOptions(classObj.number);

          if (studentsInClass.length === 0) return null;

          return (
            <div key={classId} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">
                    الصف {classObj.name}
                    <span className="text-xs font-normal text-slate-400 mr-2">
                      ({studentsInClass.length} طالب)
                    </span>
                  </h4>
                  {targetOptions && targetOptions.length > 0 && targetOptions[0].id !== 'create' ? (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      ← اختر الصف المستهدف
                    </span>
                  ) : classObj.number === 11 ? (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      🎓 تخرج
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      ⚠️ لا يوجد صف مستهدف
                    </span>
                  )}
                </div>
                <button
                  onClick={() => selectAllInClass(classId)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {allSelected ? 'إلغاء الكل' : 'اختيار الكل'}
                </button>
              </div>

              {/* ✅ اختيار الصف المستهدف للصف بأكمله */}
              {targetOptions && targetOptions.length > 0 && targetOptions[0].id !== 'create' && classObj.number < 11 && (
                <div className="mb-3 p-2 bg-slate-900/50 rounded-lg border border-slate-700">
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    الصف المستهدف:
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {targetOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          studentsInClass.forEach(s => {
                            handleTargetClassChange(s.id, opt.id);
                          });
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          studentsInClass.every(s => studentTargetClass[s.id] === opt.id)
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* قائمة الطلاب مع اختيار الصف لكل طالب */}
              <div className="space-y-2">
                {studentsInClass.map(student => {
                  const targetOptionsForStudent = getTargetClassOptions(classObj.number);
                  const currentTarget = studentTargetClass[student.id] || '';
                  
                  return (
                    <div key={student.id} className="flex items-center gap-3 p-2 bg-slate-900/30 rounded-lg">
                      <button
                        onClick={() => toggleStudent(student.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedStudents[student.id]
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {selectedStudents[student.id] && <CheckCircle className="w-3 h-3" />}
                        {student.fullName}
                      </button>
                      
                      {/* ✅ اختيار الصف المستهدف لكل طالب */}
                      {selectedStudents[student.id] && targetOptionsForStudent && targetOptionsForStudent.length > 0 && targetOptionsForStudent[0].id !== 'create' && classObj.number < 11 && (
                        <select
                          value={currentTarget}
                          onChange={(e) => handleTargetClassChange(student.id, e.target.value)}
                          className="p-1 bg-slate-800 border border-slate-700 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                        >
                          {targetOptionsForStudent.map(opt => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {selectedStudents[student.id] && classObj.number === 11 && (
                        <span className="text-xs text-emerald-400">🎓 سيتخرج</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <span className="text-xs text-slate-400">
            تم اختيار <span className="text-white font-bold">{getSelectedCount()}</span> طالب
          </span>
          <button
            onClick={handlePromote}
            disabled={getSelectedCount() === 0 || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> جاري الترفيع...</>
            ) : (
              <><GraduationCap className="w-4 h-4" /> ترفيع المختارين</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ====== عرض نتائج الترفيع ======
  const renderResultsStep = () => {
    if (!promotionResults) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 rounded-xl p-4 text-center border border-emerald-500/30">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-400">{promotionResults.promoted}</p>
            <p className="text-xs text-slate-400">تم الترفيع</p>
          </div>
          <div className="bg-rose-500/10 rounded-xl p-4 text-center border border-rose-500/30">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-rose-400">{promotionResults.failed}</p>
            <p className="text-xs text-slate-400">فشل الترفيع</p>
          </div>
        </div>

        <div className="max-h-40 overflow-y-auto">
          {promotionResults.details.map((detail, index) => (
            <div key={index} className="flex items-center justify-between p-2 border-b border-slate-700 text-xs">
              <span className="text-white">{detail.student}</span>
              <span className="text-slate-400">{detail.from}</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className={detail.status === 'success' ? 'text-emerald-400' : detail.status === 'graduated' ? 'text-blue-400' : 'text-rose-400'}>
                {detail.to || detail.error || 'تخرج'}
              </span>
              {detail.status === 'success' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
              {detail.status === 'graduated' && <GraduationCap className="w-3 h-3 text-blue-400" />}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all"
        >
          إغلاق
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full mx-4 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* ====== العنوان ====== */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">🎓 ترفيع الطلاب</h3>
              <p className="text-xs text-slate-400">
                {step === 1 && 'اختر الطلاب وحدد الصف المستهدف لكل طالب'}
                {step === 3 && 'نتائج عملية الترفيع'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ====== المحتوى ====== */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
            {error}
          </div>
        )}

        {step === 1 && renderSelectionStep()}
        {step === 3 && renderResultsStep()}
      </div>
    </div>
  );
};

export default PromoteStudentsModal;