import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

// تسجيل الدخول
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);
    throw error;
  }
};

// إنشاء حساب جديد
export const register = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // تحديث اسم المستخدم
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  } catch (error) {
    console.error("خطأ في إنشاء الحساب:", error);
    throw error;
  }
};

// تسجيل الخروج
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("خطأ في تسجيل الخروج:", error);
    throw error;
  }
};

// إعادة تعيين كلمة المرور
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("خطأ في إعادة تعيين كلمة المرور:", error);
    throw error;
  }
};

// مراقبة حالة المصادقة
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// الحصول على المستخدم الحالي
export const getCurrentUser = () => {
  return auth.currentUser;
};