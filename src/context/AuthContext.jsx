// src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // ✅ استخدام ref لتخزين userData الحالي
  const userDataRef = useRef(userData);

  // ✅ تحديث ref عند تغيير userData
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // ============ جلب بيانات المستخدم ============
  const fetchUserData = useCallback(async (uid) => {
    if (!uid) return null;
    
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("✅ User data fetched:", data);
        return { id: userDoc.id, ...data };
      }
      console.log("⚠️ No user document found for:", uid);
      return null;
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      return null;
    }
  }, []);

  // ============ إنشاء بيانات افتراضية ============
  const createDefaultUserData = useCallback(async (uid, email, displayName) => {
    const defaultData = {
      fullName: displayName || 'مستخدم',
      email: email || '',
      phone: '',
      address: '',
      bio: '',
      role: 'student',
      uid: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, defaultData);
      console.log("✅ Default user data created:", defaultData);
      return defaultData;
    } catch (error) {
      console.error("❌ Error creating default user data:", error);
      return null;
    }
  }, []);

  // ============ ✅ دالة تحديث بيانات المستخدم (محسّنة) ============
  const updateUser = useCallback(async (uid, data) => {
    if (!uid) {
      throw new Error("UID is required");
    }
    
    try {
      console.log("📝 Updating user data in Firestore:", data);
      const userDocRef = doc(db, "users", uid);
      
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      // ✅ ✅ ✅ استخدام ref للحصول على أحدث userData
      const currentUserData = userDataRef.current || {};
      
      const newUserData = {
        ...currentUserData,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      console.log('📊 New user data:', newUserData);
      
      // ✅ تحديث الحالة
      setUserData(newUserData);
      
      console.log('✅ User data updated in state');
      return newUserData;
    } catch (error) {
      console.error("❌ Error updating user data:", error);
      throw error;
    }
  }, []); // ✅ إزالة userData من التبعيات

  // ============ إعادة تحميل البيانات ============
  const refreshUserData = useCallback(async () => {
    if (!user) {
      console.log("⚠️ No user to refresh");
      return;
    }
    
    setRefreshing(true);
    try {
      const data = await fetchUserData(user.uid);
      if (data) {
        console.log("✅ User data refreshed:", data);
        setUserData(data);
        return data;
      } else {
        const newData = await createDefaultUserData(
          user.uid,
          user.email,
          user.displayName
        );
        if (newData) {
          setUserData(newData);
          return newData;
        }
      }
    } catch (error) {
      console.error("❌ Error refreshing user data:", error);
    } finally {
      setRefreshing(false);
    }
    return null;
  }, [user, fetchUserData, createDefaultUserData]);

  // ============ الاستماع لتغييرات المصادقة ============
  useEffect(() => {
    console.log("🔄 AuthProvider mounted");
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("🔄 Auth state changed:", currentUser?.uid || "No user");
      
      if (currentUser) {
        setUser(currentUser);
        
        try {
          let data = await fetchUserData(currentUser.uid);
          
          if (!data) {
            console.log("⚠️ Creating default data for user");
            data = await createDefaultUserData(
              currentUser.uid,
              currentUser.email,
              currentUser.displayName
            );
          }
          
          if (data) {
            console.log("✅ Setting user data:", data);
            setUserData(data);
          }
        } catch (error) {
          console.error("❌ Error:", error);
        }
      } else {
        console.log("🚫 No user logged in");
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, [fetchUserData, createDefaultUserData]);

  // ============ الاستماع للتغييرات في Firestore (Realtime) ============
  useEffect(() => {
    if (!user || !authInitialized) return;
    
    console.log("🔄 Setting up real-time listener for user data");
    
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("🔄 Real-time update from Firestore:", data);
        setUserData(prev => {
          if (!prev) return { id: docSnap.id, ...data };
          return {
            ...prev,
            ...data,
            id: docSnap.id
          };
        });
      }
    }, (error) => {
      console.error("❌ Error in real-time listener:", error);
    });

    return () => unsubscribe();
  }, [user, authInitialized]);

  // ============ تسجيل الخروج ============
  const logout = useCallback(async () => {
    try {
      console.log("🔄 Logging out...");
      await signOut(auth);
      setUser(null);
      setUserData(null);
      console.log("✅ Logged out successfully");
    } catch (error) {
      console.error("❌ Logout error:", error);
      throw error;
    }
  }, []);

  const value = {
    user,
    userData,
    loading,
    refreshing,
    logout,
    updateUser,
    refreshUserData,
    role: userData?.role || 'student',
    isAdmin: userData?.role === 'admin' || userData?.role === 'admin_assistant',
    isTeacher: userData?.role === 'teacher',
    isStudent: userData?.role === 'student',
    isAuthenticated: !!user && !!userData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;