// src/app/teachers/courses/create/page.js
'use client'; // هذا المكون سيكون Client Component لأنه سيحتوي على نموذج تفاعلي

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // لاستخدام الـ router للتحويل بعد الحفظ
import { createCourseAction } from '@/lib/actions/course'; // استيراد Server Action الجديد

export default function CreateCoursePage() {
  const router = useRouter();
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // هنا سيتم استدعاء Server Action لإنشاء الكورس
    try {
      // إنشاء FormData لإرسال البيانات إلى Server Action
      const formData = new FormData();
      formData.append('courseTitle', courseTitle);
      formData.append('courseDescription', courseDescription);
      formData.append('startDate', startDate);

      const result = await createCourseAction(formData); // استدعاء Server Action الحقيقي

      if (result.success) {
        setSuccessMessage(result.message);
        setCourseTitle('');
        setCourseDescription('');
        setStartDate('');
        // التوجيه إلى صفحة إدارة الكورسات بعد النجاح
        router.push('/teachers/courses');
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Unhandled error during course creation:', err);
      setError('حدث خطأ غير متوقع أثناء إنشاء الكورس.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Link href="/teachers/courses" className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; العودة لإدارة الكورسات
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">إنشاء كورس جديد</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">خطأ!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">نجاح!</strong>
            <span className="block sm:inline"> {successMessage}</span>
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
            عنوان الكورس:
          </label>
          <input
            type="text"
            id="title"
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
            وصف الكورس:
          </label>
          <textarea
            id="description"
            rows="4"
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={courseDescription}
            onChange={(e) => setCourseDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">
            تاريخ بدء الكورس:
          </label>
          <input
            type="date"
            id="startDate"
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold
                       hover:bg-blue-700 transition-colors duration-300
                       shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                       disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحفظ...' : 'إنشاء الكورس'}
          </button>
        </div>
      </form>
    </div>
  );
}
