// src/app/teachers/sessions/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
// تم إزالة استيراد Sidebar هنا، لأن الـ Layout (src/app/teachers/layout.js) سيتولى الأمر
import DeleteSessionButton from '@/components/DeleteSessionButton'; // استيراد المكون الجديد لزر الحذف

export default async function TeacherSessionsPage() {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in TeacherSessionsPage:', userError);
    // لا حاجة لـ redirect هنا، الـ layout.js سيتولى الأمر
    return (
      <div className="text-red-500 text-center py-10">يجب تسجيل الدخول لعرض وإدارة الجلسات المباشرة.</div>
    );
  }

  const teacherId = user.id; // ID المعلم المسجل دخوله
  console.log('Teacher ID in TeacherSessionsPage:', teacherId); // للمساعدة في التشخيص

  // جلب الجلسات الخاصة بهذا المعلم، مع جلب عنوان الكورس المرتبط
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, title, description, start_time, end_time, zoom_link, notes, courses(title)')
    .eq('teacher_id', teacherId) // جلب الجلسات الخاصة بالمعلم المسجل دخوله فقط
    .order('start_time', { ascending: false }); // ترتيب الجلسات من الأحدث للأقدم

  if (sessionsError) {
    console.error('Error fetching teacher sessions:', sessionsError);
    return (
      <div className="text-red-500 text-center py-10">
        حدث خطأ أثناء تحميل الجلسات: {sessionsError.message || 'خطأ غير معروف'}.
      </div>
    );
  }

  console.log('Fetched sessions data:', sessions); // للمساعدة في التشخيص

  return (
    // هذا المحتوى هو الـ children الذي سيتم تمريره إلى الـ Layout
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">إدارة الجلسات المباشرة</h1>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">جميع الجلسات</h2>
          <Link
            href="/teachers/sessions/create" // رابط لصفحة إنشاء جلسة جديدة (سنقوم بإنشائها لاحقًا)
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold
                       hover:bg-blue-700 transition-colors duration-300 shadow-md"
          >
            + إنشاء جلسة جديدة
          </Link>
        </div>

        {sessions && sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200
                           transform transition-all duration-300 ease-in-out
                           hover:shadow-2xl hover:scale-105 flex flex-col"
              >
                <Link href={`/teachers/sessions/${session.id}`} className="block">
  <h3 className="text-2xl font-extrabold mb-2 text-blue-700 hover:underline cursor-pointer">
    {session.title}
  </h3>
</Link>
                <p className="text-gray-600 mb-2 text-base leading-relaxed">
                  الكورس: <span className="font-medium">{session.courses?.title || 'غير معروف'}</span>
                </p>
                <p className="text-gray-600 mb-4 text-sm">
                  الوصف: {session.description || 'لا يوجد وصف متاح.'}
                </p>
                <p className="text-gray-500 text-sm mb-2">
                  تبدأ: <span className="font-medium">{new Date(session.start_time).toLocaleString('ar-EG')}</span>
                </p>
                {session.end_time && (
                  <p className="text-gray-500 text-sm mb-4">
                    تنتهي: <span className="font-medium">{new Date(session.end_time).toLocaleString('ar-EG')}</span>
                  </p>
                )}
                {session.zoom_link && (
                  <p className="text-gray-500 text-sm mb-4">
                    رابط الزوم: <a href={session.zoom_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{session.zoom_link}</a>
                  </p>
                )}
                {session.notes && (
                  <p className="text-gray-500 text-sm mb-4">
                    ملاحظات: {session.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-gray-100">
                  {/* رابط لصفحة تعديل الجلسة (سنقوم بإنشائها لاحقًا) */}
                  <Link
                    href={`/teachers/sessions/${session.id}/edit`}
                    className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold
                               hover:bg-yellow-600 transition-colors duration-300 shadow-md flex-grow text-center"
                  >
                    تعديل
                  </Link>
                  {/* استخدام المكون الجديد لزر الحذف */}
                  <DeleteSessionButton sessionId={session.id} sessionTitle={session.title} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-lg">لا توجد جلسات منشأة بعد. يرجى استخدام الزر أعلاه لإنشاء جلسة جديدة.</p>
        )}
      </section>
    </>
  );
}
