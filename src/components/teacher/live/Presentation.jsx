import React, { useState, useRef, useEffect } from 'react';
import { Eye, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Presentation({
  currentStep,
  editIntro,
  editBlocks,
  currentSlide,
  presentFullscreen,
  setPresentFullscreen,
  presentRef
}) {
  const [presentFontSize, setPresentFontSize] = useState(24);

  const togglePresentFullscreen = () => {
    if (!document.fullscreenElement) {
      presentRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onFsChange = () => setPresentFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [setPresentFullscreen]);

  return (
    <div
      ref={presentRef}
      className={`rounded-2xl border space-y-5 bg-[#0b0f19] border-slate-880 transition-all duration-300 ${
        presentFullscreen ? 'fixed inset-0 z-[100] p-10 flex flex-col justify-between overflow-y-auto bg-[#0b0f19]' : 'p-6'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800/60 pb-3">
        <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2">
          <Eye className="w-4 h-4" /> شاشة العرض الكبيرة (للشرح على جهاز العرض)
        </h3>
        <div className="flex items-center gap-2 select-none">
          <button
            type="button"
            onClick={togglePresentFullscreen}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
          >
            {presentFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <div className="h-4 w-[1px] bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={() => setPresentFontSize(f => Math.max(16, f - 2))}
            className="p-2 bg-[#1e293b] border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-300 bg-[#151f32] px-3 py-1 rounded-lg border border-slate-700 min-w-[50px] text-center">
            {presentFontSize}px
          </span>
          <button
            type="button"
            onClick={() => setPresentFontSize(f => Math.min(60, f + 2))}
            className="p-2 bg-[#1e293b] border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className={`rounded-xl border p-8 min-h-[320px] bg-[#0f172a] border-slate-880 flex items-center justify-center transition-all ${
          presentFullscreen ? 'flex-1 my-4' : ''
        }`}
      >
        {currentStep === 1 && (
          <div style={{ fontSize: `${presentFontSize}px`, lineHeight: 1.8 }} className="w-full text-right whitespace-pre-line text-slate-100 font-medium border border-dashed border-slate-700/65 p-6 rounded-xl bg-slate-900/40 shadow-inner">
            {editIntro ? `"${editIntro}"` : "💡 لا يوجد تمهيد أو افتتاحية مضافة لهذا الدرس حتى الآن."}
          </div>
        )}
        {currentStep === 2 && editBlocks && editBlocks[currentSlide] && (
          <div style={{ fontSize: `${presentFontSize}px`, lineHeight: 1.7 }} className="w-full text-right selection:bg-blue-500/30">
            {editBlocks[currentSlide].type === 'text' && (
              <div className="text-slate-200 leading-relaxed font-semibold markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{editBlocks[currentSlide].value || "لا توجد نصوص في هذه الشريحة."}</ReactMarkdown>
              </div>
            )}
            {editBlocks[currentSlide].type === 'note' && (
              <div className="space-y-4 border-r-4 border-amber-500 bg-amber-950/20 p-6 rounded-xl border border-amber-900/30 shadow-sm animate-fade-in">
                <div className="flex items-center gap-2 text-amber-400 font-black text-[1.05em]">
                  <span>💡</span><span>تنبيه وملاحظة هامة:</span>
                </div>
                <p className="text-slate-200 mt-2 font-medium leading-relaxed">{editBlocks[currentSlide].value || "لم يتم كتابة نص التنبيه بعد."}</p>
              </div>
            )}
            {editBlocks[currentSlide].type === 'image' && (
              <div className="space-y-3 text-center flex flex-col items-center justify-center">
                {editBlocks[currentSlide].url ? (
                  <>
                    <img
                      src={editBlocks[currentSlide].url}
                      alt={editBlocks[currentSlide].title || "معاينة الصورة"}
                      className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-750 p-1 bg-slate-900/50"
                    />
                    {editBlocks[currentSlide].title && (
                      <p className="text-sm text-slate-400 font-bold mt-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                        {editBlocks[currentSlide].title}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-slate-500 text-sm py-8">⚠️ لم يتم تحديد رابط الصورة بشكل صحيح.</div>
                )}
              </div>
            )}
            {editBlocks[currentSlide].type === 'link' && (
              <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                <a
                  href={editBlocks[currentSlide].url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 text-purple-400 underline hover:text-purple-350 font-black transition-colors transform hover:scale-105 duration-200"
                >
                  <span>🔗</span>
                  <span>{editBlocks[currentSlide].title || "انقر هنا لفتح الرابط التفاعلي المرفق"}</span>
                </a>
                {editBlocks[currentSlide].url && (
                  <p className="text-xs text-slate-500 mt-3 font-mono dir-ltr">{editBlocks[currentSlide].url}</p>
                )}
              </div>
            )}
          </div>
        )}
        {currentStep === 3 && (
          <div style={{ fontSize: `${presentFontSize + 2}px` }} className="text-center font-black text-purple-400 max-w-2xl px-6 leading-loose animate-pulse">
            🚀 وضع التقييم والامتحانات الفورية نشط الآن.
            <span className="block text-slate-400 text-sm font-normal mt-3">يرجى من جميع الطلاب التوجه لشاشاتهم لبدء الإجابة.</span>
          </div>
        )}
      </div>
    </div>
  );
}