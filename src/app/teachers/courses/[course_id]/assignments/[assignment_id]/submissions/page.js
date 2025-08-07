// src/app/teachers/courses/[course_id]/assignments/[assignment_id]/submissions/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
// تم إزالة استيراد Sidebar هنا، لأن الـ Layout (src/app/teachers/layout.js) سيتولى الأمر

export default async function AssignmentSubmissionsPage({ params }) {
  const { course_id, assignment_id } = params; // جلب الـ ID الخاص بالكورس والواجب من المسار

  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in AssignmentSubmissionsPage:', userError);
    // لا حاجة لـ redirect هنا، الـ layout.js سيتولى الأمر
    return (
      <div className="text-red-500 text-center py-10">يجب تسجيل الدخول لعرض التسليمات.</div>
    );
  }

  const teacherId = user.id; // ID المعلم المسجل دخوله

  // جلب تفاصيل الواجب المحدد
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, type, is_exam, max_score, course_id, teacher_id')
    .eq('id', assignment_id)
    .eq('course_id', course_id)
    .eq('teacher_id', teacherId) // تأكد أن المعلم هو صاحب الواجب
    .single();

  if (assignmentError) {
    console.error('Error fetching assignment details for submissions:', assignmentError);
    // لا حاجة لـ redirect هنا، الـ layout.js سيتولى الأمر
    return (
      <div className="text-red-500 text-center py-10">
        الواجب المطلوب غير موجود أو ليس لديك صلاحية لعرض تسليماته.
      </div>
    );
  }

  // إذا لم يتم العثور على الواجب
  if (!assignment) {
    return (
      <div className="text-gray-600 text-center py-10">الواجب غير موجود.</div>
    );
  }

  // جلب تسليمات الطلاب لهذا الواجب من الجدول الجديد assignment_submissions
  const { data: submissions, error: submissionsError } = await supabase
    .from('assignment_submissions')
    .select(`
      id,
      submitted_at,
      status,
      score,
      student_id,
      users (
        full_name,
        avatar_url
      )
    `)
    .eq('assignment_id', assignment_id)
    .order('submitted_at', { ascending: false }); // ترتيب التسليمات من الأحدث للأقدم

  if (submissionsError) {
    console.error('Error fetching submissions:', submissionsError);
    return (
      <div className="text-red-500 text-center py-10">
        حدث خطأ أثناء تحميل التسليمات.
      </div>
    );
  }

  return (
    // تم إزالة div الـ flex الخارجي والـ Sidebar هنا
    // هذا المحتوى هو الـ children الذي سيتم تمريره إلى الـ Layout
    <>
      <Link href={`/teachers/assignments`} className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; العودة لإدارة الواجبات
      </Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">تسليمات الواجب/الاختبار: {assignment.title}</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">قائمة التسليمات</h2>

        {submissions && submissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200
                           transform transition-all duration-300 ease-in-out
                           hover:shadow-2xl hover:scale-105 flex flex-col"
              >
                <h3 className="text-xl font-bold mb-2 text-blue-700">
                  الطالب: {submission.users?.full_name || 'طالب غير معروف'}
                </h3>
                <p className="text-gray-600 mb-2 text-base">
                  تاريخ التسليم: <span className="font-medium">{new Date(submission.submitted_at).toLocaleDateString('ar-EG')}</span>
                </p>
                <p className="text-gray-600 mb-4 text-sm">
                  الحالة: <span className="font-medium">{submission.status === 'submitted' ? 'تم التسليم' : submission.status}</span>
                </p>
                {submission.score !== null && (
                  <p className="text-gray-600 mb-4 text-sm">
                    الدرجة: <span className="font-medium">{submission.score} / {assignment.max_score}</span>
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mt-auto"> {/* أزرار الإجراءات */}
                  <Link
                    href={`/teachers/courses/${course_id}/assignments/${assignment_id}/submissions/${submission.id}`}
                    className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg
                               hover:bg-indigo-700 transition-colors duration-300
                               shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75
                               text-center mt-auto flex-grow"
                  >
                    عرض التفاصيل / التصحيح
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-lg">لا توجد تسليمات لهذا الواجب/الاختبار بعد.</p>
        )}
      </section>
    </>
  );
}
