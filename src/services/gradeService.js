import { db } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, 
  deleteDoc, query, where, onSnapshot, writeBatch 
} from 'firebase/firestore';

// ============ إدارة العلامات ============

// جلب جميع العلامات
export const getGrades = async () => {
  try {
    const snapshot = await getDocs(collection(db, "grades"));
    const grades = [];
    snapshot.forEach(doc => {
      grades.push({ id: doc.id, ...doc.data() });
    });
    return grades;
  } catch (error) {
    console.error("خطأ في جلب العلامات:", error);
    throw error;
  }
};

// جلب علامات طالب معين
export const getStudentGrades = async (studentId, semester = null) => {
  try {
    let q = query(collection(db, "grades"), where("studentId", "==", studentId));
    if (semester) {
      q = query(q, where("semester", "==", semester));
    }
    const snapshot = await getDocs(q);
    const grades = [];
    snapshot.forEach(doc => {
      grades.push({ id: doc.id, ...doc.data() });
    });
    return grades;
  } catch (error) {
    console.error("خطأ في جلب علامات الطالب:", error);
    throw error;
  }
};

// جلب علامات صف ومادة معينة
export const getClassSubjectGrades = async (classId, subjectId, semester) => {
  try {
    const q = query(
      collection(db, "grades"),
      where("classId", "==", classId),
      where("subjectId", "==", subjectId),
      where("semester", "==", semester)
    );
    const snapshot = await getDocs(q);
    const grades = [];
    snapshot.forEach(doc => {
      grades.push({ id: doc.id, ...doc.data() });
    });
    return grades;
  } catch (error) {
    console.error("خطأ في جلب علامات الصف:", error);
    throw error;
  }
};

// حفظ علامات طالب (إضافة أو تحديث)
export const saveStudentGrades = async (gradeData) => {
  try {
    // التحقق من وجود علامات سابقة
    const q = query(
      collection(db, "grades"),
      where("studentId", "==", gradeData.studentId),
      where("classId", "==", gradeData.classId),
      where("subjectId", "==", gradeData.subjectId),
      where("semester", "==", gradeData.semester)
    );
    const snapshot = await getDocs(q);
    
    // حساب المجموع والنسبة المئوية
    const total = (gradeData.dailyExam1 || 0) + (gradeData.participation1 || 0) + 
                  (gradeData.midtermExam || 0) + (gradeData.dailyExam2 || 0) + 
                  (gradeData.participation2 || 0) + (gradeData.finalExam || 0);
    
    const maxTotal = 100; // افتراضي
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    
    const finalData = {
      ...gradeData,
      total,
      percentage,
      grade,
      updatedAt: new Date().toISOString()
    };
    
    if (!snapshot.empty) {
      // تحديث العلامات الموجودة
      const docRef = doc(db, "grades", snapshot.docs[0].id);
      await updateDoc(docRef, finalData);
      return { id: snapshot.docs[0].id, ...finalData };
    } else {
      // إنشاء علامات جديدة
      const docRef = await addDoc(collection(db, "grades"), {
        ...finalData,
        createdAt: new Date().toISOString(),
        history: []
      });
      return { id: docRef.id, ...finalData };
    }
  } catch (error) {
    console.error("خطأ في حفظ العلامات:", error);
    throw error;
  }
};

// حذف علامات
export const deleteGrade = async (gradeId) => {
  try {
    await deleteDoc(doc(db, "grades", gradeId));
  } catch (error) {
    console.error("خطأ في حذف العلامات:", error);
    throw error;
  }
};

// حساب المجموع الكلي للعلامات
export const calculateTotalGrade = (grades, gradingSystem) => {
  const {
    dailyExam1 = 0,
    participation1 = 0,
    midtermExam = 0,
    dailyExam2 = 0,
    participation2 = 0,
    finalExam = 0
  } = grades;
  
  const total = dailyExam1 + participation1 + midtermExam + 
                dailyExam2 + participation2 + finalExam;
  
  const maxTotal = Object.values(gradingSystem).reduce((a, b) => a + b, 0);
  const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  
  let grade = 'F';
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B';
  else if (percentage >= 70) grade = 'C';
  else if (percentage >= 60) grade = 'D';
  
  return { total, percentage, grade };
};