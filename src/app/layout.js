// src/app/layout.js
import './globals.css'; // استيراد ملف الـ CSS الأساسي
import { Inter } from 'next/font/google'; // استيراد خط Inter من جوجل
import { Suspense } from 'react'; // لاستخدام Suspense لإدارة حالات التحميل
import DynamicNavbar from '@/components/DynamicNavbar'; // استيراد مكون شريط التنقل الديناميكي

// تهيئة خط Inter (يمكنك استبداله بخط عربي آخر إذا رغبت لاحقًا)
const inter = Inter({ subsets: ['latin'] });

// معلومات الميتا داتا للموقع (تظهر في تبويبة المتصفح)
export const metadata = {
  title: 'منصة جود أكاديمي التعليمية',
  description: 'منصة تعليمية عربية متكاملة للبرمجة وتطوير المهارات.',
};

// الـ Root Layout بتاع التطبيق كله
export default function RootLayout({ children }) {
  return (
    // تعريف لغة الصفحة واتجاه الكتابة من اليمين لليسار
    <html lang="ar" dir="rtl">
      {/* جسم الصفحة: بنستخدم Tailwind CSS لضمان تنسيق عام وجماليات */}
      {/* bg-gradient-to-br: خلفية متدرجة لإحساس بالفخامة */}
      <body className={`${inter.className} bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col min-h-screen`}>
        {/* استخدام مكون شريط التنقل الديناميكي */}
        <DynamicNavbar />

        {/* مسافة علوية لضمان عدم تغطية المحتوى بالـ Navbar الثابت */}
        <div className="pt-20"> {/* ارتفاع الـ Navbar حوالي 64px (p-4) */}
          {/* Suspense لإظهار رسالة تحميل بينما يتم جلب البيانات في Server Components */}
          <Suspense fallback={<div className="text-center py-10 text-gray-600">جاري التحميل...</div>}>
            {/* المحتوى الرئيسي لكل صفحة (children) سيظهر هنا */}
            <main className="flex-grow">
              {children}
            </main>
          </Suspense>
        </div>

        {/* شريط التذييل السفلي (Footer): تصميم فخم */}
        {/* bg-gray-900: لون أغمق وأكثر فخامة، text-gray-300: لون نص فاتح، shadow-inner: ظل داخلي */}
        <footer className="bg-gray-900 text-gray-300 p-8 text-center mt-auto shadow-inner">
          <div className="container mx-auto">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} جود أكاديمي. جميع الحقوق محفوظة.
              <span className="block mt-2">صُمم بحب في قلب العالم العربي.</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
