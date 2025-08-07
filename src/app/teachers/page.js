// src/app/teachers/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
// تم إزالة استيراد Sidebar هنا، لأن الـ Layout سيتولى الأمر
import TeacherWelcomeCard from '@/components/TeacherWelcomeCard'; // استيراد مكون بطاقة الترحيب

export default async function TeacherDashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // لا حاجة لـ redirect هنا، الـ layout.js سيتولى الأمر
  // هذا الجزء لن يتم الوصول إليه عادةً إذا كان الـ layout.js يعمل بشكل صحيح
  // ولكن نتركه كـ fallback أو للتشخيص
  if (userError || !user) {
    console.error('Error getting user in TeacherDashboardPage (fallback):', userError);
    return (
      <div className="text-red-500 text-center py-10">يجب تسجيل الدخول لعرض لوحة التحكم.</div>
    );
  }

  // استخدام الـ ID الحقيقي للمعلم المسجل دخوله
  const teacherId = user.id; 
  const teacherName = user.user_metadata?.full_name || user.email; // جلب اسم المعلم أو البريد الإلكتروني

  console.log('User fetched in TeacherDashboardPage, teacherId:', teacherId); // للتأكد من الـ ID

  // جلب عدد الكورسات
  const { count: coursesCount, error: coursesError } = await supabase
    .from('courses')
    .select('id', { count: 'exact' })
    .eq('teacher_id', teacherId);

  // جلب عدد الواجبات والاختبارات
  const { count: assignmentsCount, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id', { count: 'exact' })
    .eq('teacher_id', teacherId);

  // أولاً: جلب جميع assignment_ids التي يملكها هذا المعلم
  const { data: teacherAssignmentIds, error: fetchAssignmentIdsError } = await supabase
    .from('assignments')
    .select('id')
    .eq('teacher_id', teacherId);

  const assignmentIds = teacherAssignmentIds ? teacherAssignmentIds.map(a => a.id) : [];

  if (fetchAssignmentIdsError) {
    console.error('Error fetching teacher assignment IDs:', fetchAssignmentIdsError);
  }

  // ثانياً: استخدام هذه المصفوفة في استعلام التسليمات المعلقة
  const { count: pendingSubmissionsCount, error: pendingSubmissionsError } = await supabase
    .from('assignment_submissions')
    .select('id', { count: 'exact' })
    .in('status', ['submitted', 'pending_review'])
    .in('assignment_id', assignmentIds);

  // جلب جميع course_ids التي يملكها هذا المعلم
  const { data: teacherCourseIdsData, error: fetchTeacherCourseIdsError } = await supabase
    .from('courses')
    .select('id')
    .eq('teacher_id', teacherId);

  const teacherCourseIds = teacherCourseIdsData ? teacherCourseIdsData.map(c => c.id) : [];

  if (fetchTeacherCourseIdsError) {
    console.error('Error fetching teacher course IDs:', fetchTeacherCourseIdsError);
  }

  // جلب عدد الطلاب الفريدين المسجلين في كورسات هذا المعلم
  const { count: studentsCount, error: studentsCountError } = await supabase
    .from('enrollments') 
    .select('student_id', { count: 'exact', distinct: true }) 
    .in('course_id', teacherCourseIds);

  if (studentsCountError) {
    console.error('Error fetching students count:', studentsCountError);
  }

  // جلب أحدث 5 واجبات (للعرض السريع)
  const { data: latestAssignments, error: latestAssignmentsError } = await supabase
    .from('assignments')
    .select('id, title, due_date, type, courses(title)')
    .eq('teacher_id', teacherId)
    .order('due_date', { ascending: false })
    .limit(5);

  // جلب أحدث 5 تسليمات (للعرض السريع)
  const { data: latestSubmissions, error: latestSubmissionsError } = await supabase
    .from('assignment_submissions')
    .select('id, submitted_at, status, score, assignments(title), users(full_name)')
    .in('assignment_id', assignmentIds)
    .order('submitted_at', { ascending: false })
    .limit(5);

  return (
    // تم إزالة div الـ flex الخارجي والـ Sidebar هنا، لأن الـ Layout سيتولى الأمر
    // هذا المحتوى هو الـ children الذي سيتم تمريره إلى الـ Layout
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">لوحة تحكم المعلم</h1>

      {/* إضافة بطاقة الترحيب هنا */}
      <TeacherWelcomeCard teacherName={teacherName} />

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* كارت عدد الكورسات */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center transform transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
          <h2 className="text-5xl font-extrabold text-blue-600 mb-2">{coursesCount || 0}</h2>
          <p className="text-lg font-semibold text-gray-700">الكورسات</p>
          <Link href="/teachers/courses" className="text-blue-500 hover:underline text-sm mt-2 inline-block">عرض الكورسات</Link>
        </div>

        {/* كارت عدد الواجبات والاختبارات */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center transform transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
          <h2 className="text-5xl font-extrabold text-green-600 mb-2">{assignmentsCount || 0}</h2>
          <p className="text-lg font-semibold text-gray-700">الواجبات والاختبارات</p>
          <Link href="/teachers/assignments" className="text-green-500 hover:underline text-sm mt-2 inline-block">إدارة الواجبات</Link>
        </div>

        {/* كارت عدد التسليمات المعلقة */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center transform transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
          <h2 className="text-5xl font-extrabold text-yellow-600 mb-2">{pendingSubmissionsCount || 0}</h2>
          <p className="text-lg font-semibold text-gray-700">تسليمات تنتظر المراجعة</p>
          <Link href="/teachers/assignments" className="text-yellow-500 hover:underline text-sm mt-2 inline-block">مراجعة التسليمات</Link>
        </div>

        {/* كارت عدد الطلاب المسجلين */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center transform transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
          <h2 className="text-5xl font-extrabold text-purple-600 mb-2">{studentsCount || 0}</h2>
          <p className="text-lg font-semibold text-gray-700">الطلاب المسجلون</p>
          <Link href="/teachers/student-performance" className="text-purple-500 hover:underline text-sm mt-2 inline-block">عرض أداء الطلاب</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* أحدث الواجبات */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">أحدث الواجبات والاختبارات</h2>
          {latestAssignments && latestAssignments.length > 0 ? (
            <ul className="space-y-3">
              {latestAssignments.map((assignment) => (
                <li key={assignment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">{assignment.title}</p>
                    <p className="text-sm text-gray-500">{assignment.courses?.title || 'غير معروف'} - {assignment.type === 'exam' ? 'اختبار' : 'واجب'}</p>
                  </div>
                  <p className="text-sm text-gray-600">{new Date(assignment.due_date).toLocaleDateString('ar-EG')}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">لا توجد واجبات أو اختبارات حديثة.</p>
          )}
        </div>

        {/* أحدث التسليمات */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">أحدث التسليمات</h2>
          {latestSubmissions && latestSubmissions.length > 0 ? (
            <ul className="space-y-3">
              {latestSubmissions.map((submission) => (
                <li key={submission.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">{submission.users?.full_name || 'طالب غير معروف'}</p>
                    <p className="text-sm text-gray-500">{submission.assignments?.title || 'واجب غير معروف'}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(submission.submitted_at).toLocaleDateString('ar-EG')} - {submission.status === 'submitted' ? 'تم التسليم' : submission.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">لا توجد تسليمات حديثة.</p>
          )}
        </div>
      </section>
    </>
  );
}
