// src/components/TeacherWelcomeCard.js
'use client'; // هذا المكون سيكون Client Component

import React from 'react';

export default function TeacherWelcomeCard({ teacherName }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-xl shadow-2xl mb-8
                    transform transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-3xl
                    flex flex-col md:flex-row items-center justify-between">
      <div className="text-center md:text-right mb-4 md:mb-0">
        <h2 className="text-4xl font-extrabold mb-2 leading-tight">
          مرحباً بك، <span className="text-blue-200">{teacherName || 'معلمنا الفاضل'}</span>!
        </h2>
        <p className="text-lg font-light text-blue-100">
          نتمنى لك يوماً مثمراً ومليئاً بالإنجازات في منصة جود أكاديمي.
        </p>
        <p className="text-sm mt-2 text-blue-200 opacity-80">
          ابدأ بإدارة كورساتك وواجباتك، وتتبع أداء طلابك بكل سهولة.
        </p>
      </div>
      <div className="flex-shrink-0 mt-4 md:mt-0 md:mr-8"> {/* mr-8 for spacing in rtl */}
        {/* أيقونة ترحيبية بسيطة أو صورة */}
        <span className="text-7xl">👋</span> {/* أيقونة يد تلوح بالترحيب */}
      </div>
    </div>
  );
}
