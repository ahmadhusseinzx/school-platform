import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function LessonPreview({ darkMode, editIntro, editBlocks }) {
  return (
    <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-750' : 'bg-white border-slate-200'}`}>
      <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
        📋 معاينة محتويات الصفحة الموحدة للدرس
      </h3>
      <div className="p-5 rounded-xl border bg-[#0f172a] border-slate-850 space-y-5 text-sm text-slate-300">
        <div className="pb-4 border-b border-slate-850">
          <span className="text-xs font-bold text-blue-400 block mb-2">المقدمة والتهيئة:</span>
          <p className="italic text-slate-200 leading-relaxed bg-slate-900/40 p-3 rounded border border-slate-800">
            {editIntro ? `"${editIntro}"` : "لا توجد مقدمة مضافة لهذا الدرس بعد."}
          </p>
        </div>
        <div className="space-y-4 pt-1">
          <span className="text-xs font-bold text-purple-400 block mb-1">شرائح العرض والميديا المضمنة:</span>
          {editBlocks.map((block, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 font-extrabold block mb-1">[شريحة {i + 1}]:</span>
              {block.type === 'text' && (
                <div className="text-slate-100 font-medium leading-relaxed markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.value || "*لا يوجد محتوى مكتوب في هذه الشريحة حتى الآن.*"}</ReactMarkdown>
                </div>
              )}
              {block.type === 'note' && (
                <div className="border-r-4 border-amber-500 bg-amber-950/20 p-3 rounded border border-amber-900/30 text-slate-200 leading-relaxed font-medium">
                  <span className="font-black text-amber-400 block mb-1">💡 تنبيه وملاحظة هامة:</span>
                  {block.value || "لم يتم تدوين أي تنبيه."}
                </div>
              )}
              {block.type === 'image' && (
                <div className="flex flex-col items-start gap-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">🖼️ صورة تعليمية مصاحبة:</span>
                  <p className="text-slate-200 text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    <span className="text-slate-400">العنوان:</span> {block.title || "بدون عنوان"}
                  </p>
                  {block.url && (
                    <img
                      src={block.url}
                      alt={block.title}
                      className="max-h-40 rounded border border-slate-700 mt-1 object-contain bg-slate-900/50 p-1"
                    />
                  )}
                </div>
              )}
              {block.type === 'link' && (
                <div className="space-y-1">
                  <span className="text-purple-400 font-bold flex items-center gap-1">🔗 رابط تفاعلي خارجي:</span>
                  <a
                    href={block.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 underline hover:text-blue-300 font-semibold block text-xs"
                  >
                    {block.title || "اضغط هنا لفتح الرابط المرفق"}
                  </a>
                  {block.url && <p className="text-[10px] text-slate-500 font-mono text-left" dir="ltr">{block.url}</p>}
                </div>
              )}
            </div>
          ))}
          {editBlocks.length === 0 && <p className="text-xs text-slate-500 italic">لا توجد شرائح شرح مضافة للدرس بعد.</p>}
        </div>
      </div>
    </div>
  );
}