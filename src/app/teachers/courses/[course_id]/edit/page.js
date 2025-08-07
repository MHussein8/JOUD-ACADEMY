// src/app/teachers/courses/[course_id]/edit/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
// تم إزالة استيراد Sidebar هنا، لأن الـ Layout (src/app/teachers/layout.js) سيتولى الأمر
import EditCourseForm from '@/components/EditCourseForm'; // استيراد مكون نموذج تعديل الكورس
import { notFound } from 'next/navigation'; // لاستخدام notFound في حالة عدم العثور على الكورس

export default async function EditCoursePage({ params }) {
  const { course_id } = params; // جلب الـ ID الخاص بالكورس من المسار مباشرة

  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in EditCoursePage:', userError);
    // لا حاجة لـ redirect هنا، الـ layout.js سيتولى الأمر
    return (
      <div className="text-red-500 text-center py-10">يجب تسجيل الدخول لتعديل الكورسات.</div>
    );
  }

  const teacherId = user.id; // ID المعلم المسجل دخوله

  // جلب تفاصيل الكورس المحدد
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description, start_date, is_active, teacher_id') // تأكد من جلب is_active
    .eq('id', course_id)
    .eq('teacher_id', teacherId) // تأكد أن المعلم هو صاحب الكورس
    .single();

  if (courseError || !course) {
    console.error('Error fetching course details for editing:', courseError);
    notFound(); // عرض صفحة 404 إذا لم يتم العثور على الكورس أو لم يكن المعلم هو صاحبه
  }

  return (
    // تم إزالة div الـ flex الخارجي والـ Sidebar هنا، لأن الـ Layout سيتولى الأمر
    // هذا المحتوى هو الـ children الذي سيتم تمريره إلى الـ Layout
    <>
      <Link href={`/teachers/courses/${course_id}`} className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; العودة لتفاصيل الكورس
      </Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">تعديل الكورس: {course.title}</h1>

      {/* هنا سنستخدم المكون Client Component الذي سيحتوي على النموذج */}
      {/* تأكد من أن مكون EditCourseForm موجود في المسار الصحيح */}
      <EditCourseForm course={course} />
    </>
  );
}
