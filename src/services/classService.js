import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot 
} from 'firebase/firestore';

// ============ دوال الصفوف ============

export const getClasses = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'classes'));
    const classes = [];
    snapshot.forEach(doc => {
      classes.push({ id: doc.id, ...doc.data() });
    });
    return classes;
  } catch (error) {
    console.error('خطأ في جلب الصفوف:', error);
    throw error;
  }
};

export const getClassById = async (classId) => {
  try {
    const docRef = doc(db, 'classes', classId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('خطأ في جلب الصف:', error);
    throw error;
  }
};

export const createClass = async (classData) => {
  try {
    const docRef = await addDoc(collection(db, 'classes'), {
      ...classData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...classData };
  } catch (error) {
    console.error('خطأ في إنشاء الصف:', error);
    throw error;
  }
};

export const updateClass = async (classId, data) => {
  try {
    const docRef = doc(db, 'classes', classId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: classId, ...data };
  } catch (error) {
    console.error('خطأ في تحديث الصف:', error);
    throw error;
  }
};

export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (error) {
    console.error('خطأ في حذف الصف:', error);
    throw error;
  }
};