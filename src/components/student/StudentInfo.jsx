import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateUserData } from '../../services/auth';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, Loader2 } from 'lucide-react';

export default function StudentInfo() {
  const { userData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    dateOfBirth: userData?.dateOfBirth || '',
    parentPhone: userData?.parentPhone || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateUserData(userData.uid, formData);
      setEditing(false);
      alert('تم تحديث البيانات بنجاح!');
    } catch (error) {
      alert('حدث خطأ في تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  const InfoField = ({ icon: Icon, label, value, name, type = 'text' }) => (
    <div className="flex items-center gap-4 p-3 bg-slate-900 rounded-lg border border-slate-800">
      <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-slate-500">{label}</p>
        {editing ? (
          <input
            type={type}
            name={name}
            value={formData[name] || ''}
            onChange={handleChange}
            className="w-full bg-transparent text-white text-sm focus:outline-none border-b border-slate-700"
          />
        ) : (
          <p className="text-sm text-white">{value || 'غير محدد'}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          معلوماتي الشخصية
        </h2>
        <div className="flex gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              تعديل
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                حفظ
              </button>
              <button
                onClick={() => { setEditing(false); setFormData(userData); }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl text-xs font-bold transition-all"
              >
                <X className="w-3.5 h-3.5" />
                إلغاء
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* صورة الملف الشخصي */}
        <div className="flex items-center gap-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white">
            {userData?.fullName?.charAt(0) || 'S'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{userData?.fullName}</h3>
            <p className="text-sm text-slate-400">طالب</p>
            {userData?.studentId && (
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                رقم الطالب: {userData.studentId}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField icon={User} label="الاسم الكامل" value={userData?.fullName} name="fullName" />
          <InfoField icon={Mail} label="البريد الإلكتروني" value={userData?.email} name="email" type="email" />
          <InfoField icon={Phone} label="رقم الهاتف" value={userData?.phone} name="phone" type="tel" />
          <InfoField icon={Phone} label="هاتف ولي الأمر" value={userData?.parentPhone} name="parentPhone" type="tel" />
          <InfoField icon={Calendar} label="تاريخ الميلاد" value={userData?.dateOfBirth} name="dateOfBirth" type="date" />
          <InfoField icon={MapPin} label="العنوان" value={userData?.address} name="address" />
        </div>
      </div>
    </div>
  );
}