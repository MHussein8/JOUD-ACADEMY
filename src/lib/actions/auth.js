// src/lib/actions/auth.js
'use server'; // هذا السطر يجب أن يكون في أول سطر في الملف لتعريف كل الدوال المصدرة كـ Server Actions

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation'; // لا يزال مستخدماً في signOut

// دالة لتسجيل دخول الطالب باستخدام كود الطالب وكلمة المرور
export async function signInStudent(formData) {
  const studentCode = formData.get('studentCode')?.toString().toUpperCase();
  const password = formData.get('password');

  const supabase = createServerSupabaseClient(cookies());

  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, user_role')
      .eq('student_code', studentCode)
      .single();

    if (userError || !userData) {
      console.error('Error finding user by student code:', userError?.message || 'User not found');
      return { success: false, message: 'كود الطالب أو كلمة المرور غير صحيحة.' };
    }

    if (userData.user_role !== 'student') {
      return { success: false, message: 'ليس لديك صلاحية دخول كطالب.' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: password,
    });

    if (signInError) {
      console.error('Error signing in student:', signInError);
      return { success: false, message: `فشل تسجيل الدخول: ${signInError.message}` };
    }

    return { success: true, redirectUrl: '/student' };
  } catch (err) {
    console.error('Unhandled error in signInStudent:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

// دالة لتسجيل دخول المعلم باستخدام البريد الإلكتروني وكلمة المرور
export async function signInTeacher(formData) {
  const email = formData.get('email');
  const password = formData.get('password');

  const supabase = createServerSupabaseClient(cookies());

  try {
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      console.error('Error signing in teacher:', signInError);
      return { success: false, message: `فشل تسجيل الدخول: ${signInError.message}` };
    }

    const { data: userData, error: userRoleError } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData || userData.user_role !== 'teacher') {
      await supabase.auth.signOut();
      console.error('Unauthorized access attempt: User is not a teacher or role not found.');
      return { success: false, message: 'ليس لديك صلاحية دخول كمعلم.' };
    }

    return { success: true, redirectUrl: '/teachers' };
  } catch (err) {
    console.error('Unhandled error in signInTeacher:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

// دالة لتسجيل طالب جديد وتوليد كود الطالب
export async function signUpStudent(formData) {
  const fullName = formData.get('fullName');
  const password = formData.get('password');
  const gradeLevel = formData.get('gradeLevel');
  const dateOfBirth = formData.get('dateOfBirth');
  const contactNumber = formData.get('contactNumber');
  const country = formData.get('country');
  const city = formData.get('city');

  const supabase = createServerSupabaseClient(cookies());

  try {
    let newStudentCode;
    let isCodeUnique = false;
    let attempt = 0;

    while (!isCodeUnique && attempt < 10) {
      const { data: maxCodeData, error: maxCodeError } = await supabase
        .from('users')
        .select('student_code')
        .ilike('student_code', 'STU-%')
        .order('student_code', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1000;
      if (maxCodeData && maxCodeData.student_code) {
        const lastNumber = parseInt(maxCodeData.student_code.replace('STU-', ''));
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      newStudentCode = `STU-${nextNumber.toString().padStart(3, '0')}`;

      const { count: existingCodeCount, error: checkCodeError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .ilike('student_code', newStudentCode);

      if (checkCodeError) throw checkCodeError;

      if (existingCodeCount === 0) {
        isCodeUnique = true;
      }
      attempt++;
    }

    if (!isCodeUnique) {
      return { success: false, message: 'فشل في توليد كود طالب فريد. يرجى المحاولة مرة أخرى.' };
    }

    const dummyEmail = `student_${newStudentCode.toLowerCase()}@joudacademy.com`;

    const { data: { user }, error: createUserError } = await supabase.auth.admin.createUser({
      email: dummyEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        user_role: 'student',
      },
    });

    if (createUserError) {
      console.error('Error creating user with admin client:', createUserError);
      let errorMessage = 'فشل تسجيل الطالب.';
      if (createUserError.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
        errorMessage = 'البريد الإلكتروني المستخدم موجود بالفعل. (خطأ داخلي: كود الطالب قد يكون مستخدمًا من قبل).';
      } else if (createUserError.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.';
      } else {
        errorMessage = `فشل تسجيل الطالب: ${createUserError.message}`;
      }
      return { success: false, message: errorMessage };
    }

    const { error: updateAuthUserError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirmed_at: new Date().toISOString() }
    );

    if (updateAuthUserError) {
      console.error('Error updating auth.users email_confirmed_at:', updateAuthUserError);
      await supabase.auth.admin.deleteUser(user.id);
      return { success: false, message: `فشل في تأكيد البريد الإلكتروني للمستخدم: ${updateAuthUserError.message}` };
    }

    const { error: updateProfileError } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        student_code: newStudentCode,
        grade_level: gradeLevel,
        date_of_birth: dateOfBirth,
        contact_number: contactNumber,
        country: country,
        city: city,
      })
      .eq('id', user.id);

    if (updateProfileError) {
      console.error('Error updating student profile after admin create:', updateProfileError);
      await supabase.auth.admin.deleteUser(user.id);
      return { success: false, message: `فشل في حفظ بيانات الطالب الإضافية: ${updateProfileError.message}` };
    }

    return { success: true, message: `تم تسجيل الطالب بنجاح! كود الطالب الخاص به هو: ${newStudentCode}`, studentCode: newStudentCode };
  } catch (err) {
    console.error('Unhandled error in signUpStudent:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

// دالة Server Action لتسجيل معلم جديد
export async function signUpTeacher(formData) {
  const fullName = formData.get('fullName');
  const email = formData.get('email');
  const password = formData.get('password');
  const phoneNumber = formData.get('phoneNumber');
  const gender = formData.get('gender');
  const dateOfBirth = formData.get('dateOfBirth');
  const nationality = formData.get('nationality');
  const subject = formData.get('subject');
  const educationalLevel = formData.get('educationalLevel');
  const yearsOfExperience = parseInt(formData.get('yearsOfExperience') || '0'); // تحويل إلى رقم

  const supabase = createServerSupabaseClient(cookies());

  try {
    // 1. إنشاء المستخدم في Supabase Auth باستخدام admin client
    const { data: { user }, error: createUserError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        user_role: 'teacher', // تعيين الدور كـ 'teacher' في الـ metadata
      },
    });

    if (createUserError) {
      console.error('Error creating teacher user with admin client:', createUserError);
      let errorMessage = 'فشل تسجيل المعلم.';
      if (createUserError.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
        errorMessage = 'هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد إلكتروني آخر.';
      } else if (createUserError.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.';
      } else {
        errorMessage = `فشل تسجيل المعلم: ${createUserError.message}`;
      }
      return { success: false, message: errorMessage };
    }

    // 2. تحديث email_confirmed_at يدوياً في auth.users بعد إنشاء المستخدم
    const { error: updateAuthUserError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirmed_at: new Date().toISOString() }
    );

    if (updateAuthUserError) {
      console.error('Error updating auth.users email_confirmed_at for teacher:', updateAuthUserError);
      await supabase.auth.admin.deleteUser(user.id); // حذف المستخدم إذا فشل التأكيد
      return { success: false, message: `فشل في تأكيد البريد الإلكتروني للمعلم: ${updateAuthUserError.message}` };
    }

    // 3. تحديث جدول public.users بالبيانات الإضافية الخاصة بالمعلم
    // ******** هذا هو التعديل الحاسم: نضبط user_role صراحةً هنا ********
    const { error: updateProfileError } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        user_role: 'teacher', // ******** تأكد من أن هذا السطر غير معلق ********
        phone_number: phoneNumber,
        gender: gender,
        date_of_birth: dateOfBirth,
        nationality: nationality,
        subject: subject,
        educational_level: educationalLevel,
        years_of_experience: yearsOfExperience,
      })
      .eq('id', user.id);

    if (updateProfileError) {
      console.error('Error updating teacher profile in public.users:', updateProfileError);
      await supabase.auth.admin.deleteUser(user.id); // حذف المستخدم إذا فشل تحديث البروفايل
      return { success: false, message: `فشل في حفظ بيانات المعلم الإضافية: ${updateProfileError.message}` };
    }

    return { success: true, message: 'تم تسجيل المعلم بنجاح! يمكنك الآن تسجيل الدخول.' };
  } catch (err) {
    console.error('Unhandled error in signUpTeacher:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}


// دالة لتسجيل الخروج (يمكن استخدامها لكل الأدوار)
export async function signOut() {
  const supabase = createServerSupabaseClient(cookies());
  await supabase.auth.signOut();
  redirect('/');
  return;
}
