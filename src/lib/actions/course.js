// src/lib/actions/course.js
'use server'; // هذا السطر يجب أن يكون في أول سطر في الملف لتعريف كل الدوال المصدرة كـ Server Actions

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers'; // استيراد cookies داخل Server Action

// دالة Server Action لإنشاء كورس جديد
export async function createCourseAction(formData) {
  const courseTitle = formData.get('courseTitle');
  const courseDescription = formData.get('courseDescription');
  const startDate = formData.get('startDate');

  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية (المعلم الذي يقوم بإنشاء الكورس)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in createCourseAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لإنشاء كورس.' };
    }
    const teacherId = user.id; // هذا هو الـ ID الحقيقي للمعلم المسجل دخوله

    // إضافة الكورس إلى جدول courses
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: courseTitle,
        description: courseDescription,
        start_date: startDate,
        teacher_id: teacherId, // ربط الكورس بالمعلم الذي أنشأه
        is_active: true, // افتراضياً الكورس نشط عند إنشائه
      })
      .select('id') // نرجع الـ ID بتاع الكورس الجديد
      .single();

    if (courseError) {
      console.error('Error creating course:', courseError);
      return { success: false, message: `فشل في إنشاء الكورس: ${courseError.message}` };
    }

    return { success: true, message: 'تم إنشاء الكورس بنجاح!', courseId: course.id };
  } catch (err) {
    console.error('Unhandled error in createCourseAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

// دالة Server Action لتعديل كورس موجود
export async function updateCourseAction(formData) {
  const courseId = formData.get('courseId'); // ID الكورس اللي هيتعدل
  const courseTitle = formData.get('courseTitle');
  const courseDescription = formData.get('courseDescription');
  const startDate = formData.get('startDate');

  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية (المعلم الذي يقوم بتعديل الكورس)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in updateCourseAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لتعديل الكورس.' };
    }
    const teacherId = user.id; // هذا هو الـ ID الحقيقي للمعلم المسجل دخوله

    // تحديث الكورس في جدول courses
    const { data, error: updateError } = await supabase
      .from('courses')
      .update({
        title: courseTitle,
        description: courseDescription,
        start_date: startDate,
      })
      .eq('id', courseId) // نحدد الكورس اللي هيتعدل بالـ ID بتاعه
      .eq('teacher_id', teacherId); // مهم: نتأكد إن المعلم ده هو صاحب الكورس عشان الأمان

    if (updateError) {
      console.error('Error updating course:', updateError);
      return { success: false, message: `فشل في تعديل الكورس: ${updateError.message}` };
    }

    return { success: true, message: 'تم تعديل الكورس بنجاح!' };
  } catch (err) {
    console.error('Unhandled error in updateCourseAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

// دالة Server Action لحذف كورس موجود
export async function deleteCourseAction(courseId) {
  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية (المعلم الذي يقوم بحذف الكورس)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in deleteCourseAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لحذف الكورس.' };
    }
    const teacherId = user.id; // هذا هو الـ ID الحقيقي للمعلم المسجل دخوله

    // حذف الكورس من جدول courses
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId) // نحدد الكورس اللي هيتحذف بالـ ID بتاعه
      .eq('teacher_id', teacherId); // مهم: نتأكد إن المعلم ده هو صاحب الكورس عشان الأمان

    if (deleteError) {
      console.error('Error deleting course:', deleteError);
      return { success: false, message: `فشل في حذف الكورس: ${deleteError.message}` };
    }

    return { success: true, message: 'تم حذف الكورس بنجاح!' };
  } catch (err) {
    console.error('Unhandled error in deleteCourseAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}
