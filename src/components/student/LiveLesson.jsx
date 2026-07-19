import React, { useState, useEffect, useRef } from 'react';
import { Video, Maximize2, Minimize2, ZoomIn, ZoomOut, Eye, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function LiveLesson({ 
  liveLesson, 
  liveStep, 
  liveSlide, 
  liveBlocks, 
  liveIntro 
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const presentRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      presentRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!liveLesson) {
    return (
      <div className="bg-slate-800 rounded-2xl p-12 border border-slate-700 text-center">
        <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-400">لا توجد حصة مباشرة حالياً</h3>
        <p className="text-sm text-slate-500">انتظر بدء الحصة من قبل المعلم</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* معلومات الحصة */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              {liveLesson.title}
            </h3>
            <p className="text-xs text-slate-400">المعلم: {liveLesson.teacher}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              مباشر
            </span>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">
              {liveStep === 1 ? 'تمهيد' : liveStep === 2 ? 'شرح' : 'تقييم'}
            </span>
          </div>
        </div>
      </div>

      {/* شاشة العرض */}
      <div
        ref={presentRef}
        className={`bg-slate-900 rounded-2xl border border-slate-700 transition-all ${
          fullscreen ? 'fixed inset-0 z-[100] p-8 bg-slate-900' : 'p-6'
        }`}
      >
        {/* أدوات التحكم */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Eye className="w-4 h-4" />
            <span>شاشة العرض</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setFontSize(f => Math.max(14, f - 2))}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 px-2">{fontSize}px</span>
            <button
              onClick={() => setFontSize(f => Math.min(40, f + 2))}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* محتوى العرض */}
        <div
          className="min-h-[300px] flex items-center justify-center p-4"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
        >
          {liveStep === 1 && (
            <div className="text-right w-full">
              <p className="text-slate-200 font-medium">
                {liveIntro || '💡 جاري تحضير الدرس...'}
              </p>
            </div>
          )}

          {liveStep === 2 && liveBlocks && liveBlocks[liveSlide] && (
            <div className="w-full text-right">
              {liveBlocks[liveSlide].type === 'text' && (
                <div className="text-slate-200 markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {liveBlocks[liveSlide].value || 'لا يوجد محتوى'}
                  </ReactMarkdown>
                </div>
              )}
              {liveBlocks[liveSlide].type === 'note' && (
                <div className="border-r-4 border-amber-500 bg-amber-950/20 p-6 rounded-xl border border-amber-900/30">
                  <p className="text-amber-400 font-bold">💡 تنبيه وملاحظة هامة:</p>
                  <p className="text-slate-200 mt-2">{liveBlocks[liveSlide].value || 'لا توجد ملاحظات'}</p>
                </div>
              )}
              {liveBlocks[liveSlide].type === 'image' && (
                <div className="text-center">
                  {liveBlocks[liveSlide].url ? (
                    <>
                      <img
                        src={liveBlocks[liveSlide].url}
                        alt={liveBlocks[liveSlide].title || 'صورة تعليمية'}
                        className="max-h-[60vh] max-w-full object-contain rounded-xl mx-auto"
                      />
                      {liveBlocks[liveSlide].title && (
                        <p className="text-sm text-slate-400 mt-2">{liveBlocks[liveSlide].title}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-500">⚠️ لم يتم تحديد الصورة</p>
                  )}
                </div>
              )}
              {liveBlocks[liveSlide].type === 'link' && (
                <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-800 border-dashed">
                  <a
                    href={liveBlocks[liveSlide].url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 underline hover:text-purple-300 font-bold"
                  >
                    🔗 {liveBlocks[liveSlide].title || 'اضغط لفتح الرابط'}
                  </a>
                </div>
              )}
            </div>
          )}

          {liveStep === 3 && (
            <div className="text-center">
              <p className="text-2xl font-black text-purple-400 animate-pulse">
                🚀 وضع التقييم والامتحانات
              </p>
              <p className="text-sm text-slate-400 mt-2">استعد للإجابة على الأسئلة</p>
            </div>
          )}
        </div>

        {/* مؤشر التقدم */}
        {liveStep === 2 && liveBlocks && liveBlocks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>الشريحة {liveSlide + 1} من {liveBlocks.length}</span>
              <div className="flex gap-1">
                {liveBlocks.map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-1 rounded-full ${
                      i === liveSlide ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* عدد المشاهدين */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Users className="w-3.5 h-3.5" />
        <span>عدد المشاهدين: 12 طالب</span>
      </div>
    </div>
  );
}