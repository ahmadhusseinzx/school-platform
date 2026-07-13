import { db, rtdb } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot, addDoc 
} from 'firebase/firestore';
import { ref, set, get, update, onValue } from 'firebase/database';

// ============ Firestore Services ============

// جلب بيانات المعلم
export const getTeacherProfile = async (teacherId) => {
  try {
    const docRef = doc(db, "teachers", teacherId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("خطأ في جلب بيانات المعلم:", error);
    throw error;
  }
};

// تحديث بيانات المعلم
export const updateTeacherProfile = async (teacherId, data) => {
  try {
    const docRef = doc(db, "teachers", teacherId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: teacherId, ...data };
  } catch (error) {
    console.error("خطأ في تحديث بيانات المعلم:", error);
    throw error;
  }
};

// جلب جدول الحصص من Firestore
export const getTeacherSchedule = async (teacherId) => {
  try {
    const scheduleRef = collection(db, "teachers", teacherId, "schedule");
    const snapshot = await getDocs(scheduleRef);
    const schedule = [];
    snapshot.forEach(doc => {
      schedule.push({ id: doc.id, ...doc.data() });
    });
    return schedule;
  } catch (error) {
    console.error("خطأ في جلب جدول الحصص:", error);
    throw error;
  }
};

// حفظ جدول الحصص في Firestore
export const saveTeacherSchedule = async (teacherId, scheduleData) => {
  try {
    const scheduleRef = collection(db, "teachers", teacherId, "schedule");
    
    // حذف الجدول القديم
    const oldSchedule = await getDocs(scheduleRef);
    const deletePromises = oldSchedule.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // إضافة الجدول الجديد
    const addPromises = scheduleData.map(day => 
      addDoc(scheduleRef, day)
    );
    await Promise.all(addPromises);
    
    return scheduleData;
  } catch (error) {
    console.error("خطأ في حفظ جدول الحصص:", error);
    throw error;
  }
};

// جلب الخطة الدراسية من Firestore
export const getTeacherCurriculum = async (teacherId) => {
  try {
    const curriculumRef = collection(db, "teachers", teacherId, "curriculum");
    const snapshot = await getDocs(curriculumRef);
    const curriculum = [];
    snapshot.forEach(doc => {
      curriculum.push({ id: doc.id, ...doc.data() });
    });
    return curriculum;
  } catch (error) {
    console.error("خطأ في جلب الخطة الدراسية:", error);
    throw error;
  }
};

// حفظ الخطة الدراسية في Firestore
export const saveTeacherCurriculum = async (teacherId, curriculumData) => {
  try {
    const curriculumRef = collection(db, "teachers", teacherId, "curriculum");
    
    // حذف الخطة القديمة
    const oldCurriculum = await getDocs(curriculumRef);
    const deletePromises = oldCurriculum.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // إضافة الخطة الجديدة
    const addPromises = curriculumData.map(classPlan => 
      addDoc(curriculumRef, classPlan)
    );
    await Promise.all(addPromises);
    
    return curriculumData;
  } catch (error) {
    console.error("خطأ في حفظ الخطة الدراسية:", error);
    throw error;
  }
};

// الاستماع للتغييرات في بيانات المعلم (Realtime)
export const subscribeToTeacher = (teacherId, callback) => {
  const docRef = doc(db, "teachers", teacherId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

// ============ Realtime Database Services ============

// حفظ حالة الجدول الحالي (للجدول النشط)
export const setCurrentScheduleStatus = async (teacherId, status) => {
  try {
    await set(ref(rtdb, `teachers/${teacherId}/currentStatus`), {
      ...status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("خطأ في تحديث حالة الجدول:", error);
    throw error;
  }
};

// جلب حالة الجدول الحالي
export const getCurrentScheduleStatus = async (teacherId) => {
  try {
    const snapshot = await get(ref(rtdb, `teachers/${teacherId}/currentStatus`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("خطأ في جلب حالة الجدول:", error);
    throw error;
  }
};

// الاستماع للتغييرات في حالة الجدول (للبث المباشر)
export const subscribeToScheduleStatus = (teacherId, callback) => {
  const statusRef = ref(rtdb, `teachers/${teacherId}/currentStatus`);
  return onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};

// ============ Helper Functions ============

// إعداد بيانات المعلم الافتراضية
export const createDefaultTeacherData = (teacherId, name, email) => {
  return {
    id: teacherId,
    name: name || 'المعلم',
    title: 'مدرس',
    email: email || '',
    phone: '',
    office: '',
    bio: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// التحقق من وجود بيانات المعلم وإنشاءها إذا لم تكن موجودة
export const ensureTeacherExists = async (teacherId, defaultData) => {
  try {
    const teacher = await getTeacherProfile(teacherId);
    if (!teacher) {
      const docRef = doc(db, "teachers", teacherId);
      await setDoc(docRef, defaultData);
      return { id: teacherId, ...defaultData };
    }
    return teacher;
  } catch (error) {
    console.error("خطأ في التأكد من وجود المعلم:", error);
    throw error;
  }
};