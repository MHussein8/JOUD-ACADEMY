// src/app/teachers/layout.js
// هذا الـ Layout سيتم تطبيقه على جميع الصفحات داخل مسار /teachers
// وهو المسؤول عن عرض الـ Sidebar مرة واحدة فقط.

import Sidebar from '@/components/Sidebar'; // استيراد مكون الـ Sidebar
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation'; // لاستخدام الـ redirection

export default async function TeachersLayout({ children }) {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي للتحقق من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // إذا لم يكن المستخدم مسجلاً الدخول، أعد توجيهه إلى صفحة تسجيل الدخول
  if (userError || !user) {
    // يمكنك تعديل هذا المسار ليتناسب مع مسار صفحة تسجيل الدخول الخاصة بك
    redirect('/auth/login');
  }

  // يمكنك هنا إضافة منطق للتحقق من دور المستخدم (إذا كان مدرسًا)
  // مثال:
  // const { data: profile, error: profileError } = await supabase
  //   .from('profiles')
  //   .select('role')
  //   .eq('id', user.id)
  //   .single();

  // if (profileError || profile?.role !== 'teacher') {
  //   redirect('/unauthorized'); // أو صفحة خطأ أخرى
  // }

  return (
    <div className="flex rtl min-h-screen"> {/* استخدام flexbox لترتيب السايد بار والمحتوى */}
      {/* عرض الـ Sidebar هنا مرة واحدة فقط */}
      <Sidebar userRole="teacher" />
      
      {/* هذا هو المكان الذي سيتم فيه عرض محتوى أي صفحة فرعية (page.js) */}
      <main className="flex-grow p-6 bg-gray-100"> {/* أضف خلفية خفيفة للمحتوى */}
        {children}
      </main>
    </div>
  );
}
