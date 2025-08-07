// src/app/student/register/success/page.js
// هذا المكون سيكون Server Component لأنه يعرض بيانات بسيطة من الـ URL

import Link from 'next/link';

export default function StudentRegisterSuccessPage({ searchParams }) {
  // جلب كود الطالب من الـ Query Parameters في الـ URL
  const studentCode = searchParams.code || 'غير متاح';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl border border-blue-200 w-full max-w-md text-center transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        <div className="text-6xl mb-6 animate-bounce-once">🎉</div> {/* أيقونة احتفالية */}
        <h1 className="text-4xl font-extrabold mb-4 text-gray-900">أهلاً بك في جود أكاديمي!</h1>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          تهانينا! تم تسجيلك بنجاح في منصة جود أكاديمي التعليمية. نحن متحمسون جدًا لانضمامك إلينا في رحلتك نحو التميز.
        </p>

        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6 shadow-inner">
          <p className="text-xl font-bold text-blue-800 mb-2">
            كود الطالب الخاص بك هو: <span className="text-blue-900 text-2xl select-all">{studentCode}</span>
          </p>
          <p className="text-sm text-blue-700">
            الرجاء الاحتفاظ بهذا الكود في مكان آمن وعدم إطلاع أحد عليه. ستحتاجه لتسجيل الدخول في كل مرة.
          </p>
        </div>

        <p className="text-md text-gray-600 mb-8">
          نتمنى لك رحلة تعليمية مليئة بالمتعة والفائدة. تذكر أن المثابرة هي مفتاح النجاح!
        </p>

        <Link
          href="/student/login"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-xl
                     hover:bg-blue-700 transition-colors duration-300
                     shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-75"
        >
          اذهب لصفحة تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
