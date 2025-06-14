'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';

export const FirebaseDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const runDiagnostics = () => {
    const info = {
      currentURL: window.location.href,
      origin: window.location.origin,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      firebaseConfig: {
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(info);
    console.log('Firebase Debug Info:', info);
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-900 text-white rounded-lg shadow-lg max-w-md text-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">Firebase Debug</h3>
        <button
          onClick={runDiagnostics}
          className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
        >
          Run Diagnostics
        </button>
      </div>
      
      {debugInfo && (
        <div className="space-y-2 text-xs">
          <div>
            <strong>Origin:</strong> {debugInfo.origin}
          </div>
          <div>
            <strong>Auth Domain:</strong> {debugInfo.firebaseConfig.authDomain}
          </div>
          <div>
            <strong>Project ID:</strong> {debugInfo.firebaseConfig.projectId}
          </div>
          <div className="mt-2 p-2 bg-gray-800 rounded">
            <strong>Required in Firebase Console:</strong><br/>
            <code className="text-green-400">{debugInfo.origin}</code>
          </div>
        </div>
      )}
    </div>
  );
};