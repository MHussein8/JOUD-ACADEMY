// src/components/CreateAssignmentForm.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { createAssignmentAction } from '@/lib/actions/assignment'; // استدعاء Server Action

export default function CreateAssignmentForm({ courseId, sessions }) {
  const router = useRouter();

  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignmentType, setAssignmentType] = useState('homework');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [questions, setQuestions] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // دالة لإضافة سؤال جديد
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        questionText: '',
        questionType: 'multiple_choice',
        maxScore: 10,
        options: ['', '', '', ''],
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
          if (field === 'questionType') {
            if (value === 'multiple_choice') {
              updatedQ.options = ['', '', '', ''];
              updatedQ.correctOptionIndex = 0;
              updatedQ.correctAnswer = '';
            } else if (value === 'true_false' || value === 'short_text' || value === 'essay') {
              updatedQ.correctAnswer = '';
              updatedQ.options = [];
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

    const formData = new FormData();
    formData.append('course_id', courseId);
    formData.append('assignmentTitle', assignmentTitle);
    formData.append('assignmentDescription', assignmentDescription);
    formData.append('dueDate', dueDate);
    formData.append('assignmentType', assignmentType);
    formData.append('sessionId', selectedSessionId);
    formData.append('questionsData', JSON.stringify(questions));

    const result = await createAssignmentAction(formData);

    if (result.success) {
      setSuccessMessage(result.message);
      setAssignmentTitle('');
      setAssignmentDescription('');
      setDueDate('');
      setAssignmentType('homework');
      setSelectedSessionId('');
      setQuestions([]);
      router.push(`/teachers/courses/${courseId}`);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <Link href={`/teachers/courses/${courseId}`} className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; العودة لتفاصيل الكورس
      </Link>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
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
        
        <div className="mb-6">
          <label htmlFor="sessionId" className="block text-gray-700 text-sm font-bold mb-2">
            ربط الواجب بالجلسة:
          </label>
          <select
            id="sessionId"
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
          >
            <option value="">(بدون جلسة)</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {`${session.title || 'جلسة بدون عنوان'} - ${new Date(
                  session.start_time
                ).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}`}
              </option>
            ))}
          </select>
        </div>

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

        <div className="mt-8 mb-6 p-6 border rounded-xl bg-gray-50 shadow-inner">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">الأسئلة</h3>
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold text-gray-700">سؤال {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition-colors duration-200"
                >
                  حذف
                </button>
              </div>

              <div className="mb-4">
                <label htmlFor={`questionText-${q.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                  نص السؤال:
                </label>
                <textarea
                  id={`questionText-${q.id}`}
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={q.questionText}
                  onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="mb-4">
                <label htmlFor={`questionType-${q.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                  نوع السؤال:
                </label>
                <select
                  id={`questionType-${q.id}`}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={q.questionType}
                  onChange={(e) => updateQuestion(q.id, 'questionType', e.target.value)}
                >
                  <option value="multiple_choice">اختيار من متعدد</option>
                  <option value="true_false">صح/خطأ</option>
                  <option value="short_text">إجابة نصية قصيرة</option>
                  <option value="essay">مقالي (تصحيح يدوي)</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor={`maxScore-${q.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                  الدرجة القصوى:
                </label>
                <input
                  type="number"
                  id={`maxScore-${q.id}`}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={q.maxScore}
                  onChange={(e) => updateQuestion(q.id, 'maxScore', e.target.value)}
                  min="1"
                  required
                />
              </div>

              {q.questionType === 'multiple_choice' && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    خيارات الإجابة:
                  </label>
                  {q.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center mb-2">
                      <input
                        type="radio"
                        name={`correctOption-${q.id}`}
                        id={`option-${q.id}-${optIndex}`}
                        value={optIndex}
                        checked={q.correctOptionIndex === optIndex}
                        onChange={() => updateQuestion(q.id, 'correctOptionIndex', optIndex)}
                        className="ml-2"
                      />
                      <input
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={option}
                        onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
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
                    onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
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
                  <label htmlFor={`correctAnswer-${q.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                    الإجابة الصحيحة (كلمات مفتاحية):
                  </label>
                  <input
                    type="text"
                    id={`correctAnswer-${q.id}`}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                    placeholder="مثال: بايثون، متغيرات"
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label htmlFor={`explanationText-${q.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                  شرح الإجابة (اختياري):
                </label>
                <textarea
                  id={`explanationText-${q.id}`}
                  rows="2"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={q.explanationText}
                  onChange={(e) => updateQuestion(q.id, 'explanationText', e.target.value)}
                  placeholder="شرح مختصر للإجابة الصحيحة"
                ></textarea>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 mt-4"
          >
            + إضافة سؤال
          </button>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold
                       hover:bg-blue-700 transition-colors duration-300
                       shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={isLoading || questions.length === 0}
          >
            {isLoading ? 'جاري الحفظ...' : 'إنشاء الواجب/الاختبار'}
          </button>
        </div>
      </form>
    </div>
  );
}