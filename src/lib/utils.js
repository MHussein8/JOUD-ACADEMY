// src/lib/utils.js
// هذه دالة مساعدة لاستخراج رسالة الخطأ من أي كائن خطأ
// سواء كان خطأ من Supabase أو خطأ JavaScript عادي.
export function getErrorMessage(error, defaultMessage = 'حدث خطأ غير متوقع.') {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error.message === 'string') {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}
