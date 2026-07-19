import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot 
} from 'firebase/firestore';

// ============ دوال المواد ============

export const getSubjects = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'subjects'));
    const subjects = [];
    snapshot.forEach(doc => {
      subjects.push({ id: doc.id, ...doc.data() });
    });
    return subjects;
  } catch (error) {
    console.error('خطأ في جلب المواد:', error);
    throw error;
  }
};

export const getSubjectsByClass = async (classId) => {
  try {
    const q = query(collection(db, 'subjects'), where('classId', '==', classId));
    const snapshot = await getDocs(q);
    const subjects = [];
    snapshot.forEach(doc => {
      subjects.push({ id: doc.id, ...doc.data() });
    });
    return subjects;
  } catch (error) {
    console.error('خطأ في جلب مواد الصف:', error);
    throw error;
  }
};

export const getSubjectById = async (subjectId) => {
  try {
    const docRef = doc(db, 'subjects', subjectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('خطأ في جلب المادة:', error);
    throw error;
  }
};

export const createSubject = async (subjectData) => {
  try {
    const docRef = await addDoc(collection(db, 'subjects'), {
      ...subjectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...subjectData };
  } catch (error) {
    console.error('خطأ في إنشاء المادة:', error);
    throw error;
  }
};

export const updateSubject = async (subjectId, data) => {
  try {
    const docRef = doc(db, 'subjects', subjectId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: subjectId, ...data };
  } catch (error) {
    console.error('خطأ في تحديث المادة:', error);
    throw error;
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    await deleteDoc(doc(db, 'subjects', subjectId));
  } catch (error) {
    console.error('خطأ في حذف المادة:', error);
    throw error;
  }
};