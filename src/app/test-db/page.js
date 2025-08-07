// src/app/test-db/page.js
'use client'
import { useState } from 'react' // هذا السطر المفقود
import { supabase } from '@/lib/supabaseClient'

export default function TestDBPage() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('courses') // استبدل بجدولك المطلوب
        .select('*')
        .limit(2)
      
      if (error) throw error
      
      setResult(data)
      setError(null)
      console.log('البيانات المسترجعة:', data)
    } catch (err) {
      setError(err.message)
      setResult(null)
      console.error('حدث خطأ:', err)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">اختبار اتصال قاعدة البيانات</h1>
      
      <button
        onClick={testConnection}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-6"
      >
        اختبار الاتصال
      </button>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>خطأ!</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <h2 className="text-xl font-semibold mb-2">النتائج:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}