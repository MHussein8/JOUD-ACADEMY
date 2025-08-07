// src/app/teachers/courses/[course_id]/assignments/[assignment_id]/edit/page.js

import { supabaseServer } from '@/lib/supabase';
import Link from 'next/link';
import EditAssignmentForm from '@/components/EditAssignmentForm';

export default async function EditAssignmentPage({ params }) {
  const { course_id, assignment_id } = params;

  // استدعاء الدالة لإنشاء عميل Supabase. لا نحتاج إلى await.
  const supabase = supabaseServer();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error getting user in EditAssignmentPage:', userError);
    return (
      <div className="flex rtl">
        <div className="flex-grow p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">تعديل الواجب/الاختبار</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            يجب تسجيل الدخول لتعديل الواجبات.
          </div>
        </div>
      </div>
    );
  }

  const teacherId = user.id;
  console.log("Current Teacher ID:", teacherId);

  // جلب تفاصيل الواجب المحدد وأسئلته.
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      description,
      due_date,
      type,
      is_exam,
      max_score,
      course_id,
      teacher_id,
      session_id,
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
    `)
    .eq('id', assignment_id)
    .eq('course_id', course_id)
    .eq('teacher_id', teacherId)
    .single();

  if (assignmentError) {
    console.error('Supabase Error fetching assignment details for editing:', assignmentError);
    return (
      <div className="flex rtl">
        <div className="flex-grow p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">تعديل الواجب/الاختبار</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            حدث خطأ أثناء جلب تفاصيل الواجب. يرجى التحقق من وجود الواجب وصلاحيات الوصول.
            <br />
            تفاصيل الخطأ: {assignmentError.message || 'خطأ غير معروف'}
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    console.error(`Assignment with ID ${assignment_id} not found or not accessible for teacher ${teacherId}.`);
    return (
      <div className="flex rtl">
        <div className="flex-grow p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">تعديل الواجب/الاختبار</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            الواجب المطلوب غير موجود أو ليس لديك صلاحية لتعديله.
          </div>
        </div>
      </div>
    );
  }

  // جلب جميع الجلسات لهذه الدورة.
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, title, start_time')
    .eq('course_id', course_id)
    .order('start_time', { ascending: true });

  if (sessionsError) {
    console.error('Error fetching sessions for edit assignment page:', sessionsError);
  }

  console.log("Fetched Sessions:", sessions);

  return (
    <div className="flex rtl">
      <div className="flex-grow p-6">
        <Link href={`/teachers/assignments`} className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; العودة لإدارة الواجبات
        </Link>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">تعديل الواجب/الاختبار: {assignment.title}</h1>

        <EditAssignmentForm assignment={assignment} sessions={sessions || []} />
      </div>
    </div>
  );
}
