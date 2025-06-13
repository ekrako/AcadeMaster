'use client';

import { useState, useEffect } from 'react';

export default function HourTypeManagerSimple() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    console.log('HourTypeManager mounted');
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="text-lg">טוען...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">ניהול סוגי שעות</h2>
          <p className="text-gray-600 text-sm mt-1">
            הגדר סוגי שעות שישמשו בכל התרחישים
          </p>
        </div>
        <button
          onClick={() => console.log('Add button clicked')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
        >
          הוסף סוג שעות חדש
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-gray-400 text-4xl mb-4">⏰</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">בדיקת רכיב</h3>
        <p className="text-gray-500 mb-4">הרכיב עובד תקין</p>
      </div>
    </div>
  );
}