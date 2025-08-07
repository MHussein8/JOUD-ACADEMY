// src/app/teachers/courses/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
// تم إزالة استيراد Sidebar هنا، لأن الـ Layout (src/app/teachers/layout.js) سيتولى الأمر
import DeleteCourseButton from '@/components/DeleteCourseButton'; // استيراد المكون الجديد لزر الحذف

export default async function TeacherCoursesPage() {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in TeacherCoursesPage:', userError);
    // لا حاجة لـ redirect هنا، الـ layout.js سيتولى الأمر
    return (
      <div className="text-red-500 text-center py-10">يجب تسجيل الدخول لعرض الكورسات.</div>
    );
  }

  const teacherId = user.id; // استخدام الـ ID الحقيقي للمعلم المسجل دخوله

  // جلب الكورسات الخاصة بالمعلم
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, description, start_date, is_active') // تأكد من جلب is_active هنا
    .eq('teacher_id', teacherId) // جلب الكورسات الخاصة بالمعلم المسجل دخوله فقط
    .order('start_date', { ascending: false });

  if (coursesError) {
    console.error('Error fetching teacher courses:', coursesError);
    // يمكننا عرض رسالة خطأ هنا
  }

  return (
    // تم إزالة div الـ flex الخارجي والـ Sidebar هنا، لأن الـ Layout سيتولى الأمر
    // هذا المحتوى هو الـ children الذي سيتم تمريره إلى الـ Layout
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">إدارة الكورسات</h1>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">جميع الكورسات</h2>
          <Link
            href="/teachers/courses/create"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold
                       hover:bg-blue-700 transition-colors duration-300 shadow-md"
          >
            + إنشاء كورس جديد
          </Link>
        </div>

        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200
                           transform transition-all duration-300 ease-in-out
                           hover:shadow-2xl hover:scale-105 flex flex-col"
              >
                <h3 className="text-2xl font-extrabold mb-2 text-blue-700">{course.title}</h3>
                <p className="text-gray-600 mb-4 text-base leading-relaxed">
                  {course.description || 'لا يوجد وصف متاح.'}
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  تاريخ البدء: <span className="font-medium">{new Date(course.start_date).toLocaleDateString('ar-EG')}</span>
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  الحالة: <span className={`font-medium ${course.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {course.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </p>

                <div className="flex flex-wrap gap-3 mt-auto"> {/* أزرار الإجراءات */}
                  <Link
                    href={`/teachers/courses/${course.id}`}
                    className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold
                               hover:bg-indigo-700 transition-colors duration-300 shadow-md flex-grow text-center"
                  >
                    عرض التفاصيل
                  </Link>
                  {/* زر تعديل الكورس - هذا هو الزر الذي كان مفقودًا */}
                  <Link
                    href={`/teachers/courses/${course.id}/edit`}
                    className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold
                               hover:bg-yellow-600 transition-colors duration-300 shadow-md flex-grow text-center"
                  >
                    تعديل
                  </Link>
                  {/* زر الحذف: استخدام المكون الجديد DeleteCourseButton */}
                  <DeleteCourseButton courseId={course.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-lg">لا توجد كورسات منشأة بعد. يرجى استخدام الزر أعلاه لإنشاء كورس جديد.</p>
        )}
      </section>
    </>
  );
}
