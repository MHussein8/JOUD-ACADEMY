// src/components/EditCourseForm.js
'use client'; // هذا المكون Client Component لأنه يحتوي على تفاعل

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateCourseAction } from '@/lib/actions/course'; // استيراد الـ Server Action الجديد

export default function EditCourseForm({ course }) {
  const router = useRouter();
  // حالة النموذج (Form State) لبيانات الكورس
  const [courseTitle, setCourseTitle] = useState(course.title);
  const [courseDescription, setCourseDescription] = useState(course.description || '');
  const [startDate, setStartDate] = useState(course.start_date.split('T')[0]); // تنسيق التاريخ ليتناسب مع input type="date"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // تحديث الحالة إذا تغير الكورس الذي يتم تمريره (مثلاً لو تم تحميل كورس آخر ديناميكيًا)
  useEffect(() => {
    if (course) {
      setCourseTitle(course.title);
      setCourseDescription(course.description || '');
      setStartDate(course.start_date.split('T')[0]);
    }
  }, [course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // إنشاء FormData لإرسال البيانات إلى Server Action
      const formData = new FormData();
      formData.append('courseId', course.id); // مهم: نرسل ID الكورس لتعديله
      formData.append('courseTitle', courseTitle);
      formData.append('courseDescription', courseDescription);
      formData.append('startDate', startDate);

      // استدعاء Server Action لتعديل الكورس
      const result = await updateCourseAction(formData);

      if (result.success) {
        setSuccessMessage(result.message);
        // هذا هو التعديل: التوجيه إلى صفحة إدارة الكورسات بدلاً من تحديث الصفحة الحالية
        router.push('/teachers/courses');
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Unhandled error during course update:', err);
      setError('حدث خطأ غير متوقع أثناء تعديل الكورس.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>
    </form>
  );
}
