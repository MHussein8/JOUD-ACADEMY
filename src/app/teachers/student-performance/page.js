// src/app/teachers/student-performance/page.js
'use client'; // هذا المكون سيكون Client Component لأنه يستخدم Hooks مثل useState و useEffect

import { useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client'; // استخدام Client Supabase Client
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentPerformancePage() {
  const [studentsPerformance, setStudentsPerformance] = useState([]); // لتخزين بيانات أداء الطلاب النهائية
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClientSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      setError(null);

      try {
        // التحقق من صلاحيات المستخدم ودوره (يجب أن يكون معلمًا)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('User authentication failed for Teacher Performance Page:', userError);
          router.push('/teacher/login'); // توجيه لصفحة تسجيل الدخول إذا لم يكن هناك مستخدم
          return;
        }

        const { data: userData, error: userRoleError } = await supabase
          .from('users')
          .select('user_role')
          .eq('id', user.id)
          .single();

        if (userRoleError || userData?.user_role !== 'teacher') {
          console.error('User is not a teacher:', userRoleError);
          await supabase.auth.signOut();
          router.push('/teacher/login'); // توجيه إذا لم يكن معلمًا
          return;
        }

        const teacherId = user.id;

        // 1. جلب جميع course_ids التي يملكها هذا المعلم
        const { data: teacherCourseIdsData, error: fetchTeacherCourseIdsError } = await supabase
          .from('courses')
          .select('id')
          .eq('teacher_id', teacherId);

        if (fetchTeacherCourseIdsError) {
          throw new Error(`فشل جلب معرفات الكورسات: ${fetchTeacherCourseIdsError.message}`);
        }
        const teacherCourseIds = teacherCourseIdsData ? teacherCourseIdsData.map(c => c.id) : [];

        // 2. جلب جميع الطلاب المسجلين في كورسات هذا المعلم
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            student_id,
            courses(id, title),
            users(id, full_name, student_code, email, grade_level, contact_number, country, city)
          `)
          .in('course_id', teacherCourseIds);

        if (enrollmentsError) {
          throw new Error(`فشل جلب تسجيلات الطلاب: ${enrollmentsError.message}`);
        }

        // 3. جلب جميع الواجبات الخاصة بهذا المعلم
        const { data: teacherAssignmentsData, error: fetchAssignmentsError } = await supabase
          .from('assignments')
          .select('id, max_score')
          .eq('teacher_id', teacherId);

        if (fetchAssignmentsError) {
          throw new Error(`فشل جلب الواجبات: ${fetchAssignmentsError.message}`);
        }
        const teacherAssignmentIds = teacherAssignmentsData ? teacherAssignmentsData.map(a => a.id) : [];
        const assignmentMaxScores = teacherAssignmentsData.reduce((acc, assignment) => {
          acc[assignment.id] = assignment.max_score;
          return acc;
        }, {});

        // 4. جلب جميع التسليمات المصححة للواجبات التي يملكها المعلم
        const { data: gradedSubmissionsData, error: gradedSubmissionsError } = await supabase
          .from('assignment_submissions')
          .select('student_id, assignment_id, score')
          .eq('status', 'graded')
          .in('assignment_id', teacherAssignmentIds);

        if (gradedSubmissionsError) {
          throw new Error(`فشل جلب التسليمات المصححة: ${gradedSubmissionsError.message}`);
        }

        // معالجة البيانات لتجميع أداء كل طالب
        const processedStudents = {};

        if (enrollmentsData) {
          enrollmentsData.forEach(enrollment => {
            const student = enrollment.users;
            const course = enrollment.courses;

            if (!processedStudents[student.id]) {
              processedStudents[student.id] = {
                id: student.id,
                name: student.full_name,
                student_code: student.student_code,
                email: student.email,
                grade_level: student.grade_level,
                contact_number: student.contact_number,
                country: student.country,
                city: student.city,
                enrolledCourses: {},
                totalAssignmentsGraded: 0,
                totalScoreObtained: 0,
                totalPossibleScore: 0,
                overallAverage: 0,
              };
            }
            processedStudents[student.id].enrolledCourses[course.id] = course.title;
          });
        }

        if (gradedSubmissionsData) {
          gradedSubmissionsData.forEach(submission => {
            const studentId = submission.student_id;
            const score = submission.score || 0;
            const maxScore = assignmentMaxScores[submission.assignment_id] || 0; // استخدم الدرجة القصوى من الواجب

            if (processedStudents[studentId]) {
              processedStudents[studentId].totalAssignmentsGraded += 1;
              processedStudents[studentId].totalScoreObtained += score;
              processedStudents[studentId].totalPossibleScore += maxScore;
            }
          });
        }

        // حساب المتوسط العام لكل طالب
        Object.values(processedStudents).forEach(student => {
          if (student.totalPossibleScore > 0) {
            student.overallAverage = (student.totalScoreObtained / student.totalPossibleScore) * 100;
          } else {
            student.overallAverage = 0;
          }
        });

        setStudentsPerformance(Object.values(processedStudents));

      } catch (err) {
        console.error('Error in fetchPerformanceData:', err);
        setError(`فشل في تحميل بيانات الأداء: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [supabase, router]); // إضافة supabase و router كـ dependencies

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">جاري تحميل بيانات أداء الطلاب...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 text-red-700 p-4">
        <p className="text-xl font-bold mb-4">خطأ في تحميل البيانات:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    // تم إزالة div الـ flex الخارجي والـ Sidebar هنا، لأن الـ Layout سيتولى الأمر
    // هذا المحتوى هو الـ children الذي سيتم تمريره إلى الـ Layout
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">أداء الطلاب</h1>

      {studentsPerformance.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
          <p>لا يوجد طلاب مسجلون حالياً أو لا توجد بيانات أداء لعرضها.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {studentsPerformance.map(student => (
            <div key={student.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-blue-700 mb-2">
                {student.name} (<span className="text-blue-500 text-lg">{student.student_code}</span>)
              </h2>
              <p className="text-gray-600 mb-4">البريد الإلكتروني: {student.email}</p>
              <p className="text-gray-600 mb-4">الصف الدراسي: {student.grade_level}</p>
              <p className="text-gray-600 mb-4">الدولة: {student.country} - المدينة: {student.city}</p>
              <p className="text-gray-600 mb-4">رقم التواصل: {student.contact_number}</p>

              <h3 className="text-xl font-semibold text-gray-700 mb-3">الكورسات المسجل بها:</h3>
              {Object.keys(student.enrolledCourses).length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {Object.values(student.enrolledCourses).map((courseTitle, index) => (
                    <li key={index} className="text-gray-700">
                      <span className="font-medium">{courseTitle}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">لم يسجل في أي كورسات بعد.</p>
              )}

              <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-3">ملخص الأداء:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p className="text-gray-700"><strong>عدد الواجبات المصححة:</strong> {student.totalAssignmentsGraded}</p>
                <p className="text-gray-700"><strong>الدرجة الكلية المكتسبة:</strong> {student.totalScoreObtained.toFixed(2)}</p>
                <p className="text-gray-700"><strong>الدرجة الكلية الممكنة:</strong> {student.totalPossibleScore.toFixed(2)}</p>
                <p className="text-gray-700"><strong>المتوسط العام:</strong> {student.overallAverage.toFixed(2)}%</p>
              </div>

              <div className="mt-4">
                <Link
                  href={`/teachers/student-performance/${student.id}`}
                  className="inline-block bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold
                             hover:bg-purple-700 transition-colors duration-300 shadow-md"
                >
                  عرض التفاصيل الكاملة للطالب
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
