'use server'; // هذا السطر يجب أن يكون في أول سطر في الملف لتعريف كل الدوال المصدرة كـ Server Actions

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers'; // استيراد cookies داخل Server Action
import { revalidatePath } from 'next/cache'; // لاستخدام revalidatePath بعد الحفظ

// دالة Server Action لإضافة الواجب والأسئلة إلى قاعدة البيانات
export async function createAssignmentAction(formData) {
  const course_id = formData.get('course_id');
  const assignmentTitle = formData.get('assignmentTitle');
  const assignmentDescription = formData.get('assignmentDescription');
  const dueDate = formData.get('dueDate');
  const assignmentType = formData.get('assignmentType');
  const sessionId = formData.get('sessionId') || null; // جلب session_id، يمكن أن يكون فارغًا
  const questionsData = JSON.parse(formData.get('questionsData')); // جلب بيانات الأسئلة كـ JSON

  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية (المعلم الذي يقوم بإنشاء الواجب)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in createAssignmentAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لإنشاء واجب.' };
    }
    const teacherId = user.id; // هذا هو الـ ID الحقيقي للمعلم المسجل دخوله

    // 1. إضافة الواجب إلى جدول assignments
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        course_id,
        title: assignmentTitle,
        description: assignmentDescription,
        due_date: dueDate,
        type: assignmentType,
        max_score: questionsData.reduce((sum, q) => sum + parseInt(q.maxScore || 0), 0), // مجموع درجات الأسئلة
        is_exam: assignmentType === 'exam', // تحديد إذا كان اختبارًا
        teacher_id: teacherId, // إضافة الـ teacher_id هنا
        session_id: sessionId, // حفظ الـ session_id هنا
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      return { success: false, message: `فشل في إنشاء الواجب: ${assignmentError.message}` };
    }

    const assignmentId = assignment.id;
    let totalQuestionsScore = 0;

    // 2. إضافة الأسئلة إلى جدول questions والإجابات الصحيحة إلى correct_answers
    for (const q of questionsData) {
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          assignment_id: assignmentId,
          question_text: q.questionText,
          question_type: q.questionType,
          max_score: parseInt(q.maxScore || 0),
        })
        .select()
        .single();

      if (questionError) {
        console.error('Error creating question:', questionError);
        return { success: false, message: `فشل في إنشاء السؤال "${q.questionText}": ${questionError.message}` };
      }

      const questionId = question.id;
      totalQuestionsScore += parseInt(q.maxScore || 0);

      // إضافة الإجابات الصحيحة حسب نوع السؤال
      const { error: answerError } = await supabase.from('correct_answers').insert({
        question_id: questionId,
        correct_answer: q.questionType === 'multiple_choice' ? q.options[q.correctOptionIndex] : q.correctAnswer,
        explanation_text: q.explanationText || null,
        // إضافة accepted_variations لـ multiple_choice
        accepted_variations: q.questionType === 'multiple_choice' ? q.options : null,
      });
      if (answerError) {
        console.error('Error creating correct answer:', answerError);
        return { success: false, message: `فشل في حفظ الإجابة الصحيحة للسؤال "${q.questionText}": ${answerError.message}` };
      }
    }

    // تحديث max_score للواجب بعد إضافة كل الأسئلة
    const { error: updateAssignmentError } = await supabase
      .from('assignments')
      .update({ max_score: totalQuestionsScore })
      .eq('id', assignmentId);

    if (updateAssignmentError) {
      console.error('Error updating assignment total score:', updateAssignmentError);
      return { success: false, message: `فشل في تحديث الدرجة الكلية للواجب: ${updateAssignmentError.message}` };
    }

    // إعادة التحقق من مسار الواجبات لضمان تحديث البيانات في الواجهة
    revalidatePath('/teachers/assignments');
    // إذا كان الواجب مرتبطًا بكورس، أعد التحقق من صفحة تفاصيل الكورس أيضًا
    revalidatePath(`/teachers/courses/${course_id}`);


    return { success: true, message: 'تم إنشاء الواجب والأسئلة بنجاح!', assignmentId };
  } catch (err) {
    console.error('Unhandled error in createAssignmentAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

// دالة Server Action لتعديل الواجب والأسئلة
export async function updateAssignmentAction(formData) {
  const assignmentId = formData.get('assignmentId');
  const assignmentTitle = formData.get('assignmentTitle');
  const assignmentDescription = formData.get('assignmentDescription');
  const dueDate = formData.get('dueDate');
  const assignmentType = formData.get('assignmentType');
  const sessionId = formData.get('sessionId') || null; // جلب session_id، يمكن أن يكون فارغًا
  const questionsData = JSON.parse(formData.get('questionsData'));

  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in updateAssignmentAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لتعديل الواجب.' };
    }
    const teacherId = user.id;

    // 1. تحديث بيانات الواجب الرئيسية
    const { error: assignmentUpdateError } = await supabase
      .from('assignments')
      .update({
        title: assignmentTitle,
        description: assignmentDescription,
        due_date: dueDate,
        type: assignmentType,
        is_exam: assignmentType === 'exam',
        session_id: sessionId, // تحديث الـ session_id هنا
        // max_score سيتم تحديثه لاحقًا بناءً على الأسئلة
      })
      .eq('id', assignmentId)
      .eq('teacher_id', teacherId); // تأكد أن المعلم هو صاحب الواجب

    if (assignmentUpdateError) {
      console.error('Error updating assignment:', assignmentUpdateError);
      return { success: false, message: `فشل في تعديل الواجب: ${assignmentUpdateError.message}` };
    }

    // 2. معالجة الأسئلة: حذف القديم وإضافة الجديد وتحديث الموجود
    // أولاً: جلب الأسئلة الموجودة حاليًا للواجب
    const { data: existingQuestions, error: fetchQuestionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (fetchQuestionsError) {
      console.error('Error fetching existing questions:', fetchQuestionsError);
      return { success: false, message: `فشل في جلب الأسئلة الموجودة: ${fetchQuestionsError.message}` };
    }

    const existingQuestionIds = existingQuestions.map(q => q.id);
    const questionsToKeepIds = questionsData.filter(q => q.id).map(q => q.id); // الأسئلة الموجودة والتي تم إرسالها مرة أخرى

    // حذف الأسئلة التي تم إزالتها
    const questionsToDeleteIds = existingQuestionIds.filter(id => !questionsToKeepIds.includes(id));
    if (questionsToDeleteIds.length > 0) {
      const { error: deleteQuestionsError } = await supabase
        .from('questions')
        .delete()
        .in('id', questionsToDeleteIds);
      if (deleteQuestionsError) {
        console.error('Error deleting old questions:', deleteQuestionsError);
        return { success: false, message: `فشل في حذف بعض الأسئلة القديمة: ${deleteQuestionsError.message}` };
      }
    }

    let totalQuestionsScore = 0;

    // إضافة أو تحديث الأسئلة
    for (const q of questionsData) {
      if (q.id && existingQuestionIds.includes(q.id)) {
        // تحديث سؤال موجود
        const { error: questionUpdateError } = await supabase
          .from('questions')
          .update({
            question_text: q.questionText,
            question_type: q.questionType,
            max_score: parseInt(q.maxScore || 0),
          })
          .eq('id', q.id);

        if (questionUpdateError) {
          console.error('Error updating question:', questionUpdateError);
          return { success: false, message: `فشل في تحديث السؤال "${q.questionText}": ${questionUpdateError.message}` };
        }

        // تحديث الإجابات الصحيحة
        const { error: answerUpdateError } = await supabase
          .from('correct_answers')
          .update({
            correct_answer: q.questionType === 'multiple_choice' ? q.options[q.correctOptionIndex] : q.correctAnswer,
            explanation_text: q.explanationText || null,
            accepted_variations: q.questionType === 'multiple_choice' ? q.options : null, // تحديث accepted_variations
          })
          .eq('question_id', q.id); // نستخدم question_id لتحديد الإجابة

        if (answerUpdateError) {
          console.error('Error updating correct answer:', answerUpdateError);
          return { success: false, message: `فشل في تحديث الإجابة الصحيحة للسؤال "${q.questionText}": ${answerUpdateError.message}` };
        }

      } else {
        // إضافة سؤال جديد
        const { data: newQuestion, error: newQuestionError } = await supabase
          .from('questions')
          .insert({
            assignment_id: assignmentId,
            question_text: q.questionText,
            question_type: q.questionType,
            max_score: parseInt(q.maxScore || 0),
          })
          .select()
          .single();

        if (newQuestionError) {
          console.error('Error creating new question:', newQuestionError);
          return { success: false, message: `فشل في إضافة سؤال جديد "${q.questionText}": ${newQuestionError.message}` };
        }

        // إضافة الإجابات الصحيحة للسؤال الجديد
        const { error: newAnswerError } = await supabase.from('correct_answers').insert({
          question_id: newQuestion.id,
          correct_answer: q.questionType === 'multiple_choice' ? q.options[q.correctOptionIndex] : q.correctAnswer,
          explanation_text: q.explanationText || null,
          accepted_variations: q.questionType === 'multiple_choice' ? q.options : null,
        });
        if (newAnswerError) {
          console.error('Error creating correct answer for new question:', newAnswerError);
          return { success: false, message: `فشل في حفظ الإجابة الصحيحة للسؤال الجديد "${q.questionText}": ${newAnswerError.message}` };
        }
      }
      totalQuestionsScore += parseInt(q.maxScore || 0);
    }

    // 3. تحديث الدرجة الكلية للواجب بعد معالجة جميع الأسئلة
    const { error: updateAssignmentScoreError } = await supabase
      .from('assignments')
      .update({ max_score: totalQuestionsScore })
      .eq('id', assignmentId);

    if (updateAssignmentScoreError) {
      console.error('Error updating assignment total score:', updateAssignmentScoreError);
      return { success: false, message: `فشل في تحديث الدرجة الكلية للواجب: ${updateAssignmentScoreError.message}` };
    }

    // إعادة التحقق من مسار الواجبات لضمان تحديث البيانات في الواجهة
    revalidatePath('/teachers/assignments');
    // إذا كان الواجب مرتبطًا بكورس، أعد التحقق من صفحة تفاصيل الكورس أيضًا
    revalidatePath(`/teachers/courses/${formData.get('courseId')}`); // يجب أن نمرر courseId هنا

    return { success: true, message: 'تم تعديل الواجب والأسئلة بنجاح!' };
  } catch (err) {
    console.error('Unhandled error in updateAssignmentAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

// دالة Server Action لحذف واجب موجود
export async function deleteAssignmentAction(assignmentId) {
  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية (المعلم الذي يقوم بحذف الواجب)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in deleteAssignmentAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لحذف الواجب.' };
    }
    const teacherId = user.id; // هذا هو الـ ID الحقيقي للمعلم المسجل دخوله

    // 1. جلب جميع الأسئلة المرتبطة بهذا الواجب
    const { data: questions, error: fetchQuestionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (fetchQuestionsError) {
      console.error('Error fetching questions for deletion:', fetchQuestionsError);
      return { success: false, message: `فشل في جلب الأسئلة المرتبطة بالواجب: ${fetchQuestionsError.message}` };
    }

    const questionIds = questions.map(q => q.id);

    // 2. حذف الإجابات الصحيحة المرتبطة بالأسئلة (إذا كانت موجودة)
    if (questionIds.length > 0) {
      const { error: deleteAnswersError } = await supabase
        .from('correct_answers')
        .delete()
        .in('question_id', questionIds);
      if (deleteAnswersError) {
        console.error('Error deleting correct answers:', deleteAnswersError);
        return { success: false, message: `فشل في حذف الإجابات الصحيحة المرتبطة بالواجب: ${deleteAnswersError.message}` };
      }
    }

    // 3. حذف الأسئلة المرتبطة بالواجب
    if (questionIds.length > 0) {
      const { error: deleteQuestionsError } = await supabase
        .from('questions')
        .delete()
        .in('id', questionIds);
      if (deleteQuestionsError) {
        console.error('Error deleting questions:', deleteQuestionsError);
        return { success: false, message: `فشل في حذف الأسئلة المرتبطة بالواجب: ${deleteQuestionsError.message}` };
      }
    }

    // 4. حذف الواجب نفسه
    const { error: deleteAssignmentError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId) // نحدد الواجب اللي هيتحذف بالـ ID بتاعه
      .eq('teacher_id', teacherId); // مهم: نتأكد إن المعلم ده هو صاحب الواجب عشان الأمان

    if (deleteAssignmentError) {
      console.error('Error deleting assignment:', deleteAssignmentError);
      return { success: false, message: `فشل في حذف الواجب: ${deleteAssignmentError.message}` };
    }

    // إعادة التحقق من مسار الواجبات لضمان تحديث البيانات في الواجهة
    revalidatePath('/teachers/assignments');

    return { success: true, message: 'تم حذف الواجب والأسئلة المرتبطة به بنجاح!' };
  } catch (err) {
    console.error('Unhandled error in deleteAssignmentAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}

// دالة Server Action لتصحيح تسليم واجب/اختبار
export async function gradeSubmissionAction(formData) {
  const submissionId = formData.get('submissionId');
  const finalScore = parseFloat(formData.get('finalScore')); // الدرجة النهائية
  const status = formData.get('status'); // حالة التسليم (مثل 'graded')
  const gradedQuestionsData = JSON.parse(formData.get('gradedQuestionsData')); // بيانات الأسئلة المصححة

  const supabase = createServerSupabaseClient(cookies());

  try {
    // جلب الـ user ID من الجلسة الحالية (المعلم الذي يقوم بالتصحيح)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user in gradeSubmissionAction:', userError);
      return { success: false, message: 'يجب تسجيل الدخول لتصحيح التسليم.' };
    }
    const teacherId = user.id;

    // التحقق من أن المعلم لديه صلاحية تصحيح هذا التسليم
    // (أي أن الواجب يخص هذا المعلم)
    const { data: submissionCheck, error: checkError } = await supabase
      .from('assignment_submissions')
      .select('assignments(teacher_id, course_id, id)') // جلب course_id و id للواجب
      .eq('id', submissionId)
      .single();

    if (checkError || !submissionCheck || submissionCheck.assignments.teacher_id !== teacherId) {
      console.error('Authorization error in gradeSubmissionAction:', checkError);
      return { success: false, message: 'ليس لديك صلاحية لتصحيح هذا التسليم.' };
    }

    // 1. تحديث بيانات التسليم في جدول assignment_submissions
    const { error: submissionUpdateError } = await supabase
      .from('assignment_submissions')
      .update({
        score: finalScore,
        status: status,
        // يمكن إضافة حقل لتخزين درجات الأسئلة الفردية لو أردت
        // graded_questions_data: gradedQuestionsData // مثال: لو كان لديك عمود لتخزينها
      })
      .eq('id', submissionId);

    if (submissionUpdateError) {
      console.error('Error updating submission score and status:', submissionUpdateError);
      return { success: false, message: `فشل في تحديث درجة التسليم وحالته: ${submissionUpdateError.message}` };
    }

    // هنا يمكن إضافة منطق لحفظ درجات الأسئلة الفردية إذا كان لديك جدول مخصص لذلك
    // For example, if you have a 'student_Youtubes' table with a 'teacher_score' column:
    /*
    for (const qData of gradedQuestionsData) {
        const { error: questionGradeError } = await supabase
            .from('student_Youtubes')
            .update({ teacher_score: qData.teacherScore, teacher_feedback: qData.teacherFeedback })
            .eq('submission_id', submissionId)
            .eq('question_id', qData.questionId);
        if (questionGradeError) {
            console.error('Error updating individual question grade:', questionGradeError);
            // Handle error, but don't necessarily fail the whole submission grade
        }
    }
    */

    // إعادة التحقق من المسارات ذات الصلة بعد التصحيح
    revalidatePath(`/teachers/courses/${submissionCheck.assignments.course_id}/assignments/${submissionCheck.assignments.id}/submissions`);
    revalidatePath(`/teachers/courses/${submissionCheck.assignments.course_id}/assignments/${submissionCheck.assignments.id}/submissions/${submissionId}`);
    revalidatePath('/teachers/assignments'); // لتحديث لوحة الواجبات العامة

    return { success: true, message: 'تم تصحيح التسليم بنجاح!' };
  } catch (err) {
    console.error('Unhandled error in gradeSubmissionAction:', err);
    return { success: false, message: `حدث خطأ غير متوقع: ${err.message}` };
  }
}