import React from 'react';
import { Folder, ArrowLeft } from 'lucide-react';

export default function LiveSidebar({
  classes,
  selectedClass,
  setSelectedClass,
  selectedLesson,
  handleSelectLesson,
  filteredLessons
}) {
  return (
    <div className={`p-4 rounded-2xl border space-y-4 bg-[#1e293b] border-slate-700/80`}>
      {!selectedClass ? (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-blue-500 flex items-center gap-1">
            <Folder className="w-4 h-4" /> اختر الصف لبدء البث:
          </h3>
          <div className="space-y-2">
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c)}
                className="w-full text-right p-3 rounded-xl border text-xs font-bold bg-slate-900 border-slate-750 hover:bg-slate-800 text-white transition-all"
              >
                🏫 {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => { setSelectedClass(null); }}
            className="text-xs flex items-center gap-1 text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> تغيير الصف الحالي
          </button>
          <div className="border-b border-slate-700 pb-2">
            <span className="text-[10px] text-slate-400">الدروس المتاحة لـ:</span>
            <p className="text-xs font-black text-blue-500 mt-0.5">{selectedClass.name}</p>
          </div>
          <div className="space-y-2 max-h-[65vh] overflow-y-auto pl-1">
            {filteredLessons.map(les => (
              <button
                key={les.id}
                onClick={() => handleSelectLesson(les)}
                className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex flex-col gap-1 ${
                  selectedLesson?.id === les.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-[#0f172a] border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-[9px] opacity-70">الوحدة {les.unitNumber} • الدرس {les.lessonNumber}</span>
                <span className="font-bold">{les.title}</span>
              </button>
            ))}
            {filteredLessons.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center py-4">لا توجد دروس مضافة لهذا الصف.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}