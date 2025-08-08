'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/login')
        return
      }
      
      setUser(user)

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          type,
          is_exam,
          max_score,
          course:course_id(title),
          submissions(
            id,
            submitted_at,
            score,
            student_id
          )
        `)
        .order('due_date', { ascending: true })

      if (error) {
        console.error('Error fetching assignments:', error)
      } else {
        setAssignments(data || [])
      }
      
      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleAddAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([
          { 
            title: 'واجب الرياضيات الأول',
            description: 'حل المسائل من الصفحة 10 إلى 15',
            due_date: '2024-06-30',
            course_id: 1
          }
        ])
        .select()

      if (error) throw error;
      
      alert('تم إضافة الواجب بنجاح');
      setAssignments(prev => [...prev, ...data]);
    } catch (error) {
      console.error('Error adding assignment:', error);
      alert('فشل إضافة الواجب');
    }
  };

const handleSubmit = async (assignmentId) => {
  if (!user) {
    alert('يجب تسجيل الدخول أولاً');
    return;
  }

  // حالة التحميل
  setIsSubmitting(true);

  try {
    // 1. التحقق من أن المستخدم طالب
    const { data: studentData, error: studentError } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (studentError || !studentData || studentData.user_role !== 'student') {
      throw new Error('غير مسموح لك بتسليم الواجبات');
    }

    // 2. تنفيذ عملية التسليم
// استبدل كود الإدراج الحالي بهذا:
const { error: submissionError } = await supabase
  .from('submissions')
  .insert({
    assignment_id: assignmentId,
    student_id: user.id,
    submitted_at: new Date().toISOString(),
    score: 0  // إضافة درجة افتراضية
  });

    if (submissionError) throw submissionError;

    // 3. إعادة جلب البيانات المحدثة
    const { data: updatedData, error: fetchError } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        description,
        due_date,
        type,
        is_exam,
        max_score,
        course:course_id(title),
        submissions(
          id,
          submitted_at,
          score,
          student_id
        )
      `)
      .order('due_date', { ascending: true });

    if (fetchError) throw fetchError;

    // 4. تحديث الحالة وعرض النتيجة
    setAssignments(updatedData || []);
    
    // 5. عرض إشعار بنجاح التسليم
    alert('تم تسليم الواجب بنجاح!');

  } catch (error) {
    // معالجة الأخطاء
    console.error('تفاصيل الخطأ:', {
      error,
      user: user?.id,
      assignment: assignmentId
    });
    
    // 6. عرض رسالة الخطأ للمستخدم
    alert(`فشل التسليم: ${error.message}`);

  } finally {
    // 7. إيقاف حالة التحميل بغض النظر عن النتيجة
    setIsSubmitting(false);
  }
};

  if (loading) return <div className="p-4 text-center">جاري التحميل...</div>

  console.log("User data:", {
    id: user?.id,
    role: user?.user_metadata?.user_role,
    email: user?.email
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">الواجبات</h1>
        {user?.user_metadata?.user_role === 'teacher' && (
          <button 
            onClick={handleAddAssignment}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            إضافة واجب جديد
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {assignments.map(assignment => {
          const userSubmission = assignment.submissions?.find(s => s.student_id === user?.id)
          
          return (
            <div key={assignment.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">{assignment.title}</h2>
                  <p className="text-sm text-gray-600">{assignment.course.title}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  assignment.is_exam ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {assignment.type}
                </span>
              </div>
              
              {assignment.description && (
                <p className="mt-2 text-gray-700">{assignment.description}</p>
              )}
              
<div className="mt-3 flex items-center justify-between">
  <div>
    <span className="text-sm text-gray-500">
      {new Date(assignment.due_date).toLocaleString('en-US')}
    </span>
    {assignment.max_score && (
      <span className="text-sm font-medium ml-2">
        {assignment.max_score} نقاط
      </span>
    )}
  </div>
  
  {userSubmission ? (
    <div className="text-right">
      <div className="text-green-600 text-sm">
        مسلم في: {new Date(userSubmission.submitted_at).toLocaleString('ar-EG')}
      </div>
      <div className="text-blue-600 text-sm font-medium">
        الدرجة: {userSubmission.score !== null ? userSubmission.score : 'بانتظار التصحيح'}
      </div>
    </div>
  ) : (
    user?.user_metadata?.user_role === 'student' && (
      <button
        onClick={() => handleSubmit(assignment.id)}
        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
      >
        تسليم الواجب
      </button>
    )
  )}
</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}