// src/services/auth.js

import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  collection, query, where, getDocs, 
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc
} from 'firebase/firestore';

// ============ جلب المستخدم ============
export const getUserByUsername = async (username) => {
  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
};

// ============ ✅ جلب المستخدم بواسطة UID (محسَّن) ============
export const getUserByUid = async (uid) => {
  try {
    if (!uid) {
      console.warn('⚠️ UID غير موجود');
      return null;
    }
    
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`✅ تم جلب بيانات المستخدم: ${uid}`, data);
      return { id: docSnap.id, ...data };
    }
    
    console.warn(`⚠️ لا توجد بيانات للمستخدم: ${uid}`);
    return null;
  } catch (error) {
    console.error('❌ خطأ في جلب المستخدم بالـ UID:', error);
    return null;
  }
};

// ============ إنشاء مستخدم ============
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
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

// ============ ✅ تحديث بيانات المستخدم (المُحسَّن النهائي) ============
export const updateUserData = async (uid, data) => {
  try {
    if (!uid) {
      throw new Error('❌ UID مطلوب لتحديث البيانات');
    }
    
    const docRef = doc(db, 'users', uid);
    
    // ✅ التحقق من وجود المستند أولاً
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // ✅ إذا كان المستند غير موجود، ننشئه
      await setDoc(docRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        role: 'admin' // ✅ تعيين دور افتراضي
      });
      console.log(`✅ تم إنشاء مستند المستخدم: ${uid}`);
    } else {
      // ✅ الحصول على البيانات الحالية
      const currentData = docSnap.data();
      
      // ✅ دمج البيانات الجديدة مع القديمة
      const updatedData = {
        ...currentData,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      // ✅ تحديث المستند
      await updateDoc(docRef, updatedData);
      console.log(`✅ تم تحديث بيانات المستخدم: ${uid}`);
      console.log('📝 البيانات المحدثة:', updatedData);
    }
    
    // ✅ إرجاع البيانات المحدثة
    const updatedDoc = await getDoc(docRef);
    return { uid, ...updatedDoc.data() };
  } catch (error) {
    console.error('❌ خطأ في تحديث بيانات المستخدم:', error);
    throw error;
  }
};

// ============ ✅ حذف مستخدم ============
export const deleteUser = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    await deleteDoc(docRef);
    console.log(`✅ تم حذف المستخدم: ${uid}`);
    return { uid };
  } catch (error) {
    console.error('❌ خطأ في حذف المستخدم:', error);
    throw error;
  }
};

// ============ ✅ تغيير كلمة المرور ============
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('❌ لا يوجد مستخدم مسجل الدخول');
    }
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    
    console.log('✅ تم تغيير كلمة المرور بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في تغيير كلمة المرور:', error);
    throw error;
  }
};

// ============ المصادقة ============
export const login = async (identifier, password) => {
  try {
    let email = identifier;
    
    if (!identifier.includes('@')) {
      const userData = await getUserByUsername(identifier);
      if (!userData) {
        throw new Error('❌ اسم المستخدم غير موجود');
      }
      email = userData.email;
      console.log(`✅ تم العثور على المستخدم: ${userData.fullName} (${userData.role})`);
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ تم تسجيل الدخول بنجاح');
    return userCredential.user;
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    console.log('✅ تم تسجيل الخروج بنجاح');
  } catch (error) {
    console.error('❌ خطأ في تسجيل الخروج:', error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ تم إرسال رابط إعادة تعيين كلمة المرور');
  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين كلمة المرور:', error);
    throw error;
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

// ============ ✅ تحديث صورة الملف الشخصي ============
export const updateUserPhoto = async (photoURL) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('❌ لا يوجد مستخدم مسجل الدخول');
    }
    
    await updateProfile(user, { photoURL });
    console.log('✅ تم تحديث صورة الملف الشخصي');
    return true;
  } catch (error) {
    console.error('❌ خطأ في تحديث صورة الملف الشخصي:', error);
    throw error;
  }
};