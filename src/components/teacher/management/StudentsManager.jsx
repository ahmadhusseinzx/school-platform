import React, { useState } from 'react';
import { db } from '../../../services/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { UserPlus, Plus } from 'lucide-react';

export default function StudentsManager({ darkMode, classes, students, managementSelectedClass }) {
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClassId, setNewStudentClassId] = useState("");

  const filteredStudents = managementSelectedClass
    ? students.filter(s => s.classId === managementSelectedClass.id)
    : students;

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentClassId) return;
    try {
      await addDoc(collection(db, "users"), {
        fullName: newStudentName,
        email: `${Date.now()}@school.com`,
        classId: newStudentClassId,
        role: 'student'
      });
      setNewStudentName("");
    } catch (error) {
      alert("خطأ في قيد الطالب: " + error.message);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!confirm("حذف حساب الطالب؟")) return;
    try {
      await deleteDoc(doc(db, "users", studentId));
    } catch (error) {
      alert("خطأ في حذف الطالب: " + error.message);
    }
  };

  return (
    <div className={`lg:col-span-2 p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      <h3 className="text-xs font-bold flex items-center gap-1">
        <UserPlus className="w-4 h-4" /> تسجيل وقيد طالب جديد
      </h3>

      <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border bg-slate-900/30 border-slate-800 items-end">
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400">اسم الطالب الكامل:</label>
          <input
            type="text"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            placeholder="اسم الطالب"
            className="w-full p-2.5 rounded-lg text-xs bg-[#0f172a] text-white border-slate-700"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400">تسكين الصف المرتبط:</label>
          <select
            value={newStudentClassId}
            onChange={(e) => setNewStudentClassId(e.target.value)}
            className="w-full p-2.5 rounded-lg text-xs bg-[#0f172a] text-white border-slate-700"
          >
            <option value="">-- اختر الصف --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all">
          <Plus className="w-3.5 h-3.5" /> قيد الطالب
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="p-2.5">اسم الطالب الكامل</th>
              <th className="p-2.5">الصف الأكاديمي المرتبط</th>
              <th className="p-2.5 text-center">العمليات</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(std => {
              const associatedClass = classes.find(c => c.id === std.classId);
              return (
                <tr key={std.id} className="border-b border-slate-800/60 hover:bg-slate-850/20">
                  <td className="p-2.5 font-bold text-slate-200">{std.fullName}</td>
                  <td className="p-2.5 text-blue-400 font-semibold">
                    {associatedClass ? associatedClass.name : "غير مسكن بصف"}
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleDeleteStudent(std.id)}
                      className="text-rose-400 hover:text-rose-500 font-bold hover:underline transition-all"
                    >
                      شطب الحساب
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}