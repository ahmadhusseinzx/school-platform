import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot 
} from 'firebase/firestore';

// ============ إدارة الجدول الزمني ============

// جلب جميع الجداول
export const getSchedules = async () => {
  try {
    const snapshot = await getDocs(collection(db, "schedule"));
    const schedules = [];
    snapshot.forEach(doc => {
      schedules.push({ id: doc.id, ...doc.data() });
    });
    return schedules;
  } catch (error) {
    console.error("خطأ في جلب الجداول:", error);
    throw error;
  }
};

// جلب جدول صف معين
export const getScheduleByClass = async (classId) => {
  try {
    const q = query(
      collection(db, "schedule"),
      where("classId", "==", classId)
    );
    const snapshot = await getDocs(q);
    const schedules = [];
    snapshot.forEach(doc => {
      schedules.push({ id: doc.id, ...doc.data() });
    });
    return schedules;
  } catch (error) {
    console.error("خطأ في جلب جدول الصف:", error);
    throw error;
  }
};

// جلب جدول معلم معين
export const getScheduleByTeacher = async (teacherId) => {
  try {
    const q = query(
      collection(db, "schedule"),
      where("teacherId", "==", teacherId)
    );
    const snapshot = await getDocs(q);
    const schedules = [];
    snapshot.forEach(doc => {
      schedules.push({ id: doc.id, ...doc.data() });
    });
    return schedules;
  } catch (error) {
    console.error("خطأ في جلب جدول المعلم:", error);
    throw error;
  }
};

// جلب جدول حسب اليوم
export const getScheduleByDay = async (day) => {
  try {
    const q = query(
      collection(db, "schedule"),
      where("day", "==", day)
    );
    const snapshot = await getDocs(q);
    const schedules = [];
    snapshot.forEach(doc => {
      schedules.push({ id: doc.id, ...doc.data() });
    });
    return schedules;
  } catch (error) {
    console.error("خطأ في جلب الجدول حسب اليوم:", error);
    throw error;
  }
};

// إنشاء جدول جديد
export const createSchedule = async (scheduleData) => {
  try {
    const docRef = await addDoc(collection(db, "schedule"), {
      ...scheduleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...scheduleData };
  } catch (error) {
    console.error("خطأ في إنشاء الجدول:", error);
    throw error;
  }
};

// تحديث جدول
export const updateSchedule = async (scheduleId, data) => {
  try {
    const docRef = doc(db, "schedule", scheduleId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: scheduleId, ...data };
  } catch (error) {
    console.error("خطأ في تحديث الجدول:", error);
    throw error;
  }
};

// حذف جدول
export const deleteSchedule = async (scheduleId) => {
  try {
    await deleteDoc(doc(db, "schedule", scheduleId));
  } catch (error) {
    console.error("خطأ في حذف الجدول:", error);
    throw error;
  }
};