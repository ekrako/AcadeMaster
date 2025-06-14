'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signOut } from '@/lib/auth';

interface AuthButtonProps {
  centered?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ centered = false }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (useRedirect = false) => {
    setSigningIn(true);
    setError(null);
    
    try {
      await signInWithGoogle(useRedirect);
    } catch (error: any) {
      // Show user-friendly error message
      if (error.code === 'auth/popup-blocked') {
        setError('חלון ההתחברות נחסם. אנא אפשר חלונות קופצים או נסה שוב.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('ההתחברות בוטלה.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('שגיאת רשת. אנא בדוק את החיבור לאינטרנט ונסה שוב.');
      } else {
        setError('שגיאה בהתחברות. אנא נסה שוב.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to home page after successful sign out
      router.push('/');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={`התנתק מהמערכת - ${user.displayName}`}
        >
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-6 h-6 rounded-full border border-gray-300"
            />
          )}
          <span className="text-sm font-medium text-gray-700 font-sans max-w-24 truncate">
            {user.displayName}
          </span>
          <svg 
            className="w-4 h-4 text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${centered ? 'items-center' : 'items-end'}`}>
      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded max-w-64 text-right">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => handleSignIn(false)}
          disabled={signingIn}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="התחבר למערכת עם Google (חלון קופץ)"
        >
          {signingIn ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          התחבר
        </button>
        {error && (
          <button
            onClick={() => handleSignIn(true)}
            disabled={signingIn}
            className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="התחבר בדרך אחרת (הפניה)"
          >
            נסה שוב
          </button>
        )}
      </div>
    </div>
  );
};