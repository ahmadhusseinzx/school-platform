import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot 
} from 'firebase/firestore';

// جلب جميع الطلاب
export const getStudents = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const snapshot = await getDocs(q);
    const students = [];
    snapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });
    return students;
  } catch (error) {
    console.error("خطأ في جلب الطلاب:", error);
    throw error;
  }
};

// جلب طلاب صف معين
export const getStudentsByClass = async (classId) => {
  try {
    const q = query(
      collection(db, "users"), 
      where("role", "==", "student"),
      where("classId", "==", classId)
    );
    const snapshot = await getDocs(q);
    const students = [];
    snapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });
    return students;
  } catch (error) {
    console.error("خطأ في جلب طلاب الصف:", error);
    throw error;
  }
};

// جلب طالب بواسطة ID
export const getStudentById = async (studentId) => {
  try {
    const docRef = doc(db, "users", studentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("خطأ في جلب بيانات الطالب:", error);
    throw error;
  }
};

// إضافة طالب جديد
export const addStudent = async (studentData) => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...studentData,
      role: 'student',
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...studentData };
  } catch (error) {
    console.error("خطأ في إضافة الطالب:", error);
    throw error;
  }
};

// تحديث بيانات طالب
export const updateStudent = async (studentId, data) => {
  try {
    const docRef = doc(db, "users", studentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: studentId, ...data };
  } catch (error) {
    console.error("خطأ في تحديث بيانات الطالب:", error);
    throw error;
  }
};

// حذف طالب
export const deleteStudent = async (studentId) => {
  try {
    await deleteDoc(doc(db, "users", studentId));
  } catch (error) {
    console.error("خطأ في حذف الطالب:", error);
    throw error;
  }
};

// الاستماع لتغييرات الطلاب (Realtime)
export const subscribeToStudents = (callback) => {
  const q = query(collection(db, "users"), where("role", "==", "student"));
  return onSnapshot(q, (snapshot) => {
    const students = [];
    snapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });
    callback(students);
  });
};