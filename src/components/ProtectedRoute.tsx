'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButton } from '@/components/AuthButton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              נדרשת התחברות
            </h1>
            <p className="text-gray-600 mb-8">
              כדי לגשת לעמוד זה, עליך להתחבר למערכת
            </p>
            <div className="flex justify-center">
              <AuthButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};