import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد',
  message = 'هل أنت متأكد من هذا الإجراء؟',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'danger' // danger | warning | info
}) {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-rose-400 bg-rose-500/10',
          button: 'bg-rose-600 hover:bg-rose-700 text-white'
        };
      case 'warning':
        return {
          icon: 'text-amber-400 bg-amber-500/10',
          button: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      default:
        return {
          icon: 'text-blue-400 bg-blue-500/10',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${colors.icon}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm text-slate-400 mt-2">{message}</p>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 ${colors.button} rounded-lg text-sm font-bold transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}