// src/components/DeleteAssignmentButton.js
'use client'; // هذا المكون Client Component

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // لاستخدام router.refresh
import { deleteAssignmentAction } from '@/lib/actions/assignment'; // استيراد Server Action للحذف

export default function DeleteAssignmentButton({ assignmentId }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    // رسالة التأكيد للمستخدم
    const confirmed = window.confirm('هل أنت متأكد أنك تريد حذف هذا الواجب/الاختبار وجميع أسئلته وتسليماته؟ لا يمكن التراجع عن هذا الإجراء.');

    if (confirmed) {
      setIsLoading(true);
      setError(null);
      try {
        const result = await deleteAssignmentAction(assignmentId); // استدعاء Server Action للحذف
        if (result.success) {
          // إذا نجح الحذف، نقوم بتحديث الصفحة لإعادة جلب البيانات
          router.refresh();
        } else {
          setError(result.message);
          console.error('Failed to delete assignment:', result.message);
          // يمكن هنا عرض رسالة خطأ للمستخدم بطريقة أكثر وضوحًا
          alert(`فشل في حذف الواجب/الاختبار: ${result.message}`); // استخدام alert مؤقتًا للتبسيط
        }
      } catch (err) {
        setError('حدث خطأ غير متوقع أثناء الحذف.');
        console.error('Unhandled error during delete:', err);
        alert('حدث خطأ غير متوقع أثناء الحذف.'); // استخدام alert مؤقتًا للتبسيط
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="inline-block bg-red-500 text-white px-4 py-2 rounded-lg
                 hover:bg-red-600 transition-colors duration-300
                 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75
                 text-center text-sm flex-grow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" // إضافة cursor-pointer
      disabled={isLoading}
    >
      {isLoading ? 'جاري الحذف...' : 'حذف'}
    </button>
  );
}
