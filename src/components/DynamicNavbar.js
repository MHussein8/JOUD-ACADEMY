// src/components/DynamicNavbar.js
'use client'; // هذا السطر ضروري لتعريف المكون كـ Client Component

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // استيراد مكون Image من Next.js
import { createClientSupabaseClient } from '@/lib/supabase/client'; // استيراد Client Supabase Client
import { useRouter, usePathname } from 'next/navigation'; // استيراد useRouter و usePathname

export default function DynamicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null); // حالة لتخزين معلومات المستخدم
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // حالة لتحميل المصادقة
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // التحقق من حالة المصادقة عند تحميل المكون
    const checkUser = async () => {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoadingAuth(false);
    };

    checkUser();

    // إضافة مستمع لتغييرات حالة المصادقة
    const { data: { subscription } } = createClientSupabaseClient().auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_OUT') {
        // إذا قام المستخدم بتسجيل الخروج، أعد توجيهه إلى الصفحة الرئيسية
        router.push('/');
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe(); // إلغاء الاشتراك عند إلغاء تحميل المكون
    };
  }, [router]);

  // دالة لتسجيل الخروج
  const handleSignOut = async () => {
    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();
    setUser(null); // مسح معلومات المستخدم
    router.push('/'); // إعادة التوجيه إلى الصفحة الرئيسية
  };

  // إخفاء أزرار الدخول/التسجيل إذا كان المستخدم مسجلاً الدخول، أو إذا كان في صفحات الدخول/التسجيل بالفعل
  const showAuthButtons = !user &&
                         !pathname.startsWith('/student/login') &&
                         !pathname.startsWith('/student/register') &&
                         !pathname.startsWith('/teacher/login') &&
                         !pathname.startsWith('/teacher/register'); // ******** تم إضافة هذا الشرط ********

  return (
    <nav
      className={`fixed w-full z-50 top-0 transition-all duration-300 ease-in-out
                  ${isScrolled
                    ? 'bg-blue-900 shadow-xl'
                    : 'bg-blue-800/70 shadow-none'
                  }`}
    >
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="https://placehold.co/40x40/000000/FFFFFF?text=Logo"
            alt="Joud Academy Logo"
            width={40}
            height={40}
            className="h-10 w-10 ml-3"
            unoptimized={true}
          />
          <span className={`text-3xl font-extrabold transition-colors duration-200 text-white`}>
            جود أكاديمي
          </span>
        </Link>
        <ul className="flex space-x-6 space-x-reverse text-lg font-medium items-center">
          <li>
            <Link href="/" className={`hover:text-blue-200 transition-colors duration-200 text-white`}>
              الرئيسية
            </Link>
          </li>
          {isLoadingAuth ? (
            // عرض حالة تحميل بسيطة
            <li>
              <span className="text-white text-sm">جاري التحقق...</span>
            </li>
          ) : user ? (
            // إذا كان المستخدم مسجلاً الدخول
            <>
              <li>
                <span className="text-white text-base">مرحباً، {user.user_metadata?.full_name || user.email || 'مستخدم'}</span>
              </li>
              <li>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200 text-sm"
                >
                  تسجيل الخروج
                </button>
              </li>
            </>
          ) : (
            // إذا لم يكن المستخدم مسجلاً الدخول
            showAuthButtons && (
              <>
                <li>
                  <Link href="/student/login" className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200 text-sm">
                    دخول الطلاب
                  </Link>
                </li>
                <li>
                  <Link href="/teacher/login" className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors duration-200 text-sm">
                    دخول المعلمين
                  </Link>
                </li>
                <li>
                  <Link href="/student/register" className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors duration-200 text-sm">
                    تسجيل طالب جديد
                  </Link>
                </li>
                {/* ******** تم إضافة زر تسجيل معلم جديد هنا ******** */}
                <li>
                  <Link href="/teacher/register" className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors duration-200 text-sm">
                    تسجيل معلم جديد
                  </Link>
                </li>
              </>
            )
          )}
        </ul>
      </div>
    </nav>
  );
}
