// src/app/teachers/sessions/[session_id]/edit/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
// تم إزالة استيراد Sidebar هنا، لأن الـ Layout (src/app/teachers/layout.js) سيتولى الأمر
import EditSessionForm from '@/components/EditSessionForm'; // سنقوم بإنشاء هذا المكون لاحقًا
import { notFound } from 'next/navigation';

export default async function EditSessionPage({ params }) {
  const { session_id } = params; // جلب الـ ID الخاص بالجلسة من المسار

  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in EditSessionPage:', userError);
    return (
      <div className="flex-grow p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">تعديل الجلسة</h1>
        <div className="text-red-500 text-center py-10">يجب تسجيل الدخول لتعديل الجلسات.</div>
      </div>
    );
  }

  const teacherId = user.id; // ID المعلم المسجل دخوله

  // جلب تفاصيل الجلسة المراد تعديلها
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, title, description, start_time, end_time, zoom_link, notes, course_id, teacher_id')
    .eq('id', session_id)
    .eq('teacher_id', teacherId) // التأكد أن المعلم هو صاحب الجلسة
    .single();

  if (sessionError || !session) {
    console.error('Error fetching session for edit:', sessionError);
    notFound(); // عرض صفحة 404 إذا لم يتم العثور على الجلسة أو ليس للمعلم صلاحية
  }

  // جلب الكورسات الخاصة بهذا المعلم لملء قائمة الاختيار في النموذج
  const { data: teacherCourses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('teacher_id', teacherId)
    .order('title', { ascending: true });

  if (coursesError) {
    console.error('Error fetching teacher courses for session edit:', coursesError);
    return (
      <div className="flex-grow p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">تعديل الجلسة</h1>
        <div className="text-red-500 text-center py-10">حدث خطأ أثناء تحميل الكورسات.</div>
      </div>
    );
  }

  return (
    <>
      <Link href={`/teachers/sessions/${session_id}`} className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; العودة لتفاصيل الجلسة
      </Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">تعديل الجلسة: {session.title}</h1>

      {teacherCourses && teacherCourses.length > 0 ? (
        <EditSessionForm session={session} teacherCourses={teacherCourses} />
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">تنبيه!</strong>
          <span className="block sm:inline"> لا توجد كورسات متاحة لتعديل الجلسة أو ربطها بكورس آخر.</span>
        </div>
      )}
    </>
  );
}
