import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot 
} from 'firebase/firestore';

// ============ دوال الدروس ============

export const getLessons = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'lessons'));
    const lessons = [];
    snapshot.forEach(doc => {
      lessons.push({ id: doc.id, ...doc.data() });
    });
    return lessons;
  } catch (error) {
    console.error('خطأ في جلب الدروس:', error);
    throw error;
  }
};

export const getLessonsByClass = async (classId) => {
  try {
    const q = query(collection(db, 'lessons'), where('classId', '==', classId));
    const snapshot = await getDocs(q);
    const lessons = [];
    snapshot.forEach(doc => {
      lessons.push({ id: doc.id, ...doc.data() });
    });
    return lessons;
  } catch (error) {
    console.error('خطأ في جلب دروس الصف:', error);
    throw error;
  }
};

export const getLessonById = async (lessonId) => {
  try {
    const docRef = doc(db, 'lessons', lessonId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('خطأ في جلب الدرس:', error);
    throw error;
  }
};

export const createLesson = async (lessonData) => {
  try {
    const docRef = await addDoc(collection(db, 'lessons'), {
      ...lessonData,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...lessonData };
  } catch (error) {
    console.error('خطأ في إنشاء الدرس:', error);
    throw error;
  }
};

export const updateLesson = async (lessonId, data) => {
  try {
    const docRef = doc(db, 'lessons', lessonId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: lessonId, ...data };
  } catch (error) {
    console.error('خطأ في تحديث الدرس:', error);
    throw error;
  }
};

export const deleteLesson = async (lessonId) => {
  try {
    await deleteDoc(doc(db, 'lessons', lessonId));
  } catch (error) {
    console.error('خطأ في حذف الدرس:', error);
    throw error;
  }
};

export const publishLesson = async (lessonId) => {
  try {
    const docRef = doc(db, 'lessons', lessonId);
    await updateDoc(docRef, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { lessonId, status: 'published' };
  } catch (error) {
    console.error('خطأ في نشر الدرس:', error);
    throw error;
  }
};