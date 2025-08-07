// src/app/teachers/assignments/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
// تم إزالة استيراد Sidebar هنا، لأن الـ Layout سيتولى الأمر
import CreateAssignmentButtonWithCourseSelection from '@/components/CreateAssignmentButtonWithCourseSelection'; // استيراد المكون الجديد
import DeleteAssignmentButton from '@/components/DeleteAssignmentButton'; // استيراد المكون الجديد لزر حذف الواجب

export default async function TeacherAssignmentsPage() {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log('User fetched in TeacherAssignmentsPage:', user); // للتشخيص

  if (userError || !user) {
    console.error('Error getting user in TeacherAssignmentsPage:', userError);
    // لا حاجة لـ redirect هنا، الـ layout.js سيتولى الأمر
    return (
      <div className="text-red-500 text-center py-10">يجب تسجيل الدخول لعرض الواجبات.</div>
    );
  }

  const teacherId = user.id; // استخدام الـ ID الحقيقي للمعلم المسجل دخوله

  // جلب الواجبات الخاصة بالمعلم
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, type, is_exam, max_score, courses(id, title)')
    .eq('teacher_id', teacherId)
    .order('due_date', { ascending: true });

  // جلب الكورسات الخاصة بالمعلم (لزر إنشاء الواجب)
  const { data: teacherCourses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title') // جلب الـ ID والعنوان فقط للاختيار
    .eq('teacher_id', teacherId);

  console.log('Teacher Courses fetched:', teacherCourses); // للتشخيص

  if (assignmentsError) {
    console.error('Error fetching teacher assignments:', assignmentsError);
    // يمكننا عرض خطأ للواجبات فقط
  }

  if (coursesError) {
    console.error('Error fetching teacher courses:', coursesError);
    // يمكننا عرض خطأ للكورسات فقط أو تمرير مصفوفة فارغة
  }

  return (
    // تم إزالة div الـ flex الخارجي والـ Sidebar هنا
    // هذا المحتوى هو الـ children الذي سيتم تمريره إلى الـ Layout
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">إدارة الواجبات والاختبارات</h1>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">جميع الواجبات والاختبارات</h2>
          {/* استخدام المكون الجديد لزر إنشاء الواجب مع قائمة الكورسات */}
          <CreateAssignmentButtonWithCourseSelection courses={teacherCourses || []} />
        </div>

        {assignments && assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200
                             transform transition-all duration-300 ease-in-out
                             hover:shadow-2xl hover:scale-105 flex flex-col"
              >
                <h3 className="text-2xl font-extrabold mb-2 text-blue-700">{assignment.title}</h3>
                <p className="text-gray-600 mb-2 text-base leading-relaxed">
                  الكورس: <span className="font-medium">{assignment.courses?.title || 'غير معروف'}</span>
                </p>
                <p className="text-gray-600 mb-4 text-sm">
                  النوع: {assignment.type === 'exam' ? 'اختبار' : 'واجب'}
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  تاريخ الاستحقاق: <span className="font-medium">{new Date(assignment.due_date).toLocaleDateString('ar-EG')}</span>
                </p>

                <div className="flex flex-wrap gap-3 mt-auto"> {/* أزرار الإجراءات */}
                  <Link
                    href={`/teachers/courses/${assignment.courses?.id || 'default-course-id'}/assignments/${assignment.id}/submissions`}
                    className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg
                                 hover:bg-indigo-700 transition-colors duration-300
                                 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75
                                 text-center mt-auto flex-grow"
                  >
                    عرض التسليمات
                  </Link>
                  {/* زر تعديل الواجب */}
                  <Link
                    href={`/teachers/courses/${assignment.courses?.id || 'default-course-id'}/assignments/${assignment.id}/edit`}
                    className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-lg
                                 hover:bg-yellow-600 transition-colors duration-300
                                 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75
                                 text-center text-sm flex-grow"
                  >
                    تعديل
                  </Link>
                  {/* زر حذف الواجب: استخدام المكون الجديد DeleteAssignmentButton */}
                  <DeleteAssignmentButton assignmentId={assignment.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-lg">لا توجد واجبات أو اختبارات منشأة بعد. يرجى استخدام الزر أعلاه لإنشاء واجب جديد.</p>
        )}
      </section>
    </>
  );
}
