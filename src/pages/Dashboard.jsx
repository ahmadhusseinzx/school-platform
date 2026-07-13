import React from 'react';
// استيراد أدوات الأنميشن
import { motion } from 'framer-motion';
// استيراد الأيقونات التكنولوجية والتعليمية
import { Laptop, LogOut, Clock, Award, CheckCircle, BookOpen, HelpCircle, FileText, Play, Eye, Lock, Check } from 'lucide-react';

export default function Dashboard({ studentName, onLogout }) {
  
  // بيانات تجريبية للحصص (سيتم ربطها بـ Firebase Firestore لاحقاً)
  const lessons = [
    {
      id: 1,
      unit: "الوحدة الثانية: المنطق الرقمي",
      title: "درس البوابات المنطقية (Logic Gates)",
      desc: "تعرف على بوابات AND, OR, NOT وكيفية بناء الدوائر الإلكترونية المعقدة بدمجها معاً.",
      status: "live", // مباشر الآن
      questions: 5,
      hasSummary: true,
    },
    {
      id: 2,
      unit: "الوحدة الأولى: الثورة الرقمية",
      title: "تطور الأجهزة الطبية عبر العصور",
      desc: "دراسة الأثر التكنولوجي في تطوير أجهزة تنظيم ضربات القلب ومضخات الأنسولين الذكية.",
      status: "completed", // مكتملة ومصححة
      grade: "10/10",
      time: "الأسبوع الماضي"
    },
    {
      id: 3,
      unit: "الوحدة الثالثة: النظم المدمجة",
      title: "مقدمة في متحكمات الأردوينو (Arduino)",
      desc: "فهم معمارية الـ Microcontrollers وكيفية ربط الحساسات والمحركات ميكانيكياً وبرمجياً.",
      status: "locked", // مغلقة بطلب المعلم
      time: "الحصة القادمة"
    }
  ];

  // إعدادات أنميشن الحاوية الرئيسية لتأثير ظهور البطاقات بالتتابع
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15 // الفارق الزمني بين ظهور كل بطاقة وأخرى
      }
    }
  };

  // إعدادات أنميشن كل بطاقة فردية
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none" dir="rtl">
      
      {/* 1. شريط التنقل العلوي (Navbar) مع أنميشن هبوط سلس */}
      <motion.nav 
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-100">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-slate-900">منصة التكنولوجيا الرقمية</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-700">الطالب: {studentName || 'أحمد حسين'}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">الصف التاسع</span>
              </div>
              <button 
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* 2. المحتوى الرئيسي */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* العناوين الرئيسية بـ Fade-in */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900">مرحباً بك مجدداً 👋</h2>
          <p className="text-slate-500 text-sm mt-1">تابع دروسك التكنولوجية وأنجز تمارينك لتطور مهاراتك الهندسية.</p>
        </motion.div>

        {/* كروت الإحصائيات مع أنميشن دخول متحرك */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {[
            { icon: <Clock className="w-6 h-6" />, title: "الوقت المستغرق بالدراسة", val: "4 ساعات و 12 دقيقة", bg: "bg-blue-50 text-blue-600" },
            { icon: <Award className="w-6 h-6" />, title: "معدل التقييمات الحالي", val: "92% (ممتاز)", bg: "bg-amber-50 text-amber-600" },
            { icon: <CheckCircle className="w-6 h-6" />, title: "الحصص المكتملة", val: "7 من أصل 8 حصص", bg: "bg-emerald-50 text-emerald-600" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className={`p-3 rounded-xl ${stat.bg}`}>{stat.icon}</div>
              <div>
                <p class="text-xs text-slate-400 font-semibold">{stat.title}</p>
                <p class="text-lg font-bold text-slate-800 mt-0.5">{stat.val}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* عنوان قسم الدروس */}
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-blue-600 w-5 h-5" />
            <span>الدروس والحصص المتاحة</span>
          </h3>
        </div>

        {/* شبكة عرض بطاقات الحصص مع تفعيل تأثير التتابع (Stagger) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {lessons.map((lesson) => (
            <motion.div
              key={lesson.id}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden relative flex flex-col justify-between ${
                lesson.status === 'live' ? 'border-2 border-blue-500 shadow-blue-50/50 shadow-md' : 'border-slate-200'
              } ${lesson.status === 'locked' ? 'opacity-60' : ''}`}
            >
              {/* شارة البث المباشر */}
              {lesson.status === 'live' && (
                <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> مباشر الآن
                </div>
              )}

              <div className="p-6">
                <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-md ${
                  lesson.status === 'live' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 bg-slate-100'
                }`}>
                  {lesson.unit}
                </span>
                
                <h4 className="text-lg font-bold text-slate-900 mt-4 leading-snug">{lesson.title}</h4>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed line-clamp-2">{lesson.desc}</p>
                
                {/* التفاصيل السفلية لكل بطاقة */}
                <div className="border-t border-slate-100 my-4 pt-4 flex items-center justify-between text-xs text-slate-400">
                  {lesson.status === 'live' && (
                    <>
                      <span className="flex items-center gap-1"><HelpCircle className="w-4 h-4" /> {lesson.questions} أسئلة تقييمية</span>
                      <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> ملخص ذكي متاح</span>
                    </>
                  )}
                  {lesson.status === 'completed' && (
                    <>
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5"><Check className="w-4 h-4" /> العلامة: {lesson.grade}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {lesson.time}</span>
                    </>
                  )}
                  {lesson.status === 'locked' && (
                    <>
                      <span className="flex items-center gap-1 text-slate-400"><Lock className="w-3.5 h-3.5" /> تفتح بأمر المعلم</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {lesson.time}</span>
                    </>
                  )}
                </div>
              </div>

              {/* أزرار التفاعل المقابلة لحالة الحصة */}
              <div className="px-6 pb-6 pt-0">
                {lesson.status === 'live' && (
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2">
                    <span>دخول الحصة التفاعلية</span>
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                )}
                {lesson.status === 'completed' && (
                  <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
                    <span>مراجعة الدرس والدرجات</span>
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {lesson.status === 'locked' && (
                  <button disabled className="w-full bg-slate-100 text-slate-400 font-medium py-2.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>مغلقة حالياً</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}