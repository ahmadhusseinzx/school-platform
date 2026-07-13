import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../../../services/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';

export default function ClassesManager({ darkMode, classes, managementSelectedClass, setManagementSelectedClass }) {
  const [newClassName, setNewClassName] = useState("");

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      await addDoc(collection(db, "classes"), { name: newClassName });
      setNewClassName("");
    } catch (error) {
      alert("خطأ في إضافة الصف: " + error.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm("هل أنت متأكد من حذف هذا الصف؟ لن يتم حذف الطلاب.")) return;
    try {
      await deleteDoc(doc(db, "classes", classId));
      if (managementSelectedClass?.id === classId) setManagementSelectedClass(null);
    } catch (error) {
      alert("خطأ في حذف الصف: " + error.message);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      <h3 className="text-xs font-bold flex items-center gap-1">🏫 إدارة وتصفية الصفوف</h3>

      <form onSubmit={handleAddClass} className="flex gap-2">
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="اسم الصف الجديد"
          className="flex-1 p-2.5 rounded-lg text-xs bg-[#0f172a] border-slate-700 text-white"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg shadow transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </form>

      <div className="space-y-2 pt-2 border-t border-slate-700/30">
        <button
          onClick={() => setManagementSelectedClass(null)}
          className={`w-full text-right p-2.5 rounded-xl text-xs font-bold border ${
            !managementSelectedClass
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-[#0f172a] border-slate-800 text-slate-300'
          }`}
        >
          🌐 عرض كافة طلاب المدرسة
        </button>

        {classes.map(c => (
          <div key={c.id} className="flex gap-1 items-center">
            <button
              onClick={() => setManagementSelectedClass(c)}
              className={`flex-1 text-right p-2.5 rounded-xl text-xs font-bold border ${
                managementSelectedClass?.id === c.id
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#0f172a] border-slate-800 text-slate-300'
              }`}
            >
              🏫 {c.name}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClass(c.id)}
              className="p-2.5 bg-rose-955/20 hover:bg-rose-900 text-rose-500 border border-rose-900/30 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}