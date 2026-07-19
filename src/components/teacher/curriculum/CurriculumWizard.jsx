// src/components/teacher/curriculum/CurriculumWizard.jsx
import React from 'react';
import LessonBuilder from './LessonBuilder';
import ExamBuilder from './ExamBuilder';
import { ArrowLeft } from 'lucide-react';

export default function CurriculumWizard({ 
  classes, darkMode,
  curriculumStep, setCurriculumStep,
  curriculumMode, setCurriculumMode,
  curriculumClassId, setCurriculumClassId,
  curriculumSemester, setCurriculumSemester,
  curriculumUnit, setCurriculumUnit,
  curriculumLessonNum, setCurriculumLessonNum,
  curriculumTitle, setCurriculumTitle,
  curriculumIntro, setCurriculumIntro,
  examDuration, setExamDuration,
  startTime, setStartTime,
  endTime, setEndTime,
  shuffleQuestions, setShuffleQuestions,
  shuffleChoices, setShuffleChoices,
  curriculumBlocks, setCurriculumBlocks,
  curriculumQuestions, setCurriculumQuestions,
  addCurriculumBlock,
  updateBlockField,
  addCurriculumQuestion,
  handleSaveFullCurriculum
}) {
  if (curriculumStep === 1) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400">اختر الصف الأكاديمي المستهدف:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => { setCurriculumClassId(c.id); setCurriculumStep(2); }}
              className={`p-4 rounded-xl border text-right text-xs font-bold bg-slate-900 hover:bg-slate-700 text-white transition-all ${
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
          <p className="text-xs font-bold text-slate-400">حدد نوع المحتوى:</p>
          <button
            type="button"
            onClick={() => setCurriculumStep(1)}
            className="text-xs flex items-center gap-1 text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> العودة
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => { setCurriculumMode('lesson'); setCurriculumStep(3); }}
            className="p-6 rounded-2xl border-2 border-slate-700 text-right space-y-2 bg-slate-900 hover:border-blue-500 transition-all"
          >
            <h5 className="text-sm font-bold">📚 درس تفاعلي</h5>
            <p className="text-[11px] text-slate-400">تحضير درس كامل بشرائح وأسئلة</p>
          </button>
          <button
            onClick={() => { setCurriculumMode('exam'); setCurriculumStep(3); }}
            className="p-6 rounded-2xl border-2 border-slate-700 text-right space-y-2 bg-slate-900 hover:border-purple-500 transition-all"
          >
            <h5 className="text-sm font-bold">📝 امتحان رقمي</h5>
            <p className="text-[11px] text-slate-400">امتحان بمؤقت زمني وأسئلة</p>
          </button>
        </div>
      </div>
    );
  }

  if (curriculumStep === 3) {
    if (curriculumMode === 'lesson') {
      return (
        <LessonBuilder
          darkMode={darkMode}
          curriculumClassId={curriculumClassId}
          setCurriculumStep={setCurriculumStep}
          curriculumSemester={curriculumSemester}
          setCurriculumSemester={setCurriculumSemester}
          curriculumUnit={curriculumUnit}
          setCurriculumUnit={setCurriculumUnit}
          curriculumLessonNum={curriculumLessonNum}
          setCurriculumLessonNum={setCurriculumLessonNum}
          curriculumTitle={curriculumTitle}
          setCurriculumTitle={setCurriculumTitle}
          curriculumIntro={curriculumIntro}
          setCurriculumIntro={setCurriculumIntro}
          curriculumBlocks={curriculumBlocks}
          setCurriculumBlocks={setCurriculumBlocks}
          curriculumQuestions={curriculumQuestions}
          setCurriculumQuestions={setCurriculumQuestions}
          addCurriculumBlock={addCurriculumBlock}
          updateBlockField={updateBlockField}
          addCurriculumQuestion={addCurriculumQuestion}
          handleSaveFullCurriculum={handleSaveFullCurriculum}
        />
      );
    } else if (curriculumMode === 'exam') {
      return (
        <ExamBuilder
          darkMode={darkMode}
          curriculumClassId={curriculumClassId}
          setCurriculumStep={setCurriculumStep}
          curriculumSemester={curriculumSemester}
          setCurriculumSemester={setCurriculumSemester}
          curriculumTitle={curriculumTitle}
          setCurriculumTitle={setCurriculumTitle}
          examDuration={examDuration}
          setExamDuration={setExamDuration}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          shuffleQuestions={shuffleQuestions}
          setShuffleQuestions={setShuffleQuestions}
          shuffleChoices={shuffleChoices}
          setShuffleChoices={setShuffleChoices}
          curriculumQuestions={curriculumQuestions}
          setCurriculumQuestions={setCurriculumQuestions}
          addCurriculumQuestion={addCurriculumQuestion}
          handleSaveFullCurriculum={handleSaveFullCurriculum}
        />
      );
    }
  }

  return null;
}