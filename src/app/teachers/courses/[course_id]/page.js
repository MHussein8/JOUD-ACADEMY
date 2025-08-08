// src/app/teachers/courses/[course_id]/page.js
// هذا Component يعمل على السيرفر (Server Component)

import { supabaseServer } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CourseDetailsPage({ params }) {
  const { course_id } = params;

  // إنشاء عميل Supabase للمكونات التي تعمل على السيرفر
  const supabase = supabaseServer();

  // جلب معلومات المستخدم الحالي
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in CourseDetailsPage:', userError);
    return (
      <div className="flex rtl">
        <div className="flex-grow p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل الدورة</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            يجب تسجيل الدخول لعرض تفاصيل الدورة.
          </div>
        </div>
      </div>
    );
  }

  const teacherId = user.id;

  // جلب تفاصيل الدورة
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', course_id)
    .eq('teacher_id', teacherId)
    .single();

  if (courseError) {
    console.error('Supabase Error fetching course details:', courseError);
    notFound();
  }

  if (!course) {
    console.error(`Course with ID ${course_id} not found or not accessible for teacher ${teacherId}.`);
    notFound();
  }

  // جلب الواجبات والاختبارات الخاصة بهذه الدورة
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, title, due_date, is_exam')
    .eq('course_id', course_id)
    .eq('teacher_id', teacherId)
    .order('due_date', { ascending: true });

  if (assignmentsError) {
    // ** هذا هو الجزء الذي تم تعديله لتحسين معالجة الخطأ **
    console.error('Error fetching assignments:', assignmentsError);
    // يمكنك هنا إظهار رسالة خطأ للمستخدم إذا رغبت
    return (
      <div className="flex rtl">
        <div className="flex-grow p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل الدورة</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            حدث خطأ أثناء جلب الواجبات. يرجى المحاولة مرة أخرى.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex rtl">
      <div className="flex-grow p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">دورة: {course.title}</h1>
        <div className="flex justify-end gap-2 mb-4">
          <Link href={`/teachers/courses/${course_id}/assignments/new`} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300">
            إنشاء واجب جديد
          </Link>
          <Link href={`/teachers/courses/${course_id}/edit`} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-300">
            تعديل الدورة
          </Link>
        </div>

        {/* قائمة الواجبات */}
        <h2 className="text-2xl font-semibold mb-4">الواجبات والاختبارات</h2>
        {assignments && assignments.length > 0 ? (
          <ul className="space-y-4">
            {assignments.map(assignment => (
              <li key={assignment.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{assignment.title}</h3>
                  <p className="text-sm text-gray-500">
                    النوع: {assignment.is_exam ? 'اختبار' : 'واجب'} | 
                    الموعد النهائي: {new Date(assignment.due_date).toLocaleString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Link href={`/teachers/courses/${course_id}/assignments/${assignment.id}/edit`} className="text-blue-600 hover:underline">
                  تعديل
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">لا يوجد واجبات أو اختبارات لهذه الدورة بعد.</p>
        )}
      </div>
    </div>
  );
}
