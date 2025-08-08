// src/components/EditAssignmentForm.js
'use client'; // هذا المكون Client Component لأنه يحتوي على تفاعل

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateAssignmentAction } from '@/lib/actions/assignment'; // استيراد Server Action الجديد

// دالة مساعدة لتهيئة بيانات الأسئلة للنموذج
const formatQuestionsForForm = (assignmentQuestions) => {
  if (!assignmentQuestions) return [];

  return assignmentQuestions.map(q => {
    const correct_answer_data = q.correct_answers && q.correct_answers.length > 0 ? q.correct_answers[0] : {};
    
    // Ensure options are an array, even if accepted_variations is null/undefined
    const optionsArray = Array.isArray(correct_answer_data.accepted_variations)
                         ? correct_answer_data.accepted_variations
                         : ['', '', '', '', '']; // Default to 5 empty options

    // Determine correctOptionIndex for multiple_choice
    let correctOptIndex = 0;
    if (q.question_type === 'multiple_choice' && correct_answer_data.correct_answer) {
      const index = optionsArray.indexOf(correct_answer_data.correct_answer);
      if (index !== -1) {
        correctOptIndex = index;
      }
    }

    return {
      id: q.id, // احتفاظ بالـ ID للأسئلة الموجودة
      questionText: q.question_text,
      questionType: q.question_type,
      maxScore: q.max_score,
      options: optionsArray,
      correctOptionIndex: correctOptIndex,
      correctAnswer: q.question_type !== 'multiple_choice' ? correct_answer_data.correct_answer || '' : '',
      explanationText: correct_answer_data.explanation_text || '',
    };
  });
};


export default function EditAssignmentForm({ assignment, sessions }) { // استقبل sessions كـ prop
  const router = useRouter();

  // حالة النموذج لبيانات الواجب - تهيئة مباشرة من assignment prop
  const [assignmentTitle, setAssignmentTitle] = useState(assignment.title);
  const [assignmentDescription, setAssignmentDescription] = useState(assignment.description || '');
  const [dueDate, setDueDate] = useState(assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '');
  const [assignmentType, setAssignmentType] = useState(assignment.type);
  const [selectedSession, setSelectedSession] = useState(assignment.session_id || ''); // تهيئة session_id

  // حالة الأسئلة - تهيئة مباشرة من assignment.questions
  const [questions, setQuestions] = useState(() => formatQuestionsForForm(assignment.questions));

  // حالة التحميل والأخطاء
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // useEffect لتحديث الحالة إذا تغيرت الـ prop `assignment` (لضمان المرونة)
  useEffect(() => {
    if (assignment) {
      setAssignmentTitle(assignment.title);
      setAssignmentDescription(assignment.description || '');
      setDueDate(assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '');
      setAssignmentType(assignment.type);
      setSelectedSession(assignment.session_id || ''); // تحديث session_id هنا أيضًا
      setQuestions(formatQuestionsForForm(assignment.questions));
    }
  }, [assignment]);

  // دالة لإضافة سؤال جديد
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: null, // ID null يعني سؤال جديد لم يتم حفظه بعد
        questionText: '',
        questionType: 'multiple_choice',
        maxScore: 10,
        options: ['', '', '', '', ''], // 5 خيارات افتراضية
        correctOptionIndex: 0,
        correctAnswer: '',
        explanationText: '',
      },
    ]);
  };

  // دالة لحذف سؤال
  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // دالة لتحديث بيانات سؤال معين
  const updateQuestion = (id, field, value) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const updatedQ = { ...q, [field]: value };
          // إعادة تعيين الخيارات والإجابات عند تغيير النوع
          if (field === 'questionType') {
            if (value === 'multiple_choice') {
              updatedQ.options = ['', '', '', '', ''];
              updatedQ.correctOptionIndex = 0;
              updatedQ.correctAnswer = '';
            } else if (value === 'true_false' || value === 'short_text') {
              updatedQ.correctAnswer = '';
              updatedQ.options = ['', '', '', '', '']; // تأكد من مسح الخيارات
              updatedQ.correctOptionIndex = 0;
            } else if (value === 'essay') {
                updatedQ.correctAnswer = '';
                updatedQ.options = ['', '', '', '', ''];
                updatedQ.correctOptionIndex = 0;
            }
          }
          return updatedQ;
        }
        return q;
      })
    );
  };

  // دالة لتحديث خيارات سؤال الاختيار من متعدد
  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  // دالة لمعالجة إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // تحضير البيانات لإرسالها لـ Server Action
    const formData = new FormData();
    formData.append('assignmentId', assignment.id); // ID الواجب الذي يتم تعديله
    formData.append('assignmentTitle', assignmentTitle);
    formData.append('assignmentDescription', assignmentDescription);
    formData.append('dueDate', dueDate);
    formData.append('assignmentType', assignmentType);
    formData.append('sessionId', selectedSession || null); // إضافة session_id
    formData.append('questionsData', JSON.stringify(questions)); // تحويل مصفوفة الأسئلة لـ JSON String

    const result = await updateAssignmentAction(formData);

    if (result.success) {
      setSuccessMessage(result.message);
      // التوجيه إلى صفحة إدارة الواجبات العامة بعد النجاح
      router.push('/teachers/assignments');
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      {/* رسائل النجاح أو الخطأ */}
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

      {/* حقل عنوان الواجب */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
          عنوان الواجب/الاختبار:
        </label>
        <input
          type="text"
          id="title"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={assignmentTitle}
          onChange={(e) => setAssignmentTitle(e.target.value)}
          required
        />
      </div>

      {/* حقل وصف الواجب */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
          وصف الواجب/الاختبار:
        </label>
        <textarea
          id="description"
          rows="4"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={assignmentDescription}
          onChange={(e) => setAssignmentDescription(e.target.value)}
        ></textarea>
      </div>

      {/* حقل تاريخ الاستحقاق */}
      <div className="mb-6">
        <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2">
          تاريخ ووقت الاستحقاق:
        </label>
        <input
          type="datetime-local"
          id="dueDate"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>

      {/* حقل النوع */}
      <div className="mb-6">
        <label htmlFor="assignmentType" className="block text-gray-700 text-sm font-bold mb-2">
          النوع:
        </label>
        <select
          id="assignmentType"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={assignmentType}
          onChange={(e) => setAssignmentType(e.target.value)}
        >
          <option value="homework">واجب (Homework)</option>
          <option value="exam">اختبار (Exam)</option>
        </select>
      </div>

      {/* حقل اختيار الجلسة */}
      <div className="mb-6">
        <label htmlFor="sessionId" className="block text-gray-700 text-sm font-bold mb-2">
          ربط بالجلسة (اختياري):
        </label>
        <select
          id="sessionId"
          className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
        >
          <option value="">لا يوجد جلسة محددة</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.title} - {new Date(session.session_date).toLocaleDateString('ar-EG')}
            </option>
          ))}
        </select>
        {sessions.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">لا توجد جلسات متاحة لهذا الكورس. يمكنك إنشاء جلسة جديدة من صفحة تفاصيل الكورس.</p>
        )}
      </div>

      {/* قسم إضافة الأسئلة */}
      <div className="mt-8 mb-6 p-6 border rounded-xl bg-gray-50 shadow-inner">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">الأسئلة</h3>
        {questions.map((q, index) => (
          <div key={q.id || `new-${index}`} className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-semibold text-gray-700">سؤال {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeQuestion(q.id || `new-${index}`)}
                className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition-colors duration-200"
              >
                حذف
              </button>
            </div>

            {/* حقل نص السؤال */}
            <div className="mb-4">
              <label htmlFor={`questionText-${q.id || `new-${index}`}`} className="block text-gray-700 text-sm font-bold mb-2">
                نص السؤال:
              </label>
              <textarea
                id={`questionText-${q.id || `new-${index}`}`}
                rows="3"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={q.questionText}
                onChange={(e) => updateQuestion(q.id || `new-${index}`, 'questionText', e.target.value)}
                required
              ></textarea>
            </div>

            {/* حقل نوع السؤال */}
            <div className="mb-4">
              <label htmlFor={`questionType-${q.id || `new-${index}`}`} className="block text-gray-700 text-sm font-bold mb-2">
                نوع السؤال:
              </label>
              <select
                id={`questionType-${q.id || `new-${index}`}`}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={q.questionType}
                onChange={(e) => updateQuestion(q.id || `new-${index}`, 'questionType', e.target.value)}
              >
                <option value="multiple_choice">اختيار من متعدد</option>
                <option value="true_false">صح/خطأ</option>
                <option value="short_text">إجابة نصية قصيرة</option>
                <option value="essay">مقالي (تصحيح يدوي)</option>
              </select>
            </div>

            {/* حقل الدرجة القصوى للسؤال */}
            <div className="mb-4">
              <label htmlFor={`maxScore-${q.id || `new-${index}`}`} className="block text-gray-700 text-sm font-bold mb-2">
                الدرجة القصوى:
              </label>
              <input
                type="number"
                id={`maxScore-${q.id || `new-${index}`}`}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={q.maxScore}
                onChange={(e) => updateQuestion(q.id || `new-${index}`, 'maxScore', e.target.value)}
                min="1"
                required
              />
            </div>

            {/* حقول الإجابة الصحيحة بناءً على نوع السؤال */}
            {q.questionType === 'multiple_choice' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  خيارات الإجابة:
                </label>
                {q.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center mb-2">
                    <input
                      type="radio"
                      name={`correctOption-${q.id || `new-${index}`}`}
                      id={`option-${q.id || `new-${index}`}-${optIndex}`}
                      value={optIndex}
                      checked={q.correctOptionIndex === optIndex}
                      onChange={() => updateQuestion(q.id || `new-${index}`, 'correctOptionIndex', optIndex)}
                      className="ml-2"
                    />
                    <input
                      type="text"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={option}
                      onChange={(e) => updateOption(q.id || `new-${index}`, optIndex, e.target.value)}
                      placeholder={`خيار ${optIndex + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
            )}

            {q.questionType === 'true_false' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  الإجابة الصحيحة:
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(q.id || `new-${index}`, 'correctAnswer', e.target.value)}
                  required
                >
                  <option value="">اختر...</option>
                  <option value="صحيح">صحيح</option>
                  <option value="خطأ">خطأ</option>
                </select>
              </div>
            )}

            {q.questionType === 'short_text' && (
              <div className="mb-4">
                <label htmlFor={`correctAnswer-${q.id || `new-${index}`}`} className="block text-gray-700 text-sm font-bold mb-2">
                  الإجابة الصحيحة (كلمات مفتاحية):
                </label>
                <input
                  type="text"
                  id={`correctAnswer-${q.id || `new-${index}`}`}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(q.id || `new-${index}`, 'correctAnswer', e.target.value)}
                  placeholder="مثال: بايثون، متغيرات"
                  required
                />
              </div>
            )}

            {/* حقل شرح الإجابة (يظهر لجميع الأنواع الآن، بما في ذلك المقالي) */}
            <div className="mb-4">
              <label htmlFor={`explanationText-${q.id || `new-${index}`}`} className="block text-gray-700 text-sm font-bold mb-2">
                شرح الإجابة (اختياري):
              </label>
              <textarea
                id={`explanationText-${q.id || `new-${index}`}`}
                rows="2"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={q.explanationText}
                onChange={(e) => updateQuestion(q.id || `new-${index}`, 'explanationText', e.target.value)}
                placeholder="شرح مختصر للإجابة الصحيحة"
              ></textarea>
            </div>
          </div>
        ))}

        {/* زر إضافة سؤال جديد */}
        <button
          type="button"
          onClick={addQuestion}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 mt-4"
        >
          + إضافة سؤال
        </button>
      </div>

      {/* زر الإرسال */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold
                     hover:bg-blue-700 transition-colors duration-300
                     shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                     disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          disabled={isLoading || questions.length === 0}
        >
          {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>
    </form>
  );
}
