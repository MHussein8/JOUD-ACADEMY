// src/lib/supabase/client.js
// هذا الملف يقوم بتهيئة عميل Supabase للاستخدام في مكونات React على جانب العميل (Client Components).

import { createBrowserClient } from '@supabase/ssr'; // استيراد createBrowserClient من @supabase/ssr

export function createClientSupabaseClient() {
  // جلب متغيرات البيئة العامة (public environment variables)
  // تأكد من أنها معرفة في ملف .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // التحقق من وجود متغيرات البيئة
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL أو Anon Key غير موجودين في متغيرات البيئة العامة (NEXT_PUBLIC_).');
  }

  // تهيئة عميل Supabase للعمل في المتصفح
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        // دالة get: تقوم بجلب قيمة كوكي معينة من document.cookie
        get(name) {
          const cookie = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`));
          return cookie ? cookie.split('=')[1] : null;
        },
        // ******** تم تصحيح هذا الجزء: دوال set و remove الآن على نفس مستوى get *********
        set(name, value, options) {
          // بناء سلسلة الكوكي مع الخيارات المحددة
          let cookieString = `${name}=${value}`;
          if (options.expires) {
            cookieString += `; Expires=${new Date(options.expires).toUTCString()}`;
          }
          if (options.maxAge) {
            cookieString += `; Max-Age=${options.maxAge}`;
          }
          if (options.path) {
            cookieString += `; Path=${options.path}`;
          }
          if (options.domain) {
            cookieString += `; Domain=${options.domain}`;
          }
          if (options.secure) {
            cookieString += `; Secure`;
          }
          if (options.httpOnly) { // httpOnly لا يعمل في JavaScript مباشرة، لكنها ممارسة جيدة لتضمينها
            cookieString += `; HttpOnly`;
          }
          if (options.sameSite) {
            cookieString += `; SameSite=${options.sameSite}`;
          }
          document.cookie = cookieString;
        },
        remove(name, options) {
          // لحذف كوكي، نضبط تاريخ انتهاء صلاحيته في الماضي
          document.cookie = `${name}=; Max-Age=0; ${Object.entries(options)
            .map(([key, val]) => `${key}=${val}`)
            .join('; ')}`;
        },
      },
    }
  );
}
