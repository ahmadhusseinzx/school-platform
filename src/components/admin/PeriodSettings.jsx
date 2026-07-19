// src/components/admin/PeriodSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDocs, addDoc, updateDoc, 
  deleteDoc, query
} from 'firebase/firestore';
import { 
  Clock, Save, Edit3, X, CheckCircle, AlertCircle, 
  Loader2, Plus, Trash2, RefreshCw, Printer,
  Settings, GripVertical, Copy, ArrowUp, ArrowDown,
  Calendar, Users, Filter, Tag, AlertTriangle
} from 'lucide-react';

// ============ التوقيت الافتراضي (مع الفترات المتداخلة لصفوف مختلفة) ============
const DEFAULT_PERIODS = [
  { id: '1', label: 'الحصة 1', from: '8:00', to: '8:40', isBreak: false, grades: [] },
  { id: '2', label: 'الحصة 2', from: '8:45', to: '9:25', isBreak: false, grades: [] },
  { id: '3', label: 'الحصة 3', from: '9:30', to: '10:10', isBreak: false, grades: [] },
  { id: 'break1', label: 'استراحة (1-5)', from: '10:10', to: '10:30', isBreak: true, grades: [1, 2, 3, 4, 5] },
  { id: '4a', label: 'الحصة 4 (1-5)', from: '10:35', to: '11:15', isBreak: false, grades: [1, 2, 3, 4, 5] },
  { id: '4b', label: 'الحصة 4 (6-12)', from: '10:10', to: '10:50', isBreak: false, grades: [6, 7, 8, 9, 10, 11, 12] },
  { id: 'break2', label: 'استراحة (6-12)', from: '10:50', to: '11:10', isBreak: true, grades: [6, 7, 8, 9, 10, 11, 12] },
  { id: '5', label: 'الحصة 5', from: '11:15', to: '12:00', isBreak: false, grades: [] },
  { id: '6', label: 'الحصة 6', from: '12:05', to: '12:45', isBreak: false, grades: [] },
  { id: '7', label: 'الحصة 7', from: '12:50', to: '1:30', isBreak: false, grades: [] }
];

export default function PeriodSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // ====== حالة التوقيت ======
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [tempPeriods, setTempPeriods] = useState(DEFAULT_PERIODS);
  const [settingsId, setSettingsId] = useState(null);
  
  // ====== حالة النوافذ المنبثقة ======
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ 
    label: '', from: '12:00', to: '12:30', isBreak: false, grades: [] 
  });
  
  // ====== حالة السحب والإفلات ======
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  
  // ====== فلتر العرض ======
  const [showFilter, setShowFilter] = useState(false);
  const [filterGrade, setFilterGrade] = useState('');

  // ============ جلب الإعدادات من Firebase ============
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'schoolSettings'));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setSettingsId(doc.id);
        const data = doc.data();
        if (data.periods && Array.isArray(data.periods)) {
          setPeriods(data.periods);
          setTempPeriods(data.periods);
          console.log('✅ تم جلب توقيت الحصص:', data.periods);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الإعدادات:', error);
      setMessage({ type: 'error', text: '❌ خطأ في جلب الإعدادات: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ============ حفظ الإعدادات ============
  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const validationError = validatePeriods(tempPeriods);
      if (validationError) {
        setMessage({ type: 'error', text: validationError });
        setSaving(false);
        return;
      }

      const data = {
        periods: tempPeriods,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      };

      if (settingsId) {
        await updateDoc(doc(db, 'schoolSettings', settingsId), data);
      } else {
        const docRef = await addDoc(collection(db, 'schoolSettings'), {
          ...data,
          createdAt: new Date().toISOString()
        });
        setSettingsId(docRef.id);
      }

      setPeriods(tempPeriods);
      setEditing(false);
      setMessage({ type: 'success', text: '✅ تم حفظ توقيت الحصص بنجاح!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('❌ خطأ في حفظ الإعدادات:', error);
      setMessage({ type: 'error', text: '❌ خطأ في حفظ الإعدادات: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  // ============ التحقق من صحة البيانات (مع السماح بالتداخل لصفوف مختلفة) ============
  const validatePeriods = (items) => {
    for (let i = 0; i < items.length - 1; i++) {
      const current = items[i];
      for (let j = i + 1; j < items.length; j++) {
        const next = items[j];
        
        // التحقق من التداخل الزمني
        if (current.to > next.from && next.to > current.from) {
          // التحقق من وجود صفوف مشتركة
          const currentGrades = current.grades || [];
          const nextGrades = next.grades || [];
          
          // إذا كانت إحدى الفترات لجميع الصفوف (grades فارغة)
          const currentAll = currentGrades.length === 0;
          const nextAll = nextGrades.length === 0;
          
          // إذا كانت كلتا الفترتين لجميع الصفوف → تداخل غير مسموح
          if (currentAll && nextAll) {
            return `⚠️ تداخل في التوقيت: "${current.label}" (${current.from}-${current.to}) يتداخل مع "${next.label}" (${next.from}-${next.to}) - كلاهما لجميع الصفوف`;
          }
          
          // إذا كانت إحداهما لجميع الصفوف والأخرى لصفوف محددة → تداخل غير مسموح
          if (currentAll && !nextAll) {
            return `⚠️ تداخل في التوقيت: "${current.label}" (لجميع الصفوف) يتداخل مع "${next.label}" (للصفوف ${nextGrades.join('، ')})`;
          }
          if (!currentAll && nextAll) {
            return `⚠️ تداخل في التوقيت: "${current.label}" (للصفوف ${currentGrades.join('، ')}) يتداخل مع "${next.label}" (لجميع الصفوف)`;
          }
          
          // إذا كانت كلتا الفترتين لصفوف محددة → تحقق من وجود صفوف مشتركة
          const commonGrades = currentGrades.filter(g => nextGrades.includes(g));
          if (commonGrades.length > 0) {
            return `⚠️ تداخل في التوقيت: "${current.label}" (للصفوف ${currentGrades.join('، ')}) يتداخل مع "${next.label}" (للصفوف ${nextGrades.join('، ')}) - الصفوف المشتركة: ${commonGrades.join('، ')}`;
          }
          // ✅ إذا كانت الصفوف مختلفة → يُسمح بالتداخل (لا نعيد أي خطأ)
        }
      }
    }
    return null;
  };

  // ============ إعادة تعيين ============
  const handleReset = () => {
    if (confirm('⚠️ هل أنت متأكد من إعادة تعيين التوقيت إلى الإعدادات الافتراضية؟')) {
      setTempPeriods(DEFAULT_PERIODS);
      setMessage({ type: 'success', text: '✅ تم إعادة تعيين التوقيت إلى الإعدادات الافتراضية' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // ============ تحديث توقيت فترة ============
  const handlePeriodChange = (index, field, value) => {
    const updated = [...tempPeriods];
    updated[index] = { ...updated[index], [field]: value };
    setTempPeriods(updated);
  };

  // ============ تحديث صفوف فترة ============
  const handleGradesChange = (index, value) => {
    const grades = value
      .split(/[,،\s]+/)
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= 12);
    
    const updated = [...tempPeriods];
    updated[index] = { ...updated[index], grades };
    setTempPeriods(updated);
  };

  // ============ إضافة فترة جديدة ============
  const addPeriod = () => {
    const { label, from, to, isBreak, grades } = newItem;
    if (!label || !from || !to) {
      setMessage({ type: 'error', text: '❌ الرجاء ملء جميع الحقول' });
      return;
    }
    if (from >= to) {
      setMessage({ type: 'error', text: '❌ وقت البداية يجب أن يكون قبل وقت النهاية' });
      return;
    }

    const newPeriod = {
      id: `period-${Date.now()}`,
      label,
      from,
      to,
      isBreak,
      grades: grades || []
    };

    setTempPeriods([...tempPeriods, newPeriod]);
    setShowAddModal(false);
    setNewItem({ label: '', from: '12:00', to: '12:30', isBreak: false, grades: [] });
    setMessage({ type: 'success', text: `✅ تم إضافة ${isBreak ? 'استراحة' : 'حصة'} جديدة بنجاح` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // ============ حذف فترة ============
  const deletePeriod = (index) => {
    const item = tempPeriods[index];
    if (!confirm(`⚠️ هل أنت متأكد من حذف "${item.label}"؟`)) return;
    
    const updated = tempPeriods.filter((_, i) => i !== index);
    setTempPeriods(updated);
    setMessage({ type: 'success', text: `✅ تم حذف ${item.label} بنجاح` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // ============ السحب والإفلات ============
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.target.classList.add('opacity-50');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    setDraggedIndex(null);
    setDropIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDropIndex(index);
  };

  const handleDragLeave = (e) => {
    setDropIndex(null);
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    const dragIdx = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIdx === dropIdx) return;
    
    const updated = [...tempPeriods];
    const [draggedItem] = updated.splice(dragIdx, 1);
    updated.splice(dropIdx, 0, draggedItem);
    setTempPeriods(updated);
    setDraggedIndex(null);
    setDropIndex(null);
  };

  // ============ طباعة الجدول ============
  const handlePrint = () => {
    const printContent = document.getElementById('print-area');
    if (!printContent) return;
    
    const originalContents = document.body.innerHTML;
    const printHTML = printContent.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 20px; direction: rtl; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <h1 style="text-align: center; color: #1a237e; margin-bottom: 20px;">📋 توقيت الحصص</h1>
        ${printHTML}
        <p style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
          تم الطباعة من المنصة الذكية - ${new Date().toLocaleDateString('ar')}
        </p>
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // ============ حساب المدة ============
  const calculateDuration = (from, to) => {
    if (!from || !to) return '';
    const [fromH, fromM] = from.split(':').map(Number);
    const [toH, toM] = to.split(':').map(Number);
    const diff = (toH * 60 + toM) - (fromH * 60 + fromM);
    if (diff <= 0) return '';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return hours > 0 ? `${hours}س ${mins}د` : `${mins}د`;
  };

  // ============ عرض الصفوف كنص ============
  const getGradesText = (grades) => {
    if (!grades || grades.length === 0) return 'جميع الصفوف';
    return `الصفوف ${grades.join('، ')}`;
  };

  // ============ عرض الجدول ============
  const renderPeriodsTable = (data, isEditing) => {
    // تصفية البيانات إذا كان الفلتر مفعلاً
    const filteredData = filterGrade 
      ? data.filter(p => !p.grades || p.grades.length === 0 || p.grades.includes(parseInt(filterGrade)))
      : data;

    return (
      <div className="overflow-x-auto" id="print-area">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700">
              <th className="p-3 text-center font-bold text-slate-400 min-w-[40px]">
                {isEditing && <span className="text-[10px]">#</span>}
              </th>
              <th className="p-3 text-center font-bold text-slate-400 min-w-[100px]">الفترة</th>
              <th className="p-3 text-center font-bold text-slate-400 min-w-[110px]">بداية</th>
              <th className="p-3 text-center font-bold text-slate-400 min-w-[110px]">نهاية</th>
              <th className="p-3 text-center font-bold text-slate-400 min-w-[80px]">المدة</th>
              <th className="p-3 text-center font-bold text-slate-400 min-w-[120px]">الصفوف</th>
              {isEditing && (
                <th className="p-3 text-center font-bold text-slate-400 min-w-[140px]">إجراءات</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((period, index) => {
              const isBreak = period.isBreak || false;
              const from = period.from || '';
              const to = period.to || '';
              const duration = calculateDuration(from, to);
              const isDragging = draggedIndex === index;
              const isDropTarget = dropIndex === index && !isDragging;
              const grades = period.grades || [];

              // العثور على الفهرس الحقيقي في البيانات الأصلية (للتحديث)
              const realIndex = data.findIndex(p => p.id === period.id);

              return (
                <tr
                  key={period.id || index}
                  draggable={isEditing}
                  onDragStart={(e) => handleDragStart(e, realIndex)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, realIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, realIndex)}
                  className={`border-b border-slate-800 hover:bg-slate-800/30 transition-all ${
                    isBreak ? 'bg-amber-500/5' : ''
                  } ${isDragging ? 'opacity-50' : ''} ${
                    isDropTarget ? 'border-2 border-dashed border-blue-500 bg-blue-500/10' : ''
                  }`}
                >
                  <td className="p-3 text-center">
                    {isEditing && (
                      <GripVertical className="w-4 h-4 text-slate-500 cursor-grab hover:text-white mx-auto" />
                    )}
                    {!isEditing && (
                      <span className="text-xs text-slate-500">{realIndex + 1}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-bold ${isBreak ? 'text-amber-400' : 'text-white'}`}>
                      {isBreak ? '☕ ' : '📚 '}{period.label}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input
                        type="time"
                        value={from}
                        onChange={(e) => handlePeriodChange(realIndex, 'from', e.target.value)}
                        className={`w-24 p-2 bg-slate-800 border rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 ${
                          isBreak ? 'border-amber-500/30' : 'border-slate-700'
                        }`}
                      />
                    ) : (
                      <span className={`font-mono ${isBreak ? 'text-amber-400' : 'text-slate-300'}`}>
                        {from || '-'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input
                        type="time"
                        value={to}
                        onChange={(e) => handlePeriodChange(realIndex, 'to', e.target.value)}
                        className={`w-24 p-2 bg-slate-800 border rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 ${
                          isBreak ? 'border-amber-500/30' : 'border-slate-700'
                        }`}
                      />
                    ) : (
                      <span className={`font-mono ${isBreak ? 'text-amber-400' : 'text-slate-300'}`}>
                        {to || '-'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs ${isBreak ? 'text-amber-400' : 'text-slate-500'}`}>
                      {duration || '-'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input
                        type="text"
                        value={grades.join(', ')}
                        onChange={(e) => handleGradesChange(realIndex, e.target.value)}
                        placeholder="جميع الصفوف"
                        className="w-28 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                        dir="ltr"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {getGradesText(grades)}
                      </span>
                    )}
                  </td>
                  {isEditing && (
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            const newPeriod = { 
                              ...period, 
                              id: `period-${Date.now()}` 
                            };
                            const updated = [...tempPeriods];
                            updated.splice(realIndex + 1, 0, newPeriod);
                            setTempPeriods(updated);
                          }}
                          className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                          title="نسخ"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (realIndex > 0) {
                              const updated = [...tempPeriods];
                              [updated[realIndex], updated[realIndex - 1]] = [updated[realIndex - 1], updated[realIndex]];
                              setTempPeriods(updated);
                            }
                          }}
                          className="p-1.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600 transition-all"
                          title="نقل لأعلى"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (realIndex < tempPeriods.length - 1) {
                              const updated = [...tempPeriods];
                              [updated[realIndex], updated[realIndex + 1]] = [updated[realIndex + 1], updated[realIndex]];
                              setTempPeriods(updated);
                            }
                          }}
                          className="p-1.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600 transition-all"
                          title="نقل لأسفل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePeriod(realIndex)}
                          className="p-1.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ============ نافذة إضافة فترة ============
  const renderAddModal = () => {
    if (!showAddModal) return null;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              إضافة {newItem.isBreak ? 'استراحة' : 'حصة'} جديدة
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">النوع</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewItem({ ...newItem, isBreak: false })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    !newItem.isBreak 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  📚 حصة
                </button>
                <button
                  onClick={() => setNewItem({ ...newItem, isBreak: true })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    newItem.isBreak 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  ☕ استراحة
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">الاسم</label>
              <input
                type="text"
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                placeholder={newItem.isBreak ? "مثال: استراحة الظهر" : "مثال: الحصة 8"}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">الصفوف (أدخل الأرقام مفصولة بفواصل، اتركها فارغة للجميع)</label>
              <input
                type="text"
                value={newItem.grades.join(', ')}
                onChange={(e) => {
                  const grades = e.target.value
                    .split(/[,،\s]+/)
                    .map(s => parseInt(s.trim()))
                    .filter(n => !isNaN(n) && n >= 1 && n <= 12);
                  setNewItem({ ...newItem, grades });
                }}
                placeholder="مثال: 1, 2, 3, 4, 5"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                dir="ltr"
              />
              <p className="text-[8px] text-slate-500 mt-1">💡 اتركها فارغة لتطبيق الفترة على جميع الصفوف</p>
              <p className="text-[8px] text-amber-400 mt-1">💡 يمكن أن تتداخل الفترات إذا كانت لصفوف مختلفة</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">وقت البداية</label>
                <input
                  type="time"
                  value={newItem.from}
                  onChange={(e) => setNewItem({ ...newItem, from: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">وقت النهاية</label>
                <input
                  type="time"
                  value={newItem.to}
                  onChange={(e) => setNewItem({ ...newItem, to: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={addPeriod}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> إضافة
              </button>
              <button
                onClick={() => { setShowAddModal(false); }}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm mr-3">جاري تحميل توقيت الحصص...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* ====== نافذة إضافة ====== */}
      {renderAddModal()}

      {/* ====== العنوان ====== */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            توقيت الحصص
          </h2>
          <p className="text-xs text-slate-400">إدارة مرنة مع إمكانية التداخل للصفوف المختلفة</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* فلتر الصفوف */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                filterGrade 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="تصفية حسب الصف"
            >
              <Filter className="w-3.5 h-3.5" />
              {filterGrade && <span className="mr-1 text-[9px]">{filterGrade}</span>}
            </button>
            {showFilter && (
              <div className="absolute left-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 z-10 min-w-[120px]">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  placeholder="رقم الصف"
                  className="w-full p-1.5 bg-slate-900 border border-slate-600 rounded text-white text-xs"
                />
                <button
                  onClick={() => { setFilterGrade(''); setShowFilter(false); }}
                  className="w-full mt-1 p-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded text-xs font-bold transition-all"
                >
                  إلغاء الفلتر
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                تعديل التوقيت
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setShowAddModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                حفظ
              </button>
              <button
                onClick={() => { setTempPeriods(periods); setEditing(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl text-xs font-bold transition-all"
              >
                <X className="w-3.5 h-3.5" />
                إلغاء
              </button>
            </>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* ====== عرض الرسائل ====== */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ====== الجدول ====== */}
      <div className="mb-4">
        {renderPeriodsTable(editing ? tempPeriods : periods, editing)}
      </div>

      {/* ====== تعليمات السحب والإفلات ====== */}
      {editing && (
        <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="text-xs text-blue-400 flex items-center gap-2">
            <GripVertical className="w-3.5 h-3.5" />
            💡 يمكنك سحب الصفوف (Drag & Drop) لإعادة ترتيبها
          </p>
        </div>
      )}

      {/* ====== ملخص ====== */}
      <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-400">عدد الحصص</p>
            <p className="text-lg font-bold text-white">
              {(editing ? tempPeriods : periods).filter(p => !p.isBreak).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">عدد الاستراحات</p>
            <p className="text-lg font-bold text-amber-400">
              {(editing ? tempPeriods : periods).filter(p => p.isBreak).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">بداية اليوم</p>
            <p className="text-lg font-bold text-emerald-400">
              {(editing ? tempPeriods : periods)[0]?.from || '8:00'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">نهاية اليوم</p>
            <p className="text-lg font-bold text-rose-400">
              {(() => {
                const items = editing ? tempPeriods : periods;
                const last = items[items.length - 1];
                return last?.to || '2:15';
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* ====== تعليمات ====== */}
      <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
        <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2">
          <Settings className="w-3.5 h-3.5" />
          تعليمات
        </h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• يمكن <span className="text-emerald-400">إضافة</span> حصص أو استراحات جديدة</li>
          <li>• يمكن <span className="text-rose-400">حذف</span> أي حصة أو استراحة</li>
          <li>• يمكن <span className="text-blue-400">تحديد الصفوف</span> المستهدفة لكل فترة</li>
          <li>• <span className="text-amber-400">يُسمح بالتداخل</span> إذا كانت الفترات لصفوف مختلفة</li>
          <li>• يمكن <span className="text-purple-400">سحب</span> الصفوف لإعادة ترتيبها</li>
          <li>• التغييرات تُحفظ في قاعدة البيانات</li>
        </ul>
      </div>
    </div>
  );
}