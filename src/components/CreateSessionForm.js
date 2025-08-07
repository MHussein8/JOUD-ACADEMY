// src/components/CreateSessionForm.js
'use client'; // هذا المكون Client Component لأنه يحتوي على تفاعل

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSessionAction } from '@/lib/actions/session'; // استيراد Server Action

export default function CreateSessionForm({ teacherCourses }) {
  const router = useRouter();

  // حالة النموذج (Form State) لبيانات الجلسة
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(teacherCourses.length > 0 ? teacherCourses[0].id : ''); // تعيين أول كورس كقيمة افتراضية
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [notes, setNotes] = useState('');

  // حالة التحميل والأخطاء
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // تحضير البيانات لإرسالها لـ Server Action
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('courseId', courseId);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    formData.append('zoomLink', zoomLink);
    formData.append('notes', notes);

    const result = await createSessionAction(formData);

    if (result.success) {
      setSuccessMessage(result.message);
      // مسح النموذج بعد النجاح
      setTitle('');
      setDescription('');
      // courseId سيبقى على أول كورس أو فارغ إذا لم يكن هناك كورسات
      setStartTime('');
      setEndTime('');
      setZoomLink('');
      setNotes('');
      // التوجيه إلى صفحة إدارة الجلسات بعد النجاح
      router.push('/teachers/sessions');
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      {/* رسائل النجاح أو الخطأ */}
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

      {/* حقل عنوان الجلسة */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
          عنوان الجلسة:
        </label>
        <input
          type="text"
          id="title"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* حقل وصف الجلسة */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
          وصف الجلسة (اختياري):
        </label>
        <textarea
          id="description"
          rows="4"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>

      {/* حقل اختيار الكورس */}
      <div className="mb-6">
        <label htmlFor="courseId" className="block text-gray-700 text-sm font-bold mb-2">
          الكورس المرتبط:
        </label>
        <select
          id="courseId"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          required
          disabled={teacherCourses.length === 0} // تعطيل إذا لم يكن هناك كورسات
        >
          {teacherCourses.length === 0 && <option value="">لا توجد كورسات متاحة</option>}
          {teacherCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* حقل تاريخ ووقت البدء */}
      <div className="mb-6">
        <label htmlFor="startTime" className="block text-gray-700 text-sm font-bold mb-2">
          تاريخ ووقت البدء:
        </label>
        <input
          type="datetime-local"
          id="startTime"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>

      {/* حقل تاريخ ووقت الانتهاء (اختياري) */}
      <div className="mb-6">
        <label htmlFor="endTime" className="block text-gray-700 text-sm font-bold mb-2">
          تاريخ ووقت الانتهاء (اختياري):
        </label>
        <input
          type="datetime-local"
          id="endTime"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>

      {/* حقل رابط الزوم/الجلسة (اختياري) */}
      <div className="mb-6">
        <label htmlFor="zoomLink" className="block text-gray-700 text-sm font-bold mb-2">
          رابط الزوم/الجلسة (اختياري):
        </label>
        <input
          type="url"
          id="zoomLink"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={zoomLink}
          onChange={(e) => setZoomLink(e.target.value)}
          placeholder="مثال: https://zoom.us/j/1234567890"
        />
      </div>

      {/* حقل ملاحظات (اختياري) */}
      <div className="mb-6">
        <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
          ملاحظات (اختياري):
        </label>
        <textarea
          id="notes"
          rows="3"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>
      </div>

      {/* زر الإرسال */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold
                     hover:bg-blue-700 transition-colors duration-300
                     shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                     disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || teacherCourses.length === 0} // تعطيل إذا كان التحميل أو لا توجد كورسات
        >
          {isLoading ? 'جاري الإنشاء...' : 'إنشاء الجلسة'}
        </button>
      </div>
    </form>
  );
}
