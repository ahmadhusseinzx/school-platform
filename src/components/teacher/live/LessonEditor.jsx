import React, { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

export default function LessonEditor({
  editBlocks,
  setEditBlocks,
  currentSlide,
  setCurrentSlide,
  newLiveBlockType,
  setNewLiveBlockType,
  saveLessonUpdates,
  selectedLesson
}) {
  const moveBlock = (index, direction) => {
    const updated = [...editBlocks];
    if (direction === 'up' && index > 0) {
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    } else if (direction === 'down' && index < updated.length - 1) {
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    }
    setEditBlocks(updated);
  };

  const updateBlockValue = (index, newValue) => {
    const updated = [...editBlocks];
    updated[index].value = newValue;
    setEditBlocks(updated);
  };

  const updateEditBlockField = (index, field, newValue) => {
    const updated = [...editBlocks];
    updated[index] = { ...updated[index], [field]: newValue };
    setEditBlocks(updated);
  };

  const addBlockToLiveLesson = () => {
    if (newLiveBlockType === 'image' || newLiveBlockType === 'link') {
      setEditBlocks([...editBlocks, { type: newLiveBlockType, url: '', title: '', value: '' }]);
    } else {
      setEditBlocks([...editBlocks, { type: newLiveBlockType, value: '' }]);
    }
  };

  const deleteLiveBlock = (index) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الشريحة نهائياً؟")) {
      const updated = editBlocks.filter((_, idx) => idx !== index);
      setEditBlocks(updated);
      if (currentSlide >= updated.length && updated.length > 0) {
        setCurrentSlide(updated.length - 1);
      }
    }
  };

  return (
    <div className="p-6 rounded-2xl border bg-[#1e293b] border-slate-700 space-y-6">
      <div className="p-4 rounded-xl border border-dashed border-blue-500/40 bg-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-300">إدراج أداة تفاعلية جديدة للدرس الحاضر:</span>
          <select
            value={newLiveBlockType}
            onChange={(e) => setNewLiveBlockType(e.target.value)}
            className="p-1.5 rounded text-xs bg-[#1e293b] text-white border border-slate-700 focus:outline-none"
          >
            <option value="text">فقرة شرح</option>
            <option value="note">تنبيه هام</option>
            <option value="image">صورة تعليمية</option>
            <option value="link">رابط تفاعلي</option>
          </select>
        </div>
        <button
          type="button"
          onClick={addBlockToLiveLesson}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
        >
          + إضافة شريحة
        </button>
      </div>

      <div className="space-y-4">
        {editBlocks.map((block, index) => (
          <div key={index} className="p-4 rounded-xl border bg-[#0f172a] border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-blue-400">
                سلايد #{index + 1} ({block.type === 'image' ? 'صورة تعليمية' : block.type === 'link' ? 'رابط تفاعلي' : block.type === 'note' ? 'تنبيه هام' : 'فقرة شرح'})
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => moveBlock(index, 'up')} className="p-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors">
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => moveBlock(index, 'down')} className="p-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors">
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => deleteLiveBlock(index)} className="p-1 bg-rose-950 text-rose-400 border border-rose-900/40 rounded hover:bg-rose-900 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            {(block.type === 'image' || block.type === 'link') ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={block.url || ''}
                  onChange={(e) => updateEditBlockField(index, 'url', e.target.value)}
                  placeholder={block.type === 'image' ? "رابط الصورة الإلكتروني URL..." : "رابط موقع الويب أو المحاكي الخارجي..."}
                  className="w-full p-2 rounded text-xs bg-[#1e293b] text-white border border-slate-700 font-mono"
                />
                <input
                  type="text"
                  value={block.title || ''}
                  onChange={(e) => updateEditBlockField(index, 'title', e.target.value)}
                  placeholder={block.type === 'image' ? "التعليق التوضيحي المرفق أسفل الصورة..." : "اسم الزر التفاعلي الموضح..."}
                  className="w-full p-2 rounded text-xs bg-[#1e293b] text-white border border-slate-700"
                />
              </div>
            ) : (
              <textarea
                rows={4}
                value={block.value || ''}
                onChange={(e) => updateBlockValue(index, e.target.value)}
                placeholder={block.type === 'note' ? "اكتب التنبيه الهام والملاحظة العريضة هنا..." : "اكتب محتوى الشرح باستخدام الماركدوان..."}
                className="w-full p-2 rounded text-xs bg-[#1e293b] text-white border border-slate-700 leading-relaxed"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={saveLessonUpdates}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md"
      >
        حفظ تعديلات البث
      </button>
    </div>
  );
}