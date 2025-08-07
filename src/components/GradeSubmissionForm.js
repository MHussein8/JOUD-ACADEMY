// src/components/GradeSubmissionForm.js
'use client'; // هذا المكون Client Component لأنه يحتوي على تفاعل

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gradeSubmissionAction } from '@/lib/actions/assignment'; // استيراد Server Action الجديد

export default function GradeSubmissionForm({ submission, assignmentQuestions }) {
  const router = useRouter();

  // حالة لتخزين درجات المعلم لكل سؤال
  // تهيئة الدرجات بناءً على ما إذا كان التسليم قد تم تصحيحه بالفعل أو لا
  const initialQuestionScores = assignmentQuestions.map(q => ({
    questionId: q.id,
    maxScore: q.max_score,
    teacherScore: q.question_type === 'multiple_choice' || q.question_type === 'true_false' // إذا كانت أسئلة موضوعية، يمكننا حساب درجة افتراضية
                  ? (submission.student_answer_data && submission.student_answer_data[q.id] === q.correct_answers[0].correct_answer ? q.max_score : 0)
                  : (submission.score !== null && submission.student_answer_data && submission.student_answer_data[q.id] ? 0 : null), // للأسئلة المقالية، نبدأ بـ null أو 0
    teacherFeedback: '', // ملاحظات المعلم لكل سؤال
  }));

  const [questionScores, setQuestionScores] = useState(initialQuestionScores);
  const [finalScore, setFinalScore] = useState(submission.score !== null ? submission.score : 0);
  const [submissionStatus, setSubmissionStatus] = useState(submission.status);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // دالة لتحديث درجة سؤال فردي
  const updateQuestionScore = (questionId, score) => {
    setQuestionScores(prevScores =>
      prevScores.map(q =>
        q.questionId === questionId ? { ...q, teacherScore: parseFloat(score) } : q
      )
    );
  };

  // دالة لتحديث ملاحظات سؤال فردي
  const updateQuestionFeedback = (questionId, feedback) => {
    setQuestionScores(prevScores =>
      prevScores.map(q =>
        q.questionId === questionId ? { ...q, teacherFeedback: feedback } : q
      )
    );
  };

  // دالة لحساب الدرجة الإجمالية تلقائيًا
  useEffect(() => {
    const calculatedTotal = questionScores.reduce((sum, q) => sum + (q.teacherScore || 0), 0);
    setFinalScore(calculatedTotal);
  }, [questionScores]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('submissionId', submission.id);
    formData.append('finalScore', finalScore.toString());
    formData.append('status', submissionStatus);
    formData.append('gradedQuestionsData', JSON.stringify(questionScores)); // إرسال درجات الأسئلة الفردية

    const result = await gradeSubmissionAction(formData);

    if (result.success) {
      setSuccessMessage(result.message);
      router.refresh(); // تحديث الصفحة لجلب البيانات الجديدة
      // router.push(`/teachers/courses/${submission.assignments.course_id}/assignments/${submission.assignment_id}/submissions`);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">نموذج التصحيح</h2>

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

      {/* قسم تصحيح الأسئلة الفردية */}
      {assignmentQuestions.map((question, index) => {
        const studentAnswer = submission.student_answer_data ? submission.student_answer_data[question.id] : 'لم يتم الإجابة';
        const currentQuestionScore = questionScores.find(q => q.questionId === question.id);

        return (
          <div key={question.id} className="mb-6 p-4 border rounded-lg bg-gray-100">
            <h4 className="text-xl font-semibold text-gray-800 mb-2">
              سؤال {index + 1}: {question.question_text} (الدرجة القصوى: {question.max_score})
            </h4>
            <p className="text-gray-700 mb-2">
              **نوع السؤال:** {
                question.question_type === 'multiple_choice' ? 'اختيار من متعدد' :
                question.question_type === 'true_false' ? 'صح/خطأ' :
                question.question_type === 'short_text' ? 'إجابة نصية قصيرة' :
                question.question_type === 'essay' ? 'مقالي' : question.question_type
              }
            </p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-2">
              <p className="font-medium text-blue-800">إجابة الطالب:</p>
              <p className="text-blue-700 break-words">{studentAnswer}</p>
            </div>

            {question.correct_answers && question.correct_answers.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-4">
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

            {/* حقل درجة المعلم لهذا السؤال */}
            <div className="mb-4">
              <label htmlFor={`teacherScore-${question.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                درجة المعلم لهذا السؤال (من {question.max_score}):
              </label>
              <input
                type="number"
                id={`teacherScore-${question.id}`}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={currentQuestionScore?.teacherScore || ''}
                onChange={(e) => updateQuestionScore(question.id, e.target.value)}
                min="0"
                max={question.max_score}
                required
              />
            </div>

            {/* حقل ملاحظات المعلم لهذا السؤال */}
            <div className="mb-4">
              <label htmlFor={`teacherFeedback-${question.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                ملاحظات المعلم (اختياري):
              </label>
              <textarea
                id={`teacherFeedback-${question.id}`}
                rows="2"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={currentQuestionScore?.teacherFeedback || ''}
                onChange={(e) => updateQuestionFeedback(question.id, e.target.value)}
                placeholder="أضف ملاحظاتك هنا..."
              ></textarea>
            </div>
          </div>
        );
      })}

      {/* الدرجة النهائية وحالة التسليم */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-6">
          <label htmlFor="finalScore" className="block text-gray-700 text-sm font-bold mb-2">
            الدرجة النهائية للتسليم:
          </label>
          <input
            type="number"
            id="finalScore"
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={finalScore}
            onChange={(e) => setFinalScore(parseFloat(e.target.value))}
            min="0"
            max={assignmentQuestions.reduce((sum, q) => sum + q.max_score, 0)} // الدرجة القصوى للواجب
            required
          />
          <p className="text-gray-500 text-sm mt-1">الدرجة القصوى للواجب: {assignmentQuestions.reduce((sum, q) => sum + q.max_score, 0)}</p>
        </div>

        <div className="mb-6">
          <label htmlFor="submissionStatus" className="block text-gray-700 text-sm font-bold mb-2">
            حالة التسليم:
          </label>
          <select
            id="submissionStatus"
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={submissionStatus}
            onChange={(e) => setSubmissionStatus(e.target.value)}
          >
            <option value="submitted">تم التسليم</option>
            <option value="graded">تم التصحيح</option>
            <option value="returned">تم الإرجاع (للمراجعة)</option>
          </select>
        </div>
      </div>

      {/* زر الحفظ */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold
                     hover:bg-blue-700 transition-colors duration-300
                     shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                     disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? 'جاري الحفظ...' : 'حفظ الدرجات'}
        </button>
      </div>
    </form>
  );
}
