// src/app/actions/sessions.js
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid'; // لتوليد UUIDs فريدة

/**
 * Server Action لإنشاء جلسة جديدة ورفع مرفقاتها
 * @param {object} prevState - الحالة السابقة للنموذج
 * @param {FormData} formData - البيانات المرسلة من النموذج
 * @returns {object} - حالة جديدة للنموذج (نجاح أو فشل)
 */
export async function createSession(prevState, formData) {
  const cookieStore = cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  // جلب معلومات المستخدم الحالي (المدرس) للتأكد من تسجيل الدخول
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: 'يجب تسجيل الدخول لإنشاء جلسات.',
    };
  }

  const teacherId = user.id;

  // جلب البيانات من الـ FormData
  const title = formData.get('title');
  const description = formData.get('description');
  const courseId = formData.get('courseId');
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime') || null;
  const zoomLink = formData.get('zoomLink') || null;
  const notes = formData.get('notes') || null;

  // جلب المرفقات كـ File objects من الـ FormData
  const attachments = formData.getAll('attachments');

  let uploadedAttachments = [];

  try {
    // 1. رفع المرفقات إلى Supabase Storage
    // التحقق من وجود مرفقات صالحة (حجم الملف أكبر من صفر)
    if (attachments && attachments.length > 0 && attachments[0].size > 0) {
      const uploadPromises = attachments.map(async (file) => {
        // نستخدم UUID كاسم للملف في Supabase Storage لضمان التوافق وتجنب مشاكل الأحرف العربية
        const uniqueFileName = `${uuidv4()}`;
        const filePath = `public/${uniqueFileName}`;

        const { data, error } = await supabase.storage
          .from('session-attachments')
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        // الحصول على الرابط العام للملف المرفوع
        const { data: publicUrlData } = supabase.storage
          .from('session-attachments')
          .getPublicUrl(data.path);

        return {
          title: file.name, // حفظ الاسم الأصلي في قاعدة البيانات
          url: publicUrlData.publicUrl,
        };
      });
      uploadedAttachments = await Promise.all(uploadPromises);
    }

    // 2. إنشاء الجلسة في جدول 'sessions'
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        title,
        description,
        course_id: courseId,
        zoom_link: zoomLink,
        notes,
        start_time: startTime,
        end_time: endTime,
        teacher_id: teacherId,
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // 3. حفظ بيانات المرفقات في جدول 'session_attachments'
    if (uploadedAttachments.length > 0) {
      const attachmentsToInsert = uploadedAttachments.map(attachment => ({
        session_id: session.id,
        title: attachment.title,
        url: attachment.url,
      }));
      
      const { error: attachmentsError } = await supabase
        .from('session_attachments')
        .insert(attachmentsToInsert);
      
      if (attachmentsError) {
        throw attachmentsError;
      }
    }

    // إذا تم كل شيء بنجاح
    return { success: true, message: 'تم إنشاء الجلسة بنجاح!' };
  } catch (error) {
    // التعامل مع الأخطاء
    console.error('Error in createSession Server Action:', error);
    return { success: false, message: `حدث خطأ: ${error.message || 'غير معروف'}` };
  }
}
