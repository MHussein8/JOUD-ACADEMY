// src/lib/supabase.js
// هذا الملف يستخدم الطريقة الموصى بها لإنشاء عميل Supabase في Server Components.

import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * دالة مساعدة لإنشاء عميل Supabase للمكونات التي تعمل على السيرفر.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabaseServer = () => {
  // استخدام createServerClient، وهي الطريقة الموصى بها في Supabase
  // يتم إنشاء العميل بشكل متزامن هنا.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookies().set({ name, value, ...options });
          } catch (error) {
            // The `cookies().set()` will fail when called from a Server Component.
            // We ignore this error as we'll set cookies in a Server Action.
          }
        },
        remove(name, options) {
          try {
            cookies().set({ name, value: '', ...options });
          } catch (error) {
            // The `cookies().set()` will fail when called from a Server Component.
            // We ignore this error as we'll set cookies in a Server Action.
          }
        },
      },
    }
  );
};
