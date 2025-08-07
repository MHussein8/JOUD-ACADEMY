// src/app/student/register/page.js
'use client'; // هذا المكون سيكون Client Component

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpStudent } from '@/lib/actions/auth'; // استيراد Server Action لتسجيل الطالب

export default function StudentRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // حالة لتأكيد كلمة المرور
  const [gradeLevel, setGradeLevel] = useState('');
  const [selectedDay, setSelectedDay] = useState(''); // حالة لليوم
  const [selectedMonth, setSelectedMonth] = useState(''); // حالة للشهر
  const [selectedYear, setSelectedYear] = useState(''); // حالة للسنة
  const [contactNumber, setContactNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [generatedStudentCode, setGeneratedStudentCode] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setGeneratedStudentCode(null);

    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين.');
      setIsLoading(false);
      return;
    }

    // تجميع تاريخ الميلاد من الحقول المنفصلة
    const dateOfBirth = selectedYear && selectedMonth && selectedDay
      ? `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`
      : '';

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('password', password);
    formData.append('gradeLevel', gradeLevel);
    formData.append('dateOfBirth', dateOfBirth); // إرسال التاريخ المجمع
    formData.append('contactNumber', contactNumber);
    formData.append('country', country);
    formData.append('city', city);

    const result = await signUpStudent(formData);

    if (result.success) {
      // بدلاً من عرض الرسالة هنا، سنقوم بإعادة التوجيه إلى صفحة النجاح
      // ونمرر كود الطالب كـ Query Parameter
      router.push(`/student/register/success?code=${result.studentCode}`);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // آخر 100 سنة

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">تسجيل طالب جديد</h1>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">خطأ!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          {/* تم إزالة رسالة النجاح من هنا لأنها ستظهر في الصفحة الجديدة */}
          {/* {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">نجاح!</strong>
              <span className="block sm:inline"> {successMessage}</span>
              {generatedStudentCode && (
                <p className="mt-2 text-sm font-semibold">
                  كود الطالب الخاص بك هو: <span className="text-blue-700 text-lg">{generatedStudentCode}</span>
                </p>
              )}
            </div>
          )} */}

          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">
              الاسم الكامل للطالب (رباعي):
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="gradeLevel" className="block text-gray-700 text-sm font-bold mb-2">
              الصف الدراسي:
            </label>
            <input
              type="text"
              id="gradeLevel"
              name="gradeLevel"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              required
            />
          </div>

          {/* حقول تاريخ الميلاد الجديدة (يوم، شهر، سنة) */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              تاريخ الميلاد:
            </label>
            <div className="flex gap-2">
              <select
                className="shadow appearance-none border rounded w-1/3 py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                required
              >
                <option value="">يوم</option>
                {[...Array(31)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <select
                className="shadow appearance-none border rounded w-1/3 py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                required
              >
                <option value="">شهر</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <select
                className="shadow appearance-none border rounded w-1/3 py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                required
              >
                <option value="">سنة</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="contactNumber" className="block text-gray-700 text-sm font-bold mb-2">
              رقم التواصل (واتساب):
            </label>
            <input
              type="tel" // نوع الإدخال tel لتحسين تجربة الهاتف
              id="contactNumber"
              name="contactNumber"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">
              الدولة:
            </label>
            <input
              type="text"
              id="country"
              name="country"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-2">
              المدينة:
            </label>
            <input
              type="text"
              id="city"
              name="city"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              كلمة المرور:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
              تأكيد كلمة المرور:
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full
                       hover:bg-blue-700 transition-colors duration-300
                       shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                       disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'جاري التسجيل...' : 'تسجيل الطالب'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          لديك حساب بالفعل؟{' '}
          <Link href="/student/login" className="text-blue-600 hover:underline font-semibold">
            سجل الدخول هنا
          </Link>
        </p>
      </div>
    </div>
  );
}
