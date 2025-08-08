'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

async function fetchSessionDetails(session_id) {
  // بيانات تجريبية (ستستبدل باتصال حقيقي بالسيرفر)
  // TODO: استبدل هذا باستدعاء حقيقي من Supabase لجلب بيانات الجلسة والمرفقات
  return {
    id: session_id,
    title: 'Unit 1 Lesson 4',
    description: 'the world around us',
    course: { id: 'course1', name: 'Hello Plus' },
    start_time: '2025-08-17T01:21:00Z',
    end_time: '2025-08-29T22:29:00Z',
    notes: 'come come',
    attachments: [
      { name: 'ورقة عمل.pdf', url: '#' },
      { name: 'فيديو شرح.mp4', url: '#' },
    ],
    attendance: [
      { id: 'stu1', name: 'أحمد محمد', status: 'حاضر', grade: 9, interaction: 4, note: 'ممتاز' },
      { id: 'stu2', name: 'سارة علي', status: 'غائب', grade: 0, interaction: 0, note: '' },
      { id: 'stu3', name: 'محمد سمير', status: 'متأخر', grade: 7, interaction: 3, note: 'تأخر 10 دقائق' },
    ],
    assignments: [
      { id: 1, title: 'واجب القراءة', status: 'تم التسليم', link: '#' },
      { id: 2, title: 'اختبار قصير', status: 'لم يُسلّم', link: '#' },
    ],
    activities: [
      { time: '01:30', text: 'مناقشة حول البيئة' },
      { time: '02:00', text: 'نشاط جماعي: رسم خريطة' },
    ],
  };
}

export default function SessionDetailsPage() {
  const { session_id } = useParams();
  const [session, setSession] = useState(null);
  const [editableAttendance, setEditableAttendance] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error'
  const [showAddAttachmentForm, setShowAddAttachmentForm] = useState(false);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentFile, setNewAttachmentFile] = useState(null);

  useEffect(() => {
    fetchSessionDetails(session_id).then(data => {
      setSession(data);
      const initializedAttendance = data.attendance.map(student => ({
        ...student,
        grade: student.grade ?? 0,
        interaction: student.interaction ?? 0,
        note: student.note ?? ''
      }));
      setEditableAttendance(initializedAttendance);
    });
  }, [session_id]);

  const handleStatusChange = (studentId, newStatus) => {
    setEditableAttendance(prev => prev.map(student => 
      student.id === studentId ? { 
        ...student, 
        status: newStatus,
        grade: newStatus === 'غائب' ? 0 : student.grade
      } : student
    ));
  };
  
  const handleInteractionChange = (studentId, newInteraction) => {
    setEditableAttendance(prev => prev.map(student => 
      student.id === studentId ? { ...student, interaction: newInteraction } : student
    ));
  };

  const handleNoteChange = (studentId, newNote) => {
    setEditableAttendance(prev => prev.map(student => 
      student.id === studentId ? { ...student, note: newNote } : student
    ));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      // TODO: استبدل هذا باستدعاء حقيقي من Supabase لحفظ بيانات الحضور
      console.log('تم حفظ التغييرات:', editableAttendance);
      await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة عملية الحفظ
      setSaveStatus('success');
    } catch (error) {
      console.error('حدث خطأ أثناء الحفظ:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleAddAttachment = () => {
    if (newAttachmentName && newAttachmentFile) {
      // TODO: هنا يجب أن يتم رفع الملف إلى Supabase Storage أولاً
      // TODO: ثم الحصول على رابط URL للملف المرفوع وحفظه في قاعدة البيانات
      // TODO: حاليًا، نقوم فقط بمحاكاة الإضافة للواجهة
      console.log('سيتم رفع الملف:', newAttachmentFile.name);
      const tempUrl = URL.createObjectURL(newAttachmentFile);

      setSession(prevSession => ({
        ...prevSession,
        attachments: [
          ...prevSession.attachments,
          { name: newAttachmentName, url: tempUrl }
        ]
      }));
      setNewAttachmentName('');
      setNewAttachmentFile(null);
      setShowAddAttachmentForm(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['اسم الطالب', 'الحالة', 'المشاركة والتفاعل', 'الملاحظات'],
      ...editableAttendance.map(student => [
        student.name,
        student.status,
        student.interaction,
        student.note || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `حضور_جلسة_${session.title}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-xl text-gray-500">جاري تحميل بيانات الجلسة...</span>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'حاضر': return 'bg-green-50 border-green-200';
      case 'غائب': return 'bg-red-50 border-red-200';
      case 'متأخر': return 'bg-yellow-50 border-yellow-200';
      case 'غائب بعذر': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 pb-20">
      {/* العودة */}
      <div className="mb-6">
        <Link href="/teachers/sessions" className="text-blue-600 hover:underline text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">←</span> العودة لإدارة الجلسات
        </Link>
      </div>

      {/* عنوان الجلسة */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-400 rounded-2xl shadow-xl p-8 mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{session.title}</h1>
          <p className="text-lg text-blue-100">{session.description}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold text-lg shadow">
            {session.course.name}
          </span>
        </div>
      </div>

      {/* معلومات الجلسة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-blue-700">معلومات الجلسة</h2>
          <ul className="space-y-2 text-gray-700">
            <li><span className="font-semibold">تبدأ:</span> {new Date(session.start_time).toLocaleString('ar-EG')}</li>
            <li><span className="font-semibold">تنتهي:</span> {new Date(session.end_time).toLocaleString('ar-EG')}</li>
            <li><span className="font-semibold">ملاحظات:</span> {session.notes}</li>
          </ul>
        </div>
        
        {/* المرفقات */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-blue-700">المرفقات</h2>
          {session.attachments.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {session.attachments.map((file, idx) => (
                <li key={idx}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                    <span>📎</span> {file.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 mb-4">لا توجد مرفقات.</p>
          )}

          {showAddAttachmentForm ? (
            <div className="space-y-3 mt-4">
              <input
                type="text"
                placeholder="اسم المرفق (مثال: ورقة عمل)"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="file"
                onChange={(e) => setNewAttachmentFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddAttachment}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  إضافة
                </button>
                <button
                  onClick={() => setShowAddAttachmentForm(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddAttachmentForm(true)}
              className="mt-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
            >
              + إضافة مرفق جديد
            </button>
          )}
        </div>
      </div>

      {/* الحضور والغياب */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-700">الحضور والتفاعل</h2>
          <div className="flex gap-3">
            {saveStatus && (
              <div className={`p-2 rounded-lg text-sm font-semibold ${saveStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {saveStatus === 'success' ? 'تم الحفظ بنجاح!' : 'حدث خطأ في الحفظ.'}
              </div>
            )}
            <button 
              onClick={handleExport}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 flex items-center gap-2"
            >
              <span>📊</span> تصدير البيانات
            </button>
            <button 
              onClick={handleSaveChanges}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg font-semibold ${
                isSaving ? 'bg-gray-300 text-gray-600' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right border">
            <thead>
              <tr className="bg-blue-50">
                <th className="py-2 px-3 text-center">الطالب</th>
                <th className="py-2 px-3 text-center">الحالة</th>
                <th className="py-2 px-3 text-center">المشاركة والتفاعل</th>
                <th className="py-2 px-3 text-center">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {editableAttendance.map((student) => (
                <tr 
                  key={student.id} 
                  className={`border-t ${
                    student.status === 'غائب' ? 'bg-gray-50 text-gray-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="py-2 px-3 font-semibold text-center">{student.name}</td>
                  
                  {/* حالة الحضور */}
                  <td className="py-2 px-3 text-center">
                    <select
                      className={`p-1 rounded border w-full text-center ${getStatusColor(student.status)}`}
                      value={student.status}
                      onChange={(e) => handleStatusChange(student.id, e.target.value)}
                    >
                      <option value="حاضر">حاضر</option>
                      <option value="متأخر">متأخر</option>
                      <option value="غائب بعذر">غائب بعذر</option>
                      <option value="غائب">غائب</option>
                    </select>
                  </td>
                  
                  {/* التقييم */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      className="w-16 p-1 border rounded text-center bg-yellow-50 border-yellow-200"
                      disabled={student.status === 'غائب'}
                      value={student.grade ?? 0}
                      onChange={(e) => handleInteractionChange(student.id, e.target.value)}
                    />
                  </td>
                                  
                  {/* الملاحظات */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="text"
                      className={`p-1 border rounded w-full text-center ${
                        student.status === 'غائب' ? 'bg-gray-100' : ''
                      }`}
                      disabled={student.status === 'غائب'}
                      value={student.note ?? ''}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      placeholder="أدخل ملاحظات..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* الواجبات والأنشطة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* الواجبات المرتبطة */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-blue-700">الواجبات المرتبطة</h2>
          {session.assignments.length > 0 ? (
            <ul className="space-y-3">
              {session.assignments.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <a href={assignment.link} className="text-blue-700 font-semibold hover:underline">
                    {assignment.title}
                  </a>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    assignment.status === 'تم التسليم' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {assignment.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">لا توجد واجبات مرتبطة بهذه الجلسة.</p>
          )}
        </div>
        
        {/* سجل الأنشطة */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-700">سجل الأنشطة</h2>
            <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-semibold">
              + إضافة نشاط
            </button>
          </div>
          
          {session.activities.length > 0 ? (
            <ul className="space-y-3">
              {session.activities.map((activity, idx) => (
                <li key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-mono text-sm mt-1">
                    {activity.time}
                  </span>
                  <span className="flex-1">{activity.text}</span>
                  <button className="text-red-500 hover:text-red-700 text-sm">
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">لا توجد أنشطة مسجلة.</p>
          )}
        </div>
      </div>

      {/* روابط سريعة */}
      <div className="fixed bottom-6 right-6 flex gap-3">
        <Link 
          href={`/teachers/student-performance?course=${session.course.id}`}
          className="bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>📊</span>
          <span>أداء الطلاب</span>
        </Link>
      </div>
    </div>
  );
}
