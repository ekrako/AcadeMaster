'use client';

import { useState, useEffect } from 'react';

export default function HourTypeManagerDebug() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState('initializing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('Component mounting...');
    setMounted(true);
    
    // Test step by step
    const testSteps = async () => {
      try {
        setStep('testing imports');
        console.log('Testing imports...');
        
        // Test types import
        const typesModule = await import('@/types');
        console.log('Types imported successfully:', Object.keys(typesModule));
        
        setStep('testing default data');
        const defaultDataModule = await import('@/lib/defaultData');
        console.log('Default data imported successfully:', Object.keys(defaultDataModule));
        
        setStep('testing firebase');
        const firebaseModule = await import('@/lib/firebase');
        console.log('Firebase imported successfully:', Object.keys(firebaseModule));
        
        setStep('testing database');
        const databaseModule = await import('@/lib/database');
        console.log('Database imported successfully:', Object.keys(databaseModule));
        
        setStep('ready');
        console.log('All imports successful!');
        
      } catch (err) {
        console.error('Import error:', err);
        setError(`Error in ${step}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    
    testSteps();
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold">ניהול סוגי שעות - מצב דיבוג</h2>
        <p className="text-gray-600 text-sm mt-1">
          שלב נוכחי: <strong>{step}</strong>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">שגיאה:</h3>
          <p className="text-red-700 font-mono text-sm">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">מידע דיבוג:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>✓ רכיב נטען</li>
          <li>{step === 'ready' ? '✓' : '⏳'} יבוא קבצים</li>
          <li>{step === 'ready' ? '✓' : '❓'} Firebase מוכן</li>
        </ul>
      </div>
    </div>
  );
}