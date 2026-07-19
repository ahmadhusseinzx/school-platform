import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot 
} from 'firebase/firestore';

// ============ دوال المستخدمين ============

// جلب جميع المستخدمين
export const getUsers = async (role = null) => {
  try {
    let q = collection(db, 'users');
    if (role) {
      q = query(q, where('role', '==', role));
    }
    const snapshot = await getDocs(q);
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    throw error;
  }
};

// جلب مستخدم بواسطة اسم المستخدم (لتسجيل الدخول)
export const getUserByUsername = async (username) => {
  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('خطأ في جلب المستخدم باسم المستخدم:', error);
    throw error;
  }
};

// جلب مستخدم بواسطة البريد الإلكتروني
export const getUserByEmail = async (email) => {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('خطأ في جلب المستخدم بالبريد:', error);
    throw error;
  }
};

// جلب مستخدم بواسطة UID
export const getUserByUid = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('خطأ في جلب المستخدم بالـ UID:', error);
    throw error;
  }
};

// إنشاء مستخدم جديد (يستخدم عند إضافة معلم/طالب)
export const createUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    });
    return { id: docRef.id, ...userData };
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    throw error;
  }
};

// تحديث مستخدم
export const updateUser = async (userId, data) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: userId, ...data };
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    throw error;
  }
};

// حذف مستخدم
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    throw error;
  }
};

// التحقق من وجود اسم مستخدم مكرر
export const isUsernameTaken = async (username) => {
  try {
    const user = await getUserByUsername(username);
    return user !== null;
  } catch (error) {
    console.error('خطأ في التحقق من اسم المستخدم:', error);
    throw error;
  }
};