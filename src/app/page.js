import { checkAnswer } from '@/utils/grading/autoCorrect';

export default function Home() {
  // جرب الدالة مباشرة بثلاث حالات
  const testCases = [
    { user: "الرياض", correct: "الرياض", expected: true },
    { user: "Riyadh", correct: "الرياض", variations: ["Riyadh", "رياض"], expected: true },
    { user: "جدة", correct: "الرياض", expected: false }
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">اختبار نظام التصحيح</h1>
      
      <div className="space-y-4">
        {testCases.map((test, index) => {
          const result = checkAnswer(test.user, test.correct, test.variations || []);
          const isCorrect = result === test.expected;

          return (
            <div key={index} className={`p-3 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              <p>السؤال {index + 1}:</p>
              <p>إجابة الطالب: "{test.user}"</p>
              <p>الإجابة الصحيحة: "{test.correct}"</p>
              <p>النتيجة: {result ? '✅ صحيح' : '❌ خاطئ'}</p>
              <p>التوقيع: {isCorrect ? '✔ الاختبار ناجح' : '✖ الاختبار فشل'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}