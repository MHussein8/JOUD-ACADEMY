// src/app/student/page.js
'use client'; // هذا المكون سيكون Client Component

import { useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function StudentPage() {
  const [userEmail, setUserEmail] = useState('جاري التحميل...');
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || 'مستخدم غير معروف');
      } else {
        // إذا لم يكن هناك مستخدم، قم بتوجيهه لصفحة تسجيل الدخول
        router.push('/student/login');
      }
    };
    checkUser();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-green-200 text-center">
        <h1 className="text-3xl font-bold mb-4 text-green-800">مرحباً بك في لوحة تحكم الطالب!</h1>
        <p className="text-lg text-gray-700 mb-2">بريدك الإلكتروني: {userEmail}</p>
        <p className="mt-4 text-sm text-gray-500">هذه صفحة تجريبية لضمان عمل التوجيه وتسجيل الدخول.</p>
      </div>
    </div>
  );
}
