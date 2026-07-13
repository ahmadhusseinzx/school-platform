import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot 
} from 'firebase/firestore';

// جلب جميع الامتحانات
export const getExams = async () => {
  try {
    const snapshot = await getDocs(collection(db, "exams"));
    const exams = [];
    snapshot.forEach(doc => {
      exams.push({ id: doc.id, ...doc.data() });
    });
    return exams;
  } catch (error) {
    console.error("خطأ في جلب الامتحانات:", error);
    throw error;
  }
};

// جلب امتحانات صف معين
export const getExamsByClass = async (classId) => {
  try {
    const q = query(collection(db, "exams"), where("classId", "==", classId));
    const snapshot = await getDocs(q);
    const exams = [];
    snapshot.forEach(doc => {
      exams.push({ id: doc.id, ...doc.data() });
    });
    return exams;
  } catch (error) {
    console.error("خطأ في جلب امتحانات الصف:", error);
    throw error;
  }
};

// جلب امتحان بواسطة ID
export const getExamById = async (examId) => {
  try {
    const docRef = doc(db, "exams", examId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("خطأ في جلب بيانات الامتحان:", error);
    throw error;
  }
};

// إنشاء امتحان جديد
export const createExam = async (examData) => {
  try {
    const docRef = await addDoc(collection(db, "exams"), {
      ...examData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...examData };
  } catch (error) {
    console.error("خطأ في إنشاء الامتحان:", error);
    throw error;
  }
};

// تحديث امتحان
export const updateExam = async (examId, data) => {
  try {
    const docRef = doc(db, "exams", examId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: examId, ...data };
  } catch (error) {
    console.error("خطأ في تحديث الامتحان:", error);
    throw error;
  }
};

// حذف امتحان
export const deleteExam = async (examId) => {
  try {
    await deleteDoc(doc(db, "exams", examId));
  } catch (error) {
    console.error("خطأ في حذف الامتحان:", error);
    throw error;
  }
};

// جلب نتائج الامتحانات
export const getExamSubmissions = async (examId) => {
  try {
    const q = query(collection(db, "examSubmissions"), where("examId", "==", examId));
    const snapshot = await getDocs(q);
    const submissions = [];
    snapshot.forEach(doc => {
      submissions.push({ id: doc.id, ...doc.data() });
    });
    return submissions;
  } catch (error) {
    console.error("خطأ في جلب نتائج الامتحان:", error);
    throw error;
  }
};

// الاستماع لتغييرات الامتحانات (Realtime)
export const subscribeToExams = (callback) => {
  return onSnapshot(collection(db, "exams"), (snapshot) => {
    const exams = [];
    snapshot.forEach(doc => {
      exams.push({ id: doc.id, ...doc.data() });
    });
    callback(exams);
  });
};