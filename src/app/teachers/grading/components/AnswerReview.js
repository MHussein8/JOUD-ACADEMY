'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AnswerReview({ question, studentAnswer }) {
  const [newVariant, setNewVariant] = useState('');

  const handleAddVariant = async () => {
    try {
      // 1. تحديث حالة الإجابة إلى صحيحة
      await supabase
        .from('student_answers')
        .update({ is_correct: true })
        .eq('id', studentAnswer.id);

      // 2. إضافة المتغير الجديد
      await supabase
        .from('correct_answers')
        .update({
          accepted_variations: [...question.accepted_variations, newVariant]
        })
        .eq('question_id', question.id);

      alert('تم التحديث بنجاح!');
      window.location.reload(); // لتحديث الصفحة
    } catch (error) {
      alert('حدث خطأ: ' + error.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-bold text-lg">{question.question_text}</h3>
      <p className="my-2">إجابة الطالب: <span className="font-bold">{studentAnswer.answer_text}</span></p>
      
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          className="border p-2 flex-1"
          placeholder="أدخل صيغة مقبولة جديدة"
          value={newVariant}
          onChange={(e) => setNewVariant(e.target.value)}
        />
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleAddVariant}
        >
          إضافة
        </button>
      </div>
    </div>
  );
}