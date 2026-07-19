import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../services/auth';
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  Calendar,
  ClipboardList,
  UserCheck,
  FileText,
  Settings,
  LogOut,
  User,
  GraduationCap,
  Video,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Award,
  Sparkles,
  Bell
} from 'lucide-react';

export default function Sidebar({ isOpen, toggle, userRole, userData }) {
  const location = useLocation();
  const navigate = useNavigate();

  // ============ تعريف القوائم حسب الدور ============
  const menuItems = {
    admin: [
      { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/admin' },
      { icon: Users, label: 'المعلمين', path: '/admin/teachers' },
      { icon: Users, label: 'الطلاب', path: '/admin/students' },
      { icon: School, label: 'الصفوف', path: '/admin/classes' },
      { icon: Calendar, label: 'الجدول الزمني', path: '/admin/schedule' },
      { icon: ClipboardList, label: 'العلامات', path: '/admin/grades' },
      { icon: UserCheck, label: 'الحضور', path: '/admin/attendance' },
      { icon: FileText, label: 'الشهادات', path: '/admin/certificates' },
      { icon: Settings, label: 'الصلاحيات', path: '/admin/permissions' },
      { icon: User, label: 'معلوماتي', path: '/admin/profile' },
    ],
    teacher: [
      { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/teacher' },
      { icon: BookOpen, label: 'الدروس', path: '/teacher/lessons' },
      { icon: Video, label: 'البث المباشر', path: '/teacher/live' },
      { icon: ClipboardList, label: 'الامتحانات', path: '/teacher/exams' },
      { icon: BarChart3, label: 'العلامات', path: '/teacher/grades' },
      { icon: Users, label: 'الطلاب', path: '/teacher/students' },
      { icon: Sparkles, label: 'الذكاء الاصطناعي', path: '/teacher/ai' },
      { icon: User, label: 'معلوماتي', path: '/teacher/profile' },
    ],
    student: [
      { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/student' },
      { icon: BookOpen, label: 'موادي', path: '/student/subjects' },
      { icon: Video, label: 'الحصة المباشرة', path: '/student/live' },
      { icon: Award, label: 'علاماتي', path: '/student/grades' },
      { icon: UserCheck, label: 'حضوري', path: '/student/attendance' },
      { icon: MessageSquare, label: 'أسئلتي', path: '/student/questions' },
      { icon: User, label: 'معلوماتي', path: '/student/profile' },
    ]
  };

  const items = menuItems[userRole] || menuItems.student;

  // ============ معالجة تسجيل الخروج ============
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  // ============ الحصول على اسم الدور بالعربية ============
  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'مدير النظام';
      case 'admin_assistant': return 'مساعد مدير';
      case 'teacher': return 'معلم';
      case 'student': return 'طالب';
      default: return 'مستخدم';
    }
  };

  // ============ الحصول على أيقونة الدور ============
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
      case 'admin_assistant':
        return <GraduationCap className="w-5 h-5 text-blue-400" />;
      case 'teacher':
        return <Users className="w-5 h-5 text-emerald-400" />;
      case 'student':
        return <User className="w-5 h-5 text-purple-400" />;
      default:
        return <User className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full bg-slate-800 border-l border-slate-700 transition-all duration-300 z-50 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* ====== الشعار ====== */}
      <div className={`flex items-center h-16 px-3 border-b border-slate-700 ${isOpen ? 'justify-between' : 'justify-center'}`}>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-blue-500" />
          {isOpen && (
            <div>
              <span className="text-sm font-black text-white block">المنصة الذكية</span>
              <span className="text-[8px] text-slate-400">نظام إدارة المدرسة</span>
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ====== معلومات المستخدم ====== */}
      {isOpen && userData && (
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {userData.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{userData.fullName}</p>
              <p className="text-[10px] text-slate-400">{getRoleName(userData.role)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ====== القائمة ====== */}
      <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
        {items.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              } ${!isOpen && 'justify-center'}`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ====== زر تسجيل الخروج ====== */}
      <div className="absolute bottom-3 w-full px-2">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-rose-400 hover:bg-rose-500/10 ${
            !isOpen && 'justify-center'
          }`}
        >
          <LogOut className="w-5 h-5" />
          {isOpen && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </div>
  );
}