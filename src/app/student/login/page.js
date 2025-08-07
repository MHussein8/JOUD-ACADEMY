// src/app/student/login/page.js
'use client'; // هذا المكون سيكون Client Component

import { useState } from 'react';
import Link from 'next/link';
import { signInStudent } from '@/lib/actions/auth'; // استيراد Server Action لتسجيل الدخول
import { useRouter } from 'next/navigation'; // استيراد useRouter

export default function StudentLoginPage() {
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter(); // تهيئة useRouter

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('studentCode', studentCode);
    formData.append('password', password);

    const result = await signInStudent(formData); // استدعاء Server Action

    if (result.success) {
      // ******** التعديل هنا: توجيه العميل بعد النجاح ********
      router.push(result.redirectUrl); // استخدم router.push للتوجيه على جانب العميل
    } else {
      setError(result.message);
      setIsLoading(false); // فقط إذا فشل، نوقف التحميل هنا
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">دخول الطلاب</h1>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">خطأ!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="studentCode" className="block text-gray-700 text-sm font-bold mb-2">
              كود الطالب:
            </label>
            <input
              type="text"
              id="studentCode"
              name="studentCode"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              كلمة المرور:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full
                       hover:bg-blue-700 transition-colors duration-300
                       shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                       disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          ليس لديك حساب؟{' '}
          <Link href="/student/register" className="text-blue-600 hover:underline font-semibold">
            سجل الآن
          </Link>
        </p>
      </div>
    </div>
  );
}
