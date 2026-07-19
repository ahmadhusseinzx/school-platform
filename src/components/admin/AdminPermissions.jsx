import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, updateDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { Shield, Users, Save, RefreshCw, Loader2, Check, X } from 'lucide-react';

const PERMISSIONS_LIST = [
  { id: 'manageTeachers', label: 'إدارة المعلمين' },
  { id: 'manageStudents', label: 'إدارة الطلاب' },
  { id: 'manageClasses', label: 'إدارة الصفوف' },
  { id: 'manageSchedule', label: 'إدارة الجدول' },
  { id: 'manageGrades', label: 'إدارة العلامات' },
  { id: 'manageAttendance', label: 'إدارة الحضور' },
  { id: 'viewAll', label: 'عرض جميع البيانات' },
  { id: 'editAll', label: 'تعديل جميع البيانات' },
  { id: 'generateCertificates', label: 'إنشاء الشهادات' },
  { id: 'importStudents', label: 'استيراد الطلاب' }
];

export default function AdminPermissions() {
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'admin_assistant')),
      (snapshot) => {
        const adminList = [];
        snapshot.forEach(doc => {
          adminList.push({ id: doc.id, ...doc.data() });
        });
        setAdmins(adminList);
        if (adminList.length > 0 && !selectedAdmin) {
          setSelectedAdmin(adminList[0]);
          setPermissions(adminList[0].permissions || {});
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSelectAdmin = (admin) => {
    setSelectedAdmin(admin);
    setPermissions(admin.permissions || {});
  };

  const handleTogglePermission = (permissionId) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleSave = async () => {
    if (!selectedAdmin) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', selectedAdmin.id), {
        permissions: permissions,
        updatedAt: new Date().toISOString()
      });
      alert('تم حفظ الصلاحيات بنجاح!');
    } catch (error) {
      alert('خطأ في حفظ الصلاحيات: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          إدارة صلاحيات المساعدين
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          حفظ الصلاحيات
        </button>
      </div>

      {admins.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">لا يوجد مساعدين حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* قائمة المساعدين */}
          <div className="md:col-span-1">
            <h3 className="text-xs font-bold text-slate-400 mb-3">المساعدون</h3>
            <div className="space-y-2">
              {admins.map(admin => (
                <button
                  key={admin.id}
                  onClick={() => handleSelectAdmin(admin)}
                  className={`w-full text-right p-3 rounded-lg text-xs font-bold transition-all ${
                    selectedAdmin?.id === admin.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {admin.fullName}
                </button>
              ))}
            </div>
          </div>

          {/* الصلاحيات */}
          <div className="md:col-span-3">
            {selectedAdmin && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedAdmin.fullName}</h3>
                    <p className="text-xs text-slate-400">{selectedAdmin.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PERMISSIONS_LIST.map(perm => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800"
                    >
                      <span className="text-xs text-slate-300">{perm.label}</span>
                      <button
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`w-10 h-6 rounded-full transition-all ${
                          permissions[perm.id] ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-all ${
                            permissions[perm.id] ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}