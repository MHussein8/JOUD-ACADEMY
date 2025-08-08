// src/app/teachers/settings/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
// تم إزالة استيراد Sidebar هنا، لأن الـ Layout (src/app/teachers/layout.js) سيتولى الأمر

export default async function TeacherSettingsPage() {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in TeacherSettingsPage:', userError);
    // لا حاجة لـ redirect هنا، الـ layout.js سيتولى الأمر
    return (
      <div className="text-red-500 text-center py-10">يجب تسجيل الدخول لعرض وإدارة الإعدادات.</div>
    );
  }

  // هنا سيتم جلب بيانات إعدادات المعلم الحقيقية لاحقًا
  // حاليًا، سنعرض رسالة بسيطة
  const hasSettingsData = false; // مؤقتًا، نفترض عدم وجود بيانات

  return (
    // تم إزالة div الـ flex الخارجي والـ Sidebar هنا
    // هذا المحتوى هو الـ children الذي سيتم تمريره إلى الـ Layout
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">الإعدادات</h1>

      <section className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">إعدادات الملف الشخصي</h2>
        {hasSettingsData ? (
          // هنا سيتم عرض حقول إعدادات الملف الشخصي
          <p className="text-gray-700 text-lg">سيتم عرض إعدادات ملفك الشخصي هنا.</p>
        ) : (
          <p className="text-gray-500 text-lg">لا توجد إعدادات لعرضها بعد. سيتم تحديث هذا القسم عند توفر البيانات.</p>
        )}
      </section>

      {/* يمكن إضافة أقسام أخرى هنا مثل:
          - إعدادات الإشعارات
          - إعدادات الخصوصية
          - تغيير كلمة المرور
      */}
    </>
  );
}
