// src/components/CreateAssignmentButtonWithCourseSelection.js
'use client'; // هذا المكون Client Component

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/20/solid'; // أيقونة بسيطة للـ Dropdown

export default function CreateAssignmentButtonWithCourseSelection({ courses }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false); // حالة للتحكم في فتح/إغلاق القائمة المنسدلة

  const handleCourseSelect = (courseId) => {
    setIsOpen(false); // إغلاق القائمة بعد الاختيار
    router.push(`/teachers/courses/${courseId}/assignments/create`); // التوجيه لصفحة إنشاء الواجب
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center items-center gap-x-1.5 rounded-md bg-green-600 px-5 py-2 text-md font-semibold text-white shadow-sm
                     hover:bg-green-700 transition-colors duration-200"
          id="menu-button"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
        >
          + إنشاء واجب/اختبار جديد
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" aria-hidden="true" />
        </button>
      </div>

      {/* قائمة الكورسات المنسدلة */}
      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex="-1"
        >
          <div className="py-1" role="none">
            {courses.length > 0 ? (
              courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseSelect(course.id)}
                  className="text-gray-700 block w-full px-4 py-2 text-right text-sm hover:bg-gray-100 hover:text-gray-900"
                  role="menuitem"
                  tabIndex="-1"
                >
                  {course.title}
                </button>
              ))
            ) : (
              <p className="text-gray-500 px-4 py-2 text-sm">لا توجد كورسات متاحة.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
