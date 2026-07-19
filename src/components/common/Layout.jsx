import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const { userData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // تحديد لون الخلفية حسب الدور
  const getBgColor = () => {
    switch (userData?.role) {
      case 'admin':
      case 'admin_assistant':
        return 'from-slate-900 to-slate-800';
      case 'teacher':
        return 'from-slate-900 to-blue-950/30';
      case 'student':
        return 'from-slate-900 to-purple-950/30';
      default:
        return 'from-slate-900 to-slate-800';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBgColor()} text-white`} dir="rtl">
      {/* الشريط الجانبي */}
      <Sidebar
        isOpen={sidebarOpen}
        toggle={() => setSidebarOpen(!sidebarOpen)}
        userRole={userData?.role}
        userData={userData}
      />

      {/* المحتوى الرئيسي */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'mr-64' : 'mr-0'}`}>
        <Header
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userData={userData}
          sidebarOpen={sidebarOpen}
        />
        
        <main className="p-4 md:p-6 min-h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}