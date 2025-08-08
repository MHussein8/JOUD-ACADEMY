// src/app/teacher/register/page.js
'use client'; // هذا المكون سيكون Client Component لأنه سيحتوي على نموذج تفاعلي

import { useState, useEffect } from 'react'; // استيراد useEffect
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpTeacher } from '@/lib/actions/auth'; // استيراد Server Action لتسجيل المعلم
import { createClientSupabaseClient } from '@/lib/supabase/client'; // استيراد Client Supabase Client

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [nationality, setNationality] = useState('');
  const [subject, setSubject] = useState('');
  const [educationalLevel, setEducationalLevel] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false); // حالة جديدة للتحقق من المصادقة

  // ******** إضافة useEffect للتحقق من المصادقة والتوجيه ********
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // إذا كان المستخدم مسجلاً الدخول، قم بتوجيهه إلى لوحة تحكم المعلم
        router.replace('/teachers'); // استخدم replace لتجنب إضافة الصفحة لسجل المتصفح
      } else {
        setIsAuthChecked(true); // تم الانتهاء من التحقق
      }
    };
    checkUserAndRedirect();
  }, [router]);
  // ************************************************************

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين.');
      setIsLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('يجب الموافقة على سياسة الخصوصية وشروط الاستخدام.');
      setIsLoading(false);
      return;
    }

    const dateOfBirth = selectedYear && selectedMonth && selectedDay
      ? `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`
      : '';

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('phoneNumber', phoneNumber);
    formData.append('gender', gender);
    formData.append('dateOfBirth', dateOfBirth);
    formData.append('nationality', nationality);
    formData.append('subject', subject);
    formData.append('educationalLevel', educationalLevel);
    formData.append('yearsOfExperience', yearsOfExperience);

    const result = await signUpTeacher(formData);

    if (result.success) {
      setSuccessMessage(result.message);
      // مسح الحقول بعد التسجيل الناجح
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhoneNumber('');
      setGender('');
      setSelectedDay('');
      setSelectedMonth('');
      setSelectedYear('');
      setNationality('');
      setSubject('');
      setEducationalLevel('');
      setYearsOfExperience('');
      setAgreedToTerms(false);

      // توجيه المعلم لصفحة تسجيل الدخول بعد 3 ثوانٍ
      setTimeout(() => {
        router.push('/teacher/login');
      }, 3000);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // آخر 100 سنة

  // ******** عرض رسالة تحميل أو لا شيء حتى يتم التحقق من المصادقة ********
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">جاري التحقق من حالة تسجيل الدخول...</p>
      </div>
    );
  }
  // ********************************************************************

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">تسجيل معلم جديد</h1>

        <form onSubmit={handleSubmit}>
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

          {/* القسم الأول: البيانات الشخصية */}
          <h2 className="text-xl font-semibold mb-4 text-gray-700">البيانات الشخصية</h2>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">
              الاسم الكامل:
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
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              البريد الإلكتروني:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">
              رقم الهاتف:
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="gender" className="block text-gray-700 text-sm font-bold mb-2">
              النوع:
            </label>
            <select
              id="gender"
              name="gender"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">اختر النوع</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>

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

          <div className="mb-6">
            <label htmlFor="nationality" className="block text-gray-700 text-sm font-bold mb-2">
              الجنسية:
            </label>
            <input
              type="text"
              id="nationality"
              name="nationality"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              required
            />
          </div>

          {/* القسم الثاني: البيانات المهنية (MVP) */}
          <h2 className="text-xl font-semibold mb-4 text-gray-700 mt-6">البيانات المهنية</h2>
          <div className="mb-4">
            <label htmlFor="subject" className="block text-gray-700 text-sm font-bold mb-2">
              المادة التي تدرّسها:
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="educationalLevel" className="block text-gray-700 text-sm font-bold mb-2">
              المرحلة التعليمية:
            </label>
            <select
              id="educationalLevel"
              name="educationalLevel"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={educationalLevel}
              onChange={(e) => setEducationalLevel(e.target.value)}
              required
            >
              <option value="">اختر المرحلة</option>
              <option value="primary">ابتدائي</option>
              <option value="preparatory">إعدادي</option>
              <option value="secondary">ثانوي</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="yearsOfExperience" className="block text-gray-700 text-sm font-bold mb-2">
              عدد سنوات الخبرة:
            </label>
            <input
              type="number"
              id="yearsOfExperience"
              name="yearsOfExperience"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              min="0"
              required
            />
          </div>

          {/* القسم الثالث: بيانات الحساب */}
          <h2 className="text-xl font-semibold mb-4 text-gray-700 mt-6">بيانات الحساب</h2>
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

          {/* القسم الخامس: الموافقة على الشروط */}
          <div className="mb-6">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="ml-2 text-gray-700 text-sm">أوافق على سياسة الخصوصية وشروط الاستخدام</span>
            </label>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full
                       hover:bg-blue-700 transition-colors duration-300
                       shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                       disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'جاري التسجيل...' : 'تسجيل المعلم'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          لديك حساب بالفعل؟{' '}
          <Link href="/teacher/login" className="text-blue-600 hover:underline font-semibold">
            سجل الدخول هنا
          </Link>
        </p>
      </div>
    </div>
  );
}
