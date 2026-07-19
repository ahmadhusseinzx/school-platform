// src/components/admin/GradesManager/components/YearModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, Check, X } from 'lucide-react';

const YearModal = ({ 
  onStartYear, 
  onCancel, 
  loading 
}) => {
  const [yearInput, setYearInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const yearInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      if (yearInputRef.current) {
        yearInputRef.current.focus();
      }
    }, 100);
  }, []);

  const handleSubmit = async () => {
    if (!yearInput.trim()) {
      setError('❌ الرجاء إدخال العام الدراسي');
      return;
    }

    try {
      setVerifying(true);
      setError('');
      await onStartYear(yearInput.trim(), password);
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target === yearInputRef.current) {
        setTimeout(() => {
          if (passwordInputRef.current) {
            passwordInputRef.current.focus();
          }
        }, 50);
      } else if (e.target === passwordInputRef.current) {
        handleSubmit();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <Play className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">بدء العام الدراسي</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">العام الدراسي</label>
            <input
              ref={yearInputRef}
              type="text"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="مثال: 2026-2027"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoComplete="off"
            />
          </div>
          
          <div>
            <label className="block text-xs text-slate-400 mb-1">كلمة مرور الأدمن</label>
            <input
              ref={passwordInputRef}
              id="modal-password-input"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="أدخل كلمة المرور"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoComplete="off"
            />
            {error && (
              <p className="text-xs text-rose-400 mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSubmit}
              disabled={verifying}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحقق...</>
              ) : (
                <><Check className="w-4 h-4" /> بدء العام</>
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

export default YearModal;