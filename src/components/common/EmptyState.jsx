import React from 'react';
import { Package } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Package, 
  title = 'لا توجد بيانات', 
  description = 'لم يتم العثور على أي بيانات لعرضها',
  action,
  actionLabel 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}