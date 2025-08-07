// test-grading.js
import { checkAnswer } from '@/utils/grading/autoCorrect';

// جرب هذه الأمثلة:
const test1 = checkAnswer('الرياض', 'الرياض');
const test2 = checkAnswer('Riyadh', 'الرياض', ['Riyadh', 'رياض']);

console.log('اختبار 1 (يجب أن يكون true):', test1);
console.log('اختبار 2 (يجب أن يكون true):', test2);