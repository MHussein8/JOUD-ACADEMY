// src/app/teachers/sessions/[session_id]/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
// تم إزالة استيراد مكون الـ Sidebar هنا، لأنه سيتم توفيره بواسطة الـ Layout الأب
// import Sidebar from '@/components/Sidebar'; 
import ManageAttendanceForm from '@/components/ManageAttendanceForm'; // استيراد مكون إدارة الحضور

export default async function SessionDetailsPage({ params }) {
  const { session_id } = params; // جلب الـ ID الخاص بالجلسة من المسار

  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in SessionDetailsPage:', userError);
    // لا حاجة لـ redirect هنا، الـ layout.js سيتولى الأمر
    return (
      <div className="flex-grow p-6"> {/* تم إزالة flex rtl و Sidebar من هنا */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل الجلسة</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          يجب تسجيل الدخول لعرض تفاصيل الجلسة.
        </div>
      </div>
    );
  }

  const teacherId = user.id; // ID المعلم المسجل دخوله

  // 1. جلب تفاصيل الجلسة والكورس المرتبط بها
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, title, description, start_time, end_time, zoom_link, notes, course_id, courses(id, title, teacher_id)')
    .eq('id', session_id)
    .eq('teacher_id', teacherId) // التأكد أن الجلسة تتبع هذا المعلم
    .single();

  if (sessionError) {
    console.error('Error fetching session details:', sessionError);
    return (
      <div className="flex-grow p-6"> {/* تم إزالة flex rtl و Sidebar من هنا */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل الجلسة</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          الجلسة المطلوبة غير موجودة أو ليس لديك صلاحية لعرضها.
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-grow p-6"> {/* تم إزالة flex rtl و Sidebar من هنا */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل الجلسة</h1>
        <div className="text-gray-600 text-center py-10">الجلسة غير موجودة.</div>
      </div>
    );
  }

  // 2. جلب الطلاب المسجلين في الكورس المرتبط بهذه الجلسة
  const { data: enrolledStudents, error: studentsError } = await supabase
    .from('enrollments')
    .select('student_id, users(id, full_name)') // جلب ID واسم الطالب
    .eq('course_id', session.course_id);

  if (studentsError) {
    console.error('Error fetching enrolled students:', studentsError);
    // يمكن التعامل مع هذا الخطأ بشكل منفصل إذا أردنا عرض تفاصيل الجلسة بدون قائمة الطلاب
  }

  // 3. جلب سجلات الحضور الحالية لهذه الجلسة
  const { data: attendanceRecords, error: attendanceError } = await supabase
    .from('session_attendances')
    .select('student_id, attendance_status, notes')
    .eq('session_id', session_id);

  if (attendanceError) {
    console.error('Error fetching attendance records:', attendanceError);
    // يمكن التعامل مع هذا الخطأ بشكل منفصل
  }

  // تحويل سجلات الحضور إلى كائن لسهولة الوصول إليها
  const currentAttendanceMap = attendanceRecords?.reduce((acc, record) => {
    acc[record.student_id] = { status: record.attendance_status, notes: record.notes };
    return acc;
  }, {}) || {};

  return (
    // تم إزالة div.flex.rtl و Sidebar من هنا
    <div className="flex-grow p-6"> {/* محتوى الصفحة الرئيسي */}
      <Link href="/teachers/sessions" className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; العودة لإدارة الجلسات
      </Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل الجلسة: {session.title}</h1>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">معلومات الجلسة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p><strong>الكورس:</strong> {session.courses?.title || 'غير معروف'}</p>
          <p><strong>الوصف:</strong> {session.description || 'لا يوجد وصف.'}</p>
          <p><strong>تبدأ:</strong> {new Date(session.start_time).toLocaleString('ar-EG')}</p>
          {session.end_time && <p><strong>تنتهي:</strong> {new Date(session.end_time).toLocaleString('ar-EG')}</p>}
          {session.zoom_link && <p><strong>رابط الزوم:</strong> <a href={session.zoom_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{session.zoom_link}</a></p>}
          {session.notes && <p><strong>ملاحظات:</strong> {session.notes}</p>}
        </div>
      </div>

      {/* قسم إدارة الحضور */}
      <section className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">إدارة الحضور</h2>
        {enrolledStudents && enrolledStudents.length > 0 ? (
          <ManageAttendanceForm
            sessionId={session.id}
            enrolledStudents={enrolledStudents}
            currentAttendance={currentAttendanceMap}
          />
        ) : (
          <p className="text-gray-500 text-lg">لا يوجد طلاب مسجلون في هذا الكورس بعد.</p>
        )}
      </section>
    </div>
  );
}
