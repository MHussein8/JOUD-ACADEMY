// src/app/teachers/courses/[course_id]/assignments/[assignment_id]/submissions/[submission_id]/page.js
// هذا Component يعمل على السيرفر افتراضيًا في Next.js App Router

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar'; // استيراد مكون الـ Sidebar
import GradeSubmissionForm from '@/components/GradeSubmissionForm'; // استيراد المكون الجديد

export default async function SingleSubmissionPage({ params }) {
  const { course_id, assignment_id, submission_id } = params; // جلب الـ IDs من المسار

  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in SingleSubmissionPage:', userError);
    return (
      <div className="flex rtl">
        <Sidebar userRole="teacher" />
        <div className="flex-grow p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل تسليم الواجب/الاختبار</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            يجب تسجيل الدخول لعرض تفاصيل التسليم.
          </div>
        </div>
      </div>
    );
  }

  const teacherId = user.id; // ID المعلم المسجل دخوله

  // جلب تفاصيل التسليم المحدد
  const { data: submission, error: submissionError } = await supabase
    .from('assignment_submissions')
    .select(`
      id,
      submitted_at,
      status,
      score,
      student_id,
      student_answer_data,
      assignments (
        id,
        title,
        description,
        due_date,
        type,
        is_exam,
        max_score,
        teacher_id,
        questions (
          id,
          question_text,
          question_type,
          max_score,
          correct_answers (
            correct_answer,
            explanation_text,
            accepted_variations
          )
        )
      ),
      users (
        full_name,
        avatar_url
      )
    `)
    .eq('id', submission_id)
    .eq('assignment_id', assignment_id)
    .single();

  if (submissionError) {
    console.error('Error fetching submission details:', submissionError);
    return (
      <div className="flex rtl">
        <Sidebar userRole="teacher" />
        <div className="flex-grow p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل تسليم الواجب/الاختبار</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            التسليم المطلوب غير موجود أو ليس لديك صلاحية لعرضه.
          </div>
        </div>
      </div>
    );
  }

  // التحقق من أن الواجب يخص المعلم الحالي
  if (!submission || submission.assignments.teacher_id !== teacherId) {
    return (
      <div className="flex rtl">
        <Sidebar userRole="teacher" />
        <div className="flex-grow p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل تسليم الواجب/الاختبار</h1>
          <div className="text-gray-600 text-center py-10">التسليم غير موجود أو ليس لديك صلاحية لعرضه.</div>
        </div>
      </div>
    );
  }

  const assignment = submission.assignments;
  const student = submission.users;
  const studentAnswers = submission.student_answer_data || {}; // إجابات الطالب

  return (
    <div className="flex rtl">
      <Sidebar userRole="teacher" /> {/* عرض الـ Sidebar */}

      <div className="flex-grow p-6"> {/* محتوى الصفحة الرئيسي */}
        <Link href={`/teachers/courses/${course_id}/assignments/${assignment_id}/submissions`} className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; العودة لقائمة التسليمات
        </Link>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">تفاصيل تسليم الواجب/الاختبار</h1>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">معلومات التسليم</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <p><strong>الواجب:</strong> {assignment.title}</p>
            <p><strong>الطالب:</strong> {student?.full_name || 'غير معروف'}</p>
            <p><strong>تاريخ التسليم:</strong> {new Date(submission.submitted_at).toLocaleString('ar-EG')}</p>
            <p><strong>الحالة:</strong> {submission.status === 'submitted' ? 'تم التسليم' : submission.status}</p>
            {submission.score !== null && (
              <p><strong>الدرجة:</strong> {submission.score} / {assignment.max_score}</p>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">إجابات الطالب</h2>
          {assignment.questions && assignment.questions.length > 0 ? (
            assignment.questions.map((question, index) => (
              <div key={question.id} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <p className="text-lg font-semibold text-gray-800 mb-2">
                  سؤال {index + 1}: {question.question_text} ({question.max_score} نقطة)
                </p>
                <p className="text-gray-700 mb-2">
                  **نوع السؤال:** {
                    question.question_type === 'multiple_choice' ? 'اختيار من متعدد' :
                    question.question_type === 'true_false' ? 'صح/خطأ' :
                    question.question_type === 'short_text' ? 'إجابة نصية قصيرة' :
                    question.question_type === 'essay' ? 'مقالي' : question.question_type
                  }
                </p>
                
                {/* عرض إجابة الطالب */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-2">
                  <p className="font-medium text-blue-800">إجابة الطالب:</p>
                  <p className="text-blue-700 break-words">
                    {studentAnswers[question.id] || 'لم يتم الإجابة'}
                  </p>
                </div>

                {/* عرض الإجابة الصحيحة (للمعلم) */}
                {question.correct_answers && question.correct_answers.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="font-medium text-green-800">الإجابة الصحيحة:</p>
                    <p className="text-green-700 break-words">
                      {question.correct_answers[0].correct_answer || 'غير متاح'}
                    </p>
                    {question.correct_answers[0].explanation_text && (
                      <p className="text-green-600 text-sm mt-1">
                        **شرح:** {question.correct_answers[0].explanation_text}
                      </p>
                    )}
                    {question.question_type === 'multiple_choice' && question.correct_answers[0].accepted_variations && (
                      <p className="text-green-600 text-sm mt-1">
                        **الخيارات:** {question.correct_answers[0].accepted_variations.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">لا توجد أسئلة لهذا الواجب/الاختبار.</p>
          )}
        </div>

        {/* استخدام مكون التصحيح الجديد هنا */}
        <GradeSubmissionForm submission={submission} assignmentQuestions={assignment.questions || []} />
      </div>
    </div>
  );
}
