// src/components/admin/ClassesManager.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { School, Plus, Trash2, Edit3, Save, X, Search, Loader2 } from 'lucide-react';

export default function ClassesManager() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [className, setClassName] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const classList = [];
      snapshot.forEach(doc => {
        classList.push({ id: doc.id, ...doc.data() });
      });
      setClasses(classList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!className.trim()) return;

    try {
      await addDoc(collection(db, 'classes'), {
        name: className.trim(),
        createdAt: new Date().toISOString()
      });
      setClassName('');
      setShowAddForm(false);
      alert('✅ تم إضافة الصف بنجاح!');
    } catch (error) {
      alert('❌ خطأ في إضافة الصف: ' + error.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!className.trim()) return;

    try {
      await updateDoc(doc(db, 'classes', editingId), {
        name: className.trim()
      });
      setEditingId(null);
      setClassName('');
      alert('✅ تم تحديث الصف بنجاح!');
    } catch (error) {
      alert('❌ خطأ في تحديث الصف: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصف؟')) return;
    try {
      await deleteDoc(doc(db, 'classes', id));
      alert('تم حذف الصف بنجاح!');
    } catch (error) {
      alert('خطأ في حذف الصف: ' + error.message);
    }
  };

  const startEdit = (cls) => {
    setEditingId(cls.id);
    setClassName(cls.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setClassName('');
  };

  const filteredClasses = classes.filter(cls =>
    cls.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <School className="w-5 h-5 text-purple-400" />
            إدارة الصفوف
          </h2>
          <p className="text-xs text-slate-400">إضافة وتعديل وحذف الصفوف</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">عدد الصفوف: {classes.length}</span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'إلغاء' : 'إضافة صف'}
          </button>
        </div>
      </div>

      {/* نموذج إضافة/تعديل */}
      {(showAddForm || editingId) && (
        <form onSubmit={editingId ? handleUpdate : handleAdd} className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-purple-400 mb-4">
            {editingId ? 'تعديل اسم الصف' : 'إضافة صف جديد'}
          </h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="اسم الصف"
              className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'تحديث' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); cancelEdit(); }}
              className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg text-sm font-bold transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* شريط البحث */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="بحث عن صف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* قائمة الصفوف */}
      <div className="flex flex-wrap gap-3">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="flex items-center gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
            <School className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white">{cls.name}</span>
            <button
              onClick={() => startEdit(cls)}
              className="p-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(cls.id)}
              className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <School className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد صفوف حالياً'}
          </p>
        </div>
      )}
    </div>
  );
}