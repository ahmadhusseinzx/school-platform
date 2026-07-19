import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  User, 
  Search, 
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  Clock
} from 'lucide-react';

export default function Header({ toggleSidebar, userData, sidebarOpen }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', text: 'تم إضافة درس جديد', time: 'منذ 5 دقائق', read: false },
    { id: 2, type: 'warning', text: 'موعد تسليم الواجبات غداً', time: 'منذ ساعة', read: false },
    { id: 3, type: 'info', text: 'تم تحديث الجدول الدراسي', time: 'منذ يوم', read: true },
    { id: 4, type: 'success', text: 'تم تصحيح الامتحانات', time: 'منذ يومين', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ============ الحصول على أيقونة الإشعار ============
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'info':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  // ============ الحصول على اسم الدور ============
  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'مدير النظام';
      case 'admin_assistant': return 'مساعد مدير';
      case 'teacher': return 'معلم';
      case 'student': return 'طالب';
      default: return 'مستخدم';
    }
  };

  // ============ الحصول على لون الدور ============
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
      case 'admin_assistant':
        return 'text-blue-400';
      case 'teacher':
        return 'text-emerald-400';
      case 'student':
        return 'text-purple-400';
      default:
        return 'text-slate-400';
    }
  };

  // ============ قراءة الإشعار ============
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // ============ قراءة جميع الإشعارات ============
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // ============ إغلاق القوائم عند النقر خارجها ============
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
      if (showUserMenu && !e.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications, showUserMenu]);

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* ====== الجانب الأيمن ====== */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="تبديل القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* شريط البحث (يظهر فقط على الشاشات الكبيرة) */}
          <div className="hidden md:flex items-center bg-slate-900 rounded-lg px-3 py-2 border border-slate-700 focus-within:border-blue-500 transition-colors">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="بحث..."
              className="bg-transparent border-none outline-none text-sm text-white pr-2 w-48"
            />
          </div>
        </div>

        {/* ====== الجانب الأيسر ====== */}
        <div className="flex items-center gap-3">
          {/* ====== التاريخ والوقت ====== */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date().toLocaleDateString('ar')}</span>
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>{new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* ====== الإشعارات ====== */}
          <div className="relative notifications-container">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors relative"
              aria-label="الإشعارات"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* قائمة الإشعارات */}
            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 bg-slate-800 rounded-xl border border-slate-700 shadow-xl py-2 z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
                  <span className="text-xs font-bold text-slate-400">الإشعارات</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                    >
                      قراءة الكل
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                          !notif.read ? 'bg-slate-700/30' : ''
                        }`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notif.type)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${notif.read ? 'text-slate-400' : 'text-slate-200'}`}>
                              {notif.text}
                            </p>
                            <span className="text-[10px] text-slate-500">{notif.time}</span>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      لا توجد إشعارات
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ====== معلومات المستخدم ====== */}
          <div className="relative user-menu-container">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              aria-label="قائمة المستخدم"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                {userData?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-white">{userData?.fullName}</p>
                <p className={`text-[9px] ${getRoleColor(userData?.role)}`}>
                  {getRoleName(userData?.role)}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* قائمة المستخدم */}
            {showUserMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700 shadow-xl py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm font-bold text-white">{userData?.fullName}</p>
                  <p className={`text-xs ${getRoleColor(userData?.role)}`}>
                    {getRoleName(userData?.role)}
                  </p>
                  <p className="text-[10px] text-slate-400">{userData?.email}</p>
                </div>
                <Link
                  to={`/${userData?.role}/profile`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4" />
                  الملف الشخصي
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // سيتم تنفيذ تسجيل الخروج من المكون الأب
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-400 hover:bg-slate-700 transition-colors text-right"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// إضافة استيراد LogOut
import { LogOut } from 'lucide-react';