// src/middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  // أنشئ نسخة Response عشان نعدل عليها لو فيه تحديث للكوكيز
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // أنشئ عميل Supabase خاص بالـ Middleware
  // هنا هنستخدم الـ ANON_KEY لأننا بنتعامل مع الـ request/response مباشرة
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          request.cookies.set(name, value, options); // ده اللي بيغير الكوكيز
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set(name, value, options);
        },
        remove: (name, options) => {
          request.cookies.set(name, '', options);
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set(name, '', options);
        },
      },
    }
  );

  // قم بتحديث الـ session بتاعة Supabase
  // ده بيخلي Supabase تعمل "Refresh" للـ session وتحدث الكوكيز لو محتاجة
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // إذا كانت هناك جلسة، ممكن هنا تتحقق من الـ role أو تعمل redirects بناءً على الصلاحيات
  // في مثالنا الحالي، هنخليها تمرر الـ request عادي
  if (!session) {
    // إذا لم يكن هناك جلسة، ممكن تعمل redirect لصفحة تسجيل الدخول
    // مثلاً: return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return response;
}

// هنا بتحدد الـ paths اللي الـ middleware ده هيشتغل عليها
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any files in the api folder (Next.js API routes)
     * - any files in the auth folder (your auth pages)
     * Add other paths as needed
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};