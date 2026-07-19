import React from 'react';

export default function LoadingSpinner({ size = 'md', message }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size] || sizes.md} animate-spin rounded-full border-4 border-slate-700 border-t-blue-500`} />
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}