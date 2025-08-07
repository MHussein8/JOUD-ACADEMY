import { createSupabaseServerClient } from '@/utils/supabase/server'

export default async function GradingPage() {
  const supabase = await createSupabaseServerClient()

  const { data: pendingAnswers } = await supabase
    .from('student_answers')
    .select(`
      id, answer_text,
      questions (id, question_text, correct_answers(accepted_variations))
    `)
    .is('is_correct', null)

  const approveAnswer = async (answerId) => {
    'use server'
    const supabase = await createSupabaseServerClient()
    await supabase
      .from('student_answers')
      .update({ is_correct: true })
      .eq('id', answerId)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">الإجابات تحتاج مراجعة</h1>
      
      {pendingAnswers?.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded shadow mb-4">
          <h3 className="font-bold">{item.questions.question_text}</h3>
          <p className="my-2">إجابة الطالب: {item.answer_text}</p>
            <div className="flex gap-2 mt-4">
    <form action={approveAnswer.bind(null, item.id)}>
      <button 
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        الموافقة على الإجابة
      </button>
    </form>

    <form action={async (formData) => {
      'use server'
      const supabase = await createSupabaseServerClient()
      const newVariant = formData.get('new_variant')
      
      // 1. أضف المتغير الجديد
      await supabase
        .from('correct_answers')
        .update({
          accepted_variations: 
            supabase.rpc('array_append', {
              column: 'accepted_variations',
              value: newVariant
            })
        })
        .eq('question_id', item.questions.id)
      
      // 2. صحح الإجابة تلقائيًا إذا تطابقت
      await supabase
        .from('student_answers')
        .update({ is_correct: true })
        .eq('id', item.id)
    }}>
      <input
        type="text"
        name="new_variant"
        placeholder="أضف صيغة مقبولة"
        className="border p-2"
        required
      />
      <button 
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
      >
        إضافة متغير
      </button>
    </form>
  </div>
          
          <form action={approveAnswer.bind(null, item.id)}>
            <button 
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              الموافقة على الإجابة
            </button>
          </form>
        </div>
      ))}
    </div>
  )
}