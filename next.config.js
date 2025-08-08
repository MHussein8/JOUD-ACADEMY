/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // تم إضافة هذه الحزم لـ Next.js 15+ لضمان عملها بشكل صحيح مع Turbopack ومكونات الخادم
    // يمكنك إزالتها إذا لم تكن تواجه مشاكل
    serverComponentsExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  env: {
    // تعريف متغيرات البيئة ليتم استخدامها في التطبيق
    // تأكد من وجودها في ملف .env.local
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  images: {
    // السماح بتحميل الصور من نطاقات معينة لتجنب مشاكل الأمان
    domains: ['placehold.co'],
  },
};

module.exports = nextConfig;
