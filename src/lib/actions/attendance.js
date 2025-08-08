// src/lib/actions/attendance.js
'use server'; // هذا السطر يجب أن يكون في أول سطر في الملف لتعريف كل الدوال المصدرة كـ Server Actions

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache'; // لاستخدام revalidatePath بعد الحفظ

// دالة Server Action لإدارة حضور الطلاب في جلسة معينة
export async function manageAttendanceAction(formData) {
  const sessionId = formData.get('sessionId');
  const studentId = formData.get('studentId');
  const attendanceStatus = formData.get('attendanceStatus'); // 'present', 'absent', 'late', 'excused'
  const notes = formData.get('notes'); // ملاحظات إضافية، قد تكون فارغة

  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية (المعلم الذي يقوم بتسجيل الحضور)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in manageAttendanceAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لإدارة الحضور.' };
    }
    const teacherId = user.id; // هذا هو الـ ID الحقيقي للمعلم المسجل دخوله

    // التحقق من أن المعلم لديه صلاحية لإدارة الحضور لهذه الجلسة
    // (أي أن الجلسة تتبع هذا المعلم)
    const { data: sessionCheck, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id, teacher_id')
      .eq('id', sessionId)
      .eq('teacher_id', teacherId)
      .single();

    if (sessionCheckError || !sessionCheck) {
      console.error('Session authorization failed:', sessionCheckError);
      return { success: false, message: 'ليس لديك صلاحية لإدارة الحضور لهذه الجلسة.' };
    }

    // محاولة البحث عن سجل حضور موجود لهذا الطالب في هذه الجلسة
    const { data: existingAttendance, error: fetchAttendanceError } = await supabase
      .from('session_attendances')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single();

    if (fetchAttendanceError && fetchAttendanceError.code !== 'PGRST116') { // PGRST116 يعني "لم يتم العثور على صفوف"
      console.error('Error fetching existing attendance:', fetchAttendanceError);
      return { success: false, message: `فشل في جلب سجل الحضور: ${fetchAttendanceError.message}` };
    }

    let result;
    if (existingAttendance) {
      // إذا كان سجل الحضور موجودًا، قم بتحديثه
      result = await supabase
        .from('session_attendances')
        .update({
          attendance_status: attendanceStatus,
          notes: notes || null,
          attendance_date: new Date().toISOString(), // تحديث تاريخ ووقت التسجيل
        })
        .eq('id', existingAttendance.id)
        .select()
        .single();
    } else {
      // إذا لم يكن سجل الحضور موجودًا، قم بإنشاء سجل جديد
      result = await supabase
        .from('session_attendances')
        .insert({
          session_id: sessionId,
          student_id: studentId,
          attendance_status: attendanceStatus,
          notes: notes || null,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error managing attendance:', result.error);
      return { success: false, message: `فشل في حفظ الحضور: ${result.error.message}` };
    }

    // إعادة التحقق من مسار الجلسة لضمان تحديث البيانات في الواجهة
    // سنقوم بتحديث صفحة تفاصيل الجلسة التي سيتم فيها إدارة الحضور
    revalidatePath(`/teachers/sessions/${sessionId}`);

    return { success: true, message: 'تم حفظ حالة الحضور بنجاح!' };
  } catch (err) {
    console.error('Unhandled error in manageAttendanceAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}
