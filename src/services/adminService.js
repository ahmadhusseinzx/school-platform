// src/services/adminService.js

import { db, auth } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot, setDoc, writeBatch 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// ============ إدارة المستخدمين ============

// جلب جميع المستخدمين
export const getAllUsers = async (role = null) => {
  try {
    let q = collection(db, "users");
    if (role) {
      q = query(q, where("role", "==", role));
    }
    const snapshot = await getDocs(q);
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("❌ خطأ في جلب المستخدمين:", error);
    throw error;
  }
};

// إنشاء حساب مستخدم جديد
export const createUserAccount = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      uid: user.uid,
      email: email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return { uid: user.uid, ...userData };
  } catch (error) {
    console.error("❌ خطأ في إنشاء الحساب:", error);
    throw error;
  }
};

// تحديث بيانات المستخدم
export const updateUser = async (userId, data) => {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: userId, ...data };
  } catch (error) {
    console.error("❌ خطأ في تحديث المستخدم:", error);
    throw error;
  }
};

// حذف مستخدم
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, "users", userId));
  } catch (error) {
    console.error("❌ خطأ في حذف المستخدم:", error);
    throw error;
  }
};

// تحديث صلاحيات المستخدم
export const updateUserPermissions = async (userId, permissions) => {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      permissions: permissions,
      updatedAt: new Date().toISOString()
    });
    return { userId, permissions };
  } catch (error) {
    console.error("❌ خطأ في تحديث الصلاحيات:", error);
    throw error;
  }
};

// جلب مستخدم بواسطة البريد الإلكتروني
export const getUserByEmail = async (email) => {
  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("❌ خطأ في جلب المستخدم:", error);
    throw error;
  }
};

// ✅ جلب مستخدم بواسطة UID
export const getUserByUid = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("❌ خطأ في جلب المستخدم بالـ UID:", error);
    throw error;
  }
};

// ✅ تغيير كلمة المرور للمستخدم
export const changeUserPassword = async (uid, newPassword) => {
  try {
    // يجب استخدام Admin SDK أو Cloud Function لتغيير كلمة المرور
    // هذا مجرد مثال، يحتاج إلى تنفيذ عبر Cloud Function
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      password: newPassword,
      updatedAt: new Date().toISOString()
    });
    return { uid, passwordChanged: true };
  } catch (error) {
    console.error("❌ خطأ في تغيير كلمة المرور:", error);
    throw error;
  }
};