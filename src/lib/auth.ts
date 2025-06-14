import { auth } from './firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
// Add additional scopes for better user info
googleProvider.addScope('profile');
googleProvider.addScope('email');

const checkAuth = () => {
  if (!auth) {
    throw new Error('Firebase Authentication not initialized. Please configure Firebase.');
  }
};

export const signInWithGoogle = async (useRedirect = false) => {
  try {
    checkAuth();
    if (useRedirect) {
      // Use redirect method as fallback
      await signInWithRedirect(auth!, googleProvider);
      return null; // User will be available after redirect
    } else {
      // Use popup method (default)
      const result = await signInWithPopup(auth!, googleProvider);
      return result.user;
    }
  } catch (error) {
    const authError = error as AuthError;
    console.error('Error signing in with Google:', authError.code);
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    checkAuth();
    const result = await getRedirectResult(auth!);
    return result?.user || null;
  } catch (error) {
    const authError = error as AuthError;
    console.error('Error handling redirect result:', authError.code);
    throw error;
  }
};

export const signOut = async (onSignOutComplete?: () => void) => {
  try {
    checkAuth();
    await firebaseSignOut(auth!);
    if (onSignOutComplete) {
      onSignOutComplete();
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.warn('Firebase Authentication not initialized');
    callback(null);
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};