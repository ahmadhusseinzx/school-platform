// src/components/admin/GradesManager/components/ConfirmModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Flag, Loader2, Check } from 'lucide-react';

const ConfirmModal = ({ 
  action, 
  academicYear,
  onConfirm, 
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 100);
  }, []);

  // ✅ دالة تحديد النص حسب نوع الإجراء
  const getActionLabels = () => {
    switch (action) {
      case 'close_semester1':
        return { 
          title: 'إغلاق الفصل الأول', 
          icon: Lock, 
          color: 'bg-amber-500/10 text-amber-400',
          message: 'سيتم إغلاق الفصل الأول ومنع أي تعديلات على العلامات. هل أنت متأكد؟',
          buttonText: 'تأكيد الإغلاق',
          buttonColor: 'bg-amber-600 hover:bg-amber-700'
        };
      case 'close_semester2':
        return { 
          title: 'إغلاق الفصل الثاني', 
          icon: Lock, 
          color: 'bg-amber-500/10 text-amber-400',
          message: 'سيتم إغلاق الفصل الثاني ومنع أي تعديلات على العلامات. هل أنت متأكد؟',
          buttonText: 'تأكيد الإغلاق',
          buttonColor: 'bg-amber-600 hover:bg-amber-700'
        };
      case 'open_semester1':
        return { 
          title: 'فتح الفصل الأول', 
          icon: Unlock, 
          color: 'bg-emerald-500/10 text-emerald-400',
          message: 'سيتم فتح الفصل الأول والسماح بتعديل العلامات. هل أنت متأكد؟',
          buttonText: 'تأكيد الفتح',
          buttonColor: 'bg-emerald-600 hover:bg-emerald-700'
        };
      case 'open_semester2':
        return { 
          title: 'فتح الفصل الثاني', 
          icon: Unlock, 
          color: 'bg-emerald-500/10 text-emerald-400',
          message: 'سيتم فتح الفصل الثاني والسماح بتعديل العلامات. هل أنت متأكد؟',
          buttonText: 'تأكيد الفتح',
          buttonColor: 'bg-emerald-600 hover:bg-emerald-700'
        };
      case 'close_year':
        return { 
          title: 'إغلاق العام الدراسي', 
          icon: Flag, 
          color: 'bg-rose-500/10 text-rose-400',
          message: `سيتم إغلاق العام الدراسي ${academicYear} بالكامل. هل أنت متأكد؟`,
          buttonText: 'تأكيد الإغلاق',
          buttonColor: 'bg-rose-600 hover:bg-rose-700'
        };
      default:
        return { 
          title: 'تأكيد الإجراء', 
          icon: Lock, 
          color: 'bg-blue-500/10 text-blue-400',
          message: 'تأكيد الإجراء',
          buttonText: 'تأكيد',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const labels = getActionLabels();
  const Icon = labels.icon;

  const handleConfirm = async () => {
    try {
      setVerifying(true);
      setError('');
      await onConfirm(password);
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${labels.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">{labels.title}</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-400">{labels.message}</p>
          
          <div>
            <label className="block text-xs text-slate-400 mb-1">كلمة مرور الأدمن</label>
            <input
              ref={passwordInputRef}
              id="confirm-password-input"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="أدخل كلمة المرور للتأكيد"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoComplete="off"
            />
            {error && (
              <p className="text-xs text-rose-400 mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleConfirm}
              disabled={verifying}
              className={`flex-1 py-2.5 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${labels.buttonColor}`}
            >
              {verifying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحقق...</>
              ) : (
                <><Check className="w-4 h-4" /> {labels.buttonText}</>
              )}
            </button>
            <button
              onClick={onCancel}
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

export default ConfirmModal;