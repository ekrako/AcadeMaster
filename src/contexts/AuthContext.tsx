'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, handleRedirectResult } from '@/lib/auth';
import { createUserDocument, getUserDocument, updateUserLastLogin } from '@/lib/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result first (in case user was redirected back from Google)
    handleRedirectResult()
      .catch((error) => {
        console.error('Error handling redirect result:', error);
      });

    // Set up auth state listener
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        try {
          // Check if user document exists
          const userDoc = await getUserDocument(user.uid);
          
          if (!userDoc) {
            // Create user document if it doesn't exist
            await createUserDocument(user.uid, {
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || undefined
            });
          } else {
            // Update last login
            await updateUserLastLogin(user.uid);
          }
        } catch (error) {
          console.error('Error managing user document:', error);
        }
      }
      
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};