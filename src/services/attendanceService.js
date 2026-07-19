import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot 
} from 'firebase/firestore';

// ============ إدارة الحضور ============

// جلب جميع سجلات الحضور
export const getAttendance = async () => {
  try {
    const snapshot = await getDocs(collection(db, "attendance"));
    const attendance = [];
    snapshot.forEach(doc => {
      attendance.push({ id: doc.id, ...doc.data() });
    });
    return attendance;
  } catch (error) {
    console.error("خطأ في جلب سجلات الحضور:", error);
    throw error;
  }
};

// جلب حضور طالب معين
export const getStudentAttendance = async (studentId) => {
  try {
    const q = query(collection(db, "attendance"), where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    const attendance = [];
    snapshot.forEach(doc => {
      attendance.push({ id: doc.id, ...doc.data() });
    });
    return attendance;
  } catch (error) {
    console.error("خطأ في جلب حضور الطالب:", error);
    throw error;
  }
};

// جلب حضور صف معين في تاريخ معين
export const getClassAttendance = async (classId, date) => {
  try {
    const q = query(
      collection(db, "attendance"),
      where("classId", "==", classId),
      where("date", "==", date)
    );
    const snapshot = await getDocs(q);
    const attendance = [];
    snapshot.forEach(doc => {
      attendance.push({ id: doc.id, ...doc.data() });
    });
    return attendance;
  } catch (error) {
    console.error("خطأ في جلب حضور الصف:", error);
    throw error;
  }
};

// تسجيل حضور
export const recordAttendance = async (attendanceData) => {
  try {
    const docRef = await addDoc(collection(db, "attendance"), {
      ...attendanceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...attendanceData };
  } catch (error) {
    console.error("خطأ في تسجيل الحضور:", error);
    throw error;
  }
};

// تحديث سجل حضور
export const updateAttendance = async (attendanceId, data) => {
  try {
    const docRef = doc(db, "attendance", attendanceId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: attendanceId, ...data };
  } catch (error) {
    console.error("خطأ في تحديث سجل الحضور:", error);
    throw error;
  }
};

// حذف سجل حضور
export const deleteAttendance = async (attendanceId) => {
  try {
    await deleteDoc(doc(db, "attendance", attendanceId));
  } catch (error) {
    console.error("خطأ في حذف سجل الحضور:", error);
    throw error;
  }
};

// حساب إحصائيات الحضور
export const getAttendanceStats = (attendanceRecords) => {
  const total = attendanceRecords.length;
  const present = attendanceRecords.filter(a => a.status === 'present').length;
  const absent = attendanceRecords.filter(a => a.status === 'absent').length;
  const late = attendanceRecords.filter(a => a.status === 'late').length;
  const excused = attendanceRecords.filter(a => a.status === 'excused').length;
  
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  
  return { total, present, absent, late, excused, percentage };
};