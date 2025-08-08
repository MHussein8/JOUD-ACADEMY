// src/lib/supabase/server.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient(cookieStore) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL أو Service Role Key غير موجودين في متغيرات البيئة.');
  }

  return createServerClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      cookies: {
        get: async (name) => {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        // هذا هو السطر الذي يجعل set دالة async وتستخدم await
        set: async (name, value, options) => {
          await cookieStore.set(name, value, options);
        },
        // وهذا هو السطر الذي يجعل remove دالة async وتستخدم await
        remove: async (name, options) => {
          await cookieStore.set(name, '', options); // استخدام set مع قيمة فارغة لإزالة الكوكي
        },
      },
    }
  );
}
