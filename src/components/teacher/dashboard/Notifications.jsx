import React from 'react';
import { Bell, AlertCircle, MessageSquare } from 'lucide-react';

export default function Notifications({ darkMode, notifications, markNotificationAsRead, snoozeNotification }) {
  return (
    <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
          <Bell className="w-4 h-4 animate-bounce" /> مركز التنبيهات الفورية
        </h3>
        <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full">
          {notifications.filter(n => !n.read).length} جديد
        </span>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pl-1">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-3 rounded-xl border flex flex-col gap-2 transition-all duration-200 ${
              notif.read ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-[#0f172a] border-slate-850 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-2">
              {notif.type === 'critical' ? (
                <div className="bg-rose-500/10 p-1 rounded-lg text-rose-500 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="bg-amber-500/10 p-1 rounded-lg text-amber-500 mt-0.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex-1">
                <p className={`text-xs font-semibold leading-relaxed ${notif.read ? 'text-slate-400' : 'text-slate-200'}`}>
                  {notif.text}
                </p>
                <span className="text-[9px] text-slate-500 block mt-1">{notif.time}</span>
              </div>
            </div>

            {!notif.read && (
              <div className="flex gap-2 justify-end border-t border-slate-800/60 pt-2 mt-1">
                <button
                  onClick={() => snoozeNotification(notif.id)}
                  className="text-[10px] text-slate-400 hover:text-slate-300 px-2 py-0.5 rounded bg-slate-800"
                >
                  تأجيل التنبيه
                </button>
                <button
                  onClick={() => markNotificationAsRead(notif.id)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-500/10"
                >
                  تمت القراءة
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}