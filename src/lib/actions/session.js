// src/lib/actions/session.js
'use server'; // هذا السطر يجب أن يكون في أول سطر في الملف لتعريف كل الدوال المصدرة كـ Server Actions

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache'; // لاستخدام revalidatePath بعد الحفظ

// دالة Server Action لإنشاء جلسة جديدة
export async function createSessionAction(formData) {
  const title = formData.get('title');
  const description = formData.get('description');
  const courseId = formData.get('courseId'); // سيتم جلبها من الـ dropdown
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime'); // قد تكون فارغة
  const zoomLink = formData.get('zoomLink'); // قد تكون فارغة
  const notes = formData.get('notes'); // قد تكون فارغة

  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية (المعلم الذي يقوم بإنشاء الجلسة)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in createSessionAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لإنشاء جلسة.' };
    }
    const teacherId = user.id; // هذا هو الـ ID الحقيقي للمعلم المسجل دخوله

    // التحقق من أن الكورس فعلاً يخص هذا المعلم
    const { data: courseCheck, error: courseCheckError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('teacher_id', teacherId)
      .single();

    if (courseCheckError || !courseCheck) {
      console.error('Course validation failed:', courseCheckError);
      return { success: false, message: 'الكورس المحدد غير موجود أو ليس لديك صلاحية لإنشاء جلسة فيه.' };
    }

    // إدراج الجلسة الجديدة في جدول public.sessions
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        title,
        description,
        course_id: courseId,
        teacher_id: teacherId, // ربط الجلسة بالمعلم
        start_time: startTime,
        end_time: endTime || null, // إذا كانت فارغة، احفظها كـ NULL
        zoom_link: zoomLink || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return { success: false, message: `فشل في إنشاء الجلسة: ${sessionError.message}` };
    }

    // إعادة التحقق من مسار الجلسات لضمان تحديث البيانات في الواجهة
    revalidatePath('/teachers/sessions');

    return { success: true, message: 'تم إنشاء الجلسة بنجاح!', sessionId: session.id };
  } catch (err) {
    console.error('Unhandled error in createSessionAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

// دالة Server Action لحذف جلسة
export async function deleteSessionAction(sessionId) {
  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية (المعلم الذي يقوم بالحذف)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in deleteSessionAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لحذف جلسة.' };
    }
    const teacherId = user.id;

    // التحقق من أن المعلم هو صاحب الجلسة قبل الحذف
    const { data: sessionCheck, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id, teacher_id')
      .eq('id', sessionId)
      .eq('teacher_id', teacherId)
      .single();

    if (sessionCheckError || !sessionCheck) {
      console.error('Session authorization failed for deletion:', sessionCheckError);
      return { success: false, message: 'ليس لديك صلاحية لحذف هذه الجلسة.' };
    }

    // حذف الجلسة
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Error deleting session:', deleteError);
      return { success: false, message: `فشل في حذف الجلسة: ${deleteError.message}` };
    }

    // إعادة التحقق من مسار الجلسات لضمان تحديث البيانات في الواجهة
    revalidatePath('/teachers/sessions');

    return { success: true, message: 'تم حذف الجلسة بنجاح!' };
  } catch (err) {
    console.error('Unhandled error in deleteSessionAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}
// src/lib/actions/session.js (تابع لنفس الملف)

// دالة Server Action لتعديل جلسة موجودة
export async function updateSessionAction(formData) {
  const sessionId = formData.get('sessionId');
  const title = formData.get('title');
  const description = formData.get('description');
  const courseId = formData.get('courseId');
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime');
  const zoomLink = formData.get('zoomLink');
  const notes = formData.get('notes');

  const supabase = createServerSupabaseClient(cookies());

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in updateSessionAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لتعديل جلسة.' };
    }
    const teacherId = user.id;

    // التحقق من أن المعلم هو صاحب الجلسة
    const { data: sessionCheck, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id, teacher_id')
      .eq('id', sessionId)
      .eq('teacher_id', teacherId)
      .single();

    if (sessionCheckError || !sessionCheck) {
      console.error('Session authorization failed for update:', sessionCheckError);
      return { success: false, message: 'ليس لديك صلاحية لتعديل هذه الجلسة.' };
    }

    // التحقق من أن الكورس فعلاً يخص هذا المعلم (إذا تم تغيير الكورس)
    const { data: courseCheck, error: courseCheckError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('teacher_id', teacherId)
      .single();

    if (courseCheckError || !courseCheck) {
      console.error('Course validation failed for update:', courseCheckError);
      return { success: false, message: 'الكورس المحدد غير موجود أو ليس لديك صلاحية لربط الجلسة به.' };
    }

    // تحديث بيانات الجلسة
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        title,
        description,
        course_id: courseId,
        start_time: startTime,
        end_time: endTime || null,
        zoom_link: zoomLink || null,
        notes: notes || null,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return { success: false, message: `فشل في تحديث الجلسة: ${updateError.message}` };
    }

    // إعادة التحقق من مسار الجلسات وصفحة تفاصيل الجلسة لضمان تحديث البيانات
    revalidatePath('/teachers/sessions');
    revalidatePath(`/teachers/sessions/${sessionId}`);

    return { success: true, message: 'تم تحديث الجلسة بنجاح!', sessionId: updatedSession.id };
  } catch (err) {
    console.error('Unhandled error in updateSessionAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

