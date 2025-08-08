// src/components/CreateSessionForm.js
'use client';

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation'; // استيراد useRouter
import { createSession } from '@/app/actions/sessions';

const initialState = {
  message: '',
  success: false,
};

/**
 * مكون الزر الخاص بالـ FormStatus لعرض حالة النموذج
 * @param {object} props - خصائص المكون
 * @param {boolean} props.isUploading - حالة رفع الملفات
 */
function SubmitButton({ isUploading }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isUploading;

  return (
    <button
      type="submit"
      aria-disabled={isDisabled}
      disabled={isDisabled}
      className={`w-full py-3 px-4 rounded-lg text-white font-bold text-lg transition-colors ${
        isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {isUploading ? 'جاري رفع الملفات...' : pending ? 'جاري إنشاء الجلسة...' : 'إنشاء الجلسة'}
    </button>
  );
}

/**
 * نموذج إنشاء جلسة جديدة
 * @param {object} props - خصائص المكون
 * @param {Array<object>} props.teacherCourses - قائمة الكورسات الخاصة بالمعلم
 */
export default function CreateSessionForm({ teacherCourses }) {
  const [state, formAction] = useActionState(createSession, initialState);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter(); // استخدام useRouter هنا

  // استخدام useEffect للاستماع إلى حالة الـ Server Action
  useEffect(() => {
    if (state.success) {
      router.push('/teachers/sessions');
      router.refresh(); // <--- هذا هو السطر الجديد والمهم لضمان تحديث الصفحة
    }
  }, [state.success, router]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedAttachments([...selectedAttachments, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveAttachment = (fileToRemove) => {
    setSelectedAttachments(selectedAttachments.filter(file => file !== fileToRemove));
  };

  const handleFormSubmit = async (formData) => {
    setIsUploading(true);
    
    selectedAttachments.forEach(file => {
      formData.append('attachments', file);
    });

    await formAction(formData);

    setIsUploading(false);
  };
  
  return (
    <form action={handleFormSubmit} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      {state.message && (
        <div className={`px-4 py-3 rounded relative mb-6 ${state.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <p>{state.message}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* عنوان الجلسة */}
        <div>
          <label htmlFor="title" className="block text-gray-700 font-semibold mb-2">عنوان الجلسة</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="مثال: الوحدة الأولى - الدرس الرابع"
          />
        </div>

        {/* الكورس */}
        <div>
          <label htmlFor="courseId" className="block text-gray-700 font-semibold mb-2">الكورس</label>
          <select
            id="courseId"
            name="courseId"
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="" disabled>اختر كورسًا...</option>
            {teacherCourses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* الوصف */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">وصف الجلسة</label>
        <textarea
          id="description"
          name="description"
          required
          rows="3"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="أدخل وصفًا موجزًا للجلسة..."
        ></textarea>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* تاريخ ووقت البدء */}
        <div>
          <label htmlFor="startTime" className="block text-gray-700 font-semibold mb-2">تاريخ ووقت البدء</label>
          <input
            id="startTime"
            name="startTime"
            type="datetime-local"
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* تاريخ ووقت الانتهاء (اختياري) */}
        <div>
          <label htmlFor="endTime" className="block text-gray-700 font-semibold mb-2">تاريخ ووقت الانتهاء (اختياري)</label>
          <input
            id="endTime"
            name="endTime"
            type="datetime-local"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* رابط الزوم */}
      <div className="mb-6">
        <label htmlFor="zoomLink" className="block text-gray-700 font-semibold mb-2">رابط الزوم</label>
        <input
          id="zoomLink"
          name="zoomLink"
          type="url"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://zoom.us/j/1234567890"
        />
      </div>

      {/* ملاحظات */}
      <div className="mb-6">
        <label htmlFor="notes" className="block text-gray-700 font-semibold mb-2">ملاحظات</label>
        <textarea
          id="notes"
          name="notes"
          rows="2"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="أضف ملاحظات إضافية حول الجلسة..."
        ></textarea>
      </div>

      {/* المرفقات */}
      <div className="mb-6 border p-4 rounded-lg bg-gray-50">
        <label className="block text-gray-700 font-semibold mb-2">المرفقات</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {selectedAttachments.length > 0 && (
          <ul className="mt-4 space-y-2">
            {selectedAttachments.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-2 rounded-lg bg-white shadow-sm">
                <span className="text-sm text-gray-800">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(file)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SubmitButton isUploading={isUploading} />
    </form>
  );
}
