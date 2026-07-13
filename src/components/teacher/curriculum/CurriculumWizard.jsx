import React, { useState } from 'react';
import LessonBuilder from './LessonBuilder';
import ExamBuilder from './ExamBuilder';

export default function CurriculumWizard({ classes, darkMode }) {
  const [curriculumStep, setCurriculumStep] = useState(1);
  const [curriculumMode, setCurriculumMode] = useState(null);
  const [curriculumClassId, setCurriculumClassId] = useState("");

  if (curriculumStep === 1) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400">اختر الصف الأكاديمي المستهدف:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => { setCurriculumClassId(c.id); setCurriculumStep(2); }}
              className={`p-4 rounded-xl border text-right text-xs font-bold bg-[#0f172a] hover:bg-slate-800 text-white transition-all ${
                curriculumClassId === c.id ? 'border-blue-500' : 'border-slate-700'
              }`}
            >
              🏫 {c.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (curriculumStep === 2) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-slate-400">حدد غاية بناء المحتوى الحالي:</p>
          <button
            type="button"
            onClick={() => setCurriculumStep(1)}
            className="text-xs flex items-center gap-1 text-blue-400 hover:underline"
          >
            ← العودة للخطوة السابقة
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => { setCurriculumMode('lesson'); setCurriculumStep(3); }}
            className="p-6 rounded-2xl border-2 border-slate-700 text-right space-y-2 bg-[#0f172a] hover:border-blue-500 transition-all"
          >
            <h5 className="text-sm font-bold">📚 درس تفاعلي بشرائح وأسئلة تقييمية</h5>
            <p className="text-[11px] text-slate-400">تحضير درس كامل يحتوي على فقرات، صور، روابط خارجية ومؤشرات بث مباشر.</p>
          </button>
          <button
            onClick={() => { setCurriculumMode('exam'); setCurriculumStep(3); }}
            className="p-6 rounded-2xl border-2 border-slate-700 text-right space-y-2 bg-[#0f172a] hover:border-purple-500 transition-all"
          >
            <h5 className="text-sm font-bold">📝 امتحان رقمي مستقل بمؤقت زمني</h5>
            <p className="text-[11px] text-slate-400">بنك أسئلة مخصص للامتحانات الشهرية مع تفعيل ميزات منع الغش والخلط العشوائي.</p>
          </button>
        </div>
      </div>
    );
  }

  if (curriculumStep === 3) {
    if (curriculumMode === 'lesson') {
      return (
        <LessonBuilder
          classes={classes}
          darkMode={darkMode}
          curriculumClassId={curriculumClassId}
          setCurriculumStep={setCurriculumStep}
          curriculumMode={curriculumMode}
        />
      );
    } else if (curriculumMode === 'exam') {
      return (
        <ExamBuilder
          classes={classes}
          darkMode={darkMode}
          curriculumClassId={curriculumClassId}
          setCurriculumStep={setCurriculumStep}
          curriculumMode={curriculumMode}
        />
      );
    }
  }

  return null;
}