// src/components/Sidebar.js
'use client'; // هذا المكون سيكون Client Component لأنه يحتوي على تفاعل

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // لمعرفة المسار الحالي وتحديد الرابط النشط

export default function Sidebar({ userRole }) {
  const pathname = usePathname(); // للحصول على المسار الحالي

  // روابط لوحة المعلم المحدثة
  const teacherNavItems = [
    { name: 'نظرة عامة', href: '/teachers', icon: '📊' },
    { name: 'إدارة الكورسات', href: '/teachers/courses', icon: '📚' },
    { name: 'إدارة الواجبات', href: '/teachers/assignments', icon: '📝' },
    { name: 'أداء الطلاب', href: '/teachers/student-performance', icon: '📈' }, // تم تغيير الاسم
    { name: 'إدارة الحضور', href: '/teachers/attendance', icon: '🗓️' }, // قسم جديد
    { name: 'الجلسات المباشرة', href: '/teachers/sessions', icon: '💻' }, // تم تغيير الاسم هنا أيضًا ليتماشى مع ملاحظتك
    { name: 'الإعدادات', href: '/teachers/settings', icon: '⚙️' },
  ];

  // روابط لوحة الطالب (مؤقتة، سيتم تطويرها لاحقاً)
  const studentNavItems = [
    { name: 'الكورسات الخاصة بي', href: '/students/courses', icon: '📚' },
    { name: 'واجباتي', href: '/students/assignments', icon: '📝' },
    { name: 'تقدمي', href: '/students/progress', icon: '📈' },
    { name: 'الإعدادات', href: '/students/settings', icon: '⚙️' },
  ];

  // تحديد قائمة الروابط بناءً على دور المستخدم
  const navItems = userRole === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <aside className="w-72 bg-gray-800 text-white flex flex-col p-4 min-h-screen-minus-navbar shadow-xl"> {/* تم تغيير w-64 إلى w-72 */}
      <div className="text-2xl font-bold mb-8 text-center border-b border-gray-700 pb-4">
        {userRole === 'teacher' ? 'لوحة المعلم' : 'لوحة الطالب'}
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link
                href={item.href}
                className={`flex items-center p-3 rounded-lg transition-colors duration-200
                            ${pathname === item.href || pathname.startsWith(item.href + '/')
                              ? 'bg-blue-600 text-white shadow-md' // تفعيل الرابط النشط، ويشمل المسارات الفرعية
                              : 'hover:bg-gray-700 text-gray-300'}`}
              >
                <span className="ml-3 text-xl">{item.icon}</span> {/* أيقونة */}
                <span className="font-semibold">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* هنا ممكن نضيف معلومات المستخدم أو زرار تسجيل الخروج */}
      <div className="mt-auto pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
        <p>مرحباً بك!</p>
        {/* زر تسجيل الخروج */}
        <button className="mt-2 text-red-400 hover:text-red-300 transition-colors duration-200">
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
