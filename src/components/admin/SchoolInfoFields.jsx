// src/components/admin/SchoolInfoFields.jsx

import React, { memo, useRef, useState } from 'react';
import { 
  Building, MapPin, Calendar, UserCog, 
  FileText, Settings, Globe, Phone, Mail,
  Award, Star, BookOpen, Users, Shield, Crown,
  Image, Upload, X, Loader2
} from 'lucide-react';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// ====== ✅ مكون حقل الإدخال (مع memo ومنع إعادة التصيير غير الضرورية) ======
const InputField = memo(({ 
  icon: Icon, 
  label, 
  name, 
  placeholder, 
  type = 'text', 
  required = false,
  value,
  editing,
  onFieldChange
}) => {
  const handleChange = React.useCallback((e) => {
    onFieldChange(name, e.target.value);
  }, [name, onFieldChange]);

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
      <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-slate-500">
          {label}
          {required && <span className="text-rose-400 mr-1">*</span>}
        </p>
        {editing ? (
          <input
            type={type}
            name={name}
            value={value || ''}
            onChange={handleChange}
            className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-slate-700 focus:border-emerald-500 transition-colors"
            placeholder={placeholder}
          />
        ) : (
          <p className="text-sm text-white">{value || 'غير محدد'}</p>
        )}
      </div>
    </div>
  );
});

InputField.displayName = 'InputField';

// ====== ✅ مكون حقل نصي طويل ======
const TextAreaField = memo(({ 
  icon: Icon, 
  label, 
  name, 
  placeholder, 
  rows = 3,
  value,
  editing,
  onFieldChange
}) => {
  const handleChange = React.useCallback((e) => {
    onFieldChange(name, e.target.value);
  }, [name, onFieldChange]);

  return (
    <div className="flex items-start gap-4 p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
      <div className="p-2 bg-slate-800 rounded-lg text-emerald-400 mt-1">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-slate-500">{label}</p>
        {editing ? (
          <textarea
            name={name}
            value={value || ''}
            onChange={handleChange}
            rows={rows}
            className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-slate-700 focus:border-emerald-500 transition-colors resize-none"
            placeholder={placeholder}
          />
        ) : (
          <p className="text-sm text-white leading-relaxed">{value || 'غير محدد'}</p>
        )}
      </div>
    </div>
  );
});

TextAreaField.displayName = 'TextAreaField';

// ====== ✅ مكون رفع الشعار ======
const LogoUploader = memo(({ editing, logoUrl, onLogoUpload, onLogoRemove, uploading }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      alert('⚠️ الرجاء اختيار ملف صورة صالح (jpg, png, gif, svg)');
      return;
    }

    // التحقق من حجم الملف (أقصى 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('⚠️ حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
      return;
    }

    await onLogoUpload(file);
  };

  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
          <Image className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-slate-500">شعار المدرسة</p>
          
          {editing ? (
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {logoUrl ? (
                <div className="relative">
                  <img 
                    src={logoUrl} 
                    alt="شعار المدرسة" 
                    className="w-16 h-16 object-contain rounded-lg border border-slate-700 bg-white/5"
                  />
                  <button
                    onClick={onLogoRemove}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 p-1 bg-rose-600 hover:bg-rose-700 rounded-full text-white transition-all disabled:opacity-50"
                    title="حذف الشعار"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-slate-500">
                  <Image className="w-6 h-6" />
                </div>
              )}
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> جاري الرفع...</>
                ) : (
                  <><Upload className="w-3 h-3" /> {logoUrl ? 'تغيير الشعار' : 'رفع شعار'}</>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-1">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="شعار المدرسة" 
                  className="w-16 h-16 object-contain rounded-lg border border-slate-700 bg-white/5"
                />
              ) : (
                <p className="text-sm text-slate-400">لا يوجد شعار</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LogoUploader.displayName = 'LogoUploader';

// ====== المكون الرئيسي للحقول ======
export default function SchoolInfoFields({ editing, schoolInfo, onFieldChange }) {
  const [uploading, setUploading] = useState(false);

  // ============ رفع الشعار إلى Firebase Storage ============
  const handleLogoUpload = async (file) => {
    try {
      setUploading(true);
      
      // إنشاء مسار فريد للصورة
      const storageRef = ref(storage, `school-logos/logo_${Date.now()}.${file.name.split('.').pop()}`);
      
      // رفع الملف
      const snapshot = await uploadBytes(storageRef, file);
      
      // الحصول على رابط التحميل
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // تحديث حالة المكون الأب
      onFieldChange('logo', downloadURL);
      
    } catch (error) {
      console.error('❌ خطأ في رفع الشعار:', error);
      alert('❌ حدث خطأ في رفع الشعار: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // ============ حذف الشعار ============
  const handleLogoRemove = async () => {
    if (!schoolInfo.logo) return;
    
    if (!confirm('⚠️ هل أنت متأكد من حذف شعار المدرسة؟')) return;
    
    try {
      setUploading(true);
      
      // استخراج المسار من الرابط
      const path = schoolInfo.logo.split('/o/')[1]?.split('?')[0];
      if (path) {
        const storageRef = ref(storage, decodeURIComponent(path));
        await deleteObject(storageRef);
      }
      
      // تحديث حالة المكون الأب
      onFieldChange('logo', null);
      
    } catch (error) {
      console.error('❌ خطأ في حذف الشعار:', error);
      alert('❌ حدث خطأ في حذف الشعار: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* ====== شعار المدرسة ====== */}
      <div className="md:col-span-2">
        <LogoUploader 
          editing={editing}
          logoUrl={schoolInfo.logo}
          onLogoUpload={handleLogoUpload}
          onLogoRemove={handleLogoRemove}
          uploading={uploading}
        />
      </div>

      {/* ====== القسم الأول: معلومات أساسية ====== */}
      <InputField 
        icon={Building} 
        label="اسم المدرسة" 
        name="schoolName" 
        placeholder="مدرسة الجيل الجديد"
        required={true}
        value={schoolInfo.schoolName}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={MapPin} 
        label="عنوان المدرسة" 
        name="schoolAddress" 
        placeholder="حافظة القدس - أبو ديس"
        value={schoolInfo.schoolAddress}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={Calendar} 
        label="سنة التأسيس" 
        name="establishmentYear" 
        placeholder="1999"
        value={schoolInfo.establishmentYear}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={UserCog} 
        label="اسم المدير/ة" 
        name="principalName" 
        placeholder="منال عريقات"
        value={schoolInfo.principalName}
        editing={editing}
        onFieldChange={onFieldChange}
      />

      {/* ====== القسم الثاني: معلومات الاتصال ====== */}
      <InputField 
        icon={Phone} 
        label="رقم الهاتف" 
        name="phone" 
        placeholder="0591234567"
        type="tel"
        value={schoolInfo.phone}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={Mail} 
        label="البريد الإلكتروني" 
        name="email" 
        placeholder="info@school.edu"
        type="email"
        value={schoolInfo.email}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={Globe} 
        label="الموقع الإلكتروني" 
        name="website" 
        placeholder="www.school.edu"
        value={schoolInfo.website}
        editing={editing}
        onFieldChange={onFieldChange}
      />

      {/* ====== القسم الثالث: الشعار والرؤية ====== */}
      <InputField 
        icon={Award} 
        label="شعار المدرسة" 
        name="motto" 
        placeholder="بالعلم نرتقي"
        value={schoolInfo.motto}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={Shield} 
        label="نوع المدرسة" 
        name="schoolType" 
        placeholder="خاص"
        value={schoolInfo.schoolType}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={Users} 
        label="الصفوف الدراسية" 
        name="gradeLevels" 
        placeholder="1-12"
        value={schoolInfo.gradeLevels}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={Crown} 
        label="نظام التعليم" 
        name="gender" 
        placeholder="مختلط"
        value={schoolInfo.gender}
        editing={editing}
        onFieldChange={onFieldChange}
      />

      {/* ====== القسم الرابع: نصوص الشهادات ====== */}
      <InputField 
        icon={FileText} 
        label="نص الترويسة" 
        name="headerText" 
        placeholder="النتائج المدرسية"
        value={schoolInfo.headerText}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={Settings} 
        label="نص التذييل" 
        name="footerText" 
        placeholder="معاً نحو مستقبل أفضل"
        value={schoolInfo.footerText}
        editing={editing}
        onFieldChange={onFieldChange}
      />

      {/* ====== القسم الخامس: الرؤية والرسالة ====== */}
      <TextAreaField 
        icon={Star} 
        label="الرؤية" 
        name="vision" 
        placeholder="الريادة في التعليم"
        rows={2}
        value={schoolInfo.vision}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <TextAreaField 
        icon={BookOpen} 
        label="الرسالة" 
        name="mission" 
        placeholder="تخريج جيل واعٍ ومثقف"
        rows={2}
        value={schoolInfo.mission}
        editing={editing}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}