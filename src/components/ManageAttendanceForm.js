// src/components/ManageAttendanceForm.js
'use client'; // هذا المكون Client Component لأنه يحتوي على تفاعل

import { useState, useEffect } from 'react';
import { manageAttendanceAction } from '@/lib/actions/attendance'; // استيراد Server Action
import { useRouter } from 'next/navigation'; // لاستخدام useRouter لتحديث الصفحة

export default function ManageAttendanceForm({ sessionId, enrolledStudents, currentAttendance }) {
  const router = useRouter();
  const [attendanceState, setAttendanceState] = useState({}); // لتخزين حالة الحضور لكل طالب
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // تهيئة attendanceState عند تحميل المكون أو تغير البيانات
  useEffect(() => {
    const initialAttendance = {};
    enrolledStudents.forEach(student => {
      const studentId = student.student_id;
      initialAttendance[studentId] = {
        status: currentAttendance[studentId]?.status || 'absent', // القيمة الافتراضية 'absent'
        notes: currentAttendance[studentId]?.notes || '',
        isChanged: false, // لتتبع ما إذا كان قد تم تغيير حالة هذا الطالب
      };
    });
    setAttendanceState(initialAttendance);
  }, [enrolledStudents, currentAttendance]);

  // دالة لتحديث حالة حضور طالب معين
  const handleStatusChange = (studentId, status) => {
    setAttendanceState(prevState => ({
      ...prevState,
      [studentId]: {
        ...prevState[studentId],
        status: status,
        isChanged: true,
      },
    }));
  };

  // دالة لتحديث ملاحظات طالب معين
  const handleNotesChange = (studentId, notes) => {
    setAttendanceState(prevState => ({
      ...prevState,
      [studentId]: {
        ...prevState[studentId],
        notes: notes,
        isChanged: true,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    let allSuccess = true;
    let errorMessage = '';

    // نمر على كل طالب ونرسل بياناته إذا تم تغييرها
    for (const student of enrolledStudents) {
      const studentId = student.student_id;
      const studentAttendance = attendanceState[studentId];

      if (studentAttendance && studentAttendance.isChanged) {
        const formData = new FormData();
        formData.append('sessionId', sessionId);
        formData.append('studentId', studentId);
        formData.append('attendanceStatus', studentAttendance.status);
        formData.append('notes', studentAttendance.notes);

        const result = await manageAttendanceAction(formData);

        if (!result.success) {
          allSuccess = false;
          errorMessage += `فشل حفظ حضور الطالب ${student.users?.full_name || 'غير معروف'}: ${result.message}\n`;
        }
      }
    }

    if (allSuccess) {
      setSuccessMessage('تم حفظ الحضور بنجاح!');
      // إعادة تحميل الصفحة لجلب أحدث البيانات والتأكد من تحديث الواجهة
      router.refresh();
    } else {
      setError(errorMessage || 'حدث خطأ أثناء حفظ بعض سجلات الحضور.');
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">خطأ!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">نجاح!</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                اسم الطالب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                حالة الحضور
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                ملاحظات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enrolledStudents.map((student) => (
              <tr key={student.student_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.users?.full_name || 'طالب غير معروف'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={attendanceState[student.student_id]?.status || 'absent'}
                    onChange={(e) => handleStatusChange(student.student_id, e.target.value)}
                  >
                    <option value="present">حاضر</option>
                    <option value="absent">غائب</option>
                    <option value="late">متأخر</option>
                    <option value="excused">بعذر</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input
                    type="text"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={attendanceState[student.student_id]?.notes || ''}
                    onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                    placeholder="أضف ملاحظات..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold
                     hover:bg-blue-700 transition-colors duration-300
                     shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                     disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'جاري الحفظ...' : 'حفظ الحضور'}
        </button>
      </div>
    </form>
  );
}
