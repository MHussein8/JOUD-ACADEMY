// src/app/teachers/sessions/create/page.js
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import CreateSessionForm from '@/components/CreateSessionForm';

export default async function CreateSessionPage() {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in CreateSessionPage:', userError);
    return (
      <div className="text-red-500 text-center py-10">يجب تسجيل الدخول لإنشاء جلسات.</div>
    );
  }

  const teacherId = user.id;

  const { data: teacherCourses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('teacher_id', teacherId);

  if (coursesError) {
    console.error('Error fetching teacher courses for session creation:', coursesError);
    return (
      <div className="text-red-500 text-center py-10">حدث خطأ أثناء تحميل الكورسات.</div>
    );
  }

  return (
    <>
      <Link href="/teachers/sessions" className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; العودة لإدارة الجلسات
      </Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">إنشاء جلسة جديدة</h1>

      {teacherCourses && teacherCourses.length > 0 ? (
        <CreateSessionForm teacherCourses={teacherCourses} />
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">تنبيه!</strong>
          <span className="block sm:inline"> لا يوجد كورسات مسجلة لك حاليًا. الرجاء إضافة كورس أولاً.</span>
          <Link href="/teachers/courses/create" className="text-blue-600 hover:underline block mt-2">
            انقر هنا لإضافة كورس جديد
          </Link>
        </div>
      )}
    </>
  );
}
