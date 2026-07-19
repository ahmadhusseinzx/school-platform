// src/components/admin/AdminInfoFields.jsx

import React, { memo, useCallback } from 'react';
import { User, Mail, Phone, MapPin, FileText } from 'lucide-react';

const InputField = memo(({ 
  icon: Icon, 
  label, 
  name, 
  type = 'text', 
  required = false,
  value,
  editing,
  onFieldChange,
  disabled = false,
  rows = 1
}) => {
  const handleChange = useCallback((e) => {
    if (onFieldChange) {
      onFieldChange(name, e.target.value);
    }
  }, [name, onFieldChange]);

  // ✅ إذا كان rows > 1، استخدم textarea
  const isTextArea = rows > 1;

  return (
    <div className="flex items-start gap-4 p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
      <div className={`p-2 bg-slate-800 rounded-lg text-blue-400 ${isTextArea ? 'mt-1' : ''}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-slate-500">
          {label}
          {required && <span className="text-rose-400 mr-1">*</span>}
        </p>
        {editing ? (
          isTextArea ? (
            <textarea
              name={name}
              value={value || ''}
              onChange={handleChange}
              rows={rows}
              className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-slate-700 focus:border-blue-500 transition-colors resize-none"
              placeholder={`أدخل ${label}`}
              disabled={disabled}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={value || ''}
              onChange={handleChange}
              className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-slate-700 focus:border-blue-500 transition-colors"
              placeholder={`أدخل ${label}`}
              disabled={disabled}
            />
          )
        ) : (
          <p className="text-sm text-white whitespace-pre-line">{value || 'غير محدد'}</p>
        )}
      </div>
    </div>
  );
});

InputField.displayName = 'InputField';

export default function AdminInfoFields({ editing, userInfo, onFieldChange }) {
  const safeUserInfo = userInfo || {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField 
        icon={User} 
        label="الاسم الكامل" 
        name="fullName" 
        required={true}
        value={safeUserInfo.fullName}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={Mail} 
        label="البريد الإلكتروني" 
        name="email" 
        type="email"
        value={safeUserInfo.email}
        editing={editing}
        onFieldChange={onFieldChange}
        disabled={true}
      />
      <InputField 
        icon={Phone} 
        label="رقم الهاتف" 
        name="phone" 
        type="tel"
        value={safeUserInfo.phone}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      <InputField 
        icon={MapPin} 
        label="العنوان" 
        name="address" 
        value={safeUserInfo.address}
        editing={editing}
        onFieldChange={onFieldChange}
      />
      
      {/* ✅ حقل السيرة الذاتية - يظهر في الصف الثاني كامل العرض */}
      <div className="md:col-span-2">
        <InputField 
          icon={FileText} 
          label="السيرة الذاتية" 
          name="bio" 
          value={safeUserInfo.bio}
          editing={editing}
          onFieldChange={onFieldChange}
          rows={3}
        />
      </div>
    </div>
  );
}