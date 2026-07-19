// src/components/admin/GradesManager/hooks/useSchoolSettings.js

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../../../services/firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  query, onSnapshot
} from 'firebase/firestore';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export const useSchoolSettings = () => {
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState(
    new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
  );

  // ====== 1. الاستماع للتغييرات في Firestore ======
  useEffect(() => {
    setSettingsLoading(true);
    
    const unsubscribe = onSnapshot(
      collection(db, 'schoolSettings'),
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = { id: doc.id, ...doc.data() };
          setSchoolSettings(data);
          
          if (data.academicYear?.current) {
            setAcademicYear(data.academicYear.current);
          }
          console.log('✅ تم تحديث إعدادات المدرسة:', data);
        } else {
          setSchoolSettings(null);
          console.log('ℹ️ لا توجد إعدادات للمدرسة');
        }
        setSettingsLoading(false);
      },
      (error) => {
        console.error('❌ خطأ في الاستماع لإعدادات المدرسة:', error);
        setSettingsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ====== 2. دالة التحقق من كلمة المرور (تُعرّف أولاً) ======
  const verifyAdminPassword = useCallback(async (password) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('الرجاء تسجيل الدخول أولاً');
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('المستخدم غير موجود');
      }
      
      const data = userDoc.data();
      if (data.role !== 'admin' && data.role !== 'admin_assistant') {
        throw new Error('ليس لديك صلاحية للقيام بهذا الإجراء');
      }

      // محاولة إعادة المصادقة
      try {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        return true;
      } catch (authError) {
        if (authError.code === 'auth/wrong-password') {
          return false;
        }
        // في حال فشل إعادة المصادقة، نتحقق من كلمة المرور المخزنة
        console.warn('Reauthentication failed, checking stored password');
        return password === data.password;
      }
    } catch (error) {
      console.error('❌ خطأ في التحقق من كلمة المرور:', error);
      return false;
    }
  }, []);

  // ====== 3. دالة تحديث الحالة محلياً ======
  const updateLocalSettings = useCallback((updates) => {
    setSchoolSettings(prev => {
      if (!prev) return prev;
      
      const updated = {
        ...prev,
        ...updates,
        semesters: {
          ...prev.semesters,
          ...(updates.semesters || {})
        },
        academicYear: {
          ...prev.academicYear,
          ...(updates.academicYear || {})
        }
      };
      return updated;
    });
  }, []);

  // ====== 4. دالة بدء العام الدراسي ======
  const startAcademicYear = useCallback(async (year, adminPassword) => {
    const isValid = await verifyAdminPassword(adminPassword);
    if (!isValid) throw new Error('كلمة المرور غير صحيحة');

    updateLocalSettings({
      academicYear: {
        current: year,
        startDate: new Date().toISOString(),
        status: 'active'
      },
      semesters: {
        semester1: { status: 'active' },
        semester2: { status: 'pending' }
      }
    });

    const settingsData = {
      academicYear: {
        current: year,
        startDate: new Date().toISOString(),
        status: 'active'
      },
      semesters: {
        semester1: { status: 'active' },
        semester2: { status: 'pending' }
      },
      history: [
        {
          action: 'start_academic_year',
          academicYear: year,
          performedBy: auth.currentUser?.uid || 'admin',
          performedAt: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'admin'
    };

    if (schoolSettings?.id) {
      await updateDoc(doc(db, 'schoolSettings', schoolSettings.id), settingsData);
    } else {
      const docRef = await addDoc(collection(db, 'schoolSettings'), settingsData);
      setSchoolSettings({ id: docRef.id, ...settingsData });
    }

    setAcademicYear(year);
    return year;
  }, [schoolSettings, verifyAdminPassword, updateLocalSettings]);

  // ====== 5. دالة فتح الفصل ======
  const openSemester = useCallback(async (semester, adminPassword) => {
    const isValid = await verifyAdminPassword(adminPassword);
    if (!isValid) throw new Error('كلمة المرور غير صحيحة');

    const semesterKey = semester === 1 ? 'semester1' : 'semester2';
    
    updateLocalSettings({
      semesters: {
        [semesterKey]: { 
          status: 'active',
          openedAt: new Date().toISOString(),
          openedBy: auth.currentUser?.uid || 'admin'
        }
      },
      updatedAt: new Date().toISOString()
    });

    const updateData = {
      [`semesters.${semesterKey}.status`]: 'active',
      [`semesters.${semesterKey}.openedAt`]: new Date().toISOString(),
      [`semesters.${semesterKey}.openedBy`]: auth.currentUser?.uid || 'admin',
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'admin'
    };

    if (schoolSettings?.id) {
      await updateDoc(doc(db, 'schoolSettings', schoolSettings.id), updateData);
    }

    return semester;
  }, [schoolSettings, verifyAdminPassword, updateLocalSettings]);

  // ====== 6. دالة إغلاق الفصل ======
  const closeSemester = useCallback(async (semester, adminPassword) => {
    const isValid = await verifyAdminPassword(adminPassword);
    if (!isValid) throw new Error('كلمة المرور غير صحيحة');

    const semesterKey = semester === 1 ? 'semester1' : 'semester2';
    
    updateLocalSettings({
      semesters: {
        [semesterKey]: { 
          status: 'closed',
          closedAt: new Date().toISOString(),
          closedBy: auth.currentUser?.uid || 'admin'
        }
      },
      updatedAt: new Date().toISOString()
    });

    const updateData = {
      [`semesters.${semesterKey}.status`]: 'closed',
      [`semesters.${semesterKey}.closedAt`]: new Date().toISOString(),
      [`semesters.${semesterKey}.closedBy`]: auth.currentUser?.uid || 'admin',
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'admin'
    };

    if (schoolSettings?.id) {
      await updateDoc(doc(db, 'schoolSettings', schoolSettings.id), updateData);
    }

    return semester;
  }, [schoolSettings, verifyAdminPassword, updateLocalSettings]);

  // ====== 7. دالة إغلاق العام ======
  const closeAcademicYear = useCallback(async (adminPassword) => {
    const isValid = await verifyAdminPassword(adminPassword);
    if (!isValid) throw new Error('كلمة المرور غير صحيحة');

    updateLocalSettings({
      academicYear: {
        status: 'closed',
        endDate: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    });

    const updateData = {
      'academicYear.status': 'closed',
      'academicYear.endDate': new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'admin'
    };

    if (schoolSettings?.id) {
      await updateDoc(doc(db, 'schoolSettings', schoolSettings.id), updateData);
    }

    return true;
  }, [schoolSettings, verifyAdminPassword, updateLocalSettings]);

  // ====== 8. حساب الحالات ======
  const isSemester1Closed = schoolSettings?.semesters?.semester1?.status === 'closed';
  const isSemester2Closed = schoolSettings?.semesters?.semester2?.status === 'closed';
  const isYearActive = schoolSettings?.academicYear?.status === 'active';
  const isYearClosed = schoolSettings?.academicYear?.status === 'closed';

  // ====== 9. القيم المعادة ======
  return {
    schoolSettings,
    settingsLoading,
    academicYear,
    setAcademicYear,
    isSemester1Closed,
    isSemester2Closed,
    isYearActive,
    isYearClosed,
    verifyAdminPassword,
    startAcademicYear,
    openSemester,
    closeSemester,
    closeAcademicYear,
    updateLocalSettings
  };
};