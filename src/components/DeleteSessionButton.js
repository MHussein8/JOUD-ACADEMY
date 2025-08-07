// src/components/DeleteSessionButton.js
'use client'; // هذا المكون Client Component لأنه يحتوي على تفاعل (onClick)

import { useState } from 'react';
import { deleteSessionAction } from '@/lib/actions/session'; // استيراد Server Action للحذف
import { useRouter } from 'next/navigation'; // لاستخدام useRouter لتحديث الصفحة

export default function DeleteSessionButton({ sessionId, sessionTitle }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`هل أنت متأكد أنك تريد حذف الجلسة "${sessionTitle}"؟ سيتم حذف جميع سجلات الحضور المرتبطة بها.`)) {
      setIsLoading(true);
      const result = await deleteSessionAction(sessionId); // استدعاء Server Action للحذف
      if (result.success) {
        alert('تم حذف الجلسة بنجاح!'); // استخدام alert مؤقتًا
        // router.refresh(); // لإعادة جلب البيانات بعد الحذف - revalidatePath في Server Action يقوم بهذا
      } else {
        alert(`فشل حذف الجلسة: ${result.message}`); // استخدام alert مؤقتًا
      }
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold
                 hover:bg-red-700 transition-colors duration-300
                 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75
                 flex-grow disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isLoading}
    >
      {isLoading ? 'جاري الحذف...' : 'حذف'}
    </button>
  );
}
